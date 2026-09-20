from fastapi import APIRouter
from .auth import router as auth_router
from .dashboard import router as dashboard_router
from .honeypots import router as honeypots_router
from .attacks import router as attacks_router
from .threat_intelligence import router as threat_intel_router
from .mitre import router as mitre_router
from .incidents import router as incidents_router
from .response import router as response_router
from .lab import router as lab_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(dashboard_router)
api_router.include_router(honeypots_router)
api_router.include_router(attacks_router)
api_router.include_router(threat_intel_router)
api_router.include_router(mitre_router)
api_router.include_router(incidents_router)
api_router.include_router(response_router)
api_router.include_router(lab_router)
