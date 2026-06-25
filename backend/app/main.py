from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import meetings, action_items, participants

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS Middleware
# Allows Next.js frontend (typically port 3000) to fetch data from Python backend (typically port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production deployments to specify trusted domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers under /api/v1
app.include_router(meetings.router, prefix=settings.API_V1_STR)
app.include_router(action_items.router, prefix=settings.API_V1_STR)
app.include_router(participants.router, prefix=settings.API_V1_STR)

@app.get("/", tags=["health"])
async def health_check():
    """
    Simple status check endpoint.
    """
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "docs_url": "/docs"
    }
