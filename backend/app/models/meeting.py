from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import uuid

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    meeting_date = Column(DateTime, nullable=False)
    source_type = Column(String, nullable=False)  # AUDIO_UPLOAD, TRANSCRIPT_UPLOAD, TRANSCRIPT_PASTE
    status = Column(String, default="CREATED")  # CREATED, UPLOADED, QUEUED, TRANSCRIBING, NORMALIZING, ANALYZING, INDEXING, COMPLETED, FAILED
    duration_seconds = Column(Float, default=0)
    language = Column(String, nullable=True)
    participant_count = Column(Integer, default=0)
    audio_url = Column(String, nullable=True)
    transcript_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="meetings")
    segments = relationship("TranscriptSegment", back_populates="meeting")
    analysis = relationship("Analysis", back_populates="meeting", uselist=False)
    jobs = relationship("Job", back_populates="meeting")
    followups = relationship("FollowUp", back_populates="meeting")
