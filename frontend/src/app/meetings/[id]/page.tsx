'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { MeetingDetail, TranscriptSegment, ChatMessage, Intelligence, Transcript } from '@/types';
import { meetings, ai } from '@/lib/api';

type Tab = 'overview' | 'transcript' | 'ask-ai';

export default function MeetingWorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const meetingId = params.id as string;

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'overview');
  const [intelligence, setIntelligence] = useState<Intelligence | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [followUpContent, setFollowUpContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    loadMeeting();
  }, [meetingId]);

  useEffect(() => {
    const tab = searchParams.get('tab') as Tab;
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const loadMeeting = async () => {
    try {
      const response = await meetings.get(meetingId);
      setMeeting(response.data);
      if (response.data.status === 'COMPLETED') {
        loadIntelligence();
        loadTranscript();
      }
    } catch (error) {
      console.error('Failed to load meeting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadIntelligence = async () => {
    try {
      const response = await meetings.getIntelligence(meetingId);
      setIntelligence(response.data);
    } catch (error) {
      console.error('Failed to load intelligence:', error);
    }
  };

  const loadTranscript = async () => {
    try {
      const response = await meetings.getTranscript(meetingId);
      setTranscript(response.data.segments || []);
    } catch (error) {
      console.error('Failed to load transcript:', error);
    }
  };

  const handleAskQuestion = async () => {
    if (!chatInput.trim() || isAsking) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      created_at: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    const question = chatInput;
    setChatInput('');
    setIsAsking(true);

    try {
      const response = await ai.chat(meetingId, question, conversationId);
      const data = response.data;
      setConversationId(data.conversation_id);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        created_at: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to ask question:', error);
    } finally {
      setIsAsking(false);
    }
  };

  const handleGenerateFollowUp = async () => {
    try {
      const response = await ai.generateFollowUp(meetingId);
      setFollowUpContent(response.data.content);
    } catch (error) {
      console.error('Failed to generate follow-up:', error);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!meeting) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <h1 className="text-heading-2 text-neutral-dark">Meeting not found</h1>
          <Link href="/meetings">
            <Button className="mt-4">Back to Meetings</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-small text-neutral mb-2">
              <Link href="/meetings" className="hover:text-primary">Meetings</Link>
              <span>/</span>
              <span className="text-neutral-dark">{meeting.title}</span>
            </div>
            <h1 className="text-heading-2 text-neutral-dark">{meeting.title}</h1>
            <p className="text-body text-neutral mt-1">
              {new Date(meeting.meeting_date).toLocaleDateString()} · {Math.round(meeting.duration_seconds / 60)} min
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleGenerateFollowUp}>
              Generate Follow-Up
            </Button>
          </div>
        </div>

        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {(['overview', 'transcript', 'ask-ai'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-body font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral hover:text-neutral-dark'
              }`}
            >
              {tab === 'ask-ai' ? 'Ask AI' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <Card>
                <h3 className="text-body font-semibold text-neutral-dark mb-3">AI Summary</h3>
                <p className="text-body text-neutral leading-relaxed">
                  {intelligence?.summary?.detailed || intelligence?.summary?.short || 'No summary available yet.'}
                </p>
              </Card>
            </div>

            <div>
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-body font-semibold text-neutral-dark">Action Items</h3>
                  <span className="text-small text-neutral">{intelligence?.action_items?.length || 0}</span>
                </div>
                <div className="space-y-3">
                  {intelligence?.action_items?.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1 h-4 w-4 text-primary border-gray-300 rounded" />
                      <div className="flex-1">
                        <p className="text-body text-neutral-dark">{item.task}</p>
                        {item.owner && (
                          <p className="text-small text-neutral mt-1">Assigned to {item.owner}</p>
                        )}
                      </div>
                      {item.priority && (
                        <Badge variant={item.priority === 'HIGH' ? 'danger' : item.priority === 'MEDIUM' ? 'warning' : 'neutral'}>
                          {item.priority}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="col-span-2">
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-body font-semibold text-neutral-dark">Decisions</h3>
                  <span className="text-small text-neutral">{intelligence?.decisions?.length || 0}</span>
                </div>
                <div className="space-y-3">
                  {intelligence?.decisions?.map((decision) => (
                    <div key={decision.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-success rounded-full mt-2" />
                      <div className="flex-1">
                        <p className="text-body text-neutral-dark">{decision.text}</p>
                        {decision.source?.timestamp_seconds !== undefined && (
                          <p className="text-small text-neutral mt-1">
                            {Math.floor(decision.source.timestamp_seconds / 60)}:{(decision.source.timestamp_seconds % 60).toString().padStart(2, '0')}
                          </p>
                        )}
                      </div>
                      <Badge variant={decision.status === 'APPROVED' ? 'success' : decision.status === 'REJECTED' ? 'danger' : 'neutral'}>
                        {decision.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div>
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-body font-semibold text-neutral-dark">Risks</h3>
                  <span className="text-small text-neutral">{intelligence?.risks?.length || 0}</span>
                </div>
                <div className="space-y-3">
                  {intelligence?.risks?.map((risk) => (
                    <div key={risk.id} className="flex items-start gap-3">
                      <Badge variant={risk.severity === 'HIGH' ? 'danger' : risk.severity === 'MEDIUM' ? 'warning' : 'neutral'}>
                        {risk.severity}
                      </Badge>
                      <p className="text-body text-neutral-dark flex-1">{risk.content}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'transcript' && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-body font-semibold text-neutral-dark">Transcript</h3>
              <input
                type="text"
                placeholder="Search transcript..."
                className="input-field w-64"
              />
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {transcript.length === 0 ? (
                <p className="text-body text-neutral text-center py-8">No transcript available</p>
              ) : (
                transcript.map((segment) => (
                  <div key={segment.id} className="flex gap-4">
                    <span className="text-small text-neutral w-16 flex-shrink-0">
                      {Math.floor(segment.start_seconds / 60)}:{(segment.start_seconds % 60).toString().padStart(2, '0')}
                    </span>
                    <div>
                      {segment.speaker && (
                        <p className="text-body font-medium text-neutral-dark">{segment.speaker.label}</p>
                      )}
                      <p className="text-body text-neutral">{segment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {activeTab === 'ask-ai' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <Card className="h-[600px] flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <h3 className="text-body font-medium text-neutral-dark mb-1">Ask anything about this meeting</h3>
                      <p className="text-small text-neutral">Get answers grounded in your transcript</p>
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-4 rounded-xl ${
                            message.role === 'user'
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-neutral-dark'
                          }`}
                        >
                          <p className="text-body">{message.content}</p>
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-small text-neutral">Sources:</p>
                              {message.sources.map((source, idx) => (
                                <p key={idx} className="text-small text-neutral">
                                  {source.timestamp_seconds !== undefined &&
                                    `${Math.floor(source.timestamp_seconds / 60)}:${(source.timestamp_seconds % 60).toString().padStart(2, '0')} - `}
                                  {source.excerpt}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                    placeholder="Ask anything about this meeting..."
                    className="input-field flex-1"
                    disabled={isAsking}
                  />
                  <Button onClick={handleAskQuestion} isLoading={isAsking}>
                    Send
                  </Button>
                </div>
              </Card>
            </div>

            <div>
              <Card>
                <h3 className="text-body font-semibold text-neutral-dark mb-3">Suggested Questions</h3>
                <div className="space-y-2">
                  {[
                    'What decisions were made?',
                    'What are my action items?',
                    'What are the next steps?',
                    'What risks were discussed?',
                  ].map((question) => (
                    <button
                      key={question}
                      onClick={() => setChatInput(question)}
                      className="w-full text-left p-3 text-body text-neutral hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {followUpContent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-heading-3 text-neutral-dark">Follow-Up Email</h3>
                <button onClick={() => setFollowUpContent(null)} className="text-neutral hover:text-neutral-dark">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-body text-neutral-dark">{followUpContent}</pre>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" onClick={() => navigator.clipboard.writeText(followUpContent)}>
                  Copy
                </Button>
                <Button onClick={() => setFollowUpContent(null)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
