export interface Participant {
  id: number;
  name: string;
  email: string;
}

export interface TranscriptSegment {
  id: number;
  meeting_id: number;
  speaker: string;
  start_time: number;
  end_time: number;
  text: string;
}

export interface MeetingSummary {
  id: number;
  meeting_id: number;
  summary_text: string;
}

export interface Chapter {
  id: number;
  meeting_id: number;
  title: string;
  start_time: number;
  summary: string;
}

export interface ActionItem {
  id: number;
  meeting_id: number;
  text: string;
  is_completed: boolean;
  assigned_to?: string;
}

export interface Meeting {
  id: number;
  title: string;
  date: string;
  duration: number;
  audio_url?: string;
  participants: Participant[];
}

export interface MeetingDetail extends Meeting {
  transcript_segments: TranscriptSegment[];
  summary?: MeetingSummary;
  chapters: Chapter[];
  action_items: ActionItem[];
}
