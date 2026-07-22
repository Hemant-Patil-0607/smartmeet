from pydantic import BaseModel
from typing import Optional, List

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class ChatSource(BaseModel):
    segment_id: Optional[str] = None
    timestamp_seconds: Optional[float] = None
    excerpt: Optional[str] = None

class ChatResponse(BaseModel):
    conversation_id: Optional[str] = None
    answer: str
    sources: Optional[List[ChatSource]] = None
