from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.database.session import get_db
from app.models.models import MitreTechnique, AttackMitreMapping, AttackEvent
from app.schemas.schemas import MitreTechniqueOut

router = APIRouter(prefix="/mitre", tags=["MITRE ATT&CK"])

@router.get("/techniques", response_model=List[MitreTechniqueOut])
async def list_techniques(
    tactic: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    q = select(MitreTechnique)
    if tactic:
        q = q.where(MitreTechnique.tactic.ilike(f"%{tactic}%"))
    if search:
        q = q.where(
            MitreTechnique.id.ilike(f"%{search}%") |
            MitreTechnique.name.ilike(f"%{search}%") |
            MitreTechnique.description.ilike(f"%{search}%")
        )
    q = q.order_by(desc(MitreTechnique.observed_count))
    res = await db.execute(q)
    return res.scalars().all()

@router.get("/techniques/{technique_id}")
async def get_technique_drilldown(technique_id: str, db: AsyncSession = Depends(get_db)):
    q = (
        select(MitreTechnique)
        .where(MitreTechnique.id == technique_id)
    )
    res = await db.execute(q)
    tech = res.scalar_one_or_none()
    if not tech:
        raise HTTPException(status_code=404, detail="Technique not found")

    # Fetch associated attack events
    map_q = (
        select(AttackMitreMapping)
        .options(selectinload(AttackMitreMapping.event))
        .where(AttackMitreMapping.technique_id == technique_id)
        .limit(20)
    )
    map_res = await db.execute(map_q)
    mappings = map_res.scalars().all()

    associated_attacks = []
    for m in mappings:
        if m.event:
            associated_attacks.append({
                "event_id": m.event.id,
                "source_ip": m.event.source_ip,
                "service": m.event.service,
                "attack_type": m.event.attack_type,
                "severity": m.event.severity,
                "threat_score": m.event.threat_score,
                "timestamp": m.event.timestamp.isoformat(),
                "confidence": m.confidence,
                "rationale": m.rationale
            })

    return {
        "technique": {
            "id": tech.id,
            "name": tech.name,
            "tactic": tech.tactic,
            "description": tech.description,
            "detection_guidance": tech.detection_guidance,
            "reference_url": tech.reference_url,
            "observed_count": tech.observed_count,
            "confidence": tech.confidence
        },
        "associated_attacks": associated_attacks
    }

@router.get("/matrix")
async def get_mitre_matrix(db: AsyncSession = Depends(get_db)):
    # Group techniques by standard MITRE tactics
    tactics_order = [
        "Reconnaissance",
        "Initial Access",
        "Execution",
        "Persistence",
        "Privilege Escalation",
        "Defense Evasion",
        "Credential Access",
        "Discovery",
        "Lateral Movement"
    ]
    res = await db.execute(select(MitreTechnique))
    all_techs = res.scalars().all()

    matrix: Dict[str, List[Dict[str, Any]]] = {tactic: [] for tactic in tactics_order}
    for tech in all_techs:
        tactic_name = tech.tactic
        if tactic_name not in matrix:
            matrix[tactic_name] = []
        matrix[tactic_name].append({
            "id": tech.id,
            "name": tech.name,
            "observed_count": tech.observed_count,
            "confidence": tech.confidence,
            "description": tech.description
        })

    return {"matrix": matrix, "tactics": tactics_order}
