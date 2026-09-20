from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.database.session import get_db
from app.models.models import Playbook, PlaybookExecution, BlocklistEntry
from app.schemas.schemas import PlaybookOut, PlaybookExecutionOut
from app.services.soar_service import soar_engine

router = APIRouter(prefix="/response", tags=["SOAR & Automated Response"])

@router.get("/playbooks", response_model=List[PlaybookOut], include_in_schema=True)
@router.get("/playbooks/", response_model=List[PlaybookOut], include_in_schema=False)
async def list_playbooks(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Playbook))
    return res.scalars().all()

@router.get("/executions", response_model=List[PlaybookExecutionOut], include_in_schema=True)
@router.get("/executions/", response_model=List[PlaybookExecutionOut], include_in_schema=False)
async def list_executions(limit: int = Query(50, ge=1, le=100), db: AsyncSession = Depends(get_db)):
    q = select(PlaybookExecution).options(selectinload(PlaybookExecution.playbook)).order_by(desc(PlaybookExecution.started_at)).limit(limit)
    res = await db.execute(q)
    executions = res.scalars().all()
    
    out = []
    for ex in executions:
        out.append(PlaybookExecutionOut(
            id=ex.id,
            playbook_id=ex.playbook_id,
            playbook_name=ex.playbook.name if ex.playbook else ex.playbook_id,
            event_id=ex.event_id,
            incident_id=ex.incident_id,
            status=ex.status,
            execution_steps=ex.execution_steps or [],
            started_at=ex.started_at,
            completed_at=ex.completed_at
        ))
    return out

@router.get("/blocklist", include_in_schema=True)
@router.get("/blocklist/", include_in_schema=False)
async def get_active_blocklist(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(BlocklistEntry).where(BlocklistEntry.active == True).order_by(desc(BlocklistEntry.created_at)))
    return res.scalars().all()

@router.post("/playbooks/{playbook_id}/simulate")
async def simulate_playbook_run(
    playbook_id: str,
    target_ip: str = "185.199.110.23",
    threat_score: float = 88.0,
    db: AsyncSession = Depends(get_db)
):
    q = select(Playbook).where(Playbook.id == playbook_id)
    res = await db.execute(q)
    pb = res.scalar_one_or_none()
    if not pb:
        raise HTTPException(status_code=404, detail="Playbook not found")

    result = await soar_engine.execute_response(
        event_id=None,
        source_ip=target_ip,
        attack_type="Simulated Hostile Probe",
        threat_score=threat_score,
        incident_id=None,
        db=db
    )
    return result
