from typing import Dict, Any, Tuple

class ThreatScoringEngine:
    def calculate_score(
        self,
        attack_type: str,
        ml_confidence: float,
        features: Dict[str, Any],
        reputation_score: float,
        mitre_count: int
    ) -> Tuple[float, str, Dict[str, Any]]:
        """
        Calculates an explainable threat score from 0.0 to 100.0 and assigns severity.
        """
        # Base weights
        # 1. Attack type inherent risk (max 30 points)
        type_weights = {
            "Command Execution": 30.0,
            "SQL Injection": 28.0,
            "Brute Force": 24.0,
            "Credential Attack": 22.0,
            "Vulnerability Scan": 18.0,
            "Directory Scanning": 15.0,
            "Bot Activity": 12.0
        }
        type_score = type_weights.get(attack_type, 15.0)

        # 2. ML Confidence factor (max 20 points)
        ml_score = ml_confidence * 20.0

        # 3. External Threat Intelligence reputation (max 25 points)
        intel_score = (reputation_score / 100.0) * 25.0

        # 4. Behavioral velocity & interaction intensity (max 15 points)
        auth_f = features.get("auth_failures", 0)
        req_f = features.get("request_frequency", 1.0)
        cmd_c = features.get("command_count", 0)
        
        behavior_points = 0.0
        if auth_f >= 5:
            behavior_points += 7.0
        elif auth_f >= 2:
            behavior_points += 4.0

        if req_f >= 10:
            behavior_points += 5.0
        elif req_f >= 3:
            behavior_points += 3.0

        if cmd_c >= 1:
            behavior_points += 6.0

        behavior_score = min(15.0, behavior_points)

        # 5. MITRE Technique multiplicity factor (max 10 points)
        mitre_score = min(10.0, mitre_count * 4.0)

        raw_total = type_score + ml_score + intel_score + behavior_score + mitre_score
        final_score = round(min(100.0, max(5.0, raw_total)), 1)

        # Severity classification
        if final_score >= 80.0:
            severity = "CRITICAL"
        elif final_score >= 60.0:
            severity = "HIGH"
        elif final_score >= 35.0:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        breakdown = {
            "total_score": final_score,
            "severity": severity,
            "components": {
                "attack_type_severity": round(type_score, 1),
                "ml_model_confidence": round(ml_score, 1),
                "threat_intel_reputation": round(intel_score, 1),
                "behavioral_intensity": round(behavior_score, 1),
                "mitre_technique_breadth": round(mitre_score, 1)
            },
            "formula": "Type_Weight(30) + ML_Confidence(20) + Intel_Reputation(25) + Behavioral_Intensity(15) + Mitre_Weight(10)"
        }

        return final_score, severity, breakdown

scoring_engine = ThreatScoringEngine()
