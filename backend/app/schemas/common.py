"""Common API response schemas adhering to {success, message, data} pattern."""

from typing import Any, Generic, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Standard success API response envelope."""

    success: bool = Field(default=True, description="Indicates if request succeeded")
    message: str = Field(..., description="Human-readable status or result message")
    data: Optional[T] = Field(default=None, description="Response payload data")


class ErrorResponse(BaseModel):
    """Standard failure API response envelope."""

    success: bool = Field(default=False, description="Always False for errors")
    message: str = Field(..., description="Descriptive error explanation")
    error_code: Optional[str] = Field(default=None, description="Optional programmatic error code")
