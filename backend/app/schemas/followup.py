from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FollowUpRequest(BaseModel):
    style: Optional[str] = None  # PROFESSIONAL, etc.

class FollowUpResponse(BaseModel):
    content: str

    class Config:
        from_attributes = True
