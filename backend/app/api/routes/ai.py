import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.meeting import Meeting
from app.models.transcript import TranscriptSegment
from app.models.followup import FollowUp
from app.schemas.chat import ChatRequest, ChatResponse, ChatSource
from app.schemas.followup import FollowUpRequest, FollowUpResponse
from app.services.auth import AuthService
from app.services.analysis import analysis_service

router = APIRouter()

@router.post("/meetings/{meeting_id}/chat", response_model=ChatResponse)
async def chat_with_meeting(
    meeting_id: str,
    request: ChatRequest,
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

    transcript = [
        {
            "speaker": s.speaker_label,
            "timestamp": s.start_seconds,
            "text": s.text,
        }
        for s in segments
    ]

    result = await analysis_service.answer_question(
        question=request.message,
        transcript=transcript,
    )

    conversation_id = request.conversation_id or f"chat_{uuid.uuid4().hex[:12]}"

    sources = []
    for src in (result.get("sources") or []):
        sources.append(ChatSource(
            segment_id=src.get("segment_id"),
            timestamp_seconds=src.get("timestamp_seconds"),
            excerpt=src.get("excerpt"),
        ))

    return ChatResponse(
        conversation_id=conversation_id,
        answer=result.get("answer", "I couldn't find that information in this meeting."),
        sources=sources if sources else None,
    )


@router.post("/meetings/{meeting_id}/follow-up", response_model=FollowUpResponse)
async def generate_followup(
    meeting_id: str,
    request: FollowUpRequest = None,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.owner_id == current_user.id,
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    meeting_data = {
        "title": meeting.title,
        "date": meeting.meeting_date.isoformat() if meeting.meeting_date else "",
        "summary_short": meeting.analysis.summary_short if meeting.analysis else None,
        "summary_detailed": meeting.analysis.summary_detailed if meeting.analysis else None,
        "decisions": [],
        "action_items": [],
    }

    if meeting.analysis:
        meeting_data["decisions"] = [
            {"text": d.text, "status": d.status} for d in meeting.analysis.decisions
        ]
        meeting_data["action_items"] = [
            {"task": a.task, "owner": a.owner} for a in meeting.analysis.action_items
        ]

    style = request.style if request else None
    content = await analysis_service.generate_followup(meeting_data, style=style)

    followup = FollowUp(
        meeting_id=meeting_id,
        content=content,
    )
    db.add(followup)
    db.commit()

    return FollowUpResponse(content=content)
