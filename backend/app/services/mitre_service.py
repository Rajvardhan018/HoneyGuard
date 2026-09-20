from typing import List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import MitreTechnique, AttackMitreMapping

INITIAL_TECHNIQUES = [
    {
        "id": "T1110.001",
        "name": "Password Guessing",
        "tactic": "Credential Access",
        "description": "Adversaries may guess passwords to attempt authentication against SSH, HTTP admin portals, or other services without prior knowledge of system passwords.",
        "detection_guidance": "Monitor authentication logs for repeated failure rates, password spray patterns, and high-frequency connection resets.",
        "reference_url": "https://attack.mitre.org/techniques/T1110/001/"
    },
    {
        "id": "T1190",
        "name": "Exploit Public-Facing Application",
        "tactic": "Initial Access",
        "description": "Adversaries may attempt to exploit vulnerabilities in Internet-facing software (e.g., HTTP server endpoints, SQL injection, directory traversal).",
        "detection_guidance": "Inspect HTTP request bodies and query parameters for unusual characters, SQL control keywords, or traversal markers.",
        "reference_url": "https://attack.mitre.org/techniques/T1190/"
    },
    {
        "id": "T1059.004",
        "name": "Unix Shell Execution",
        "tactic": "Execution",
        "description": "Adversaries may abuse Unix shell commands and scripts to execute arbitrary commands on victim systems via interactive or simulated sessions.",
        "detection_guidance": "Log all command line telemetry within terminal sessions; look for reconnaissance binaries like whoami, uname, cat /etc/passwd.",
        "reference_url": "https://attack.mitre.org/techniques/T1059/004/"
    },
    {
        "id": "T1082",
        "name": "System Information Discovery",
        "tactic": "Discovery",
        "description": "Adversaries may attempt to gather detailed information about operating system version, patch level, and hardware configuration.",
        "detection_guidance": "Detect commands invoking uname, hostname, lsb_release, or systeminfo in honeypot sessions.",
        "reference_url": "https://attack.mitre.org/techniques/T1082/"
    },
    {
        "id": "T1083",
        "name": "File and Directory Discovery",
        "tactic": "Discovery",
        "description": "Adversaries may enumerate files and directories or search in specific locations for sensitive data or configuration files.",
        "detection_guidance": "Monitor HTTP probe requests for common sensitive paths (.env, wp-login, .git, /etc/passwd) and shell ls / find commands.",
        "reference_url": "https://attack.mitre.org/techniques/T1083/"
    },
    {
        "id": "T1595.002",
        "name": "Vulnerability Scanning",
        "tactic": "Reconnaissance",
        "description": "Adversaries may execute automated vulnerability scanners against honeypot ports to discover unpatched software and misconfigurations.",
        "detection_guidance": "Detect high-velocity automated request bursts and scanner user-agent strings (Nikto, SQLMap, Nmap).",
        "reference_url": "https://attack.mitre.org/techniques/T1595/002/"
    },
    {
        "id": "T1078",
        "name": "Valid Accounts: Default Accounts",
        "tactic": "Defense Evasion",
        "description": "Adversaries may obtain and abuse credentials of default accounts (root, admin, guest) to access honeypot management interfaces.",
        "detection_guidance": "Inspect submitted credentials for universal default combinations (admin/admin, root/123456).",
        "reference_url": "https://attack.mitre.org/techniques/T1078/"
    }
]

class MitreService:
    async def seed_techniques(self, db: AsyncSession):
        for tech in INITIAL_TECHNIQUES:
            q = select(MitreTechnique).where(MitreTechnique.id == tech["id"])
            res = await db.execute(q)
            existing = res.scalar_one_or_none()
            if not existing:
                record = MitreTechnique(
                    id=tech["id"],
                    name=tech["name"],
                    tactic=tech["tactic"],
                    description=tech["description"],
                    detection_guidance=tech["detection_guidance"],
                    reference_url=tech["reference_url"],
                    observed_count=0,
                    confidence=0.95
                )
                db.add(record)
        await db.commit()

    def map_attack_to_techniques(self, attack_type: str, features: Dict[str, Any], payload: str) -> List[Tuple[str, float, str]]:
        mappings = []
        payload_lower = (payload or "").lower()

        if attack_type in ["Brute Force", "Credential Attack"] or features.get("auth_failures", 0) >= 2:
            mappings.append(("T1110.001", 0.96, "Repeated authentication failure sequence indicative of password guessing"))
            if any(term in payload_lower for term in ["admin", "root", "guest", "test"]):
                mappings.append(("T1078", 0.88, "Targeted default or common administrative credentials"))

        if attack_type == "Directory Scanning" or features.get("endpoint_diversity", 1) >= 4 or features.get("has_traversal_indicators"):
            mappings.append(("T1083", 0.94, "Automated enumeration of web paths, config files, or sensitive directories"))

        if attack_type in ["SQL Injection", "Vulnerability Scan"] or features.get("has_sqli_indicators"):
            mappings.append(("T1190", 0.95, "Payload attempted exploitation of public-facing web service parameters"))

        if attack_type == "Command Execution" or features.get("command_count", 0) > 0 or features.get("has_shell_indicators"):
            mappings.append(("T1059.004", 0.98, "Shell interpreter invoked with commands inside the isolated honeypot environment"))
            if any(cmd in payload_lower for cmd in ["uname", "id", "whoami", "hostname", "cat /etc"]):
                mappings.append(("T1082", 0.92, "Command sequence aimed at discovering OS identity and system privileges"))

        if attack_type == "Bot Activity" or features.get("user_agent_score", 0) >= 0.8:
            mappings.append(("T1595.002", 0.90, "Automated reconnaissance scanner tooling detected"))

        # Fallback if empty
        if not mappings:
            mappings.append(("T1595.002", 0.80, "Heuristic scanning probe observed on exposed honeypot service"))

        return mappings

    async def link_attack_event(self, event_id: str, mappings: List[Tuple[str, float, str]], db: AsyncSession):
        for tech_id, confidence, rationale in mappings:
            mapping = AttackMitreMapping(
                event_id=event_id,
                technique_id=tech_id,
                confidence=confidence,
                rationale=rationale
            )
            db.add(mapping)
            
            # Update technique observation count
            q = select(MitreTechnique).where(MitreTechnique.id == tech_id)
            res = await db.execute(q)
            tech = res.scalar_one_or_none()
            if tech:
                tech.observed_count += 1

        await db.commit()

mitre_service = MitreService()
