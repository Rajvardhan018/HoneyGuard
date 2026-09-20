import os
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import List

class Settings(BaseSettings):
    model_config = ConfigDict(case_sensitive=True)

    PROJECT_NAME: str = "HoneyGuard"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DATABASE_URL: str = (
        os.getenv("DATABASE_URL") or 
        os.getenv("POSTGRES_URL") or 
        os.getenv("DIRECT_URL") or 
        "sqlite+aiosqlite:///./honeyguard.db"
    )
    DIRECT_URL: str = os.getenv("DIRECT_URL", "")
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "honeyguard_super_secure_jwt_secret_key_2026_purple_glass_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    
    HONEYPOT_SSH_HOST: str = "0.0.0.0"
    HONEYPOT_SSH_PORT: int = int(os.getenv("HONEYPOT_SSH_PORT", "2222"))
    HONEYPOT_HTTP_HOST: str = "0.0.0.0"
    HONEYPOT_HTTP_PORT: int = int(os.getenv("HONEYPOT_HTTP_PORT", "8080"))
    
    ABUSEIPDB_API_KEY: str = os.getenv("ABUSEIPDB_API_KEY", "")
    VIRUSTOTAL_API_KEY: str = os.getenv("VIRUSTOTAL_API_KEY", "")
    
    SYSTEM_MODE: str = os.getenv("SYSTEM_MODE", "LIVE")
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "*"
    ]

settings = Settings()
