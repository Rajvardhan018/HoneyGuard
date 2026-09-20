# HONEYGUARD - Comprehensive Demonstration & Viva Guide

This document provides a step-by-step script for academic reviews, project defenses, viva examinations, and technical presentations.

---

## 🎬 5-Minute Live Demonstration Script

### Step 1: Launch & Product Introduction
1. Open terminal and run:
   ```bash
   python run_demo.py
   ```
2. The browser automatically navigates to `http://localhost:5173`.
3. **Showcase Home Page**:
   - Point out the **3D HG Security Core** surrounded by rotating hexagonal honeycomb elements with physically believable glass transmission.
   - Highlight the core philosophy: *"Detect. Deceive. Analyze. Respond. — Turn Attacks into Intelligence."*
   - Scroll down to the **Automated Threat Pipeline** (Capture $\rightarrow$ ML $\rightarrow$ Threat Intel $\rightarrow$ MITRE $\rightarrow$ Score $\rightarrow$ SOAR).
   - Demonstrate the **Adaptive Deception Showcase** by clicking the interactive tier buttons (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) and show how decoy responses change.
   - Click the primary CTA: **"Enter HoneyGuard"** to transition to the operational security dashboard.

---

### Step 2: The Operational Security Dashboard (`/dashboard`)
1. **Explain the Top Statistics**:
   - Total Attacks (127), Critical Threats (14), Open Incidents (23), Blocked IPs (41).
   - Note the **System Status: All systems operational** in the sidebar.
2. **Explain the Visual Charts**:
   - **Attack Activity**: Smooth area chart illustrating inbound telemetry across SSH and HTTP protocols over time.
   - **Severity Distribution**: Donut chart with live percentage breakdown (Critical, High, Medium, Low).
   - **Global Threat Map**: Interactive 3D threat globe with rotating nodes and ballistic attack arcs.
   - **Recent Attacks Table**: Real-time table displaying timestamp, adversary IP, protocol, attack type, and severity badges.

---

### Step 3: Trigger a Live Attack via Quick Attack Modal
1. Click the **MODE: LIVE** pill in the top navigation bar.
2. The **Lab Attack Simulator & Replay Modal** opens.
3. Select:
   - **Service**: `SSH (:2222)`
   - **Attack Type**: `SSH Password Brute Force (T1110.001)`
   - **Velocity**: `Tier 3`
4. Click **"Dispatch Lab Attack"**.
5. **Watch the Magic Happen Live Without Page Refresh**:
   - Notice the animated toast alert appear in the top-right: *"NEW ATTACK DETECTED - External Source SSH Brute Force - CRITICAL - Threat Score: 87"*.
   - Notice the **Total Attacks** counter increment.
   - Notice the attack instantly appear at the top of the **Recent Attacks** table.
   - Notice the **MODE** indicator switch to `LAB`.

---

### Step 4: Full Forensic Investigation (`/attacks/:id`)
1. Click **"View"** on the newly detected attack.
2. **Walk the Reviewer Through the Investigation Dossier**:
   - **Overview**: Target honeypot (`SSH-HONEY-01`), source IP (`185.199.110.23`), AI confidence (94%).
   - **Autonomous Chronological Timeline**: Traces the event from Capture $\rightarrow$ ML Extraction $\rightarrow$ Threat Intel $\rightarrow$ MITRE $\rightarrow$ Scoring $\rightarrow$ Containment.
   - **Captured Telemetry**: Real sandboxed credentials captured (`user=root pass=admin123...`).
   - **Explainable Scoring Engine**: Show the exact mathematical contribution of each factor (Attack Type Inherent Risk, Threat Intel Reputation, ML Model Confidence, Behavioral Intensity, MITRE Multiplicity).
   - **Threat Intelligence**: Origin country (Russian Federation), ASN (`AS49453`), ISP, and 92% abuse confidence.
   - **MITRE ATT&CK**: Mapped to `T1110.001` (Password Guessing) and `T1078` (Valid Default Accounts).
   - **SOAR Actions**: Shows all 6 automated containment steps checked as completed (`✓`).
   - Click the **Associated Incident link** (e.g. `INC-2026-001`).

---

### Step 5: Incident Management & Case Resolution (`/incidents`)
1. Point out the newly created autonomous case `INC-2026-001`.
2. Inspect the **Incident Action Timeline**.
3. Add an analyst note: *"Confirmed external brute force burst against SSH sensor. Automated simulated quarantine verified."*
4. Click **"RESOLVED"** status button to demonstrate the resolution workflow (enjoy the celebration effect!).

---

### Step 6: SOAR & Automated Playbooks (`/response`)
1. Explain the **Critical Threat Autonomous Containment Playbook**:
   - Shows the active condition: `threat_score >= 80.0`.
   - Explains the simulated quarantine mechanism in the **Blocklist**.
   - Click **"Simulate Run"** to demonstrate manual on-demand playbook execution.

---

### Step 7: Replay Mode Demonstration
1. Open the **Mode Selector** from the navbar.
2. Click **"Replay Corpus"**.
3. Point out that HoneyGuard streams authentic pre-captured honeynet attacks through the exact same processing pipeline, proving that the system works reliably even in environments without external internet connectivity!

---

## 🎯 Key Questions & Academic Answers

**Q: How does HoneyGuard prevent attackers from breaking into the host server?**  
*A: HoneyGuard deploys emulated, non-privileged socket sensors that emulate protocol banners and mock responses in memory. No real shell execution or host binaries are ever invoked.*

**Q: Why is the Threat Score "explainable"?**  
*A: Unlike black-box algorithms, HoneyGuard's scoring engine decomposes the 0–100 score into transparent, auditable mathematical factors (inherent type risk, ML confidence, external reputation, behavioral velocity, and MITRE breadth) stored directly in the database for SOC auditability.*

**Q: How does the system handle private / local IP addresses?**  
*A: In accordance with RFC 1918, HoneyGuard detects private addresses and explicitly displays: "External reputation unavailable for private address", preventing synthetic or fabricated reputation scores.*
