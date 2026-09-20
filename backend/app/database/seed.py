import datetime
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.models import (
    User, Honeypot, HoneypotSession, AttackEvent, AttackFeature, MLPrediction,
    ThreatIntelligence, MitreTechnique, AttackMitreMapping, Incident, IncidentEvent,
    Playbook, PlaybookExecution, BlocklistEntry, SystemEvent
)
from app.security.auth import get_password_hash
from app.services.mitre_service import mitre_service
from app.services.soar_service import soar_engine

logger = logging.getLogger("honeyguard.seed")

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

async def seed_database(db: AsyncSession):
    now = utcnow()

    # 1. Seed User
    user_res = await db.execute(select(User).where(User.username == "analyst"))
    if not user_res.scalar_one_or_none():
        analyst_user = User(
            username="analyst",
            email="analyst@honeyguard.local",
            hashed_password=get_password_hash("honeyguard2026!"),
            full_name="Security Analyst",
            role="analyst",
            is_active=True
        )
        db.add(analyst_user)

    # 2. Seed Honeypots (Matching Reference UI: SSH-HONEY-01 & HTTP-HONEY-01)
    hp_ssh_res = await db.execute(select(Honeypot).where(Honeypot.id == "SSH-HONEY-01"))
    if not hp_ssh_res.scalar_one_or_none():
        hp_ssh = Honeypot(
            id="SSH-HONEY-01",
            name="SSH-HONEY-01",
            type="ssh",
            status="active",
            port=2222,
            uptime_seconds=86400 * 5 + 3600 * 12,  # 5 days, 12 hours
            sessions_count=37,
            requests_count=182,
            attacks_count=24,
            deception_level="HIGH",
            description="Emulated SSH service with adaptive behaviour and session capture.",
            last_activity=now
        )
        db.add(hp_ssh)

    hp_http_res = await db.execute(select(Honeypot).where(Honeypot.id == "HTTP-HONEY-01"))
    if not hp_http_res.scalar_one_or_none():
        hp_http = Honeypot(
            id="HTTP-HONEY-01",
            name="HTTP-HONEY-01",
            type="http",
            status="active",
            port=8080,
            uptime_seconds=86400 * 3 + 3600 * 4,  # 3 days, 4 hours
            sessions_count=142,
            requests_count=890,
            attacks_count=61,
            deception_level="CRITICAL",
            description="Emulated HTTP service with dynamic responses and lure content.",
            last_activity=now
        )
        db.add(hp_http)

    await db.commit()

    # 3. Seed MITRE Techniques & Playbooks
    await mitre_service.seed_techniques(db)
    await soar_engine.seed_playbooks(db)

    # 4. Seed Threat Intelligence Records
    threat_intel_seeds = [
        ("185.199.110.23", "Russian Federation", "RU", "Moscow", 55.7558, 37.6173, "AS49453", "Mir Telematiki LLC", 88.0, 92, 348, ["brute-force", "ssh-scanner"]),
        ("103.21.244.18", "China", "CN", "Hangzhou", 30.2741, 120.1551, "AS4134", "CHINANET-BACKBONE", 76.5, 79, 182, ["web-scanner", "directory-traversal"]),
        ("45.12.78.90", "United States", "US", "Dallas", 32.7767, -96.7970, "AS14061", "DigitalOcean LLC", 64.0, 68, 94, ["compromised-vps", "credential-stuffer"]),
        ("91.189.94.5", "Germany", "DE", "Frankfurt", 50.1109, 8.6821, "AS24940", "Hetzner Online GmbH", 82.0, 85, 215, ["sqli-probe", "automated-exploit"]),
        ("172.67.201.44", "Singapore", "SG", "Singapore", 1.3521, 103.8198, "AS13335", "Cloudflare Inc.", 38.0, 25, 14, ["proxy", "web-crawler"]),
        ("203.0.113.77", "Netherlands", "NL", "Amsterdam", 52.3676, 4.9041, "AS1103", "SURFnet, The Netherlands", 55.0, 50, 42, ["ssh-probe"]),
        ("198.51.100.12", "Brazil", "BR", "Sao Paulo", -23.5505, -46.6333, "AS27699", "TELEFONICA BRASIL S.A", 71.0, 74, 130, ["bot-activity"]),
        ("104.28.53.91", "United Kingdom", "GB", "London", 51.5074, -0.1278, "AS13335", "Cloudflare Network", 45.0, 30, 28, ["bot-probe"]),
    ]

    for ip, country, code, city, lat, lng, asn, isp, rep, abuse, reports, tags in threat_intel_seeds:
        q = select(ThreatIntelligence).where(ThreatIntelligence.ip_address == ip)
        res = await db.execute(q)
        if not res.scalar_one_or_none():
            ti = ThreatIntelligence(
                ip_address=ip,
                is_private=False,
                country_name=country,
                country_code=code,
                city=city,
                latitude=lat,
                longitude=lng,
                asn=asn,
                isp=isp,
                reputation_score=rep,
                abuse_confidence_score=abuse,
                known_reports_count=reports,
                first_seen=now - datetime.timedelta(days=12),
                last_seen=now,
                local_sightings=3,
                tags=tags,
                raw_intel={"verified": True, "curated_feed": "HoneyNet Global"},
                last_checked_at=now
            )
            db.add(ti)

    # 5. Seed Blocklist
    blocked_ips_seed = [
        ("185.199.110.23", "Autonomous containment trigger: High velocity SSH brute force"),
        ("103.21.244.18", "Automated quarantine: Web directory enumeration probe"),
        ("91.189.94.5", "SQL injection exploit signature detected"),
        ("198.51.100.12", "Masscan scanner botnet node")
    ]
    for ip, reason in blocked_ips_seed:
        q = select(BlocklistEntry).where(BlocklistEntry.ip_address == ip)
        res = await db.execute(q)
        if not res.scalar_one_or_none():
            be = BlocklistEntry(
                ip_address=ip,
                reason=reason,
                action_type="SIMULATED_QUARANTINE",
                active=True,
                expires_at=now + datetime.timedelta(hours=48),
                created_at=now - datetime.timedelta(hours=6)
            )
            db.add(be)

    await db.commit()

    # 6. Seed Baseline Attack Events (matching Reference UI attacks table)
    events_count_res = await db.execute(select(func.count(AttackEvent.id)))
    if (events_count_res.scalar() or 0) < 5:
        sample_attacks = [
            ("EVT-1001", "SSH-HONEY-01", "SSH", "185.199.110.23", "Brute Force", "CRITICAL", 87.0, "user=root pass=admin123; user=admin pass=password"),
            ("EVT-1002", "HTTP-HONEY-01", "HTTP", "103.21.244.18", "Directory Scanning", "HIGH", 74.0, "GET /wp-login.php HTTP/1.1; GET /.env HTTP/1.1"),
            ("EVT-1003", "SSH-HONEY-01", "SSH", "45.12.78.90", "Command Execution", "MEDIUM", 58.0, "whoami; uname -a; id; cat /etc/passwd"),
            ("EVT-1004", "HTTP-HONEY-01", "HTTP", "91.189.94.5", "SQL Injection", "HIGH", 79.0, "GET /api/v1/auth?id=1' OR '1'='1'-- HTTP/1.1"),
            ("EVT-1005", "HTTP-HONEY-01", "HTTP", "172.67.201.44", "Vulnerability Scan", "LOW", 32.0, "GET /actuator/health HTTP/1.1"),
            ("EVT-1006", "SSH-HONEY-01", "SSH", "203.0.113.77", "Credential Attack", "MEDIUM", 52.0, "user=support pass=winter2024"),
            ("EVT-1007", "HTTP-HONEY-01", "HTTP", "198.51.100.12", "Bot Activity", "LOW", 28.0, "GET /robots.txt HTTP/1.1 (User-Agent: Masscan)"),
            ("EVT-1008", "SSH-HONEY-01", "SSH", "104.28.53.91", "Brute Force", "CRITICAL", 89.5, "user=oracle pass=oracle; user=postgres pass=postgres")
        ]

        for i, (eid, hid, svc, ip, atype, sev, score, payload) in enumerate(sample_attacks):
            ev_time = now - datetime.timedelta(minutes=(i * 12 + 4))
            ev = AttackEvent(
                id=eid,
                session_id=f"SES-{eid[4:]}",
                honeypot_id=hid,
                timestamp=ev_time,
                source_ip=ip,
                service=svc,
                activity=f"{atype} attempt detected on {svc}",
                attack_type=atype,
                severity=sev,
                threat_score=score,
                status="analyzed",
                raw_payload=payload,
                event_metadata={"scoring_breakdown": {"total_score": score, "severity": sev}},
                mode="REPLAY"
            )
            db.add(ev)

            # Feature
            feat = AttackFeature(
                event_id=eid,
                auth_failures=8 if "Brute" in atype or "Cred" in atype else 0,
                request_frequency=6.5 if "Scan" in atype else 2.0,
                session_duration=18.0,
                command_count=4 if "Command" in atype else 0,
                endpoint_diversity=12 if "Directory" in atype else 1,
                payload_entropy=3.8,
                user_agent_score=0.9 if "Bot" in atype else 0.2,
                extracted_features={}
            )
            db.add(feat)

            # Prediction
            pred = MLPrediction(
                event_id=eid,
                model_name="RandomForest_Honeynet_v1",
                predicted_class=atype,
                confidence=0.94,
                probabilities={atype: 0.94},
                feature_importance={"auth_failures": 0.28, "request_frequency": 0.22},
                explanation=f"Strong pattern correlation with {atype} heuristics."
            )
            db.add(pred)

            # Link MITRE
            tech_id = "T1110.001" if "Brute" in atype else ("T1190" if "SQL" in atype or "Scan" in atype else "T1059.004")
            m_map = AttackMitreMapping(
                event_id=eid,
                technique_id=tech_id,
                confidence=0.95,
                rationale="Automated correlation with observed honeypot telemetry."
            )
            db.add(m_map)

        # 7. Seed Sample Incident (e.g. INC-2026-001)
        inc = Incident(
            id="INC-2026-001",
            title="Autonomous Incident: Brute Force against SSH-HONEY-01 from 185.199.110.23",
            severity="CRITICAL",
            status="OPEN",
            source_ip="185.199.110.23",
            attack_type="Brute Force",
            threat_score=87.0,
            session_id="SES-1001",
            honeypot_id="SSH-HONEY-01",
            assigned_analyst="Security Analyst",
            summary="Autonomous HoneyGuard alert triggered for high-frequency credential spray against SSH sensor.",
            mitre_summary=["T1110.001", "T1078"],
            playbook_summary=["PLAYBOOK-CRIT-01"],
            created_at=now - datetime.timedelta(minutes=52),
            updated_at=now - datetime.timedelta(minutes=10)
        )
        db.add(inc)
        await db.flush()

        inc_ev1 = IncidentEvent(
            incident_id="INC-2026-001",
            timestamp=now - datetime.timedelta(minutes=52),
            event_type="CREATED",
            description="Incident created autonomously by Risk Engine.",
            performed_by="HoneyGuard Threat Engine"
        )
        inc_ev2 = IncidentEvent(
            incident_id="INC-2026-001",
            timestamp=now - datetime.timedelta(minutes=51),
            event_type="CONTAINED",
            description="Autonomous SOAR playbook executed. Simulated quarantine enacted.",
            performed_by="HoneyGuard SOAR Engine"
        )
        db.add(inc_ev1)
        db.add(inc_ev2)

        # Seed Playbook Execution
        pb_exec = PlaybookExecution(
            id="EXEC-CRIT-001",
            playbook_id="PLAYBOOK-CRIT-01",
            event_id="EVT-1001",
            incident_id="INC-2026-001",
            status="SUCCESS",
            execution_steps=[
                {"name": "Attack analyzed", "status": "COMPLETED", "detail": "ML verified: Brute Force"},
                {"name": "Threat intelligence retrieved", "status": "COMPLETED", "detail": "185.199.110.23 (RU) reputation: 88.0"},
                {"name": "MITRE mapped", "status": "COMPLETED", "detail": "T1110.001 - Password Guessing"},
                {"name": "Incident created", "status": "COMPLETED", "detail": "INC-2026-001"},
                {"name": "Adaptive mode increased", "status": "COMPLETED", "detail": "Escalated to HIGH Deception"},
                {"name": "Response recorded", "status": "COMPLETED", "detail": "Simulated quarantine recorded"}
            ],
            started_at=now - datetime.timedelta(minutes=52),
            completed_at=now - datetime.timedelta(minutes=51)
        )
        db.add(pb_exec)

    await db.commit()
    logger.info("Database seeding completed successfully.")
