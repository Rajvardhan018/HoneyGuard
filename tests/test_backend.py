import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.session import AsyncSessionLocal, init_db
from app.database.seed import seed_database
from app.services.ml_service import ml_service
from app.services.scoring_service import scoring_engine
from app.services.event_processor import event_processor

@pytest.mark.asyncio
async def test_database_init_and_seed():
    await init_db()
    async with AsyncSessionLocal() as session:
        await seed_database(session)

@pytest.mark.asyncio
async def test_ml_prediction():
    sample_telemetry = {
        "auth_failures": 12,
        "request_frequency": 5.0,
        "duration_seconds": 15.0,
        "command_count": 0,
        "endpoint_diversity": 1,
        "raw_payload": "user=admin pass=123456",
        "user_agent": "-"
    }
    result = ml_service.predict(sample_telemetry)
    assert result["predicted_class"] in ["Brute Force", "Credential Attack"]
    assert result["confidence"] > 0.4

@pytest.mark.asyncio
async def test_scoring_engine():
    features = {"auth_failures": 10, "request_frequency": 6.0, "command_count": 0}
    score, severity, breakdown = scoring_engine.calculate_score(
        attack_type="Brute Force",
        ml_confidence=0.95,
        features=features,
        reputation_score=85.0,
        mitre_count=2
    )
    assert score >= 70.0
    assert severity in ["HIGH", "CRITICAL"]
    assert "components" in breakdown

@pytest.mark.asyncio
async def test_e2e_event_processing():
    telemetry = {
        "service": "SSH",
        "honeypot_id": "SSH-HONEY-01",
        "source_ip": "185.199.110.23",
        "source_port": 54321,
        "auth_failures": 15,
        "request_frequency": 7.0,
        "duration_seconds": 20.0,
        "command_count": 0,
        "endpoint_diversity": 1,
        "raw_payload": "user=root pass=admin; user=oracle pass=oracle",
        "user_agent": "ssh-brute-tool",
        "mode": "LAB"
    }
    async with AsyncSessionLocal() as session:
        event = await event_processor.process_raw_event(telemetry, session)
        assert event["id"] is not None
        assert event["threat_score"] > 60.0
        assert event["severity"] in ["HIGH", "CRITICAL"]
        assert event["country_code"] == "RU"

@pytest.mark.asyncio
async def test_dashboard_api():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_attacks" in data
        assert "critical_threats" in data
        assert "recent_attacks" in data

@pytest.mark.asyncio
async def test_create_honeypot_api():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test creating a LAB honeypot on an isolated port
        payload = {
            "name": "SSH-TEST-LAB",
            "type": "ssh",
            "port": 2229,
            "description": "Academic test honeypot",
            "deception_level": "HIGH",
            "deployment_mode": "LAB"
        }
        res = await client.post("/api/v1/honeypots/", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["name"] == "SSH-TEST-LAB"
        assert data["port"] == 2229
        assert data["deception_level"] == "HIGH"
        assert "SSH-LAB" in data["id"]

        # 2. Test port collision check
        res_dup = await client.post("/api/v1/honeypots/", json=payload)
        assert res_dup.status_code == 400
        assert "already assigned" in res_dup.json()["detail"]

        # 3. Test LIVE mode verification failure for unbound port
        live_payload = {
            "name": "HTTP-UNBOUND-LIVE",
            "type": "http",
            "port": 59998,
            "description": "Unbound live test",
            "deception_level": "MEDIUM",
            "deployment_mode": "LIVE"
        }
        res_live = await client.post("/api/v1/honeypots/", json=live_payload)
        assert res_live.status_code == 400
        assert "LIVE Mode Verification Failed" in res_live.json()["detail"]
