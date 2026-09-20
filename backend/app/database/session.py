from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.config import settings

import os

Base = declarative_base()

db_url = settings.DATABASE_URL
is_vercel = os.environ.get("VERCEL") == "1" or os.environ.get("NOW_REGION") is not None

# 1. Normalize PostgreSQL URLs (Supabase / Neon / RDS) to asyncpg dialect
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

import tempfile

# 2. Redirect SQLite to writable temp directory if running on Vercel without a remote PostgreSQL database
if is_vercel and db_url.startswith("sqlite"):
    temp_dir = tempfile.gettempdir().replace("\\", "/")
    db_url = f"sqlite+aiosqlite:///{temp_dir}/honeyguard.db"

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_async_engine(
    db_url,
    echo=False,
    connect_args=connect_args,
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
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
