import datetime
import logging
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.models import Honeypot, SystemEvent
from app.websocket.manager import manager

logger = logging.getLogger("honeyguard.adaptive")

DECEPTION_PROFILES = {
    "LOW": {
        "tier": "LOW",
        "name": "Standard Emulation",
        "description": "Standard service banners, immediate connection resets on anomaly, basic 404/401 HTTP codes.",
        "shell_delay_ms": 0,
        "fake_file_access": False,
        "logging_detail": "STANDARD",
        "banner_style": "Generic OpenSSH / Basic Nginx"
    },
    "MEDIUM": {
        "tier": "MEDIUM",
        "name": "Heuristic Decoy",
        "description": "Realistic fake administrative login interfaces, simulated session keepalive, detailed command responses.",
        "shell_delay_ms": 250,
        "fake_file_access": True,
        "logging_detail": "VERBOSE",
        "banner_style": "Ubuntu OpenSSH 8.9p1 / Apache 2.4.52"
    },
    "HIGH": {
        "tier": "HIGH",
        "name": "Deep Deception",
        "description": "Simulated vulnerable services, lure filesystem (/var/www/backup.sql, /etc/shadow dummy entries), honeytoken artifacts.",
        "shell_delay_ms": 500,
        "fake_file_access": True,
        "logging_detail": "FULL_PACKET",
        "banner_style": "Enterprise Gateway / Spring Boot Actuator"
    },
    "CRITICAL": {
        "tier": "CRITICAL",
        "name": "Active Containment & Trap",
        "description": "High-interaction labyrinth, infinite tar-pit delay, honeytokens with canary triggers, rate-limited tarpit.",
        "shell_delay_ms": 1200,
        "fake_file_access": True,
        "logging_detail": "FORENSIC_CAPTURE",
        "banner_style": "Sensitive Internal Core Router"
    }
}

class AdaptiveDeceptionService:
    async def evaluate_and_adapt(self, honeypot_id: str, threat_score: float, db: AsyncSession) -> str:
        q = select(Honeypot).where(Honeypot.id == honeypot_id)
        res = await db.execute(q)
        hp = res.scalar_one_or_none()
        if not hp:
            return "LOW"

        # Determine target deception tier based on threat score
        if threat_score >= 80.0:
            target_level = "CRITICAL"
        elif threat_score >= 60.0:
            target_level = "HIGH"
        elif threat_score >= 35.0:
            target_level = "MEDIUM"
        else:
            target_level = "LOW"

        # Escalate if target is higher than current
        tier_weights = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
        current_weight = tier_weights.get(hp.deception_level, 1)
        target_weight = tier_weights.get(target_level, 1)

        if target_weight > current_weight:
            old_level = hp.deception_level
            hp.deception_level = target_level
            hp.last_activity = datetime.datetime.now(datetime.timezone.utc)
            
            # Log system event
            sys_ev = SystemEvent(
                event_type="ADAPTATION",
                message=f"Honeypot {honeypot_id} deception escalated from {old_level} to {target_level} due to threat score {threat_score}.",
                details={
                    "honeypot_id": honeypot_id,
                    "old_level": old_level,
                    "new_level": target_level,
                    "trigger_score": threat_score,
                    "profile": DECEPTION_PROFILES[target_level]
                }
            )
            db.add(sys_ev)
            await db.commit()

            # Broadcast honeypot status change over WebSocket
            await manager.broadcast_honeypot({
                "id": hp.id,
                "name": hp.name,
                "type": hp.type,
                "status": hp.status,
                "deception_level": hp.deception_level,
                "last_activity": hp.last_activity.isoformat()
            })

            return target_level
        
        return hp.deception_level

    def get_profile(self, level: str) -> Dict[str, Any]:
        return DECEPTION_PROFILES.get(level, DECEPTION_PROFILES["LOW"])

adaptive_service = AdaptiveDeceptionService()
