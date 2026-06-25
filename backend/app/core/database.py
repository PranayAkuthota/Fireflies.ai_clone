from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# For SQLite, check_same_thread=False is required to allow multiple threads to access it
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Create the asynchronous SQLAlchemy engine
engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=True,  # Set to True to print generated SQL commands to console for debugging/learning
)

# Async session factory
SessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Declarative base class for models
class Base(DeclarativeBase):
    pass

# Dependency to get db session in FastAPI routes
async def get_db():
    """
    Yields an asynchronous database session.
    Ensures that the connection is cleanly closed when the request is complete.
    """
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
