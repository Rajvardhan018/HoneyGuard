from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.config import settings

import os

Base = declarative_base()

db_url = settings.DATABASE_URL
is_vercel = bool(
    os.environ.get("VERCEL") or 
    os.environ.get("VERCEL_ENV") or 
    os.environ.get("VERCEL_REGION") or 
    os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or 
    os.environ.get("NOW_REGION")
)

connect_args = {}

# 1. Normalize PostgreSQL URLs (Supabase / Neon / RDS) to asyncpg dialect
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Strip sslmode query parameter which asyncpg does not accept directly in the URL
if "postgresql" in db_url:
    import re
    db_url = re.sub(r'([?&])sslmode=[^&]*(&?)', r'\1', db_url).rstrip('?&')
    # If on Vercel or remote cloud database, enable SSL in connect_args
    if is_vercel or "supabase" in db_url or "neon" in db_url:
        connect_args["ssl"] = "require"

import tempfile

# 2. Redirect SQLite to writable temp directory if running on Vercel without a remote PostgreSQL database
if is_vercel and db_url.startswith("sqlite"):
    temp_dir = tempfile.gettempdir().replace("\\", "/")
    db_url = f"sqlite+aiosqlite:///{temp_dir}/honeyguard.db"

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_async_engine(
    db_url,
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=True,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    # Import all models to ensure they are registered with Base.metadata
    from app.models import models
    import logging
    logger = logging.getLogger("honeyguard.db")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema initialized successfully.")
    except Exception as e:
        logger.warning(f"Database schema initialization warning: {e}")
