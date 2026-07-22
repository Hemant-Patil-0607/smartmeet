import os
import tempfile
import logging
import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.meeting import Meeting
from app.models.transcript import TranscriptSegment
from app.models.analysis import Analysis, Decision, ActionItem, Topic, Risk
from app.models.job import Job
from app.schemas.meeting import MeetingResponse, MeetingListResponse, MeetingCreate
from app.schemas.transcript import TranscriptSegmentResponse, TranscriptResponse, SpeakerResponse
from app.schemas.analysis import IntelligenceResponse, SummaryResponse, DecisionResponse, ActionItemResponse, TopicResponse, RiskResponse, SourceResponse
from app.schemas.job import ProcessingStatusResponse
from app.services.auth import AuthService
from app.services.storage import storage_service

logger = logging.getLogger(__name__)

router = APIRouter()


def build_intelligence(analysis) -> IntelligenceResponse:
    if not analysis:
        return IntelligenceResponse(
            summary=SummaryResponse(),
            decisions=[],
            action_items=[],
            topics=[],
            risks=[],
        )

    decisions = []
    for d in (analysis.decisions or []):
        source = None
        if d.source_segment_ids:
            try:
                source = SourceResponse(
                    segment_ids=json.loads(d.source_segment_ids),
                    timestamp_seconds=d.source_timestamp_seconds,
                )
            except Exception:
                source = SourceResponse(segment_ids=[], timestamp_seconds=d.source_timestamp_seconds)
        decisions.append(DecisionResponse(
            id=d.id,
            text=d.text,
            status=d.status or "PENDING",
            confidence=d.confidence or 0.0,
            source=source,
            user_modified=d.user_modified or False,
        ))

    action_items = []
    for a in (analysis.action_items or []):
        source = None
        if a.source_segment_ids:
            try:
                source = SourceResponse(
                    segment_ids=json.loads(a.source_segment_ids),
                    timestamp_seconds=a.source_timestamp_seconds,
                )
            except Exception:
                source = SourceResponse(segment_ids=[], timestamp_seconds=a.source_timestamp_seconds)
        action_items.append(ActionItemResponse(
            id=a.id,
            task=a.task,
            owner=a.owner,
            due_date=a.due_date.isoformat() if a.due_date else None,
            priority=a.priority,
            status=a.status or "OPEN",
            confidence=a.confidence or 0.0,
            source=source,
            user_modified=a.user_modified or False,
        ))

    topics = [
        TopicResponse(id=t.id, name=t.name, description=t.description)
        for t in (analysis.topics or [])
    ]

    risks = []
    for r in (analysis.risks or []):
        source = None
        if r.source_segment_ids:
            try:
                source = SourceResponse(
                    segment_ids=json.loads(r.source_segment_ids),
                    timestamp_seconds=r.source_timestamp_seconds,
                )
            except Exception:
                source = SourceResponse(segment_ids=[], timestamp_seconds=r.source_timestamp_seconds)
        risks.append(RiskResponse(
            id=r.id,
            content=r.content,
            severity=r.severity or "MEDIUM",
            source=source,
        ))

    return IntelligenceResponse(
        summary=SummaryResponse(
            short=analysis.summary_short,
            detailed=analysis.summary_detailed,
        ),
        decisions=decisions,
        action_items=action_items,
        topics=topics,
        risks=risks,
    )


@router.get("", response_model=MeetingListResponse)
def list_meetings(
    page: int = 1,
    limit: int = 20,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db),
):
    limit = min(limit, 100)
    offset = (page - 1) * limit

    meetings_query = db.query(Meeting).filter(Meeting.owner_id == current_user.id)

    if status_filter:
        meetings_query = meetings_query.filter(Meeting.status == status_filter)
    if search:
        search_filter = (
            Meeting.title.ilike(f"%{search}%") |
            Meeting.transcript_text.ilike(f"%{search}%")
        )
        meetings_query = meetings_query.filter(search_filter)

    total = meetings_query.count()
    meetings = meetings_query.order_by(Meeting.created_at.desc()).offset(offset).limit(limit).all()

    return MeetingListResponse(
        meetings=[MeetingResponse.from_meeting(m) for m in meetings],
        total=total,
        has_more=offset + limit < total,
        page=page,
        limit=limit,
    )


