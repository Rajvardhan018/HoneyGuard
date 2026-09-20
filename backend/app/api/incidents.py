import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.database.session import get_db
from app.models.models import Incident, IncidentEvent
from app.schemas.schemas import IncidentOut, IncidentUpdate
from app.websocket.manager import manager

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("", response_model=List[IncidentOut], include_in_schema=False)
@router.get("/", response_model=List[IncidentOut])
async def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    q = select(Incident).options(selectinload(Incident.events))
    if status:
        q = q.where(Incident.status == status.upper())
    if severity:
        q = q.where(Incident.severity == severity.upper())
    q = q.order_by(desc(Incident.created_at)).limit(limit)
    res = await db.execute(q)
    return res.scalars().all()

@router.get("/{incident_id}", response_model=IncidentOut)
async def get_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    q = select(Incident).options(selectinload(Incident.events)).where(Incident.id == incident_id)
    res = await db.execute(q)
    inc = res.scalar_one_or_none()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

@router.patch("/{incident_id}", response_model=IncidentOut)
async def update_incident(incident_id: str, payload: IncidentUpdate, db: AsyncSession = Depends(get_db)):
    q = select(Incident).options(selectinload(Incident.events)).where(Incident.id == incident_id)
    res = await db.execute(q)
    inc = res.scalar_one_or_none()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    now = datetime.datetime.now(datetime.timezone.utc)
    if payload.status:
        old_status = inc.status
        inc.status = payload.status.upper()
        # Add timeline event
        ev = IncidentEvent(
            incident_id=inc.id,
            timestamp=now,
            event_type="STATUS_CHANGE",
            description=f"Status transitioned from {old_status} to {inc.status}.",
            performed_by="Security Analyst",
            details={"old_status": old_status, "new_status": inc.status}
        )
        db.add(ev)

    if payload.assigned_analyst:
        inc.assigned_analyst = payload.assigned_analyst

    if payload.notes:
        ev_note = IncidentEvent(
            incident_id=inc.id,
            timestamp=now,
            event_type="NOTE_ADDED",
            description=f"Analyst note: {payload.notes}",
            performed_by="Security Analyst",
            details={"notes": payload.notes}
        )
        db.add(ev_note)

    inc.updated_at = now
    await db.commit()
    await db.refresh(inc)

    # Broadcast incident update
    await manager.broadcast_incident({
        "id": inc.id,
        "title": inc.title,
        "severity": inc.severity,
        "status": inc.status,
        "source_ip": inc.source_ip,
        "threat_score": inc.threat_score
    })

    return inc
