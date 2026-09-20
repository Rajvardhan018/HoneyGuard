import os
import ssl as ssl_module
import tempfile
import asyncio
import logging
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.config import settings

logger = logging.getLogger("honeyguard.db")

Base = declarative_base()

# Resolve database URL from environment or settings
raw_db_url = (
    os.environ.get("DATABASE_URL") or 
    os.environ.get("POSTGRES_URL") or 
    os.environ.get("DIRECT_URL") or 
    settings.DATABASE_URL or 
    "sqlite+aiosqlite:///./honeyguard.db"
).strip()

is_vercel = bool(
    os.environ.get("VERCEL") or 
    os.environ.get("VERCEL_ENV") or 
    os.environ.get("VERCEL_REGION") or 
    os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or 
    os.environ.get("NOW_REGION")
)

connect_args = {}
engine_kwargs = {
    "echo": False,
    "future": True,
    "pool_pre_ping": True,
}

# Determine dialect
is_postgres = (
    raw_db_url.startswith("postgres://") or 
    raw_db_url.startswith("postgresql://") or 
    raw_db_url.startswith("postgresql+asyncpg://")
)

if is_postgres:
    # 1. Normalize scheme to postgresql+asyncpg
    if raw_db_url.startswith("postgres://"):
        norm_url = raw_db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif raw_db_url.startswith("postgresql://") and not raw_db_url.startswith("postgresql+asyncpg://"):
        norm_url = raw_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    else:
        norm_url = raw_db_url

    # 2. Clean query parameters that asyncpg doesn't accept as direct connect kwargs
    parts = urlsplit(norm_url)
    query_params = dict(parse_qsl(parts.query))
    unsupported_asyncpg_params = {"sslmode", "supavisor", "pgbouncer", "channel_binding", "options"}
    filtered_query = {k: v for k, v in query_params.items() if k.lower() not in unsupported_asyncpg_params}
    db_url = urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(filtered_query), parts.fragment))

    # 3. SSL Configuration: create a verified/safe SSLContext for cloud databases
    ssl_context = ssl_module.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl_module.CERT_NONE
    connect_args["ssl"] = ssl_context

    # 4. Connection Pooler compatibility (Supabase Supavisor / PgBouncer port 6543)
    connect_args["statement_cache_size"] = 0
    connect_args["prepared_statement_cache_size"] = 0
    connect_args["command_timeout"] = 25

    # 5. Engine pool settings for serverless
    engine_kwargs.update({
        "pool_size": 5,
        "max_overflow": 10,
        "pool_recycle": 300,
    })
else:
    # SQLite
    db_url = raw_db_url
    if is_vercel and db_url.startswith("sqlite"):
        temp_dir = tempfile.gettempdir().replace("\\", "/")
        db_url = f"sqlite+aiosqlite:///{temp_dir}/honeyguard.db"
    connect_args["check_same_thread"] = False

engine = create_async_engine(
    db_url,
    connect_args=connect_args,
    **engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

_db_initialized = False

async def init_db():
    global _db_initialized
    if _db_initialized:
        return
    from app.models import models
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema verified/created successfully.")
        _db_initialized = True
    except Exception as e:
        logger.error(f"Database schema initialization error: {e}", exc_info=True)
        raise

async def get_db():
    if not _db_initialized:
        await init_db()
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
