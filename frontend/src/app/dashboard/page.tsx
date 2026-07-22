'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import MeetingCard from '@/components/meeting/MeetingCard';
import { Meeting } from '@/types';
import { meetings } from '@/lib/api';

export default function DashboardPage() {
  const [meetingsList, setMeetingsList] = useState<Meeting[]>([]);
  const [stats, setStats] = useState({
    totalMeetings: 0,
    thisMonth: 0,
    actionItems: 0,
    avgTimeSaved: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await meetings.list({ limit: 5 });
      setMeetingsList(response.data.meetings);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-heading-2 text-neutral-dark">Welcome back, John 👋</h1>
            <p className="text-body text-neutral mt-1">Here&apos;s what&apos;s happening with your meetings.</p>
          </div>
          <Link href="/meetings/new">
            <Button>+ Add Meeting</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card>
            <p className="text-small text-neutral mb-1">Total Meetings</p>
            <p className="text-heading-2 text-neutral-dark">{stats.totalMeetings}</p>
          </Card>
          <Card>
            <p className="text-small text-neutral mb-1">This Month</p>
            <p className="text-heading-2 text-neutral-dark">{stats.thisMonth}</p>
          </Card>
          <Card>
            <p className="text-small text-neutral mb-1">Action Items</p>
            <p className="text-heading-2 text-neutral-dark">{stats.actionItems}</p>
          </Card>
          <Card>
            <p className="text-small text-neutral mb-1">Avg. Time Saved</p>
            <p className="text-heading-2 text-neutral-dark">{stats.avgTimeSaved} hrs</p>
          </Card>
        </div>

        {/* Recent Meetings */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading-3 text-neutral-dark">Recent Meetings</h2>
          <Link href="/meetings" className="text-body text-primary font-medium hover:underline">
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : meetingsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetingsList.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-body font-medium text-neutral-dark mb-1">No meetings yet</h3>
            <p className="text-small text-neutral mb-4">Upload your first meeting to get started</p>
            <Link href="/meetings/new">
              <Button>Add Meeting</Button>
            </Link>
          </Card>
        )}
      </div>
    </Layout>
  );
}
