'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import MeetingCard from '@/components/meeting/MeetingCard';
import { Meeting } from '@/types';
import { meetings } from '@/lib/api';

export default function MeetingsPage() {
  const [meetingsList, setMeetingsList] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, [page]);

  const loadMeetings = async () => {
    try {
      const response = await meetings.list({ page, limit: 12 });
      if (page === 1) {
        setMeetingsList(response.data.meetings);
      } else {
        setMeetingsList((prev) => [...prev, ...response.data.meetings]);
      }
      setHasMore(response.data.hasMore);
    } catch (error) {
      console.error('Failed to load meetings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-heading-2 text-neutral-dark">Meetings</h1>
            <p className="text-body text-neutral mt-1">Manage and review your meeting insights</p>
          </div>
          <Link href="/meetings/new">
            <Button>+ Add Meeting</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : meetingsList.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meetingsList.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 text-center">
                <Button variant="secondary" onClick={() => setPage((p) => p + 1)}>
                  Load More
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="card text-center py-12">
            <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-body font-medium text-neutral-dark mb-1">No meetings found</h3>
            <p className="text-small text-neutral mb-4">Get started by adding your first meeting</p>
            <Link href="/meetings/new">
              <Button>Add Meeting</Button>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
