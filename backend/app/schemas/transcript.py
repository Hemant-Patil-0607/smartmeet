from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SpeakerResponse(BaseModel):
    id: str
    label: str

class TranscriptSegmentResponse(BaseModel):
    id: str
    speaker: Optional[SpeakerResponse] = None
    start_seconds: float
    end_seconds: Optional[float] = None
    text: str

    class Config:
        from_attributes = True

class TranscriptResponse(BaseModel):
    segments: List[TranscriptSegmentResponse] = []

class TranscriptMeta(BaseModel):
    next_cursor: Optional[str] = None
