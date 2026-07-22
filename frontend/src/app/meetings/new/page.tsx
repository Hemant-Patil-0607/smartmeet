'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { meetings } from '@/lib/api';
import { SourceType } from '@/types';

const meetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  participants: z.string().optional(),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

export default function NewMeetingPage() {
  const router = useRouter();
  const [uploadMode, setUploadMode] = useState<'audio' | 'transcript-paste' | 'transcript-upload' | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcriptText, setTranscriptText] = useState('');
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
  });

  const onAudioDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setAudioFile(acceptedFiles[0]);
    }
  }, []);

  const onTranscriptDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setTranscriptFile(acceptedFiles[0]);
    }
  }, []);

  const audioDropzone = useDropzone({
    onDrop: onAudioDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.webm'],
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024,
  });

  const transcriptDropzone = useDropzone({
    onDrop: onTranscriptDrop,
    accept: {
      'text/*': ['.txt'],
    },
    maxFiles: 1,
  });

  const onSubmit = async (data: MeetingFormData) => {
    if (!audioFile && !transcriptText && !transcriptFile) {
      setError('Please provide audio or transcript content');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let sourceType: SourceType;
      if (audioFile) {
        sourceType = 'AUDIO_UPLOAD';
      } else if (transcriptFile) {
        sourceType = 'TRANSCRIPT_UPLOAD';
      } else {
        sourceType = 'TRANSCRIPT_PASTE';
      }

      const participants = data.participants
        ? data.participants.split(',').map(p => p.trim()).filter(p => p)
        : undefined;

      const response = await meetings.create({
        title: data.title,
        meeting_date: new Date(data.date).toISOString(),
        source_type: sourceType,
        participants,
      });

      const meetingId = response.data.id;

      if (audioFile) {
        const uploadUrlRes = await meetings.getUploadUrl(meetingId, {
          filename: audioFile.name,
          content_type: audioFile.type,
          size: audioFile.size,
        });

        const { upload_url } = uploadUrlRes.data.data;
        await fetch(upload_url, {
          method: 'PUT',
          body: audioFile,
          headers: { 'Content-Type': audioFile.type },
        });

        await meetings.confirmUpload(meetingId);
      } else if (transcriptText) {
        await meetings.submitTranscript(meetingId, transcriptText);
      } else if (transcriptFile) {
        const text = await transcriptFile.text();
        await meetings.submitTranscript(meetingId, text);
      }

      router.push(`/meetings/${meetingId}/processing`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create meeting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-heading-2 text-neutral-dark">Add Meeting</h1>
          <p className="text-body text-neutral mt-1">
            Upload an audio recording or transcript to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-4 bg-danger/10 text-danger rounded-lg text-body">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setUploadMode('audio')}
              className={`p-6 border-2 rounded-xl text-center transition-colors ${
                uploadMode === 'audio'
                  ? 'border-primary bg-primary-light'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="text-body font-medium text-neutral-dark">Upload Audio</p>
              <p className="text-small text-neutral mt-1">MP3, WAV, M4A, etc.</p>
            </button>

            <button
              type="button"
              onClick={() => setUploadMode('transcript-paste')}
              className={`p-6 border-2 rounded-xl text-center transition-colors ${
                uploadMode === 'transcript-paste'
                  ? 'border-primary bg-primary-light'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-body font-medium text-neutral-dark">Paste Transcript</p>
              <p className="text-small text-neutral mt-1">Copy & paste text</p>
            </button>

            <button
              type="button"
              onClick={() => setUploadMode('transcript-upload')}
              className={`p-6 border-2 rounded-xl text-center transition-colors ${
                uploadMode === 'transcript-upload'
                  ? 'border-primary bg-primary-light'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-body font-medium text-neutral-dark">Upload Transcript</p>
              <p className="text-small text-neutral mt-1">TXT files</p>
            </button>
          </div>

          {uploadMode === 'audio' && (
            <div
              {...audioDropzone.getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                audioDropzone.isDragActive ? 'border-primary bg-primary-light' : 'border-gray-200'
              }`}
            >
              <input {...audioDropzone.getInputProps()} />
              {audioFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-body font-medium text-neutral-dark">{audioFile.name}</p>
                    <p className="text-small text-neutral">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-body text-neutral-dark mb-1">
                    Drop your audio file here, or{' '}
                    <span className="text-primary font-medium">browse</span>
                  </p>
                  <p className="text-small text-neutral">
                    MP3, WAV, M4A, OGG, WebM (max 500MB)
                  </p>
                </>
              )}
            </div>
          )}

          {uploadMode === 'transcript-paste' && (
            <div>
              <textarea
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                placeholder="Paste your meeting transcript here..."
                className="input-field min-h-[200px] resize-y"
              />
            </div>
          )}

          {uploadMode === 'transcript-upload' && (
            <div
              {...transcriptDropzone.getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                transcriptDropzone.isDragActive ? 'border-primary bg-primary-light' : 'border-gray-200'
              }`}
            >
              <input {...transcriptDropzone.getInputProps()} />
              {transcriptFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-body font-medium text-neutral-dark">{transcriptFile.name}</p>
                    <p className="text-small text-neutral">{(transcriptFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-body text-neutral-dark mb-1">
                    Drop your transcript file here, or{' '}
                    <span className="text-primary font-medium">browse</span>
                  </p>
                  <p className="text-small text-neutral">TXT files only</p>
                </>
              )}
            </div>
          )}

          <div className="card">
            <h3 className="text-body font-medium text-neutral-dark mb-4">Meeting Details (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Meeting Title"
                placeholder="e.g., Product Planning Meeting"
                error={errors.title?.message}
                {...register('title')}
              />
              <Input
                label="Meeting Date"
                type="date"
                error={errors.date?.message}
                {...register('date')}
              />
            </div>
            <div className="mt-4">
              <Input
                label="Participants"
                placeholder="e.g., John, Sarah, Mike"
                {...register('participants')}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create & Process
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
