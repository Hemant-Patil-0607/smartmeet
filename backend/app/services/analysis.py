import json
from typing import List, Dict, Optional
from openai import OpenAI
from app.config import settings

class AnalysisService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL

    async def analyze_meeting(self, transcript: List[Dict]) -> Dict:
        """Analyze meeting transcript and extract insights."""
        transcript_text = self._format_transcript(transcript)

        prompt = f"""Analyze the following meeting transcript and extract structured insights.

TRANSCRIPT:
{transcript_text}

Extract the following in JSON format:
{{
  "summary": "A concise summary of the meeting (2-3 paragraphs)",
  "decisions": [
    {{
      "content": "The decision made",
      "timestamp": null_or_number,
      "confidence": 0.0_to_1.0,
      "sources": [{{"timestamp": number, "text": "relevant quote"}}]
    }}
  ],
  "action_items": [
    {{
      "content": "The action item",
      "assignee": "person name or null",
      "priority": "low|medium|high",
      "timestamp": null_or_number,
      "sources": [{{"timestamp": number, "text": "relevant quote"}}]
    }}
  ],
  "topics": [
    {{
      "name": "Topic name",
      "description": "Brief description",
      "timestamp": null_or_number,
      "sources": [{{"timestamp": number, "text": "relevant quote"}}]
    }}
  ],
  "risks": [
    {{
      "content": "Risk description",
      "severity": "low|medium|high",
      "timestamp": null_or_number,
      "sources": [{{"timestamp": number, "text": "relevant quote"}}]
    }}
  ]
}}

IMPORTANT: Only include information that is explicitly stated or clearly implied in the transcript.
Do not hallucinate or make assumptions. Include source references for all insights."""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a meeting analysis assistant. Extract structured insights from meeting transcripts. Only include information explicitly stated in the transcript."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )

        result = json.loads(response.choices[0].message.content)
        return result

    async def answer_question(
        self,
        question: str,
        transcript: List[Dict],
        context: Optional[str] = None
    ) -> Dict:
        """Answer a question about the meeting using the transcript."""
        transcript_text = self._format_transcript(transcript)

        prompt = f"""Answer the following question based ONLY on the meeting transcript provided.

TRANSCRIPT:
{transcript_text}

QUESTION: {question}

Provide your answer with source references. Return in JSON format:
{{
  "answer": "Your answer based on the transcript",
  "sources": [
    {{
      "timestamp": number,
      "text": "relevant quote from transcript"
    }}
  ]
}}

IMPORTANT: Only answer based on information in the transcript. If the answer is not in the transcript, say so."""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a meeting assistant. Answer questions based only on the provided transcript. Include source references."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )

        result = json.loads(response.choices[0].message.content)
        return result

    async def generate_followup(self, meeting_data: Dict) -> str:
        """Generate a follow-up email based on meeting insights."""
        prompt = f"""Generate a professional follow-up email based on the following meeting insights:

Meeting: {meeting_data.get('title', 'Untitled')}
Date: {meeting_data.get('date', 'Unknown')}

Summary: {meeting_data.get('summary', 'No summary')}

Decisions: {json.dumps(meeting_data.get('decisions', []))}

Action Items: {json.dumps(meeting_data.get('action_items', []))}

Generate a clear, professional follow-up email that:
1. Thanks participants
2. Summarizes key points
3. Lists action items with owners
4. Mentions next steps

Keep it concise and actionable."""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a professional meeting assistant. Generate clear, concise follow-up emails."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
        )

        return response.choices[0].message.content

    def _format_transcript(self, transcript: List[Dict]) -> str:
        formatted = []
        for segment in transcript:
            minutes = int(segment["timestamp"] // 60)
            seconds = int(segment["timestamp"] % 60)
            time_str = f"{minutes:02d}:{seconds:02d}"
            speaker = segment.get("speaker") or "Speaker"
            formatted.append(f"[{time_str}] {speaker}: {segment['text']}")
        return "\n".join(formatted)

analysis_service = AnalysisService()
