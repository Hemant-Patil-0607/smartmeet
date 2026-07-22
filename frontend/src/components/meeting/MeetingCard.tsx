'use client';

import Link from 'next/link';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Meeting, MeetingStatus } from '@/types';

interface MeetingCardProps {
  meeting: Meeting;
}

export default function MeetingCard({ meeting }: MeetingCardProps) {
  const statusVariant: Record<MeetingStatus, string> = {
    COMPLETED: 'success',
    TRANSCRIBING: 'warning',
    NORMALIZING: 'warning',
    ANALYZING: 'warning',
    INDEXING: 'warning',
    FAILED: 'danger',
    CREATED: 'neutral',
    UPLOADED: 'neutral',
    QUEUED: 'neutral',
  };

  const statusLabel: Record<MeetingStatus, string> = {
    COMPLETED: 'Completed',
    TRANSCRIBING: 'Transcribing',
    NORMALIZING: 'Normalizing',
    ANALYZING: 'Analyzing',
    INDEXING: 'Indexing',
    FAILED: 'Failed',
    CREATED: 'Created',
    UPLOADED: 'Uploaded',
    QUEUED: 'Queued',
  };

  const meetingDate = new Date(meeting.meeting_date);

  return (
    <Link href={`/meetings/${meeting.id}`}>
      <Card variant="hover">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-body font-semibold text-neutral-dark truncate">
              {meeting.title}
            </h3>
            <p className="text-small text-neutral mt-1">
              {meetingDate.toLocaleDateString()}
              {meeting.duration_seconds > 0 && ` · ${Math.round(meeting.duration_seconds / 60)} min`}
            </p>
          </div>
          <Badge variant={statusVariant[meeting.status] as any}>
            {statusLabel[meeting.status]}
          </Badge>
        </div>

        {meeting.status === 'COMPLETED' && meeting.stats && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            {meeting.stats.decisions > 0 && (
              <div className="flex items-center gap-1.5 text-small text-neutral">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {meeting.stats.decisions} decisions
              </div>
            )}
            {meeting.stats.action_items > 0 && (
              <div className="flex items-center gap-1.5 text-small text-neutral">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {meeting.stats.action_items} actions
              </div>
            )}
          </div>
        )}
      </Card>
    </Link>
  );
}
