from fastapi import APIRouter
from app.api.routes import auth, meetings, search

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(meetings.router, prefix="/meetings", tags=["meetings"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
