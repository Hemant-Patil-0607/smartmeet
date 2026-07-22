from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, UserWithWorkspace, WorkspaceResponse
from app.services.auth import AuthService

router = APIRouter()

@router.post("/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=AuthService.get_password_hash(user_data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = AuthService.create_access_token(data={"sub": user.id})
    return Token(
        access_token=access_token,
        user=UserWithWorkspace(
            id=user.id,
            name=user.name,
            email=user.email,
            avatar_url=None,
            workspace=WorkspaceResponse(
                id=f"ws_{user.id[:8]}",
                name=f"{user.name}'s Workspace",
                role="OWNER",
            ),
        ),
    )

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not AuthService.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = AuthService.create_access_token(data={"sub": user.id})
    return Token(
        access_token=access_token,
        user=UserWithWorkspace(
            id=user.id,
            name=user.name,
            email=user.email,
            avatar_url=None,
            workspace=WorkspaceResponse(
                id=f"ws_{user.id[:8]}",
                name=f"{user.name}'s Workspace",
                role="OWNER",
            ),
        ),
    )

@router.get("/me", response_model=UserWithWorkspace)
def get_current_user(
    current_user: User = Depends(AuthService.get_current_user),
):
    return UserWithWorkspace(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        avatar_url=None,
        workspace=WorkspaceResponse(
            id=f"ws_{current_user.id[:8]}",
            name=f"{current_user.name}'s Workspace",
            role="OWNER",
        ),
    )
