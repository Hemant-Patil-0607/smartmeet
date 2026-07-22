'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import { meetings } from '@/lib/api';
import { Meeting, ProcessingStatus } from '@/types';

interface ProcessingStep {
  id: string;
  label: string;
  completed: boolean;
  active: boolean;
}

export default function ProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [steps, setSteps] = useState<ProcessingStep[]>([]);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const [meetingRes, statusRes] = await Promise.all([
          meetings.get(meetingId),
          meetings.getProcessingStatus(meetingId),
        ]);

        const meetingData = meetingRes.data;
        const statusData = statusRes.data;
        setMeeting(meetingData);
        setProcessingStatus(statusData);

        if (meetingData.status === 'COMPLETED') {
          router.push(`/meetings/${meetingId}`);
          return;
        }

        const completedSteps = statusData.completed_steps || [];
        const currentStep = statusData.current_step;

        setSteps([
          { id: 'upload', label: 'File uploaded', completed: completedSteps.includes('UPLOAD'), active: currentStep === 'UPLOAD' },
          { id: 'transcription', label: 'Transcript prepared', completed: completedSteps.includes('TRANSCRIPTION'), active: currentStep === 'TRANSCRIPTION' },
          { id: 'normalization', label: 'Understanding discussion', completed: completedSteps.includes('NORMALIZATION'), active: currentStep === 'NORMALIZATION' },
          { id: 'analysis', label: 'Extracting intelligence', completed: completedSteps.includes('AI_ANALYSIS'), active: currentStep === 'AI_ANALYSIS' },
          { id: 'indexing', label: 'Indexing for search', completed: completedSteps.includes('INDEXING'), active: currentStep === 'INDEXING' },
        ]);
      } catch (error) {
        console.error('Failed to check status:', error);
      }
    };

    const interval = setInterval(checkStatus, 3000);
    checkStatus();

    return () => clearInterval(interval);
  }, [meetingId, router]);

  return (
    <Layout>
      <div className="p-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-heading-2 text-neutral-dark">Analyzing your meeting...</h1>
          <p className="text-body text-neutral mt-1">
            This may take a few minutes. You can leave this page and we&apos;ll notify you when it&apos;s ready.
          </p>
        </div>

        <div className="card">
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step.completed
                    ? 'bg-success'
                    : step.active
                    ? 'bg-warning animate-pulse'
                    : meeting?.status === 'FAILED'
                    ? 'bg-danger'
                    : 'bg-gray-200'
                }`}>
                  {step.completed ? (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : step.active ? (
                    <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : meeting?.status === 'FAILED' ? (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : null}
                </div>
                <span className={`text-body ${
                  step.completed
                    ? 'text-neutral-dark'
                    : step.active
                    ? 'text-primary font-medium'
                    : meeting?.status === 'FAILED'
                    ? 'text-danger'
                    : 'text-neutral'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {meeting?.status === 'FAILED' && (
          <div className="mt-6">
            <div className="p-4 bg-danger/10 rounded-lg mb-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-danger mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-body text-danger font-medium">Processing failed</p>
                  <p className="text-small text-neutral mt-1">
                    {processingStatus?.error || 'An error occurred during processing.'}
                  </p>
                </div>
              </div>
            </div>
            <Button onClick={() => meetings.retryProcessing(meetingId)}>
              Retry Processing
            </Button>
          </div>
        )}

        {meeting?.status !== 'FAILED' && (
          <div className="mt-6 p-4 bg-primary-light rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-primary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-body text-neutral-dark">
                You can safely leave this page. We&apos;ll redirect you when your meeting is ready.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
