from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MeetingStats(BaseModel):
    decisions: int = 0
    action_items: int = 0
    risks: int = 0

class MeetingCreate(BaseModel):
    title: Optional[str] = None
    meeting_date: str
    source_type: str  # AUDIO_UPLOAD, TRANSCRIPT_UPLOAD, TRANSCRIPT_PASTE
    participants: Optional[List[str]] = None

class MeetingResponse(BaseModel):
    id: str
    title: str
    meeting_date: str
    source_type: str
    status: str
    duration_seconds: float = 0
    language: Optional[str] = None
    participant_count: int = 0
    created_at: str
    updated_at: str
    stats: Optional[MeetingStats] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_meeting(cls, meeting) -> "MeetingResponse":
        stats = None
        if meeting.analysis:
            stats = MeetingStats(
                decisions=len(meeting.analysis.decisions) if meeting.analysis.decisions else 0,
                action_items=len(meeting.analysis.action_items) if meeting.analysis.action_items else 0,
                risks=len(meeting.analysis.risks) if meeting.analysis.risks else 0,
            )
        return cls(
            id=meeting.id,
            title=meeting.title,
            meeting_date=meeting.meeting_date.isoformat() if meeting.meeting_date else "",
            source_type=meeting.source_type or "AUDIO_UPLOAD",
            status=meeting.status or "CREATED",
            duration_seconds=meeting.duration_seconds or 0,
            language=meeting.language,
            participant_count=meeting.participant_count or 0,
            created_at=meeting.created_at.isoformat() if meeting.created_at else "",
            updated_at=meeting.updated_at.isoformat() if meeting.updated_at else "",
            stats=stats,
        )

class MeetingListResponse(BaseModel):
    meetings: List[MeetingResponse]
    total: int
    has_more: bool
    page: int = 1
    limit: int = 20
