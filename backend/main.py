import logging
import time
from collections import defaultdict
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import engine, Base
from app.api import api_router

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create tables (use Alembic in production)
if settings.DEBUG:
    Base.metadata.create_all(bind=engine)
    logger.warning("Using create_all - run Alembic migrations in production")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS - restricted in production
origins = ["http://localhost:3000", "http://localhost:3001"]
if not settings.DEBUG:
    # Add production URLs here
    origins = []

if origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )

# Simple in-memory rate limiting
rate_limit_store = defaultdict(list)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limiting for health checks and in debug mode
    if request.url.path == "/health" or settings.DEBUG:
        return await call_next(request)

    # Get client IP
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()

    # Clean old entries (sliding window)
    rate_limit_store[client_ip] = [
        t for t in rate_limit_store[client_ip] if now - t < 60
    ]

    # Check rate limit
    if len(rate_limit_store[client_ip]) >= settings.RATE_LIMIT_PER_MINUTE:
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Please try again later."},
        )

    rate_limit_store[client_ip].append(now)
    response = await call_next(request)
    return response

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

# Routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": "development" if settings.DEBUG else "production",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
