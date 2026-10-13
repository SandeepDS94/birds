"""FastAPI application entry point.

Configures CORS, lifespan events, exception handling, and API routes.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.schemas.common import APIResponse, ErrorResponse
from app.schemas.health import HealthData, ServiceStatus
from app.database import check_supabase_health

# Configure root logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("birdnet_app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager: preloads models and manages resources."""
    logger.info("Initializing AI Bird Sound Identification Service...")
    settings.TMP_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    try:
        from app.services.birdnet_service import get_analyzer
        get_analyzer()
        logger.info("BirdNET bioacoustic model preloaded into memory.")
    except Exception as exc:
        logger.warning(f"Could not preload BirdNET model at startup: {exc}")
    yield
    logger.info("Shutting down AI Bird Sound Identification Service...")


app = FastAPI(
    title="AI-Based Bird Sound Identification System",
    description="Bioacoustic species identification and ecological information system powered by BirdNET and Supabase.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration
allowed_origins = [
    settings.FRONTEND_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
]
# Remove duplicates
allowed_origins = list(set(allowed_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Ensures consistent {success: false, message: ...} formatting for HTTP errors."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": str(exc.detail)},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Formats validation errors into friendly messages without leaking internals."""
    errors = exc.errors()
    first_error = errors[0] if errors else {}
    msg = first_error.get("msg", "Invalid request parameters.")
    loc = " -> ".join(str(l) for l in first_error.get("loc", []))
    detail_msg = f"{msg} at {loc}" if loc else msg
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"success": False, "message": f"Validation Error: {detail_msg}"},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catches unhandled errors, logs them internally, and returns a safe response."""
    logger.error(f"Unhandled server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An internal server error occurred. Please try again later.",
        },
    )


# Health Check Endpoint
@app.get("/api/health", response_model=APIResponse[HealthData])
async def health_check():
    """Health diagnostic endpoint checking API, Supabase connectivity, and BirdNET model status."""
    # Check Supabase connectivity
    sb_healthy, sb_detail = check_supabase_health()

    # Check BirdNET model status (will be populated dynamically in Stage 3)
    from app.services.birdnet_service import is_model_loaded  # imported lazily or checked

    model_loaded = is_model_loaded() if "is_model_loaded" in globals() or _can_check_model() else False
    model_status = "ok" if model_loaded else "standby"
    model_detail = "Model ready in memory" if model_loaded else "Model will load on first inference or initialization"

    health_data = HealthData(
        api=ServiceStatus(status="ok", details="FastAPI service operational"),
        birdnet_model=ServiceStatus(status=model_status, details=model_detail),
        supabase=ServiceStatus(
            status="ok" if sb_healthy else "degraded",
            details=sb_detail,
        ),
        environment="development",
    )

    return APIResponse(
        success=True,
        message="System health check completed",
        data=health_data,
    )


def _can_check_model() -> bool:
    try:
        from app.services.birdnet_service import is_model_loaded
        return is_model_loaded()
    except Exception:
        return False


# Register API Routers
from app.routes.identify import router as identify_router
from app.routes.birds import router as birds_router
from app.routes.history import router as history_router
from app.routes.statistics import router as statistics_router

app.include_router(identify_router)
app.include_router(birds_router)
app.include_router(history_router)
app.include_router(statistics_router)

# Mount Static Assets
from fastapi.staticfiles import StaticFiles
from pathlib import Path

static_dir = Path(__file__).resolve().parent.parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
    images_dir = static_dir / "images"
    if images_dir.exists():
        app.mount("/images", StaticFiles(directory=str(images_dir)), name="images")



