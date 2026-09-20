from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database.session import get_db
from app.models.models import ThreatIntelligence
from app.schemas.schemas import ThreatIntelOut
from app.services.threat_intel_service import threat_intel_service

router = APIRouter(prefix="/threat-intelligence", tags=["Threat Intelligence"])

@router.get("", response_model=List[ThreatIntelOut], include_in_schema=False)
@router.get("/", response_model=List[ThreatIntelOut])
async def list_threat_intel(
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    q = select(ThreatIntelligence)
    if search:
        q = q.where(
            ThreatIntelligence.ip_address.ilike(f"%{search}%") |
            ThreatIntelligence.country_name.ilike(f"%{search}%") |
            ThreatIntelligence.isp.ilike(f"%{search}%")
        )
    q = q.order_by(desc(ThreatIntelligence.last_seen)).limit(limit)
    res = await db.execute(q)
    return res.scalars().all()

@router.get("/lookup/{ip_address}", response_model=ThreatIntelOut)
async def lookup_ip(ip_address: str, db: AsyncSession = Depends(get_db)):
    intel_dict = await threat_intel_service.get_or_enrich_ip(ip_address, db)
    q = select(ThreatIntelligence).where(ThreatIntelligence.ip_address == ip_address)
    res = await db.execute(q)
    record = res.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Intelligence lookup failed")
    return record
