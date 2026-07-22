import os
from typing import List, Dict, Optional
from abc import ABC, abstractmethod
from openai import OpenAI
from app.config import settings

class TranscriptionProvider(ABC):
    @abstractmethod
    async def transcribe(self, audio_path: str) -> List[Dict]:
        """Transcribe audio file and return segments with timestamps."""
        pass

class OpenAITranscriptionProvider(TranscriptionProvider):
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    async def transcribe(self, audio_path: str) -> List[Dict]:
        with open(audio_path, "rb") as audio_file:
            response = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                timestamp_granularities=["segment"],
            )

        segments = []
        for segment in response.segments:
            segments.append({
                "speaker": None,
                "timestamp": segment["start"],
                "text": segment["text"].strip(),
                "duration": segment["end"] - segment["start"],
            })

        return segments

class TextTranscriptionProvider(TranscriptionProvider):
    async def transcribe(self, audio_path: str) -> List[Dict]:
        """For text files, just return the content as a single segment."""
        with open(audio_path, "r", encoding="utf-8") as f:
            text = f.read()
        return [{
            "speaker": None,
            "timestamp": 0,
            "text": text.strip(),
            "duration": None,
        }]

class TranscriptionService:
    def __init__(self):
        self.providers = {
            "openai": OpenAITranscriptionProvider(),
            "text": TextTranscriptionProvider(),
        }
        self.default_provider = "openai"

    async def transcribe(
        self,
        audio_path: str,
        provider: Optional[str] = None,
    ) -> List[Dict]:
        provider_name = provider or self.default_provider
        transcription_provider = self.providers.get(provider_name)
        if not transcription_provider:
            raise ValueError(f"Unknown transcription provider: {provider_name}")
        return await transcription_provider.transcribe(audio_path)

    def get_provider_for_file(self, file_path: str) -> str:
        ext = os.path.splitext(file_path)[1].lower()
        if ext in [".txt", ".docx", ".pdf"]:
            return "text"
        return "openai"

transcription_service = TranscriptionService()
