import os
import math
import joblib
import numpy as np
from typing import Dict, Any, Tuple
from sklearn.ensemble import RandomForestClassifier

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
MODEL_PATH = os.path.join(MODEL_DIR, "honeyguard_rf_model.joblib")

CLASSES = [
    "Brute Force",
    "Directory Scanning",
    "Credential Attack",
    "SQL Injection",
    "Command Execution",
    "Bot Activity",
    "Vulnerability Scan"
]

FEATURE_NAMES = [
    "auth_failures",
    "request_frequency",
    "session_duration",
    "command_count",
    "endpoint_diversity",
    "payload_entropy",
    "user_agent_score",
    "has_sqli_indicators",
    "has_traversal_indicators",
    "has_shell_indicators"
]

class MLClassifierService:
    def __init__(self):
        self.model: RandomForestClassifier = None
        self._initialize_model()

    def _calculate_entropy(self, text: str) -> float:
        if not text:
            return 0.0
        prob = [float(text.count(c)) / len(text) for c in set(text)]
        return -sum([p * math.log2(p) for p in prob if p > 0])

    def extract_features(self, raw_data: Dict[str, Any]) -> Tuple[list, Dict[str, Any]]:
        # Extract features from telemetry dictionary
        auth_failures = float(raw_data.get("auth_failures", 0))
        req_freq = float(raw_data.get("request_frequency", 1.0))
        duration = float(raw_data.get("duration_seconds", 1.0))
        cmd_count = float(raw_data.get("command_count", 0))
        endpoints = float(raw_data.get("endpoint_diversity", 1))
        
        payload = str(raw_data.get("raw_payload") or "")
        entropy = self._calculate_entropy(payload)
        
        user_agent = str(raw_data.get("user_agent") or "").lower()
        ua_score = 0.0
        if any(bot in user_agent for bot in ["nikto", "sqlmap", "nmap", "masscan", "zgrab", "gobuster", "curl", "python"]):
            ua_score = 1.0
        elif not user_agent or user_agent == "-":
            ua_score = 0.8

        payload_lower = payload.lower()
        has_sqli = 1.0 if any(p in payload_lower for p in ["union", "select", "' or '", "1=1", "information_schema", "sleep(", "--"]) else 0.0
        has_traversal = 1.0 if any(p in payload_lower for p in ["../", "..\\", "/etc/passwd", "/win.ini", "boot.ini"]) else 0.0
        has_shell = 1.0 if any(p in payload_lower for p in [";", "|", "whoami", "uname", "/bin/sh", "/bin/bash", "curl ", "wget ", "powershell", "cmd.exe"]) else 0.0

        features_dict = {
            "auth_failures": auth_failures,
            "request_frequency": req_freq,
            "session_duration": duration,
            "command_count": cmd_count,
            "endpoint_diversity": endpoints,
            "payload_entropy": round(entropy, 3),
            "user_agent_score": ua_score,
            "has_sqli_indicators": has_sqli,
            "has_traversal_indicators": has_traversal,
            "has_shell_indicators": has_shell
        }

        vector = [features_dict[f] for f in FEATURE_NAMES]
        return vector, features_dict

    def _initialize_model(self):
        try:
            os.makedirs(MODEL_DIR, exist_ok=True)
        except OSError:
            pass
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                return
            except Exception:
                pass

        # Train a realistic high-accuracy baseline Random Forest model on representative honeypot telemetry patterns
        X_train, y_train = self._generate_training_data()
        self.model = RandomForestClassifier(n_estimators=60, max_depth=8, random_state=42)
        self.model.fit(X_train, y_train)
        try:
            joblib.dump(self.model, MODEL_PATH)
        except Exception:
            pass

    def _generate_training_data(self):
        X = []
        y = []
        # Synthesize realistic honeypot behavioral patterns
        for _ in range(120):
            # Brute force: high auth failures, moderate request freq, low commands
            X.append([np.random.randint(6, 40), np.random.uniform(2.0, 10.0), np.random.uniform(5, 60), 0, 1, np.random.uniform(2.5, 4.0), np.random.choice([0.0, 0.5]), 0, 0, 0])
            y.append("Brute Force")
            
            # Directory scanning: high endpoints, zero auth failures, high freq
            X.append([0, np.random.uniform(5.0, 25.0), np.random.uniform(2, 30), 0, np.random.randint(10, 50), np.random.uniform(3.0, 4.5), np.random.choice([0.5, 1.0]), 0, np.random.choice([0.0, 1.0]), 0])
            y.append("Directory Scanning")
            
            # Credential Attack: targeted user/pass spray
            X.append([np.random.randint(3, 10), np.random.uniform(0.5, 3.0), np.random.uniform(10, 120), 0, 1, np.random.uniform(2.8, 4.2), 0.2, 0, 0, 0])
            y.append("Credential Attack")

            # SQL Injection: sqli indicators, varied entropy
            X.append([0, np.random.uniform(1.0, 8.0), np.random.uniform(2, 45), 0, np.random.randint(1, 5), np.random.uniform(3.8, 5.2), np.random.choice([0.5, 1.0]), 1.0, 0, 0])
            y.append("SQL Injection")

            # Command Execution: command count > 0, shell indicators
            X.append([np.random.choice([0, 1]), np.random.uniform(0.5, 4.0), np.random.uniform(10, 200), np.random.randint(2, 15), 1, np.random.uniform(3.5, 5.0), 0.0, 0, 0, 1.0])
            y.append("Command Execution")

            # Bot Activity: scanner user agent, moderate scan rate
            X.append([0, np.random.uniform(1.0, 5.0), np.random.uniform(1, 10), 0, np.random.randint(2, 8), np.random.uniform(2.0, 3.8), 1.0, 0, 0, 0])
            y.append("Bot Activity")

            # Vulnerability Scan: broad probes, traversal
            X.append([0, np.random.uniform(4.0, 15.0), np.random.uniform(5, 50), 0, np.random.randint(5, 20), np.random.uniform(3.2, 4.8), np.random.choice([0.5, 1.0]), 0, 1.0, 0])
            y.append("Vulnerability Scan")

        return np.array(X), np.array(y)

    def predict(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        vector, features_dict = self.extract_features(raw_data)
        X = np.array([vector])

        probs = self.model.predict_proba(X)[0]
        classes = self.model.classes_
        pred_idx = np.argmax(probs)
        predicted_class = classes[pred_idx]
        confidence = float(probs[pred_idx])

        # Get feature importances from the model
        importances = dict(zip(FEATURE_NAMES, [round(float(w), 3) for w in self.model.feature_importances_]))
        
        # Sort probabilities
        prob_dict = {cls: round(float(p), 4) for cls, p in zip(classes, probs)}

        # Explainability summary
        top_factors = []
        if features_dict["auth_failures"] >= 3:
            top_factors.append(f"{int(features_dict['auth_failures'])} failed authentication attempts")
        if features_dict["has_sqli_indicators"]:
            top_factors.append("SQL injection syntax detected in payload")
        if features_dict["has_shell_indicators"]:
            top_factors.append("Command shell injection operators detected")
        if features_dict["user_agent_score"] >= 0.8:
            top_factors.append("Automated scanner / adversary tooling signature")
        if features_dict["endpoint_diversity"] >= 5:
            top_factors.append(f"High endpoint traversal diversity ({int(features_dict['endpoint_diversity'])} URIs)")

        factor_summary = ", ".join(top_factors) if top_factors else "Heuristic behavioral baseline"
        explanation = f"Classified as {predicted_class} with {round(confidence * 100, 1)}% confidence based on: {factor_summary}."

        return {
            "model_name": "RandomForest_Honeynet_v1",
            "predicted_class": predicted_class,
            "confidence": round(confidence, 3),
            "probabilities": prob_dict,
            "feature_importance": importances,
            "features": features_dict,
            "explanation": explanation
        }

ml_service = MLClassifierService()
