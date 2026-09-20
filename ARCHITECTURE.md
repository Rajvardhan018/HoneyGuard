# HONEYGUARD - System Architecture & Engineering Specifications

## 1. End-to-End Threat Pipeline

HoneyGuard operates an autonomous, closed-loop telemetry and response loop:

```
                  +----------------------------------------------+
                  |         INBOUND INTERACTION TRAFFIC          |
                  |  (Internet Live Sensor / Lab Probe / Replay) |
                  +-----------------------+----------------------+
                                          |
                                          v
                    +------------------------------------------+
                    |        ISOLATED HONEYPOT SENSORS         |
                    |  - SSH-HONEY-01 (Emulated SSH on :2222)  |
                    |  - HTTP-HONEY-01 (Emulated HTTP on :8080)|
                    +---------------------+--------------------+
                                          | Safe Telemetry Payload
                                          v
                    +------------------------------------------+
                    |             EVENT PROCESSOR              |
                    | Ingests sessions, headers, commands, IPs |
                    +---------------------+--------------------+
                                          |
                                          v
                    +------------------------------------------+
                    |        FEATURE EXTRACTION ENGINE         |
                    | [Auth Failures, Velocity, Entropy, etc.] |
                    +---------------------+--------------------+
                                          |
                                          v
                    +------------------------------------------+
                    |       AI / ML BEHAVIOR CLASSIFIER        |
                    |  Random Forest Model -> Attack Class     |
                    +---------------------+--------------------+
                                          |
                                          v
                    +------------------------------------------+
                    |     THREAT INTELLIGENCE ENRICHMENT       |
                    |   GeoIP, ASN, ISP, Malicious Reputation  |
                    +---------------------+--------------------+
                                          |
                                          v
                    +------------------------------------------+
                    |         MITRE ATT&CK CORRELATOR          |
                    | Maps techniques: T1110, T1059, T1190...  |
                    +---------------------+--------------------+
                                          |
                                          v
                    +------------------------------------------+
                    |      EXPLAINABLE RISK SCORING ENGINE     |
                    | Threat Score: 0 - 100 & Severity Tier    |
                    +---------------------+--------------------+
                                          |
         +--------------------------------+--------------------------------+
         |                                                                 |
         v                                                                 v
+------------------------------------+             +------------------------------------+
|      ADAPTIVE DECEPTION ENGINE     |             |            SOAR ENGINE             |
| Dynamically elevates deception tier|             | Executes containment playbooks,    |
| (LOW -> MEDIUM -> HIGH -> CRITICAL)|             | logs audit steps, creates incident |
+-----------------+------------------+             +-----------------+------------------+
                  |                                                  |
                  +-----------------------+--------------------------+
                                          |
                                          v
                    +------------------------------------------+
                    |         POSTGRESQL / SQLITE DB           |
                    |  Relational storage of events, cases, etc|
                    +---------------------+--------------------+
                                          |
                                          v
                    +------------------------------------------+
                    |       REAL-TIME WEBSOCKET & REST         |
                    |  Broadcasts new attacks & counter deltas |
                    +---------------------+--------------------+
                                          |
                                          v
                    +------------------------------------------+
                    |          HONEYGUARD FRONTEND             |
                    | React 18, Three.js 3D Visuals, Glassmorphism|
                    +------------------------------------------+
```

---

## 2. Machine Learning Pipeline & Feature Extraction

The ML module (`app/services/ml_service.py`) extracts an 10-dimensional numerical vector from raw connection telemetry:

1. `auth_failures`: Count of invalid authentication attempts in session.
2. `request_frequency`: Request rate per second.
3. `session_duration`: Total connection lifetime in seconds.
4. `command_count`: Number of shell commands executed.
5. `endpoint_diversity`: Count of distinct URI endpoints requested.
6. `payload_entropy`: Shannon entropy of raw payload text:
   $$H(X) = -\sum_{i=1}^n P(x_i) \log_2 P(x_i)$$
