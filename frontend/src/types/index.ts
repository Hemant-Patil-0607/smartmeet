export type MeetingStatus = 'CREATED' | 'UPLOADED' | 'QUEUED' | 'TRANSCRIBING' | 'NORMALIZING' | 'ANALYZING' | 'INDEXING' | 'COMPLETED' | 'FAILED';

export type SourceType = 'AUDIO_UPLOAD' | 'TRANSCRIPT_UPLOAD' | 'TRANSCRIPT_PASTE';

export type DecisionStatus = 'APPROVED' | 'REJECTED' | 'DEFERRED' | 'PENDING' | 'CANCELLED';

export type ActionItemStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  workspace?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface MeetingStats {
  decisions: number;
  action_items: number;
  risks: number;
}

export interface Meeting {
  id: string;
  title: string;
  meeting_date: string;
  source_type: SourceType;
  status: MeetingStatus;
  duration_seconds: number;
  language?: string | null;
  participant_count: number;
  created_at: string;
  updated_at: string;
  stats?: MeetingStats;
}

export interface MeetingDetail extends Meeting {
  transcript_text?: string;
}

export interface Source {
  segment_ids: string[];
  timestamp_seconds?: number;
}

export interface Decision {
  id: string;
  text: string;
  status: DecisionStatus;
  confidence: number;
  source?: Source;
  user_modified: boolean;
}

export interface ActionItem {
  id: string;
  task: string;
  owner?: string;
  due_date?: string;
  priority?: Priority;
  status: ActionItemStatus;
  confidence: number;
  source?: Source;
  user_modified: boolean;
}

export interface Topic {
  id: string;
  name: string;
  description?: string;
}

export interface Risk {
  id: string;
  content: string;
  severity: RiskSeverity;
  source?: Source;
}

export interface Summary {
  short?: string;
  detailed?: string;
}

export interface Intelligence {
  summary: Summary;
  decisions: Decision[];
  action_items: ActionItem[];
  topics: Topic[];
  risks: Risk[];
}

export interface Speaker {
  id: string;
  label: string;
}

export interface TranscriptSegment {
  id: string;
  speaker?: Speaker;
  start_seconds: number;
  end_seconds?: number;
  text: string;
}

export interface Transcript {
  segments: TranscriptSegment[];
}

export interface ChatSource {
  segment_id?: string;
  timestamp_seconds?: number;
  excerpt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  created_at: string;
}

export interface FollowUp {
  content: string;
}

export interface ProcessingStatus {
  status: string;
  stage?: string;
  completed_steps: string[];
  current_step?: string;
  error?: string;
}

export interface Job {
  job_id: string;
  meeting_id: string;
  status: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    has_more?: boolean;
    next_cursor?: string;
  } | null;
}
