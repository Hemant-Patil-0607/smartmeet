from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache
import os

class Settings(BaseSettings):
    # App
    APP_NAME: str = "SmartMeet"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    
    # Auth - REQUIRED, no default
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/smartmeet"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Storage (Supabase S3-compatible)
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_BUCKET_NAME: str = "smartmeet-storage"
    AWS_REGION: str = "us-east-1"
    S3_ENDPOINT_URL: str = ""
    
    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_DAY: int = 1000
    
    # File Upload
    MAX_UPLOAD_SIZE_MB: int = 500
    ALLOWED_AUDIO_TYPES: list[str] = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/ogg", "audio/webm"]
    ALLOWED_TRANSCRIPT_TYPES: list[str] = ["text/plain", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if v == "your-secret-key-change-in-production":
            raise ValueError("SECRET_KEY must be changed from default value")
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters")
        return v
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()

def get_settings_no_cache() -> Settings:
    return Settings()
