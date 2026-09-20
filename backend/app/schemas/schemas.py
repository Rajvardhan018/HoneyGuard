from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

# Auth
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool

# Honeypots
class HoneypotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    type: str
    status: str
    port: int
    uptime_seconds: int
    sessions_count: int
    requests_count: int
    attacks_count: int
    deception_level: str
    description: Optional[str] = None
    last_activity: Optional[datetime] = None

class HoneypotCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    type: str = Field(..., pattern="^(?i)(ssh|http)$")
    port: int = Field(..., ge=1024, le=65535)
    description: Optional[str] = Field(None, max_length=256)
    deception_level: str = Field("LOW", pattern="^(?i)(LOW|MEDIUM|HIGH|CRITICAL)$")
    deployment_mode: str = Field("LAB", pattern="^(?i)(LAB|LIVE)$")

class HoneypotActionRequest(BaseModel):
    action: str  # start, stop, restart, set_deception
    deception_level: Optional[str] = None

# Attacks
class AttackEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: Optional[str] = None
    honeypot_id: str
    timestamp: datetime
    source_ip: str
    service: str
    activity: str
    attack_type: str
    severity: str
    threat_score: float
    status: str
    mode: str = "LIVE"

class FeatureOut(BaseModel):
    auth_failures: int
    request_frequency: float
    session_duration: float
    command_count: int
    endpoint_diversity: int
    payload_entropy: float
    user_agent_score: float
    extracted_features: Dict[str, Any] = {}

class MLPredictionOut(BaseModel):
    model_name: str
    predicted_class: str
    confidence: float
    probabilities: Dict[str, float] = {}
    feature_importance: Dict[str, float] = {}
    explanation: Optional[str] = None

class MitreMappingOut(BaseModel):
    technique_id: str
    technique_name: str
    tactic: str
    confidence: float
    rationale: Optional[str] = None

class AttackDetailOut(BaseModel):
    id: str
    session_id: Optional[str]
    honeypot_id: str
    timestamp: datetime
    source_ip: str
    service: str
    activity: str
    attack_type: str
    severity: str
    threat_score: float
    status: str
    raw_payload: Optional[str]
    event_metadata: Dict[str, Any]
    mode: str
    features: Optional[FeatureOut] = None
    prediction: Optional[MLPredictionOut] = None
    threat_intel: Optional[Dict[str, Any]] = None
    mitre_mappings: List[MitreMappingOut] = []
    response_actions: List[Dict[str, Any]] = []
    incident_id: Optional[str] = None
    timeline: List[Dict[str, Any]] = []

# Threat Intelligence
class ThreatIntelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ip_address: str
    is_private: bool
    country_name: str
    country_code: str
    city: str
    latitude: float
    longitude: float
    asn: str
    isp: str
    reputation_score: float
    abuse_confidence_score: int
    known_reports_count: int
    first_seen: datetime
    last_seen: datetime
    local_sightings: int
    tags: List[str] = []
    raw_intel: Dict[str, Any] = {}
    last_checked_at: datetime

# MITRE
class MitreTechniqueOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    tactic: str
    description: str
    detection_guidance: Optional[str] = None
    reference_url: Optional[str] = None
    observed_count: int
    confidence: float

# Incidents
class IncidentEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    event_type: str
    description: str
    performed_by: str
    details: Dict[str, Any] = {}

class IncidentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    severity: str
    status: str
    source_ip: str
    attack_type: str
    threat_score: float
    session_id: Optional[str]
    honeypot_id: Optional[str]
    assigned_analyst: str
    summary: Optional[str]
    mitre_summary: List[str] = []
    playbook_summary: List[str] = []
    created_at: datetime
    updated_at: datetime
    events: List[IncidentEventOut] = []

class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    assigned_analyst: Optional[str] = None
    notes: Optional[str] = None

# SOAR & Playbooks
class PlaybookOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    trigger_condition: str
    actions: List[Dict[str, Any]]
    is_active: bool

class PlaybookExecutionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    playbook_id: str
    playbook_name: Optional[str] = None
    event_id: Optional[str]
    incident_id: Optional[str]
    status: str
    execution_steps: List[Dict[str, Any]]
    started_at: datetime
    completed_at: Optional[datetime]

# Dashboard
class AttackActivityPoint(BaseModel):
    time: str
    ssh: int
    http: int
    total: int

class SeverityDistribution(BaseModel):
    critical: int
    high: int
    medium: int
    low: int
    total: int

class TopSourceCountry(BaseModel):
    country: str
    code: str
    count: int
    percentage: float

class DashboardStats(BaseModel):
    total_attacks: int
    critical_threats: int
    open_incidents: int
    blocked_ips: int
    active_honeypots: int
    system_uptime_pct: float = 99.7
    system_mode: str = "LIVE"
    activity_chart: List[AttackActivityPoint]
    severity_distribution: SeverityDistribution
    top_countries: List[TopSourceCountry]
    recent_attacks: List[AttackEventOut]

class SystemHealthOut(BaseModel):
    status: str
    system_mode: str
    database: str
    ml_model: str
    threat_intel: str
    soar_engine: str
    ssh_honeypot: str
    http_honeypot: str
    uptime_seconds: int

# Lab & Testing
class LabAttackRequest(BaseModel):
    attack_type: str
    service: str
    source_ip: Optional[str] = None
    intensity: int = 1

class ReplayControlRequest(BaseModel):
    dataset_name: str = "standard_honeynet_capture_2026"
    speed_multiplier: float = 1.0
    loop: bool = False
