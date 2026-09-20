import datetime
import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.models import Incident, IncidentEvent
from app.websocket.manager import manager

class IncidentService:
    async def create_or_update_incident(
        self,
        event_id: str,
        source_ip: str,
        attack_type: str,
        severity: str,
        threat_score: float,
        honeypot_id: str,
        session_id: Optional[str],
        mitre_list: List[str],
        db: AsyncSession
    ) -> Optional[Incident]:
        # Only automatically create incidents for HIGH or CRITICAL threats (or score >= 75)
        if threat_score < 60.0 and severity not in ["HIGH", "CRITICAL"]:
            return None

        # Check if an OPEN incident for this source_ip already exists within the last hour
        now = datetime.datetime.now(datetime.timezone.utc)
        recent_cutoff = now - datetime.timedelta(hours=1)
        
        q = select(Incident).where(
            Incident.source_ip == source_ip,
            Incident.status.in_(["OPEN", "INVESTIGATING"]),
            Incident.created_at >= recent_cutoff
        )
        res = await db.execute(q)
        existing_incident = res.scalar_one_or_none()

        if existing_incident:
            # Update existing incident
            if threat_score > existing_incident.threat_score:
                existing_incident.threat_score = threat_score
                existing_incident.severity = severity
            
            existing_incident.updated_at = now
            # Merge MITRE techniques
            existing_mitre = set(existing_incident.mitre_summary or [])
            for m in mitre_list:
                existing_mitre.add(m)
            existing_incident.mitre_summary = list(existing_mitre)

            # Add incident timeline event
            ev = IncidentEvent(
                incident_id=existing_incident.id,
                event_type="ESCALATION",
                description=f"Further hostile interaction detected ({attack_type}). Threat score evaluated at {threat_score}.",
                performed_by="Autonomous Detection Engine",
                details={"event_id": event_id, "score": threat_score, "mitre": mitre_list}
            )
            db.add(ev)
            await db.commit()
            await db.refresh(existing_incident)

            await manager.broadcast_incident({
                "id": existing_incident.id,
                "title": existing_incident.title,
                "severity": existing_incident.severity,
                "status": existing_incident.status,
                "source_ip": existing_incident.source_ip,
                "threat_score": existing_incident.threat_score
            })
            return existing_incident

        # Generate new Incident ID
        count_q = select(func.count(Incident.id))
        count_res = await db.execute(count_q)
        total_incidents = count_res.scalar() or 0
        inc_id = f"INC-2026-{(total_incidents + 1):03d}"

        title = f"Autonomous Incident: {attack_type} against {honeypot_id} from {source_ip}"
        summary = (
            f"Autonomous HoneyGuard alert triggered for hostile probe sequence from IP {source_ip}. "
            f"Observed classification: {attack_type}, with an explainable risk score of {threat_score} ({severity})."
        )

        incident = Incident(
            id=inc_id,
            title=title,
            severity=severity,
            status="OPEN",
            source_ip=source_ip,
            attack_type=attack_type,
            threat_score=threat_score,
            session_id=session_id,
            honeypot_id=honeypot_id,
            assigned_analyst="Security Analyst",
            summary=summary,
            mitre_summary=mitre_list,
            playbook_summary=["SOAR-AUTO-CONTAINMENT"],
            created_at=now,
            updated_at=now
        )
        db.add(incident)
        await db.flush()

        # Initial creation timeline event
        ev_create = IncidentEvent(
            incident_id=inc_id,
            timestamp=now,
            event_type="CREATED",
            description=f"Incident generated automatically by Risk Engine. Severity: {severity}, Threat Score: {threat_score}.",
            performed_by="HoneyGuard Threat Engine",
            details={"event_id": event_id, "threat_score": threat_score}
        )
        db.add(ev_create)

        await db.commit()
        await db.refresh(incident)

        await manager.broadcast_incident({
            "id": incident.id,
            "title": incident.title,
            "severity": incident.severity,
            "status": incident.status,
            "source_ip": incident.source_ip,
            "threat_score": incident.threat_score
        })

        return incident

incident_service = IncidentService()
