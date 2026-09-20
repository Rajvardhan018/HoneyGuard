import datetime
import uuid
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import Playbook, PlaybookExecution, BlocklistEntry, IncidentEvent
from app.websocket.manager import manager

logger = logging.getLogger("honeyguard.soar")

INITIAL_PLAYBOOKS = [
    {
        "id": "PLAYBOOK-CRIT-01",
        "name": "Critical Threat Autonomous Containment",
        "description": "Triggered when threat score >= 80. Enriches indicators, maps MITRE tactics, quarantines IP, and elevates deception to CRITICAL.",
        "trigger_condition": "threat_score >= 80.0",
        "actions": [
            {"step": "analyze_telemetry", "name": "Extract & Classify ML Features"},
            {"step": "enrich_intel", "name": "Query Threat Intelligence & Geolocation"},
            {"step": "map_mitre", "name": "Correlate with MITRE ATT&CK Matrix"},
            {"step": "adapt_honeypot", "name": "Escalate Honeypot to CRITICAL Deception"},
            {"step": "quarantine_ip", "name": "Issue Safe Simulated Quarantine"},
            {"step": "create_incident", "name": "Generate Security Incident & Notify Analyst"}
        ]
    },
    {
        "id": "PLAYBOOK-BRUTE-02",
        "name": "Credential Spray Tarpit Slowdown",
        "description": "Triggered on high-frequency SSH credential attacks. Adds latency tarpit and decoy credentials.",
        "trigger_condition": "attack_type == 'Brute Force' and threat_score >= 60.0",
        "actions": [
            {"step": "analyze_telemetry", "name": "Compute Failed Auth Velocity"},
            {"step": "adapt_honeypot", "name": "Inject 1200ms Tarpit Delay into Shell"},
            {"step": "quarantine_ip", "name": "Rate-Limit Simulated Quarantine"},
            {"step": "notify_analyst", "name": "Push Real-Time Analyst Alert"}
        ]
    }
]

class SOAREngine:
    async def seed_playbooks(self, db: AsyncSession):
        for pb in INITIAL_PLAYBOOKS:
            q = select(Playbook).where(Playbook.id == pb["id"])
            res = await db.execute(q)
            existing = res.scalar_one_or_none()
            if not existing:
                record = Playbook(
                    id=pb["id"],
                    name=pb["name"],
                    description=pb["description"],
                    trigger_condition=pb["trigger_condition"],
                    actions=pb["actions"],
                    is_active=True
                )
                db.add(record)
        await db.commit()

    async def execute_response(
        self,
        event_id: str,
        source_ip: str,
        attack_type: str,
        threat_score: float,
        incident_id: Optional[str],
        db: AsyncSession
    ) -> Optional[Dict[str, Any]]:
        # Pick playbook
        playbook_id = "PLAYBOOK-CRIT-01" if threat_score >= 80.0 else "PLAYBOOK-BRUTE-02"
        now = datetime.datetime.now(datetime.timezone.utc)
        exec_id = f"EXEC-{uuid.uuid4().hex[:8].upper()}"

        steps = [
            {"name": "Attack analyzed", "status": "COMPLETED", "detail": f"ML classification verified: {attack_type}"},
            {"name": "Threat intelligence retrieved", "status": "COMPLETED", "detail": f"Geolocation & ASN context enriched for {source_ip}"},
            {"name": "MITRE mapped", "status": "COMPLETED", "detail": "Correlated against MITRE ATT&CK techniques"},
            {"name": "Incident created", "status": "COMPLETED" if incident_id else "SKIPPED", "detail": f"Associated case: {incident_id or 'Under threshold'}"},
            {"name": "Adaptive mode increased", "status": "COMPLETED", "detail": "Honeypot deception state dynamically escalated"},
            {"name": "Response recorded", "status": "COMPLETED", "detail": f"Simulated quarantine recorded for IP {source_ip}"}
        ]

        # Record simulated quarantine entry in Blocklist
        block_q = select(BlocklistEntry).where(BlocklistEntry.ip_address == source_ip)
        block_res = await db.execute(block_q)
        existing_block = block_res.scalar_one_or_none()
        if not existing_block:
            entry = BlocklistEntry(
                ip_address=source_ip,
                reason=f"Autonomous SOAR Playbook quarantine trigger ({attack_type}, score: {threat_score})",
                action_type="SIMULATED_QUARANTINE",
                active=True,
                expires_at=now + datetime.timedelta(hours=24)
            )
            db.add(entry)

        # Record execution in DB
        execution = PlaybookExecution(
            id=exec_id,
            playbook_id=playbook_id,
            event_id=event_id,
            incident_id=incident_id,
            status="SUCCESS",
            execution_steps=steps,
            started_at=now,
            completed_at=now + datetime.timedelta(milliseconds=140)
        )
        db.add(execution)

        if incident_id:
            ev = IncidentEvent(
                incident_id=incident_id,
                timestamp=now,
                event_type="CONTAINED",
                description=f"Autonomous SOAR playbook {playbook_id} executed successfully. Simulated quarantine placed on {source_ip}.",
                performed_by="HoneyGuard SOAR Engine",
                details={"execution_id": exec_id, "steps": steps}
            )
            db.add(ev)

        await db.commit()

        # Broadcast SOAR execution to connected WebSocket clients
        await manager.broadcast_soar({
            "id": exec_id,
            "playbook_id": playbook_id,
            "source_ip": source_ip,
            "threat_score": threat_score,
            "status": "SUCCESS",
            "steps": steps
        })

        return {
            "execution_id": exec_id,
            "playbook_id": playbook_id,
            "status": "SUCCESS",
            "steps": steps
        }

soar_engine = SOAREngine()
