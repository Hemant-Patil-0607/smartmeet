from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class ApiResponse(BaseModel):
    success: bool = True
    data: Any = None
    meta: Any = None

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class WorkspaceResponse(BaseModel):
    id: str
    name: str
    role: str

class UserWithWorkspace(BaseModel):
    id: str
    name: str
    email: str
    avatar_url: Optional[str] = None
    workspace: Optional[WorkspaceResponse] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserWithWorkspace
