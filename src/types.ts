export type PageType = 'dashboard' | 'manager' | 'leads' | 'dialer' | 'history' | 'reports' | 'sentiment' | 'login';

export type ThemeMode = 'light' | 'dark';

export type LeadStatus = 'New' | 'Interested' | 'Not Interested' | 'Call Back' | 'Wrong Number' | 'Hot Lead';

export type InterestLevel = 'High' | 'Medium' | 'Low' | 'Not Interested';

export interface AiCallStatement {
  customerStatement: string;
  interestLevel: InterestLevel;
  keyPoints: string[];
  suggestedNextAction: string;
  languageStyle?: 'English' | 'Tamil-English';
  lastEditedAt?: string;
  isEdited?: boolean;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  company: string;
  status: LeadStatus;
  assignedTo: string;
  notes?: string;
  lastCallDate?: string;
  lastCallDuration?: number;
  nextFollowUpDate?: string;
  aiSummary?: string;
  callStatement?: AiCallStatement;
}

export interface TranscriptTurn {
  id: string;
  timestamp: string; // e.g. "0:14"
  speaker: 'Sales Rep' | 'Consumer';
  text: string;
  sentiment?: 'Positive' | 'Neutral' | 'Negative' | 'Hesitant' | 'Enthusiastic';
  sentimentScore?: number; // 0-100
  emotion?: string; // e.g. "Interested", "Skeptical", "Satisfied", "Concerned"
  isKeyMoment?: boolean;
}

export interface ConsumerEmotion {
  emotion: string;
  percentage: number;
  color: string;
}

export interface SentimentAnalysis {
  overallSentiment: 'Positive' | 'Neutral' | 'Negative' | 'Mixed';
  sentimentScore: number; // 0-100 score
  customerSatisfactionScore: number; // 0-100
  buyingIntentLevel: 'High' | 'Moderate' | 'Low' | 'Critical Risk';
  consumerTone: string; // e.g. "Engaged & Open to Evaluation"
  consumerEmotions: ConsumerEmotion[];
  keyBuyingSignals: string[];
  consumerPainPoints: string[];
  customerObjections: string[];
  talkListenRatio: {
    repPercent: number;
    consumerPercent: number;
  };
  recommendedNextSteps: string[];
  executiveAiSummary: string;
  isAiPowered: boolean;
  analyzedAt: string;
}

export interface CallRecording {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  phone: string;
  repName: string;
  duration: number; // in seconds
  recordedAt: string;
  audioDurationFormatted: string;
  audioUrl?: string; // Real or synthetic data
  waveformPeaks?: number[]; // Array of normalized audio heights 0-100
  status: LeadStatus;
  sentimentAnalysis: SentimentAnalysis;
  transcript: TranscriptTurn[];
  callStatement?: AiCallStatement;
}

export interface CallSummary {
  id: string;
  leadId: string;
  leadName: string;
  phone: string;
  company: string;
  duration: number;
  outcome: LeadStatus;
  aiSummary: string;
  suggestedFollowUpDate: string;
  timestamp: string;
  notes?: string;
  recordingId?: string;
  callStatement?: AiCallStatement;
}

export interface MissedCall {
  id: string;
  leadId: string;
  name: string;
  phone: string;
  company: string;
  timeAgo: string;
  timestamp: string;
  assignedTo: string;
}

export interface ActivityItem {
  id: string;
  repName: string;
  action: string;
  leadName: string;
  phone: string;
  timestamp: string;
  type: 'calling' | 'disposition' | 'assignment' | 'recording';
  status?: LeadStatus;
}

export interface UserProfile {
  name: string;
  email: string;
  role: 'Manager' | 'Sales Representative' | 'Admin';
  avatarUrl?: string;
}

export interface NavItem {
  id: PageType;
  label: string;
  iconName: string;
  badge?: string | number | null;
}

