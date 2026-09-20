# HONEYGUARD - REST API & WebSocket Specifications

Base URL: `http://localhost:8000/api/v1`  
Interactive Swagger UI: `http://localhost:8000/docs`  
Interactive ReDoc UI: `http://localhost:8000/redoc`  
WebSocket Stream: `ws://localhost:8000/ws/stream`

---

## 🔐 Authentication

All administrative and operational endpoints support Bearer JWT tokens.  
*In local development / demo mode, unauthenticated requests automatically fall back to the default Security Analyst session.*

### POST `/auth/login`
Authenticates SOC analyst and returns JWT access token.
- **Request Body**:
  ```json
  {
    "username": "analyst",
    "password": "honeyguard2026!"
  }
  ```
- **Response**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "username": "analyst",
      "full_name": "Security Analyst",
      "role": "analyst"
    }
  }
  ```

---

## 📊 Dashboard & System Health

### GET `/dashboard/stats`
Returns aggregated security statistics, temporal activity chart series, severity donut distribution, top attacking countries, and recent attack stream.

### GET `/dashboard/health`
Returns system health status across database, ML model, threat intel service, SOAR engine, and isolated sensor listening ports.

---

## 🍯 Honeypots Management

### GET `/honeypots/`
Lists all deployed honeypots (`SSH-HONEY-01`, `HTTP-HONEY-01`) with uptime, session counts, request counts, attacks trapped, and deception levels.

### POST `/honeypots/{id}/action`
Controls honeypot state or tunes deception level.
- **Payload**:
  ```json
  {
    "action": "set_deception",
    "deception_level": "CRITICAL"
  }
  ```
- **Supported actions**: `"start"`, `"stop"`, `"restart"`, `"set_deception"`.

### GET `/honeypots/{id}/sessions`
Retrieves raw connection sessions captured by the sensor.

---

## ⚡ Attack Events & Investigations

### GET `/attacks/`
Filters and streams attacks.
- **Query Parameters**:
  - `search` (string): Filter by IP, attack type, or activity.
  - `service` (string): Filter by `SSH` or `HTTP`.
  - `severity` (string): Filter by `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.
  - `mode` (string): Filter by `LIVE`, `LAB`, `REPLAY`.
  - `limit` (int, default 50), `offset` (int, default 0).

### GET `/attacks/{id}`
Returns complete investigation dossier including:
- Telemetry overview & session metadata.
- ML prediction, probabilities, and natural language explanation.
- Explainable threat scoring factor breakdown.
- Threat intelligence context (Country, ASN, ISP, Abuse score).
- MITRE ATT&CK technique correlations.
- Visual chronological timeline.
- Associated Incident & SOAR execution records.

---

## 🌐 Threat Intelligence

### GET `/threat-intelligence/`
Lists all enriched threat indicators with search capability.

### GET `/threat-intelligence/lookup/{ip}`
Manually queries or enriches any IP address. Returns explicit RFC 1918 private notice if an internal address is provided.

---

## 🛡️ MITRE ATT&CK

### GET `/mitre/techniques`
Lists observed techniques with confidence ratings, tactic grouping, and observation frequencies.

### GET `/mitre/matrix`
Returns the structured MITRE matrix grouped across standard tactics.

### GET `/mitre/techniques/{id}`
Returns technique details and drill-down list of all associated attack sessions.

---

## 🚨 Incident Management

### GET `/incidents/`
Lists autonomous incidents with optional `status` (`OPEN`, `INVESTIGATING`, `RESOLVED`) and `severity` filters.

### GET `/incidents/{id}`
Returns incident details with complete event action timeline.

### PATCH `/incidents/{id}`
Updates incident status, reassigns analyst, or records investigation notes.

---

## ⚙️ SOAR & Automated Playbooks

### GET `/response/playbooks`
Lists registered SOAR containment playbooks.

### GET `/response/executions`
Returns playbook execution history with step-by-step checklist status.

### GET `/response/blocklist`
Returns active simulated quarantine entries.

### POST `/response/playbooks/{id}/simulate`
Manually triggers a simulated playbook run against a target IP for demonstration.

---

## 🧪 Lab & Replay Modes

### GET `/lab/mode`
Returns active operational mode (`LIVE`, `LAB`, `REPLAY`).

### POST `/lab/mode/{mode}`
Switches system mode.

### POST `/lab/attack`
Safely dispatches a synthetic attack (e.g. `brute_force`, `sql_injection`, `directory_scan`, `command_exec`) through the full end-to-end processing pipeline.

### POST `/lab/replay`
Initiates sequential replay of authentic honeynet captures.

---

## 🔄 Real-Time WebSocket Protocol

- **Endpoint**: `/ws/stream`
- **Outgoing Message Format**:
  ```json
  {
    "type": "NEW_ATTACK",
    "data": {
      "id": "EVT-1001",
      "service": "SSH",
      "source_ip": "185.199.110.23",
      "attack_type": "Brute Force",
      "severity": "CRITICAL",
      "threat_score": 87.0
    }
  }
  ```
- **Other Message Types**:
  - `ACTIVITY_STREAM`: Real-time terminal log line.
  - `INCIDENT_UPDATE`: Case creation / status change.
  - `SOAR_EXECUTION`: Playbook step updates.
  - `HONEYPOT_STATUS`: Sensor status & deception changes.
