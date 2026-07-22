from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SourceResponse(BaseModel):
    segment_ids: List[str] = []
    timestamp_seconds: Optional[float] = None

class DecisionResponse(BaseModel):
    id: str
    text: str
    status: str = "PENDING"
    confidence: float = 0.0
    source: Optional[SourceResponse] = None
    user_modified: bool = False

    class Config:
        from_attributes = True

class ActionItemResponse(BaseModel):
    id: str
    task: str
    owner: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    status: str = "OPEN"
    confidence: float = 0.0
    source: Optional[SourceResponse] = None
    user_modified: bool = False

    class Config:
        from_attributes = True

class TopicResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class RiskResponse(BaseModel):
    id: str
    content: str
    severity: str = "MEDIUM"
    source: Optional[SourceResponse] = None

    class Config:
        from_attributes = True

class SummaryResponse(BaseModel):
    short: Optional[str] = None
    detailed: Optional[str] = None

class IntelligenceResponse(BaseModel):
    summary: SummaryResponse
    decisions: List[DecisionResponse] = []
    action_items: List[ActionItemResponse] = []
    topics: List[TopicResponse] = []
    risks: List[RiskResponse] = []

class AnalysisResponse(BaseModel):
    id: str
    meeting_id: str
    summary_short: Optional[str] = None
    summary_detailed: Optional[str] = None
    decisions: List[DecisionResponse] = []
    action_items: List[ActionItemResponse] = []
    topics: List[TopicResponse] = []
    risks: List[RiskResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True
