from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_
from sqlalchemy.orm import selectinload

from app.database.session import get_db
from app.models.models import (
    AttackEvent, AttackFeature, MLPrediction, ThreatIntelligence,
    AttackMitreMapping, MitreTechnique, PlaybookExecution, Incident
)
from app.schemas.schemas import AttackEventOut, AttackDetailOut, FeatureOut, MLPredictionOut, MitreMappingOut

router = APIRouter(prefix="/attacks", tags=["Attacks"])

@router.get("", response_model=List[AttackEventOut], include_in_schema=False)
@router.get("/", response_model=List[AttackEventOut])
async def list_attacks(
    search: Optional[str] = None,
    service: Optional[str] = None,
    severity: Optional[str] = None,
    attack_type: Optional[str] = None,
    mode: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    q = select(AttackEvent)

    if search:
        q = q.where(
            or_(
                AttackEvent.source_ip.ilike(f"%{search}%"),
                AttackEvent.activity.ilike(f"%{search}%"),
                AttackEvent.attack_type.ilike(f"%{search}%")
            )
        )
    if service:
        q = q.where(AttackEvent.service == service.upper())
    if severity:
        q = q.where(AttackEvent.severity == severity.upper())
    if attack_type:
        q = q.where(AttackEvent.attack_type == attack_type)
    if mode:
        q = q.where(AttackEvent.mode == mode.upper())

    q = q.order_by(desc(AttackEvent.timestamp)).limit(limit).offset(offset)
    res = await db.execute(q)
    return res.scalars().all()

@router.get("/{event_id}", response_model=AttackDetailOut)
async def get_attack_details(event_id: str, db: AsyncSession = Depends(get_db)):
    q = (
        select(AttackEvent)
        .options(
            selectinload(AttackEvent.features),
            selectinload(AttackEvent.prediction),
            selectinload(AttackEvent.mitre_mappings).selectinload(AttackMitreMapping.technique),
            selectinload(AttackEvent.playbook_executions)
        )
        .where(AttackEvent.id == event_id)
    )
    res = await db.execute(q)
    event = res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Attack event not found")

    # Threat Intelligence context
    intel_q = select(ThreatIntelligence).where(ThreatIntelligence.ip_address == event.source_ip)
    intel_res = await db.execute(intel_q)
    intel_record = intel_res.scalar_one_or_none()
    intel_data = None
    if intel_record:
        intel_data = {
            "ip_address": intel_record.ip_address,
            "is_private": intel_record.is_private,
            "country_name": intel_record.country_name,
            "country_code": intel_record.country_code,
            "city": intel_record.city,
            "latitude": intel_record.latitude,
            "longitude": intel_record.longitude,
            "asn": intel_record.asn,
            "isp": intel_record.isp,
            "reputation_score": intel_record.reputation_score,
            "abuse_confidence_score": intel_record.abuse_confidence_score,
            "known_reports_count": intel_record.known_reports_count,
            "local_sightings": intel_record.local_sightings,
            "tags": intel_record.tags or []
        }

    # MITRE mappings
    mitre_list = []
    for m in event.mitre_mappings:
        tech = m.technique
        mitre_list.append(MitreMappingOut(
            technique_id=m.technique_id,
            technique_name=tech.name if tech else m.technique_id,
            tactic=tech.tactic if tech else "Discovery",
            confidence=m.confidence,
            rationale=m.rationale
        ))

    # Features
    feat_out = None
    if event.features:
        f = event.features
        feat_out = FeatureOut(
            auth_failures=f.auth_failures,
            request_frequency=f.request_frequency,
            session_duration=f.session_duration,
            command_count=f.command_count,
            endpoint_diversity=f.endpoint_diversity,
            payload_entropy=f.payload_entropy,
            user_agent_score=f.user_agent_score,
            extracted_features=f.extracted_features or {}
        )

    # Prediction
    pred_out = None
    if event.prediction:
        p = event.prediction
        pred_out = MLPredictionOut(
            model_name=p.model_name,
            predicted_class=p.predicted_class,
            confidence=p.confidence,
            probabilities=p.probabilities or {},
            feature_importance=p.feature_importance or {},
            explanation=p.explanation
        )

    # Associated Incident
    inc_q = select(Incident).where(Incident.source_ip == event.source_ip).order_by(desc(Incident.created_at))
    inc_res = await db.execute(inc_q)
    associated_inc = inc_res.scalars().first()

    # Timeline reconstruction
    timeline = [
        {"stage": "DETECTED", "timestamp": event.timestamp.isoformat(), "title": f"Interaction Captured on {event.service}", "description": f"Inbound request from {event.source_ip}"},
        {"stage": "ANALYZED", "timestamp": event.timestamp.isoformat(), "title": f"ML Behavioral Classification: {event.attack_type}", "description": pred_out.explanation if pred_out else "Pattern analyzed"},
        {"stage": "ENRICHED", "timestamp": event.timestamp.isoformat(), "title": f"Threat Intel Evaluated", "description": f"Reputation score {intel_data.get('reputation_score', 0) if intel_data else 0}/100 ({intel_data.get('country_name', 'Unknown') if intel_data else 'Unknown'})"},
        {"stage": "MAPPED", "timestamp": event.timestamp.isoformat(), "title": f"MITRE ATT&CK Correlated", "description": f"{len(mitre_list)} techniques identified"},
        {"stage": "SCORED", "timestamp": event.timestamp.isoformat(), "title": f"Threat Score: {event.threat_score} ({event.severity})", "description": f"Autonomous severity evaluated"},
    ]

    response_actions = []
    for exec_item in event.playbook_executions:
        response_actions.append({
            "id": exec_item.id,
            "playbook_id": exec_item.playbook_id,
            "status": exec_item.status,
            "steps": exec_item.execution_steps or []
        })

    return AttackDetailOut(
        id=event.id,
        session_id=event.session_id,
        honeypot_id=event.honeypot_id,
        timestamp=event.timestamp,
        source_ip=event.source_ip,
        service=event.service,
        activity=event.activity,
        attack_type=event.attack_type,
        severity=event.severity,
        threat_score=event.threat_score,
        status=event.status,
        raw_payload=event.raw_payload,
        event_metadata=event.event_metadata or {},
        mode=event.mode,
        features=feat_out,
        prediction=pred_out,
        threat_intel=intel_data,
        mitre_mappings=mitre_list,
        response_actions=response_actions,
        incident_id=associated_inc.id if associated_inc else None,
        timeline=timeline
    )
