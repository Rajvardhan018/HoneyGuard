import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON, Index
)
from sqlalchemy.orm import relationship
from app.database.session import Base

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    full_name = Column(String(128), default="Security Analyst")
    role = Column(String(32), default="analyst")  # analyst, admin, viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class Honeypot(Base):
    __tablename__ = "honeypots"

    id = Column(String(64), primary_key=True, index=True)  # e.g., SSH-HONEY-01, HTTP-HONEY-01
    name = Column(String(128), nullable=False)
    type = Column(String(32), nullable=False)  # ssh, http
    status = Column(String(32), default="active")  # active, stopped, restarted
    port = Column(Integer, nullable=False)
    uptime_seconds = Column(Integer, default=0)
    sessions_count = Column(Integer, default=0)
    requests_count = Column(Integer, default=0)
    attacks_count = Column(Integer, default=0)
    deception_level = Column(String(32), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(String(256), nullable=True)
    last_activity = Column(DateTime(timezone=True), default=utcnow)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    sessions = relationship("HoneypotSession", back_populates="honeypot", cascade="all, delete-orphan")
    events = relationship("AttackEvent", back_populates="honeypot")


class HoneypotSession(Base):
    __tablename__ = "honeypot_sessions"

    id = Column(String(64), primary_key=True, index=True)
    honeypot_id = Column(String(64), ForeignKey("honeypots.id"), nullable=False, index=True)
    source_ip = Column(String(64), nullable=False, index=True)
    source_port = Column(Integer, nullable=True)
    start_time = Column(DateTime(timezone=True), default=utcnow, index=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Float, default=0.0)
    protocol = Column(String(32), nullable=False)  # SSH, HTTP
    status = Column(String(32), default="open")  # open, closed, terminated
    session_data = Column(JSON, default=dict)  # Captured credentials, commands, client info

    honeypot = relationship("Honeypot", back_populates="sessions")
    events = relationship("AttackEvent", back_populates="session", cascade="all, delete-orphan")


class AttackEvent(Base):
    __tablename__ = "attack_events"

    id = Column(String(64), primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("honeypot_sessions.id"), nullable=True, index=True)
    honeypot_id = Column(String(64), ForeignKey("honeypots.id"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow, index=True)
    source_ip = Column(String(64), nullable=False, index=True)
    service = Column(String(32), nullable=False)  # SSH, HTTP
    activity = Column(String(256), nullable=False)
    attack_type = Column(String(64), nullable=False, index=True)  # Brute Force, Directory Scanning, SQL Injection, etc.
    severity = Column(String(32), nullable=False, index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    threat_score = Column(Float, nullable=False, default=0.0)
    status = Column(String(32), default="analyzed")  # detected, analyzing, analyzed, contained
    raw_payload = Column(Text, nullable=True)
    event_metadata = Column(JSON, default=dict)
    mode = Column(String(32), default="LIVE", index=True)  # LIVE, LAB, REPLAY

    honeypot = relationship("Honeypot", back_populates="events")
    session = relationship("HoneypotSession", back_populates="events")
    features = relationship("AttackFeature", uselist=False, back_populates="event", cascade="all, delete-orphan")
    prediction = relationship("MLPrediction", uselist=False, back_populates="event", cascade="all, delete-orphan")
    mitre_mappings = relationship("AttackMitreMapping", back_populates="event", cascade="all, delete-orphan")
    playbook_executions = relationship("PlaybookExecution", back_populates="event")


class AttackFeature(Base):
    __tablename__ = "attack_features"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(64), ForeignKey("attack_events.id"), unique=True, nullable=False, index=True)
    auth_failures = Column(Integer, default=0)
    request_frequency = Column(Float, default=0.0)
    session_duration = Column(Float, default=0.0)
    command_count = Column(Integer, default=0)
    endpoint_diversity = Column(Integer, default=1)
    payload_entropy = Column(Float, default=0.0)
    user_agent_score = Column(Float, default=0.0)
    extracted_features = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    event = relationship("AttackEvent", back_populates="features")


class MLPrediction(Base):
    __tablename__ = "ml_predictions"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(64), ForeignKey("attack_events.id"), unique=True, nullable=False, index=True)
    model_name = Column(String(64), default="RandomForest_v1")
    predicted_class = Column(String(64), nullable=False)
    confidence = Column(Float, nullable=False)  # 0.0 - 1.0
    probabilities = Column(JSON, default=dict)
    feature_importance = Column(JSON, default=dict)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    event = relationship("AttackEvent", back_populates="prediction")


class ThreatIntelligence(Base):
    __tablename__ = "threat_intelligence"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String(64), unique=True, index=True, nullable=False)
    is_private = Column(Boolean, default=False)
    country_name = Column(String(128), default="Unknown")
    country_code = Column(String(8), default="XX")
    city = Column(String(128), default="Unknown")
    latitude = Column(Float, default=0.0)
    longitude = Column(Float, default=0.0)
    asn = Column(String(64), default="AS0")
    isp = Column(String(128), default="Unknown ISP")
    reputation_score = Column(Float, default=0.0)  # 0 to 100
    abuse_confidence_score = Column(Integer, default=0)
    known_reports_count = Column(Integer, default=0)
    first_seen = Column(DateTime(timezone=True), default=utcnow)
    last_seen = Column(DateTime(timezone=True), default=utcnow)
    local_sightings = Column(Integer, default=1)
    tags = Column(JSON, default=list)
    raw_intel = Column(JSON, default=dict)
    last_checked_at = Column(DateTime(timezone=True), default=utcnow)


