# HONEYGUARD

### AI-Powered Adaptive Honeypot with Real-Time Threat Intelligence and Incident Response Dashboard

> *"Detect. Deceive. Analyze. Respond. — Turn Attacks into Intelligence."*

---

## 🌟 Executive Overview

**HoneyGuard** is an academic cybersecurity platform that bridges high-interaction deception technology with machine learning, automated threat intelligence, MITRE ATT&CK correlation, and SOAR incident response.

Unlike conventional static honeypots that suffer from easy fingerprinting, unstructured logs, and passive operation, HoneyGuard dynamically deepens decoy interactions according to adversary sophistication, classifies incoming probes in real time using a multi-class Random Forest model, computes transparent, explainable threat scores, and autonomously executes safe containment playbooks.

---

## 🎨 Visual Design System

Built to the exact specification and brand aesthetics established in the reference designs:
- **Palette**: Soft white & light lavender background (`#f4f5fb`), Deep Indigo (`#210f47`), Royal Purple (`#6d28d9`), and Violet (`#8b5cf6`).
- **Glassmorphism**: Apple Vision Pro styled translucent glass panels (`backdrop-blur-xl`, `border-white/90`, and soft purple auras).
- **Realistic 3D Web Visuals**:
  - **3D HG Security Core**: Interactive faceted monogram surrounded by floating hexagonal honeycomb shield meshes (`react-three-fiber` / `three.js`).
  - **3D Threat Globe**: Dynamic interactive translucent wireframe globe displaying ballistic attack arcs and geo-origin nodes.
  - **3D Isometric Honeypot Modules**: Real-time 3D server stacks indicating sensor status.

---

## 🚀 Key Capabilities & 9 Core Routes

1. **Product Introduction (`/`)**: Cinematic 3D product overview, pipeline animation, adaptive deception slider, and architecture preview.
2. **Security Overview Dashboard (`/dashboard`)**: Live metrics, SSH vs HTTP temporal area chart, severity distribution donut, recent attacks stream, and global threat map.
3. **Honeypot Management (`/honeypots`)**: Emulated isolated sensors (`SSH-HONEY-01` on `:2222` and `HTTP-HONEY-01` on `:8080`), start/stop/restart controls, deception level tuning (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), and live session inspection.
4. **Live Attacks Feed (`/attacks`)**: Real-time streaming WebSocket table, animated notification toasts, 3D interactive threat globe, and live activity console.
5. **Attack Investigation Dossier (`/attacks/:id`)**: Full session investigation, explainable threat score breakdown, AI classification confidence, raw payload inspection, MITRE ATT&CK mapping, and visual chronological attack timeline.
6. **Threat Intelligence (`/threat-intelligence`)**: Autonomous external IP enrichment (Country, ASN, ISP, Abuse confidence, Reputation score), manual IP search, and private IP detection disclaimer.
7. **MITRE ATT&CK Matrix (`/mitre`)**: Real-time matrix of observed techniques across tactics (Initial Access, Execution, Persistence, Credential Access, Discovery), with attack drilldowns.
8. **Incident Management (`/incidents`)**: Autonomous incident creation (e.g. `INC-2026-001`), case tracking (`OPEN`, `INVESTIGATING`, `RESOLVED`), timeline audit log, and analyst notes.
9. **SOAR & Automated Response (`/response`)**: Playbook engine (Critical Threat Containment, Credential Spray Tarpit), step-by-step verified execution checklist, and simulated IP quarantine.

---

## ⚙️ Operational Modes

HoneyGuard provides three operating modes:
- **`LIVE`**: Ingests unsolicited incoming internet traffic on isolated ports `:2222` and `:8080`.
- **`LAB`**: Safe controlled synthetic attack testing against HoneyGuard's own isolated environment via the built-in Quick Attack Simulator.
- **`REPLAY`**: High-fidelity replay of authentic honeynet attack captures through the complete analysis pipeline.

*The UI prominently displays the active mode in the navigation bar to guarantee that replay or lab data is never confused with live internet traffic.*

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Three.js, React Three Fiber (`@react-three/fiber`, `@react-three/drei`), Framer Motion, Recharts, Lucide Icons.
- **Backend**: FastAPI (Python 3.13), Uvicorn, WebSockets, Pydantic v2.
- **Machine Learning**: `scikit-learn` (Multi-class Random Forest with feature importance), `numpy`, `pandas`.
- **Database**: Dual-engine SQLAlchemy 2.0 async (SQLite via `aiosqlite` for zero-friction local run; PostgreSQL via `asyncpg` for Docker deployment).
- **Sensors**: Sandboxed emulated SSH server (port 2222) and HTTP server (port 8080).

---

## 🏁 Quick Start Guide

### Prerequisites
- Python 3.10+ (Python 3.13 tested)
- Node.js 18+ & npm
- (Optional) Docker & Docker Compose

### 1. Instant Local Run (Recommended for Demo)
```powershell
# In project root: C:\Users\Rajvardhan Singh\.gemini\antigravity\scratch\honeyguard
python run_demo.py
```
This automatically initializes the database, seeds baseline threat intelligence, launches backend and sensors, boots the React frontend, and opens `http://localhost:5173` in your browser!

### 2. Manual Run
**Terminal 1 (Backend & Sensors):**
```powershell
$env:PYTHONPATH = "backend;."
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 (React Frontend):**
```powershell
cd frontend
npm run dev
```

### 3. Docker Deployment
```bash
docker compose up --build
```
Access the application at `http://localhost` (or `http://localhost:5173`).

---

## 🧪 Running Automated Tests

```powershell
$env:PYTHONPATH = "backend;."
python -m pytest tests -v
```
Runs the full test suite including unit tests, ML classification, explainable scoring engine, and the full 18-step end-to-end acceptance scenario.

---

## 🛡️ Default Analyst Credentials
- **Username**: `analyst`
- **Password**: `honeyguard2026!`
- **Role**: `Senior SOC Analyst`

---

## 📜 Academic Attribution
Developed as an advanced academic research project in Adaptive Deception Systems and Autonomous Incident Response.
