"""Health check schemas for system diagnostics."""

from typing import Optional
from pydantic import BaseModel, Field


class ServiceStatus(BaseModel):
    """Component status detail."""

    status: str = Field(..., description="Operational status: ok, degraded, or offline")
    details: Optional[str] = Field(default=None, description="Diagnostic details or error message")


class HealthData(BaseModel):
    """Aggregated health status data."""

    api: ServiceStatus
    birdnet_model: ServiceStatus
    supabase: ServiceStatus
    environment: str = "production"
