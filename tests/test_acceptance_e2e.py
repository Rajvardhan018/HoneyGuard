import pytest
import uuid
from app.main import app
from app.database.session import AsyncSessionLocal, init_db
from app.database.seed import seed_database
from app.services.event_processor import event_processor
from app.models.models import AttackEvent, Incident, PlaybookExecution, Honeypot
from sqlalchemy import select

@pytest.mark.asyncio
async def test_full_acceptance_scenario():
    await init_db()
    async with AsyncSessionLocal() as session:
        await seed_database(session)

    evt_id = f"EVT-ACCEPTANCE-{uuid.uuid4().hex[:6].upper()}"
    ses_id = f"SES-ACCEPTANCE-{uuid.uuid4().hex[:6].upper()}"

    test_event = {
        "id": evt_id,
        "session_id": ses_id,
        "honeypot_id": "SSH-HONEY-01",
        "service": "SSH",
        "source_ip": "185.199.110.23",
        "source_port": 51234,
        "auth_failures": 16,
        "request_frequency": 8.5,
        "duration_seconds": 22.0,
        "command_count": 0,
        "endpoint_diversity": 1,
        "raw_payload": "user=root pass=admin123 and user=admin pass=toor",
        "user_agent": "Paramiko-Adversary-Scanner",
        "mode": "LAB"
    }

    async with AsyncSessionLocal() as session:
        processed = await event_processor.process_raw_event(test_event, session)
        
        # Verify ML Classification and Scoring
        assert processed["attack_type"] in ["Brute Force", "Credential Attack"]
        assert processed["threat_score"] >= 80.0
        assert processed["severity"] == "CRITICAL"
        assert processed["deception_level"] in ["HIGH", "CRITICAL"]
        
        # Verify Incident was automatically generated
        assert processed["incident_id"] is not None

        # Verify DB records
        q_ev = select(AttackEvent).where(AttackEvent.id == evt_id)
        res_ev = await session.execute(q_ev)
        db_event = res_ev.scalar_one_or_none()
        assert db_event is not None
        assert db_event.threat_score >= 80.0

        q_inc = select(Incident).where(Incident.id == processed["incident_id"])
        res_inc = await session.execute(q_inc)
        db_inc = res_inc.scalar_one_or_none()
        assert db_inc is not None
        assert db_inc.status == "OPEN"
        assert db_inc.severity == "CRITICAL"

        # Verify SOAR playbook executed
        q_soar = select(PlaybookExecution).where(PlaybookExecution.event_id == evt_id)
        res_soar = await session.execute(q_soar)
        db_soar = res_soar.scalar_one_or_none()
        assert db_soar is not None
        assert db_soar.status == "SUCCESS"
        assert len(db_soar.execution_steps) >= 5