@router.post("", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
async def create_meeting(
    request: MeetingCreate,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db),
):
    participants_count = len(request.participants) if request.participants else 0

    meeting = Meeting(
        owner_id=current_user.id,
        title=request.title or "Untitled Meeting",
        meeting_date=datetime.fromisoformat(request.meeting_date.replace("Z", "+00:00")),
        source_type=request.source_type,
        status="CREATED",
        participant_count=participants_count,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    job = Job(
        meeting_id=meeting.id,
        type="PROCESSING",
        status="QUEUED",
    )
    db.add(job)
    db.commit()

    return MeetingResponse.from_meeting(meeting)


@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(
    meeting_id: str,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).options(
        joinedload(Meeting.analysis).joinedload(Analysis.decisions),
        joinedload(Meeting.analysis).joinedload(Analysis.action_items),
        joinedload(Meeting.analysis).joinedload(Analysis.topics),
        joinedload(Meeting.analysis).joinedload(Analysis.risks),
    ).filter(
        Meeting.id == meeting_id,
        Meeting.owner_id == current_user.id,
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return MeetingResponse.from_meeting(meeting)


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: str,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.owner_id == current_user.id,
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    db.delete(meeting)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{meeting_id}/transcript", response_model=TranscriptResponse)
def get_transcript(
    meeting_id: str,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.owner_id == current_user.id,
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    segments = db.query(TranscriptSegment).filter(
        TranscriptSegment.meeting_id == meeting_id
    ).order_by(TranscriptSegment.start_seconds).all()

    segment_responses = []
    for s in segments:
        speaker = None
        if s.speaker_label:
            speaker = SpeakerResponse(id=f"spk_{s.speaker_label}", label=s.speaker_label)
        segment_responses.append(TranscriptSegmentResponse(
            id=s.id,
            speaker=speaker,
            start_seconds=s.start_seconds,
            end_seconds=s.end_seconds,
            text=s.text,
        ))

    return TranscriptResponse(segments=segment_responses)


@router.get("/{meeting_id}/intelligence", response_model=IntelligenceResponse)
def get_intelligence(
    meeting_id: str,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).options(
        joinedload(Meeting.analysis).joinedload(Analysis.decisions),
        joinedload(Meeting.analysis).joinedload(Analysis.action_items),
        joinedload(Meeting.analysis).joinedload(Analysis.topics),
        joinedload(Meeting.analysis).joinedload(Analysis.risks),
    ).filter(
        Meeting.id == meeting_id,
        Meeting.owner_id == current_user.id,
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    return build_intelligence(meeting.analysis)


@router.get("/{meeting_id}/processing-status", response_model=ProcessingStatusResponse)
def get_processing_status(
    meeting_id: str,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.owner_id == current_user.id,
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    status_map = {
        "CREATED": ("CREATED", "UPLOAD", [], "UPLOAD"),
        "UPLOADED": ("UPLOADED", "TRANSCRIPTION", ["UPLOAD"], "TRANSCRIPTION"),
        "QUEUED": ("QUEUED", "TRANSCRIPTION", ["UPLOAD"], "TRANSCRIPTION"),
        "TRANSCRIBING": ("TRANSCRIBING", "TRANSCRIPTION", ["UPLOAD"], "TRANSCRIPTION"),
        "NORMALIZING": ("NORMALIZING", "NORMALIZATION", ["UPLOAD", "TRANSCRIPTION"], "NORMALIZATION"),
        "ANALYZING": ("ANALYZING", "AI_ANALYSIS", ["UPLOAD", "TRANSCRIPTION", "NORMALIZATION"], "AI_ANALYSIS"),
        "INDEXING": ("INDEXING", "INDEXING", ["UPLOAD", "TRANSCRIPTION", "NORMALIZATION", "AI_ANALYSIS"], "INDEXING"),
        "COMPLETED": ("COMPLETED", "DONE", ["UPLOAD", "TRANSCRIPTION", "NORMALIZATION", "AI_ANALYSIS", "INDEXING"], None),
        "FAILED": ("FAILED", "ERROR", [], None),
    }

    current_status = meeting.status or "CREATED"
    stage, step, completed, current = status_map.get(current_status, ("CREATED", "UPLOAD", [], "UPLOAD"))

    return ProcessingStatusResponse(
        status=stage,
        stage=step,
        completed_steps=completed,
        current_step=current,
        error=None,
    )


@router.post("/{meeting_id}/upload-url")
async def get_upload_url(
    meeting_id: str,
    filename: str,
    content_type: str,
    size: int,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.owner_id == current_user.id,
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if size > max_size:
        raise HTTPException(status_code=413, detail=f"File too large. Max: {settings.MAX_UPLOAD_SIZE_MB}MB")

    allowed_types = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/ogg", "audio/webm", "text/plain"]
    if content_type not in allowed_types:
        raise HTTPException(status_code=415, detail="Unsupported media type")

    upload_url, storage_key = await storage_service.get_signed_upload_url(
        f"meetings/{meeting_id}/source/{filename}",
        content_type,
    )

    return {
        "success": True,
        "data": {
            "upload_url": upload_url,
            "storage_key": storage_key,
            "expires_in": 900,
        },
    }


@router.post("/{meeting_id}/upload-complete")
async def upload_complete(
    meeting_id: str,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.owner_id == current_user.id,
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    meeting.status = "UPLOADED"
    db.commit()

    from app.workers.tasks import process_transcription
    process_transcription.delay(meeting.id)

    return {
        "success": True,
        "data": {"status": "QUEUED"},
    }


@router.post("/{meeting_id}/transcript-text", status_code=status.HTTP_202_ACCEPTED)
async def submit_transcript_text(
    meeting_id: str,
    text: str,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db),
):
    if not text or len(text.strip()) < 10:
        raise HTTPException(status_code=422, detail="Transcript text too short")

    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.owner_id == current_user.id,
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    meeting.transcript_text = text
    meeting.status = "QUEUED"
    db.commit()

    from app.workers.tasks import process_transcript_text
    process_transcript_text.delay(meeting_id, text)

    return {"success": True, "data": {"status": "QUEUED"}}


@router.post("/{meeting_id}/process", status_code=status.HTTP_202_ACCEPTED)
async def start_processing(
    meeting_id: str,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.owner_id == current_user.id,
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    existing_job = db.query(Job).filter(
        Job.meeting_id == meeting_id,
        Job.status.in_(["QUEUED", "PROCESSING"]),
    ).first()
    if existing_job:
        return {
            "success": True,
            "data": {
                "job_id": existing_job.id,
                "meeting_id": meeting_id,
                "status": existing_job.status,
            },
        }

    job = Job(
        meeting_id=meeting_id,
        type="PROCESSING",
        status="QUEUED",
    )
    db.add(job)
    meeting.status = "QUEUED"
    db.commit()

    from app.workers.tasks import process_meeting
    process_meeting.delay(meeting_id, job.id)

    return {
        "success": True,
        "data": {
            "job_id": job.id,
            "meeting_id": meeting_id,
            "status": "QUEUED",
        },
    }


@router.post("/{meeting_id}/retry", status_code=status.HTTP_202_ACCEPTED)
async def retry_processing(
    meeting_id: str,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.owner_id == current_user.id,
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if meeting.status not in ["FAILED", "COMPLETED"]:
        raise HTTPException(status_code=409, detail="Meeting is currently processing")

    job = Job(
        meeting_id=meeting_id,
        type="RETRY",
        status="QUEUED",
    )
    db.add(job)
    meeting.status = "QUEUED"
    db.commit()

    from app.workers.tasks import process_meeting
    process_meeting.delay(meeting_id, job.id)

    return {
        "success": True,
        "data": {
            "job_id": job.id,
            "meeting_id": meeting_id,
            "status": "QUEUED",
        },
    }


@router.get("/{meeting_id}/audio-url")
def get_audio_url(
    meeting_id: str,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.owner_id == current_user.id,
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if not meeting.audio_url:
        raise HTTPException(status_code=404, detail="No audio available")

    signed_url = storage_service.get_signed_url(meeting.audio_url)
    return {
        "success": True,
        "data": {"url": signed_url},
    }
