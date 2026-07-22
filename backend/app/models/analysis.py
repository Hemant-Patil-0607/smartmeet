from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import uuid

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False, unique=True)
    summary_short = Column(Text, nullable=True)
    summary_detailed = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="analysis")
    decisions = relationship("Decision", back_populates="analysis")
    action_items = relationship("ActionItem", back_populates="analysis")
    topics = relationship("Topic", back_populates="analysis")
    risks = relationship("Risk", back_populates="analysis")

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(String, ForeignKey("analyses.id"), nullable=False)
    text = Column(Text, nullable=False)
    status = Column(String, default="PENDING")  # APPROVED, REJECTED, DEFERRED, PENDING, CANCELLED
    confidence = Column(Float, default=0.0)
    source_segment_ids = Column(Text, nullable=True)  # JSON array of segment IDs
    source_timestamp_seconds = Column(Float, nullable=True)
    user_modified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    analysis = relationship("Analysis", back_populates="decisions")

class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(String, ForeignKey("analyses.id"), nullable=False)
    task = Column(Text, nullable=False)
    owner = Column(String, nullable=True)
    due_date = Column(DateTime, nullable=True)
    priority = Column(String, nullable=True)  # LOW, MEDIUM, HIGH, null
    status = Column(String, default="OPEN")  # OPEN, IN_PROGRESS, COMPLETED
    confidence = Column(Float, default=0.0)
    source_segment_ids = Column(Text, nullable=True)  # JSON array of segment IDs
    source_timestamp_seconds = Column(Float, nullable=True)
    user_modified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    analysis = relationship("Analysis", back_populates="action_items")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(String, ForeignKey("analyses.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    analysis = relationship("Analysis", back_populates="topics")

class Risk(Base):
    __tablename__ = "risks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(String, ForeignKey("analyses.id"), nullable=False)
    content = Column(Text, nullable=False)
    severity = Column(String, default="MEDIUM")  # LOW, MEDIUM, HIGH
    source_segment_ids = Column(Text, nullable=True)  # JSON array of segment IDs
    source_timestamp_seconds = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    analysis = relationship("Analysis", back_populates="risks")