7. `user_agent_score`: Automated scanning tool anomaly rating (Nikto, SQLMap, Nmap, Gobuster = 1.0).
8. `has_sqli_indicators`: Binary flag for SQL injection keywords (`UNION`, `' OR '1'='1'`).
9. `has_traversal_indicators`: Binary flag for directory traversal (`../`, `/etc/passwd`).
10. `has_shell_indicators`: Binary flag for command chaining operators (`;`, `|`, `whoami`, `curl`).

### Model Architecture
- **Algorithm**: Multi-Class Random Forest (`n_estimators=60`, `max_depth=8`, random_state=42).
- **Target Classes**:
  - `Brute Force`
  - `Directory Scanning`
  - `Credential Attack`
  - `SQL Injection`
  - `Command Execution`
  - `Bot Activity`
  - `Vulnerability Scan`
- **Explainability**: Outputs exact class probabilities, feature importances, and plain-English natural language justification.

---

## 3. Explainable Threat Scoring Engine

The Threat Scoring Engine (`app/services/scoring_service.py`) computes a normalized score from 0.0 to 100.0:

$$\text{Threat Score} = \min\left(100, \; W_{\text{type}} + W_{\text{ml}} + W_{\text{intel}} + W_{\text{behavior}} + W_{\text{mitre}}\right)$$

### Weighting Breakdown:
- **$W_{\text{type}}$ (Max 30 pts)**: Inherent risk of attack category (Command Execution = 30, SQLi = 28, Brute Force = 24, Directory Scan = 15).
- **$W_{\text{ml}}$ (Max 20 pts)**: Confidence score of machine learning classification ($\text{confidence} \times 20$).
- **$W_{\text{intel}}$ (Max 25 pts)**: External reputation and abuse confidence score ($(\text{reputation} / 100) \times 25$).
- **$W_{\text{behavior}}$ (Max 15 pts)**: Session velocity, authentication failure threshold, and payload entropy.
- **$W_{\text{mitre}}$ (Max 10 pts)**: Technique multiplicity factor ($\min(10, \text{techniques} \times 4)$).

### Severity Classification Thresholds:
- **`CRITICAL`**: Score $\ge 80.0$
- **`HIGH`**: $60.0 \le \text{Score} < 80.0$
- **`MEDIUM`**: $35.0 \le \text{Score} < 60.0$
- **`LOW`**: $\text{Score} < 35.0$

---

## 4. Adaptive Honeypot Deception State Machine

HoneyGuard dynamically alters its interaction tier in real time based on observed threat scores:

| Deception Tier | Trigger Threshold | SSH Behavior | HTTP Behavior | Deception Content |
|---|---|---|---|---|
| **`LOW`** | Score < 35.0 | Generic OpenSSH banner, immediate disconnect | Generic 404 / 401 error | Basic minimal responses |
| **`MEDIUM`** | Score 35.0 - 59.9 | Ubuntu OpenSSH 8.9p1, 250ms simulated latency | Fake administrative login portal | HTML login forms |
| **`HIGH`** | Score 60.0 - 79.9 | 500ms latency, decoy shell prompts | Simulated Spring Boot Actuator / Apache Coyote | Lure SQL backup URIs |
| **`CRITICAL`** | Score $\ge 80.0$ | 1200ms infinite tarpit keepalive | Canary honeytoken responses | Forensic honeynet isolation |

---

## 5. Automated SOAR & Incident Response

When an attack triggers a score $\ge 60$ or severity `CRITICAL`:
1. **`ANALYZE`**: ML behavioral features extracted and classified.
2. **`ENRICH`**: IP intelligence queried from local cache or external providers.
3. **`MAP`**: Attack correlated to MITRE ATT&CK techniques (e.g. `T1110.001`).
4. **`CONTAIN`**: Simulated IP quarantine entry recorded in the Blocklist table.
5. **`ADAPT`**: Sensor deception level elevated (`LOW` $\rightarrow$ `HIGH` / `CRITICAL`).
6. **`INCIDENT`**: Autonomous incident generated with unique case ID (e.g. `INC-2026-001`).
7. **`NOTIFY`**: Real-time broadcast pushed via WebSocket to all connected analyst dashboards.