class MitreTechnique(Base):
    __tablename__ = "mitre_techniques"

    id = Column(String(32), primary_key=True, index=True)  # e.g., T1110, T1059
    name = Column(String(128), nullable=False)
    tactic = Column(String(64), nullable=False, index=True)  # Initial Access, Execution, etc.
    description = Column(Text, nullable=False)
    detection_guidance = Column(Text, nullable=True)
    reference_url = Column(String(256), nullable=True)
    observed_count = Column(Integer, default=0)
    confidence = Column(Float, default=0.95)

    mappings = relationship("AttackMitreMapping", back_populates="technique")


class AttackMitreMapping(Base):
    __tablename__ = "attack_mitre_mappings"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(64), ForeignKey("attack_events.id"), nullable=False, index=True)
    technique_id = Column(String(32), ForeignKey("mitre_techniques.id"), nullable=False, index=True)
    confidence = Column(Float, default=1.0)
    rationale = Column(String(256), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    event = relationship("AttackEvent", back_populates="mitre_mappings")
    technique = relationship("MitreTechnique", back_populates="mappings")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(64), primary_key=True, index=True)  # e.g., INC-2026-001
    title = Column(String(256), nullable=False)
    severity = Column(String(32), nullable=False, index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(32), default="OPEN", index=True)  # OPEN, INVESTIGATING, RESOLVED
    source_ip = Column(String(64), nullable=False, index=True)
    attack_type = Column(String(64), nullable=False)
    threat_score = Column(Float, nullable=False)
    session_id = Column(String(64), nullable=True)
    honeypot_id = Column(String(64), nullable=True)
    assigned_analyst = Column(String(128), default="Security Analyst")
    summary = Column(Text, nullable=True)
    mitre_summary = Column(JSON, default=list)
    playbook_summary = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    events = relationship("IncidentEvent", back_populates="incident", cascade="all, delete-orphan")
    playbook_executions = relationship("PlaybookExecution", back_populates="incident")


class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(64), ForeignKey("incidents.id"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow)
    event_type = Column(String(64), nullable=False)  # CREATED, ANALYZED, CONTAINED, ADAPTED, STATUS_CHANGE, NOTE_ADDED
    description = Column(Text, nullable=False)
    performed_by = Column(String(128), default="SOAR Engine")
    details = Column(JSON, default=dict)

    incident = relationship("Incident", back_populates="events")


class Playbook(Base):
    __tablename__ = "playbooks"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    trigger_condition = Column(String(256), nullable=False)  # e.g. "threat_score >= 80"
    actions = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    executions = relationship("PlaybookExecution", back_populates="playbook")


class PlaybookExecution(Base):
    __tablename__ = "playbook_executions"

    id = Column(String(64), primary_key=True, index=True)
    playbook_id = Column(String(64), ForeignKey("playbooks.id"), nullable=False, index=True)
    event_id = Column(String(64), ForeignKey("attack_events.id"), nullable=True, index=True)
    incident_id = Column(String(64), ForeignKey("incidents.id"), nullable=True, index=True)
    status = Column(String(32), default="SUCCESS")  # SUCCESS, RUNNING, FAILED, SIMULATED
    execution_steps = Column(JSON, default=list)  # list of {step: str, status: str, time: str, detail: str}
    started_at = Column(DateTime(timezone=True), default=utcnow)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    playbook = relationship("Playbook", back_populates="executions")
    event = relationship("AttackEvent", back_populates="playbook_executions")
    incident = relationship("Incident", back_populates="playbook_executions")


class BlocklistEntry(Base):
    __tablename__ = "blocklist"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String(64), unique=True, index=True, nullable=False)
    reason = Column(String(256), nullable=False)
    action_type = Column(String(64), default="SIMULATED_QUARANTINE")  # SIMULATED_QUARANTINE, RATE_LIMITED, BLOCKED
    active = Column(Boolean, default=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class SystemEvent(Base):
    __tablename__ = "system_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(64), nullable=False, index=True)  # SERVICE_START, ADAPTATION, THREAT_DETECTED, ERROR
    message = Column(String(256), nullable=False)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=utcnow, index=True)
