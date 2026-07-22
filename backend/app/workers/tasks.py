import os
import json
import logging
import asyncio
from datetime import datetime
from app.workers import celery_app
from app.database import SessionLocal
from app.models.meeting import Meeting
from app.models.transcript import TranscriptSegment
from app.models.analysis import Analysis, Decision, ActionItem, Topic, Risk
from app.models.job import Job
from app.services.transcription import transcription_service
from app.services.analysis import analysis_service

logger = logging.getLogger(__name__)

def run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, max_retries=3)
def process_transcription(self, meeting_id: str, file_path: str = None):
    db = SessionLocal()
    job = None
    meeting = None
    try:
        logger.info(f"Starting transcription for meeting {meeting_id}")

        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            return

        job = db.query(Job).filter(
            Job.meeting_id == meeting_id,
            Job.type == "PROCESSING",
        ).first()
        if job:
            job.status = "PROCESSING"
            db.commit()

        meeting.status = "TRANSCRIBING"
        db.commit()

        if file_path:
            provider = transcription_service.get_provider_for_file(file_path)
            segments = run_async(transcription_service.transcribe(file_path, provider=provider))
        else:
            segments = []

        for seg_data in segments:
            segment = TranscriptSegment(
                meeting_id=meeting_id,
                speaker_label=seg_data.get("speaker"),
                start_seconds=seg_data.get("timestamp", 0),
                end_seconds=seg_data.get("end_timestamp"),
                text=seg_data.get("text", ""),
            )
            db.add(segment)

        if segments and meeting:
            meeting.duration_seconds = max(
                s.get("timestamp", 0) + s.get("duration", 0) for s in segments
            )

        meeting.status = "NORMALIZING"
        db.commit()

        if job:
            job.status = "COMPLETED"
            job.completed_at = datetime.utcnow()
            db.commit()

        logger.info(f"Transcription completed for meeting {meeting_id}")
        analyze_meeting.delay(meeting_id)

    except Exception as exc:
        logger.error(f"Transcription failed for meeting {meeting_id}: {exc}", exc_info=True)
        if job:
            job.status = "FAILED"
            job.error = str(exc)[:1000]
            db.commit()
        if meeting:
            meeting.status = "FAILED"
            db.commit()
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3)
def process_transcript_text(self, meeting_id: str, transcript_text: str):
    db = SessionLocal()
    job = None
    meeting = None
    try:
        logger.info(f"Starting transcript processing for meeting {meeting_id}")

        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            return

        meeting.status = "NORMALIZING"
        db.commit()

        paragraphs = [p.strip() for p in transcript_text.split("\n\n") if p.strip()]
        for i, paragraph in enumerate(paragraphs):
            segment = TranscriptSegment(
                meeting_id=meeting_id,
                start_seconds=i * 30,
                text=paragraph,
            )
            db.add(segment)

        if meeting and paragraphs:
            meeting.duration_seconds = len(paragraphs) * 30

        db.commit()

        job = db.query(Job).filter(
            Job.meeting_id == meeting_id,
            Job.type == "PROCESSING",
        ).first()
        if job:
            job.status = "COMPLETED"
            job.completed_at = datetime.utcnow()
            db.commit()

        logger.info(f"Transcript processing completed for meeting {meeting_id}")
        analyze_meeting.delay(meeting_id)

    except Exception as exc:
        logger.error(f"Transcript processing failed for meeting {meeting_id}: {exc}", exc_info=True)
        if job:
            job.status = "FAILED"
            job.error = str(exc)[:1000]
            db.commit()
        if meeting:
            meeting.status = "FAILED"
            db.commit()
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3)
def analyze_meeting(self, meeting_id: str):
    db = SessionLocal()
    job = None
    meeting = None
    try:
        logger.info(f"Starting analysis for meeting {meeting_id}")

        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            return

        meeting.status = "ANALYZING"
        db.commit()

        job = db.query(Job).filter(
            Job.meeting_id == meeting_id,
            Job.type == "ANALYSIS",
        ).first()
        if not job:
            job = Job(meeting_id=meeting_id, type="ANALYSIS", status="PROCESSING")
            db.add(job)
        else:
            job.status = "PROCESSING"
        db.commit()

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

        if not transcript:
            logger.warning(f"No transcript segments found for meeting {meeting_id}")
            job.status = "FAILED"
            job.error = "No transcript segments found"
            db.commit()
            return

        result = run_async(analysis_service.analyze_meeting(transcript))

        analysis = db.query(Analysis).filter(Analysis.meeting_id == meeting_id).first()
        if not analysis:
            analysis = Analysis(meeting_id=meeting_id)
            db.add(analysis)

        analysis.summary_short = result.get("summary_short", "")
        analysis.summary_detailed = result.get("summary_detailed", result.get("summary", ""))
        db.commit()

        for dec_data in result.get("decisions", []):
            segment_ids = dec_data.get("source", {}).get("segment_ids", [])
            timestamp = dec_data.get("source", {}).get("timestamp_seconds")
            decision = Decision(
                analysis_id=analysis.id,
                text=dec_data.get("text", dec_data.get("content", "")),
                status=dec_data.get("status", "PENDING"),
                confidence=dec_data.get("confidence", 0.8),
                source_segment_ids=json.dumps(segment_ids) if segment_ids else None,
                source_timestamp_seconds=timestamp,
            )
            db.add(decision)

        for item_data in result.get("action_items", []):
            segment_ids = item_data.get("source", {}).get("segment_ids", [])
            timestamp = item_data.get("source", {}).get("timestamp_seconds")
            action_item = ActionItem(
                analysis_id=analysis.id,
                task=item_data.get("task", item_data.get("content", "")),
                owner=item_data.get("owner", item_data.get("assignee")),
                priority=item_data.get("priority", "MEDIUM"),
                status=item_data.get("status", "OPEN"),
                confidence=item_data.get("confidence", 0.8),
                source_segment_ids=json.dumps(segment_ids) if segment_ids else None,
                source_timestamp_seconds=timestamp,
            )
            db.add(action_item)

        for topic_data in result.get("topics", []):
            topic = Topic(
                analysis_id=analysis.id,
                name=topic_data["name"],
                description=topic_data.get("description"),
            )
            db.add(topic)

        for risk_data in result.get("risks", []):
            segment_ids = risk_data.get("source", {}).get("segment_ids", [])
            timestamp = risk_data.get("source", {}).get("timestamp_seconds")
            risk = Risk(
                analysis_id=analysis.id,
                content=risk_data["content"],
                severity=risk_data.get("severity", "MEDIUM"),
                source_segment_ids=json.dumps(segment_ids) if segment_ids else None,
                source_timestamp_seconds=timestamp,
            )
            db.add(risk)

        db.commit()

        meeting.status = "COMPLETED"
        db.commit()

        job.status = "COMPLETED"
        job.completed_at = datetime.utcnow()
        db.commit()

        logger.info(f"Analysis completed for meeting {meeting_id}")

    except Exception as exc:
        logger.error(f"Analysis failed for meeting {meeting_id}: {exc}", exc_info=True)
        if job:
            job.status = "FAILED"
            job.error = str(exc)[:1000]
            db.commit()
        if meeting:
            meeting.status = "FAILED"
            db.commit()
        raise self.retry(exc=exc, countdown=120)
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3)
def process_meeting(self, meeting_id: str, job_id: str = None):
    db = SessionLocal()
    try:
        logger.info(f"Starting processing for meeting {meeting_id}")
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            return

        if meeting.source_type == "AUDIO_UPLOAD" and meeting.audio_url:
            process_transcription.delay(meeting_id)
        elif meeting.source_type in ["TRANSCRIPT_UPLOAD", "TRANSCRIPT_PASTE"] and meeting.transcript_text:
            process_transcript_text.delay(meeting_id, meeting.transcript_text)
        else:
            analyze_meeting.delay(meeting_id)

    except Exception as exc:
        logger.error(f"Processing failed for meeting {meeting_id}: {exc}", exc_info=True)
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()
