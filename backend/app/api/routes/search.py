from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.user import User
from app.models.meeting import Meeting
from app.schemas.meeting import MeetingListResponse, MeetingResponse
from app.services.auth import AuthService

router = APIRouter()

@router.get("", response_model=MeetingListResponse)
def search_meetings(
    q: str = "",
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db),
):
    limit = min(limit, 100)
    offset = (page - 1) * limit

    meetings_query = db.query(Meeting).filter(Meeting.owner_id == current_user.id)

    if q:
        search_filter = or_(
            Meeting.title.ilike(f"%{q}%"),
            Meeting.transcript_text.ilike(f"%{q}%"),
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
