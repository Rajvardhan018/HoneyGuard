import os
import socket
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database.session import get_db
from app.models.models import Honeypot, HoneypotSession, SystemEvent
from app.schemas.schemas import HoneypotOut, HoneypotCreate, HoneypotActionRequest
from app.websocket.manager import manager
from app.services.honeypot_manager import honeypot_manager

router = APIRouter(prefix="/honeypots", tags=["Honeypots"])

@router.get("", response_model=List[HoneypotOut], include_in_schema=False)
@router.get("/", response_model=List[HoneypotOut])
async def list_honeypots(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Honeypot).order_by(Honeypot.id))
    return res.scalars().all()

@router.post("", response_model=HoneypotOut, status_code=201, include_in_schema=False)
@router.post("/", response_model=HoneypotOut, status_code=201)
async def create_honeypot(payload: HoneypotCreate, db: AsyncSession = Depends(get_db)):
    # 1. Check for port collision in database
    existing = (await db.execute(select(Honeypot).where(Honeypot.port == payload.port))).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Port {payload.port} is already assigned to active sensor '{existing.name}' ({existing.id})."
        )

    # 2. Derive unique canonical Honeypot ID
    hp_type = payload.type.lower()
    mode = payload.deployment_mode.upper()
    prefix = f"{hp_type.upper()}-{mode}"
    
    all_hps = (await db.execute(select(Honeypot.id))).scalars().all()
    idx = 1
    new_id = f"{prefix}-{idx:02d}"
    while new_id in all_hps:
        idx += 1
        new_id = f"{prefix}-{idx:02d}"

    # 3. Handle LIVE vs LAB mode
    is_vercel = bool(
        os.environ.get("VERCEL") or 
        os.environ.get("VERCEL_ENV") or 
        os.environ.get("VERCEL_REGION") or 
        os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or 
        os.environ.get("NOW_REGION")
    )

    if is_vercel:
        # On Vercel Serverless, persistent raw TCP socket listening is not supported.
        # LAB registers a simulated sensor; LIVE registers an external/isolated sensor.
        pass
    else:
        if mode == "LIVE":
            # LIVE Mode: verify that an isolated external listener is already bound on that port
            is_live_reachable = False
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(1.5)
            try:
                res_code = s.connect_ex(("127.0.0.1", payload.port))
                if res_code == 0:
                    is_live_reachable = True
            except Exception:
                is_live_reachable = False
            finally:
                s.close()

            if not is_live_reachable:
                raise HTTPException(
                    status_code=400,
                    detail=f"LIVE Mode Verification Failed: No active isolated sensor listener detected on port {payload.port}. Please ensure your isolated sensor daemon is running and listening, or select LAB mode to spawn a simulated local sensor."
                )
        else:
            # LAB Mode: verify port availability and spawn local sandboxed sensor
            is_free = False
            test_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            try:
                test_sock.bind(("0.0.0.0", payload.port))
                is_free = True
            except OSError:
                is_free = False
            finally:
                test_sock.close()

            if not is_free:
                raise HTTPException(
                    status_code=400,
                    detail=f"Port Conflict: Port {payload.port} is already in use by another local process. Please select a different port (e.g. 2223, 8081)."
                )

            try:
                await honeypot_manager.spawn_sensor(
                    hp_id=new_id,
                    hp_type=hp_type,
                    port=payload.port,
                    deception_level=payload.deception_level.upper(),
                    mode="LAB"
                )
            except Exception as spawn_err:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to initialize local honeypot sensor on port {payload.port}: {str(spawn_err)}"
                )

    # 4. Save to Database
    now = datetime.datetime.now(datetime.timezone.utc)
    desc_text = payload.description.strip() if payload.description else f"{mode} {hp_type.upper()} Honeypot Sensor"
    if not desc_text.startswith(f"[{mode}]"):
        desc_text = f"[{mode}] {desc_text}"

    new_hp = Honeypot(
        id=new_id,
        name=payload.name.strip(),
        type=hp_type,
        status="active",
        port=payload.port,
        uptime_seconds=0,
        sessions_count=0,
        requests_count=0,
        attacks_count=0,
        deception_level=payload.deception_level.upper(),
        description=desc_text,
        last_activity=now,
        created_at=now
    )
    db.add(new_hp)

    # 5. Log System Audit Event
    sys_event = SystemEvent(
        event_type="HONEYPOT_DEPLOYED",
        message=f"Honeypot '{new_hp.name}' ({new_id}) successfully deployed on port {new_hp.port} [{mode}].",
        details={
            "id": new_id,
            "name": new_hp.name,
            "type": hp_type,
            "port": new_hp.port,
            "mode": mode,
            "deception": new_hp.deception_level
        }
    )
    db.add(sys_event)
    await db.commit()
    await db.refresh(new_hp)

    # 6. Broadcast via WebSocket
    await manager.broadcast_honeypot({
        "id": new_hp.id,
        "name": new_hp.name,
        "type": new_hp.type,
        "status": new_hp.status,
        "deception_level": new_hp.deception_level,
        "last_activity": new_hp.last_activity.isoformat()
    })

    return new_hp

@router.get("/{honeypot_id}", response_model=HoneypotOut)
async def get_honeypot(honeypot_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Honeypot).where(Honeypot.id == honeypot_id))
    hp = res.scalar_one_or_none()
    if not hp:
        raise HTTPException(status_code=404, detail="Honeypot not found")
    return hp

@router.post("/{honeypot_id}/action", response_model=HoneypotOut)
async def perform_honeypot_action(honeypot_id: str, payload: HoneypotActionRequest, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Honeypot).where(Honeypot.id == honeypot_id))
    hp = res.scalar_one_or_none()
    if not hp:
        raise HTTPException(status_code=404, detail="Honeypot not found")

    action = payload.action.lower()
    now = datetime.datetime.now(datetime.timezone.utc)

    if action == "start":
        hp.status = "active"
    elif action == "stop":
        hp.status = "stopped"
    elif action == "restart":
        hp.status = "active"
        hp.uptime_seconds = 0
    elif action == "set_deception":
        if payload.deception_level in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
            hp.deception_level = payload.deception_level
            honeypot_manager.set_sensor_deception(hp.id, hp.deception_level)
        else:
            raise HTTPException(status_code=400, detail="Invalid deception level")
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported action: {payload.action}")

    hp.last_activity = now
    
    # Log event
    sys_ev = SystemEvent(
        event_type="HONEYPOT_CONTROL",
        message=f"Honeypot {honeypot_id} action '{action}' performed by analyst.",
        details={"honeypot_id": honeypot_id, "action": action, "status": hp.status, "deception": hp.deception_level}
    )
    db.add(sys_ev)
    await db.commit()
    await db.refresh(hp)

    # Broadcast via websocket
    await manager.broadcast_honeypot({
        "id": hp.id,
        "name": hp.name,
        "type": hp.type,
        "status": hp.status,
        "deception_level": hp.deception_level,
        "last_activity": hp.last_activity.isoformat()
    })

    return hp

@router.get("/{honeypot_id}/sessions")
async def get_honeypot_sessions(honeypot_id: str, limit: int = 20, db: AsyncSession = Depends(get_db)):
    q = select(HoneypotSession).where(HoneypotSession.honeypot_id == honeypot_id).order_by(desc(HoneypotSession.start_time)).limit(limit)
    res = await db.execute(q)
    return res.scalars().all()
