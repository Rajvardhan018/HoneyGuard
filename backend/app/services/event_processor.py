import datetime
import uuid
import logging
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import (
    AttackEvent, AttackFeature, MLPrediction, HoneypotSession, Honeypot
)
from app.services.ml_service import ml_service
from app.services.threat_intel_service import threat_intel_service
from app.services.mitre_service import mitre_service
from app.services.scoring_service import scoring_engine
from app.services.adaptive_service import adaptive_service
from app.services.incident_service import incident_service
from app.services.soar_service import soar_engine
from app.websocket.manager import manager

logger = logging.getLogger("honeyguard.processor")

class EventProcessor:
    async def process_raw_event(self, raw_telemetry: Dict[str, Any], db: AsyncSession) -> Dict[str, Any]:
        """
        Master ingest function for honeypot telemetry.
        Runs through the complete automated cybersecurity pipeline.
        """
        now = datetime.datetime.now(datetime.timezone.utc)
        event_id = raw_telemetry.get("id") or f"EVT-{uuid.uuid4().hex[:8].upper()}"
        session_id = raw_telemetry.get("session_id") or f"SES-{uuid.uuid4().hex[:6].upper()}"
        honeypot_id = raw_telemetry.get("honeypot_id", "SSH-HONEY-01")
        source_ip = raw_telemetry.get("source_ip", "127.0.0.1")
        service = raw_telemetry.get("service", "SSH")
        raw_payload = raw_telemetry.get("raw_payload", "")
        mode = raw_telemetry.get("mode", "LIVE")

        # 1. Update Honeypot counters & ensure session exists
        hp_q = select(Honeypot).where(Honeypot.id == honeypot_id)
        hp_res = await db.execute(hp_q)
        hp = hp_res.scalar_one_or_none()
        if hp:
            hp.attacks_count += 1
            hp.requests_count += int(raw_telemetry.get("request_frequency", 1))
            hp.last_activity = now

        # Ensure session
        sess_q = select(HoneypotSession).where(HoneypotSession.id == session_id)
        sess_res = await db.execute(sess_q)
        session_obj = sess_res.scalar_one_or_none()
        if not session_obj:
            session_obj = HoneypotSession(
                id=session_id,
                honeypot_id=honeypot_id,
                source_ip=source_ip,
                source_port=raw_telemetry.get("source_port", 44120),
                start_time=now,
                protocol=service,
                session_data=raw_telemetry.get("session_data", {})
            )
            db.add(session_obj)
            if hp:
                hp.sessions_count += 1

        # 2. Extract features & Run ML Classifier
        vector, features_dict = ml_service.extract_features(raw_telemetry)
        ml_result = ml_service.predict(raw_telemetry)
        attack_type = ml_result["predicted_class"]
        confidence = ml_result["confidence"]

        # 3. Enrich Threat Intelligence
        intel_dict = await threat_intel_service.get_or_enrich_ip(source_ip, db)
        reputation = intel_dict.get("reputation_score", 0.0)

        # 4. Map to MITRE ATT&CK
        mitre_mappings = mitre_service.map_attack_to_techniques(attack_type, features_dict, raw_payload)
        mitre_ids = [m[0] for m in mitre_mappings]

        # 5. Calculate Explainable Threat Score
        threat_score, severity, score_breakdown = scoring_engine.calculate_score(
            attack_type=attack_type,
            ml_confidence=confidence,
            features=features_dict,
            reputation_score=reputation,
            mitre_count=len(mitre_mappings)
        )

        activity_str = f"{attack_type} detected on {service}"
        if raw_payload:
            activity_str += f" ({raw_payload[:40]}...)" if len(raw_payload) > 40 else f" ({raw_payload})"

        # 6. Save AttackEvent & Features & Predictions
        event = AttackEvent(
            id=event_id,
            session_id=session_id,
            honeypot_id=honeypot_id,
            timestamp=now,
            source_ip=source_ip,
            service=service,
            activity=activity_str,
            attack_type=attack_type,
            severity=severity,
            threat_score=threat_score,
            status="analyzed",
            raw_payload=raw_payload,
            event_metadata={
                "scoring_breakdown": score_breakdown,
                "threat_intel_summary": {
                    "country": intel_dict.get("country_name"),
                    "asn": intel_dict.get("asn"),
                    "isp": intel_dict.get("isp")
                }
            },
            mode=mode
        )
        db.add(event)
        await db.flush()

        feature_record = AttackFeature(
            event_id=event_id,
            auth_failures=int(features_dict["auth_failures"]),
            request_frequency=features_dict["request_frequency"],
            session_duration=features_dict["session_duration"],
            command_count=int(features_dict["command_count"]),
            endpoint_diversity=int(features_dict["endpoint_diversity"]),
            payload_entropy=features_dict["payload_entropy"],
            user_agent_score=features_dict["user_agent_score"],
            extracted_features=features_dict
        )
        db.add(feature_record)

        pred_record = MLPrediction(
            event_id=event_id,
            model_name=ml_result["model_name"],
            predicted_class=attack_type,
            confidence=confidence,
            probabilities=ml_result["probabilities"],
            feature_importance=ml_result["feature_importance"],
            explanation=ml_result["explanation"]
        )
        db.add(pred_record)

        # 7. Link MITRE mappings in DB
        await mitre_service.link_attack_event(event_id, mitre_mappings, db)

        # 8. Adaptive Honeypot evaluation
        new_deception = await adaptive_service.evaluate_and_adapt(honeypot_id, threat_score, db)

        # 9. Automated Incident Creation (if criteria met)
        incident = await incident_service.create_or_update_incident(
            event_id=event_id,
            source_ip=source_ip,
            attack_type=attack_type,
            severity=severity,
            threat_score=threat_score,
            honeypot_id=honeypot_id,
            session_id=session_id,
            mitre_list=mitre_ids,
            db=db
        )
        incident_id = incident.id if incident else None

        # 10. Automated SOAR Playbook Execution
        soar_result = None
        if threat_score >= 60.0 or severity in ["HIGH", "CRITICAL"]:
            soar_result = await soar_engine.execute_response(
                event_id=event_id,
                source_ip=source_ip,
                attack_type=attack_type,
                threat_score=threat_score,
                incident_id=incident_id,
                db=db
            )

        await db.commit()

        # 11. Broadcast over WebSocket to all real-time UI dashboards
        event_dict = {
            "id": event.id,
            "session_id": session_id,
            "honeypot_id": honeypot_id,
            "timestamp": event.timestamp.isoformat(),
            "source_ip": source_ip,
            "service": service,
            "activity": activity_str,
            "attack_type": attack_type,
            "severity": severity,
            "threat_score": threat_score,
            "status": event.status,
            "mode": mode,
            "country_code": intel_dict.get("country_code", "XX"),
            "country_name": intel_dict.get("country_name", "Unknown"),
            "latitude": intel_dict.get("latitude", 0.0),
            "longitude": intel_dict.get("longitude", 0.0),
            "incident_id": incident_id,
            "deception_level": new_deception
        }
        await manager.broadcast_attack(event_dict)

        # Broadcast real-time activity stream line
        stream_line = {
            "time": event.timestamp.strftime("%H:%M:%S"),
            "ip": source_ip,
            "service": service,
            "attack_type": attack_type,
            "severity": severity,
            "threat_score": threat_score,
            "text": f"[{event.timestamp.strftime('%H:%M:%S')}] {service} {attack_type} from {source_ip} (Score: {threat_score} - {severity})"
        }
        await manager.broadcast_stream_log(stream_line)

        return event_dict

event_processor = EventProcessor()
