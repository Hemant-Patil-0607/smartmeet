from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class JobResponse(BaseModel):
    job_id: str
    meeting_id: str
    status: str

    class Config:
        from_attributes = True

class ProcessingStatusResponse(BaseModel):
    status: str
    stage: Optional[str] = None
    completed_steps: list[str] = []
    current_step: Optional[str] = None
    error: Optional[str] = None
