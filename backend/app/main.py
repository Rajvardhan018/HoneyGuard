import os
import sys
import logging
from contextlib import asynccontextmanager

# Ensure project root is in sys.path for honeypots and shared modules
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from app.config import settings
from app.database.session import init_db, AsyncSessionLocal
from app.database.seed import seed_database
from app.api import api_router
from app.websocket.manager import manager
from app.services.honeypot_manager import honeypot_manager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("honeyguard.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing HoneyGuard Database & Schema...")
    try:
        await init_db()
        logger.info("Checking & Seeding HoneyGuard Baseline Intelligence...")
        async with AsyncSessionLocal() as session:
            await seed_database(session)
    except Exception as db_err:
        logger.warning(f"Database initialization warning in lifespan: {db_err}")
        
    is_vercel = bool(
        os.environ.get("VERCEL") or 
        os.environ.get("VERCEL_ENV") or 
        os.environ.get("VERCEL_REGION") or 
        os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or 
        os.environ.get("NOW_REGION")
    )
    if not is_vercel:
        logger.info("Starting isolated Honeypot Sensors (SSH :2222, HTTP :8080)...")
        await honeypot_manager.start_sensors()
    else:
        logger.info("Running in Vercel Serverless environment: raw TCP sensor binding skipped (use LAB mode or external sensors).")
        
    logger.info("HoneyGuard Cyber Intelligence Platform is ONLINE.")
    yield
    
    if not is_vercel:
        logger.info("Shutting down HoneyGuard sensors and resources...")
        await honeypot_manager.stop_sensors()

app = FastAPI(
    title="HoneyGuard API",
    description="AI-Powered Adaptive Honeypot with Real-Time Threat Intelligence & SOAR Dashboard",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_request_middleware(request: Request, call_next):
    logger.info(f"[HONEYGUARD HTTP] {request.method} {request.url.path}")
    response = await call_next(request)
    return response

# Mount REST API (both /api/v1 and fallback /v1 in case proxy rewrites strip /api)
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router, prefix="/v1")

@app.get("/health")
@app.get("/api/health")
@app.get("/api")
@app.get("/api/")
async def api_root():
    return {
        "platform": "HoneyGuard Cyber Intelligence Platform API",
        "tagline": "Detect. Deceive. Analyze. Respond.",
        "version": settings.PROJECT_VERSION,
        "mode": settings.SYSTEM_MODE,
        "status": "online",
        "api_docs": "/docs",
        "health": f"{settings.API_V1_STR}/dashboard/health"
    }

# Real-time WebSocket Endpoint
@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text('{"type":"pong"}')
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.debug(f"WebSocket client loop exception: {e}")
        manager.disconnect(websocket)

# Static Files & SPA Routing for local standalone development
is_serverless = bool(
    os.environ.get("VERCEL") or 
    os.environ.get("VERCEL_ENV") or 
    os.environ.get("VERCEL_REGION") or 
    os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or 
    os.environ.get("NOW_REGION")
)

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if not is_serverless and os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't hijack API or WS routes
        if full_path.startswith("api") or full_path.startswith("ws") or full_path.startswith("v1"):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    async def root():
        return {
            "platform": "HoneyGuard Cyber Intelligence Platform API",
            "tagline": "Detect. Deceive. Analyze. Respond.",
            "version": settings.PROJECT_VERSION,
            "mode": settings.SYSTEM_MODE,
            "api_docs": "/docs",
            "health": f"{settings.API_V1_STR}/dashboard/health"
        }
