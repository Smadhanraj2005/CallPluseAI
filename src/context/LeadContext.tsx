import React, { createContext, useContext, useState, useEffect } from 'react';
import { Lead, LeadStatus, CallSummary, MissedCall, ActivityItem, CallRecording, SentimentAnalysis, AiCallStatement } from '../types';

export const SALES_REPRESENTATIVES = [
  'Alex Morgan',
  'Priya Sharma',
  'Rahul Verma',
  'Sarah Jenkins',
  'Vikram Patel',
  'Ravi Kumar',
];

interface LeadContextType {
  leads: Lead[];
  addLeads: (newLeads: Omit<Lead, 'id'>[]) => void;
  assignLead: (leadId: string, salesperson: string) => void;
  assignMultipleLeads: (leadIds: string[], salesperson: string) => void;
  updateLeadDisposition: (
    leadId: string,
    status: LeadStatus,
    notes: string,
    duration?: number,
    followUpDate?: string,
    aiSummary?: string,
    callStatement?: AiCallStatement
  ) => void;
  deleteLead: (leadId: string) => void;
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  currentLead: Lead | null;
  
  // Call Tracking & AI Summaries
  callSummaries: CallSummary[];
  lastCallSummary: CallSummary | null;
  saveCallSummary: (summary: Omit<CallSummary, 'id' | 'timestamp'>) => CallSummary;
  clearLastSummary: () => void;

  // Call Recordings & Consumer Sentiment Intelligence
  recordings: CallRecording[];
  selectedRecordingId: string | null;
  setSelectedRecordingId: (id: string | null) => void;
  currentRecording: CallRecording | null;
  addRecording: (recording: Omit<CallRecording, 'id' | 'recordedAt'>) => CallRecording;
  updateRecordingSentiment: (recordingId: string, sentiment: Partial<SentimentAnalysis>) => void;
  deleteRecording: (recordingId: string) => void;

  // Missed Calls
  missedCalls: MissedCall[];
  removeMissedCall: (missedCallId: string) => void;

  // Real-Time Manager Activity Feed
  activityFeed: ActivityItem[];
  logActivity: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
}

const DEFAULT_INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'Madhavan Swaminathan',
    phone: '+91 9361860781',
    company: 'Vortex Global Enterprise',
    status: 'Hot Lead',
    assignedTo: 'Alex Morgan',
    notes: 'Requested follow-up on Enterprise Tier pricing plan.',
    lastCallDate: 'Today, 10:30 AM',
    nextFollowUpDate: 'Tomorrow at 11:00 AM',
    aiSummary: 'Customer showed high interest in 25-user enterprise license. Asked for SLA specifications and billing schedule.',
  },
  {
    id: 'lead-2',
    name: 'Rajesh Sundaram',
    phone: '+91 8838398097',
    company: 'Apex Logistics & Tech',
    status: 'New',
    assignedTo: 'Alex Morgan',
    notes: 'Inbound demo request from website landing page.',
    lastCallDate: 'Yesterday',
    nextFollowUpDate: 'Today at 4:00 PM',
  },
  {
    id: 'lead-3',
    name: 'Ananya Rao',
    phone: '+91 9845012345',
    company: 'Zenith Cloud Systems',
    status: 'Call Back',
    assignedTo: 'Priya Sharma',
    notes: 'Busy in executive meeting, requested callback after 4 PM.',
    lastCallDate: 'Aug 19, 2026',
    nextFollowUpDate: 'Today at 4:30 PM',
  },
  {
    id: 'lead-4',
    name: 'Karthik Narayanan',
    phone: '+91 9444123890',
    company: 'Hyperion Retail Tech',
    status: 'New',
    assignedTo: 'Unassigned',
    notes: 'Downloaded product overview whitepaper.',
  },
  {
    id: 'lead-5',
    name: 'Deepa Krishnan',
    phone: '+91 9876543210',
    company: 'Nova Financial Labs',
    status: 'Interested',
    assignedTo: 'Rahul Verma',
    notes: 'Very interested in outbound CRM integration.',
    lastCallDate: 'Aug 18, 2026',
    nextFollowUpDate: 'Aug 22, 2026 at 2:00 PM',
    aiSummary: 'Productive pitch discussing CRM integration webhooks. Lead requested technical architecture doc.',
  },
  {
    id: 'lead-6',
    name: 'Suresh Menon',
    phone: '+91 9123456789',
    company: 'Starlight Energy Solutions',
    status: 'New',
    assignedTo: 'Unassigned',
    notes: 'Imported from trade show lead scanner.',
  },
  {
    id: 'lead-7',
    name: 'Meera Iyer',
    phone: '+91 9884019283',
    company: 'Quantum Dynamics',
    status: 'Interested',
    assignedTo: 'Alex Morgan',
    notes: 'Looking for 15 sales rep seats trial.',
    lastCallDate: 'Aug 17, 2026',
    nextFollowUpDate: 'Aug 23, 2026 at 10:00 AM',
  },
  {
    id: 'lead-8',
    name: 'Rohan Deshmukh',
    phone: '+91 9712398456',
    company: 'Aura Logistics India',
    status: 'New',
    assignedTo: 'Sarah Jenkins',
    notes: 'Lead submitted via webinar signup form.',
  },
];

const DEFAULT_MISSED_CALLS: MissedCall[] = [
  {
    id: 'missed-1',
    leadId: 'lead-1',
    name: 'Madhavan Swaminathan',
    phone: '+91 9361860781',
    company: 'Vortex Global Enterprise',
    timeAgo: '4 mins ago',
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    assignedTo: 'Alex Morgan',
  },
  {
    id: 'missed-2',
    leadId: 'lead-2',
    name: 'Rajesh Sundaram',
    phone: '+91 8838398097',
    company: 'Apex Logistics & Tech',
    timeAgo: '18 mins ago',
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    assignedTo: 'Alex Morgan',
  },
  {
    id: 'missed-3',
    leadId: 'lead-3',
    name: 'Ananya Rao',
    phone: '+91 9845012345',
    company: 'Zenith Cloud Systems',
    timeAgo: '42 mins ago',
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    assignedTo: 'Priya Sharma',
  },
];

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    repName: 'Ravi Kumar',
    action: 'is calling Lead #123 (Deepa Krishnan)',
    leadName: 'Deepa Krishnan',
    phone: '+91 9876543210',
    timestamp: 'Just now',
    type: 'calling',
  },
  {
    id: 'act-2',
    repName: 'Alex Morgan',
    action: 'is calling Madhavan Swaminathan (+91 9361860781)',
    leadName: 'Madhavan Swaminathan',
    phone: '+91 9361860781',
    timestamp: '2m ago',
    type: 'calling',
  },
  {
    id: 'act-3',
    repName: 'Priya Sharma',
    action: 'logged outcome: Call Back for Zenith Cloud',
    leadName: 'Ananya Rao',
    phone: '+91 9845012345',
    timestamp: '5m ago',
    type: 'disposition',
    status: 'Call Back',
  },
  {
    id: 'act-4',
    repName: 'Sarah Jenkins',
    action: 'logged outcome: Interested for Aura Logistics',
    leadName: 'Rohan Deshmukh',
    phone: '+91 9712398456',
    timestamp: '12m ago',
    type: 'disposition',
    status: 'Interested',
  },
  {
    id: 'act-5',
    repName: 'Vikram Patel',
    action: 'completed call with Lead #108 (Karthik Narayanan)',
    leadName: 'Karthik Narayanan',
    phone: '+91 9444123890',
    timestamp: '25m ago',
    type: 'disposition',
  },
];

export const DEFAULT_RECORDINGS: CallRecording[] = [
  {
    id: 'rec-1',
    leadId: 'lead-1',
    leadName: 'Madhavan Swaminathan',
    company: 'Vortex Global Enterprise',
    phone: '+91 9361860781',
    repName: 'Alex Morgan',
    duration: 222,
    audioDurationFormatted: '3m 42s',
    recordedAt: 'Today, 10:30 AM',
    status: 'Hot Lead',
    callStatement: {
      customerStatement: 'Customer said they are very interested in our 25-seat SDR rollout and requested an official pricing proposal and technical architecture deep dive.',
      interestLevel: 'High',
      keyPoints: [
        'Requested enterprise proposal for 25 SDR seats',
        'Manual dialing friction causing 15+ hours lost weekly',
        'Q3 modernization budget already approved'
      ],
      suggestedNextAction: 'Send enterprise proposal deck and schedule technical architecture call for tomorrow at 11:00 AM',
      languageStyle: 'English'
    },
    waveformPeaks: [18, 35, 50, 75, 90, 68, 42, 25, 60, 82, 95, 88, 62, 48, 72, 88, 98, 65, 45, 32, 68, 85, 52, 28, 74, 88, 92, 78, 48, 35, 64, 82, 96, 72, 42, 22],
    sentimentAnalysis: {
      overallSentiment: 'Positive',
      sentimentScore: 92,
      customerSatisfactionScore: 94,
      buyingIntentLevel: 'High',
      consumerTone: 'Highly Enthusiastic & Solution-Driven',
      consumerEmotions: [
        { emotion: 'Enthusiastic', percentage: 56, color: '#10b981' },
        { emotion: 'Curious', percentage: 28, color: '#3b82f6' },
        { emotion: 'Hesitant', percentage: 11, color: '#f59e0b' },
        { emotion: 'Frustrated', percentage: 5, color: '#ef4444' },
      ],
      keyBuyingSignals: [
        'Specifically requested enterprise proposal for 25 SDR seats by end of month',
        'Stated manual dialing friction is currently losing them 15+ hours per rep weekly',
        'Confirmed executive budget is already allocated for Q3 modernization',
      ],
      consumerPainPoints: [
        'Current CRM lacks real-time automated logging, causing severe data loss',
        'Sales reps spend over 50% of their working hours on manual clerical entry',
      ],
      customerObjections: [
        'Inquired whether dedicated webhook integration and SOC2 compliance are included in base tier',
      ],
      talkListenRatio: {
        repPercent: 38,
        consumerPercent: 62,
      },
      recommendedNextSteps: [
        'Send custom enterprise pricing schedule with 25-user volume tier by 2:00 PM',
        'Schedule technical architecture deep dive with Vortex IT leadership',
        'Prepare SOC2 compliance and SLA documentation package',
      ],
      executiveAiSummary: 'The consumer displayed exceptional purchasing readiness and positive sentiment throughout the call. They clearly articulated their operational pain points and requested a formal enterprise proposal immediately.',
      isAiPowered: true,
      analyzedAt: 'Today, 10:34 AM',
    },
    transcript: [
      {
        id: 't-1',
        timestamp: '0:04',
        speaker: 'Sales Rep',
        text: 'Hello Madhavan! Alex here from CallPulse following up on your enterprise sales inquiry.',
      },
      {
        id: 't-2',
        timestamp: '0:12',
        speaker: 'Consumer',
        text: 'Hi Alex, thanks for getting back to me so fast. Our sales leadership is currently looking to completely overhaul our outbound dialing workflow.',
        sentiment: 'Positive',
        sentimentScore: 88,
        emotion: 'Interested',
      },
      {
        id: 't-3',
        timestamp: '0:28',
        speaker: 'Sales Rep',
        text: 'Glad to hear that. What is the single biggest bottleneck your SDR team is facing with your current stack?',
      },
      {
        id: 't-4',
        timestamp: '0:36',
        speaker: 'Consumer',
        text: 'Honestly, it is manual dialing and slow post-call logging. Reps are spending nearly half their day typing notes instead of speaking with high-value prospects.',
        sentiment: 'Hesitant',
        sentimentScore: 62,
        emotion: 'Frustrated with current tool',
        isKeyMoment: true,
      },
      {
        id: 't-5',
        timestamp: '0:58',
        speaker: 'Sales Rep',
        text: 'That is exactly why we built CallPulse. With 1-click power dialing, automated voice-to-text notes, and instant Gemini AI summaries, reps save 2+ hours daily.',
      },
      {
        id: 't-6',
        timestamp: '1:16',
        speaker: 'Consumer',
        text: 'That sounds incredible. If we roll this out across our 25 sales reps, what does the implementation timeline look like?',
        sentiment: 'Enthusiastic',
        sentimentScore: 95,
        emotion: 'High Interest',
        isKeyMoment: true,
      },
      {
        id: 't-7',
        timestamp: '1:34',
        speaker: 'Sales Rep',
        text: 'We can have your entire 25-rep team fully provisioned and trained within 48 hours with zero workflow disruption.',
      },
      {
        id: 't-8',
        timestamp: '1:48',
        speaker: 'Consumer',
        text: 'Perfect! Please send over the formal enterprise contract and SLA sheet today. We have budget signed off for this quarter and want to move quickly.',
        sentiment: 'Enthusiastic',
        sentimentScore: 98,
        emotion: 'Ready to Buy',
        isKeyMoment: true,
      },
    ],
  },
  {
    id: 'rec-2',
    leadId: 'lead-2',
    leadName: 'Rajesh Sundaram',
    company: 'Apex Logistics & Tech',
    phone: '+91 8838398097',
    repName: 'Alex Morgan',
    duration: 145,
    audioDurationFormatted: '2m 25s',
    recordedAt: 'Yesterday, 3:15 PM',
    status: 'Interested',
    waveformPeaks: [12, 28, 40, 65, 80, 58, 38, 20, 50, 70, 85, 78, 55, 40, 65, 75, 85, 60, 40, 28, 58, 75, 48, 22, 65, 78, 82, 70, 42, 30, 55, 72, 85, 65, 38, 18],
    sentimentAnalysis: {
      overallSentiment: 'Positive',
      sentimentScore: 84,
      customerSatisfactionScore: 86,
      buyingIntentLevel: 'Moderate',
      consumerTone: 'Curious & Analytical',
      consumerEmotions: [
        { emotion: 'Curious', percentage: 48, color: '#3b82f6' },
        { emotion: 'Enthusiastic', percentage: 36, color: '#10b981' },
        { emotion: 'Hesitant', percentage: 16, color: '#f59e0b' },
      ],
      keyBuyingSignals: [
        'Expressed strong enthusiasm for automated missed call callback tray',
        'Liked the WebRTC HD network telemetry diagnostics',
      ],
      consumerPainPoints: [
        'Outbound reps frequently lose hot inbound callbacks when in the field',
      ],
      customerObjections: [
        'Wanted to compare with their existing telemarketing vendor agreement',
      ],
      talkListenRatio: {
        repPercent: 46,
        consumerPercent: 54,
      },
      recommendedNextSteps: [
        'Send competitor comparison matrix and ROI calculator',
        'Follow up today at 4:00 PM for scheduled feature demo',
      ],
      executiveAiSummary: 'Consumer is very receptive and keen on the missed callback automation. Follow-up demo scheduled for today.',
      isAiPowered: true,
      analyzedAt: 'Yesterday, 3:18 PM',
    },
    transcript: [
      {
        id: 't-21',
        timestamp: '0:05',
        speaker: 'Sales Rep',
        text: 'Hi Rajesh, Alex calling from CallPulse. Reaching out regarding your logistics team demo request.',
      },
      {
        id: 't-22',
        timestamp: '0:15',
        speaker: 'Consumer',
        text: 'Hi Alex! Yes, we have 8 field agents and they keep missing inbound callbacks from shipping coordinators.',
        sentiment: 'Hesitant',
        sentimentScore: 68,
        emotion: 'Pain point identified',
      },
      {
        id: 't-23',
        timestamp: '0:35',
        speaker: 'Sales Rep',
        text: 'Our dedicated Zero-Loss Callback Tray queues all missed calls with instant 1-click redialing on both desktop and mobile.',
      },
      {
        id: 't-24',
        timestamp: '0:52',
        speaker: 'Consumer',
        text: 'That sounds really promising. Can we schedule a 15-minute screen share demo to test with our sample phone numbers?',
        sentiment: 'Positive',
        sentimentScore: 88,
        emotion: 'Interested',
        isKeyMoment: true,
      },
    ],
  },
  {
    id: 'rec-3',
    leadId: 'lead-5',
    leadName: 'Deepa Krishnan',
    company: 'Nova Financial Labs',
    phone: '+91 9876543210',
    repName: 'Rahul Verma',
    duration: 190,
    audioDurationFormatted: '3m 10s',
    recordedAt: 'Aug 18, 2026',
    status: 'Interested',
    waveformPeaks: [15, 25, 45, 70, 85, 62, 40, 22, 55, 75, 90, 82, 60, 44, 70, 82, 90, 62, 42, 30, 62, 78, 50, 25, 68, 82, 88, 74, 45, 32, 58, 76, 88, 68, 40, 20],
    sentimentAnalysis: {
      overallSentiment: 'Positive',
      sentimentScore: 89,
      customerSatisfactionScore: 90,
      buyingIntentLevel: 'High',
      consumerTone: 'Detail-Oriented & Security Conscious',
      consumerEmotions: [
        { emotion: 'Curious', percentage: 42, color: '#3b82f6' },
        { emotion: 'Enthusiastic', percentage: 44, color: '#10b981' },
        { emotion: 'Hesitant', percentage: 14, color: '#f59e0b' },
      ],
      keyBuyingSignals: [
        'Confirmed interest in 15 sales rep seats trial',
        'Requested API documentation for webhook triggers',
      ],
      consumerPainPoints: [
        'High latency issues with their previous legacy SIP software',
      ],
      customerObjections: [
        'Required assurance on end-to-end SRTP encryption',
      ],
      talkListenRatio: {
        repPercent: 42,
        consumerPercent: 58,
      },
      recommendedNextSteps: [
        'Send financial compliance security sheet and API webhook guides',
        'Check in on Aug 22 at 2:00 PM as requested',
      ],
      executiveAiSummary: 'Excellent conversation with high interest from Nova Financial. Provided clear answers regarding encryption and CRM webhooks.',
      isAiPowered: true,
      analyzedAt: 'Aug 18, 2026, 2:40 PM',
    },
    transcript: [
      {
        id: 't-31',
        timestamp: '0:06',
        speaker: 'Sales Rep',
        text: 'Good afternoon Deepa, Rahul from CallPulse. How is your day going?',
      },
      {
        id: 't-32',
        timestamp: '0:14',
        speaker: 'Consumer',
        text: 'Good afternoon Rahul. We are evaluating dialers for our financial sales group and need strict security compliance.',
        sentiment: 'Neutral',
        sentimentScore: 72,
        emotion: 'Security Focus',
      },
      {
        id: 't-33',
        timestamp: '0:38',
        speaker: 'Sales Rep',
        text: 'All CallPulse audio streams utilize 256-bit SRTP encryption with zero local plain-text audio storage.',
      },
      {
        id: 't-34',
        timestamp: '0:55',
        speaker: 'Consumer',
        text: 'That is great. If that is validated in the compliance document, we are ready to pilot with 15 seats.',
        sentiment: 'Enthusiastic',
        sentimentScore: 92,
        emotion: 'Buying Signal',
        isKeyMoment: true,
      },
    ],
  },
];

const LeadContext = createContext<LeadContextType | undefined>(undefined);

const STORAGE_KEY_LEADS = 'sales_dialer_leads_v4';
const STORAGE_KEY_MISSED = 'sales_dialer_missed_v4';
const STORAGE_KEY_SUMMARIES = 'sales_dialer_summaries_v4';
const STORAGE_KEY_RECORDINGS = 'sales_dialer_recordings_v4';

export const LeadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LEADS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return DEFAULT_INITIAL_LEADS;
  });

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>('lead-1');

  const [missedCalls, setMissedCalls] = useState<MissedCall[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MISSED);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return DEFAULT_MISSED_CALLS;
  });

  const [callSummaries, setCallSummaries] = useState<CallSummary[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUMMARIES);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  const [recordings, setRecordings] = useState<CallRecording[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return DEFAULT_RECORDINGS;
  });

  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>('rec-1');
  const [lastCallSummary, setLastCallSummary] = useState<CallSummary | null>(null);

  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);

  // Sync with LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
    } catch {}
  }, [leads]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MISSED, JSON.stringify(missedCalls));
    } catch {}
  }, [missedCalls]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUMMARIES, JSON.stringify(callSummaries));
    } catch {}
  }, [callSummaries]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDINGS, JSON.stringify(recordings));
    } catch {}
  }, [recordings]);

  // Periodic simulated live activity for realism in Manager feed
  useEffect(() => {
    const reps = ['Ravi Kumar', 'Priya Sharma', 'Rahul Verma', 'Sarah Jenkins', 'Vikram Patel'];
    const actions = [
      { action: 'is calling Lead #104 (Suresh Menon)', lead: 'Suresh Menon', phone: '+91 9123456789', type: 'calling' as const },
      { action: 'logged outcome: Interested for Apex Logistics', lead: 'Rajesh Sundaram', phone: '+91 8838398097', type: 'disposition' as const, status: 'Interested' as LeadStatus },
      { action: 'is calling Lead #102 (Meera Iyer)', lead: 'Meera Iyer', phone: '+91 9884019283', type: 'calling' as const },
      { action: 'scheduled follow-up with Vortex Global', lead: 'Madhavan Swaminathan', phone: '+91 9361860781', type: 'disposition' as const, status: 'Hot Lead' as LeadStatus },
    ];

    let actionIdx = 0;
    const interval = setInterval(() => {
      const rep = reps[Math.floor(Math.random() * reps.length)];
      const act = actions[actionIdx % actions.length];
      actionIdx++;

      const newActivity: ActivityItem = {
        id: `act-${Date.now()}`,
        repName: rep,
        action: `${rep} ${act.action}`,
        leadName: act.lead,
        phone: act.phone,
        timestamp: 'Just now',
        type: act.type,
        status: act.status,
      };

      setActivityFeed((prev) => [newActivity, ...prev.slice(0, 14)]);
    }, 28000);

    return () => clearInterval(interval);
  }, []);

  const addLeads = (newLeadsData: Omit<Lead, 'id'>[]) => {
    const timestamp = Date.now();
    const created: Lead[] = newLeadsData.map((item, idx) => ({
      ...item,
      id: `lead-import-${timestamp}-${idx}`,
    }));
    setLeads((prev) => [...created, ...prev]);

    logActivity({
      repName: 'Manager',
      action: `uploaded ${newLeadsData.length} new leads to queue`,
      leadName: 'Lead Batch',
      phone: 'Multiple',
      type: 'assignment',
    });
  };

  const assignLead = (leadId: string, salesperson: string) => {
    const targetLead = leads.find((l) => l.id === leadId);
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, assignedTo: salesperson } : lead
      )
    );

    if (targetLead) {
      logActivity({
        repName: 'Manager',
        action: `assigned ${targetLead.name} to ${salesperson}`,
        leadName: targetLead.name,
        phone: targetLead.phone,
        type: 'assignment',
      });
    }
  };

  const assignMultipleLeads = (leadIds: string[], salesperson: string) => {
    setLeads((prev) =>
      prev.map((lead) =>
        leadIds.includes(lead.id) ? { ...lead, assignedTo: salesperson } : lead
      )
    );

    logActivity({
      repName: 'Manager',
      action: `assigned batch of ${leadIds.length} leads to ${salesperson}`,
      leadName: 'Batch Assignment',
      phone: 'Multiple',
      type: 'assignment',
    });
  };

  const updateLeadDisposition = (
    leadId: string,
    status: LeadStatus,
    notes: string,
    duration?: number,
    followUpDate?: string,
    aiSummary?: string,
    callStatement?: AiCallStatement
  ) => {
    const now = new Date();
    const formattedDate = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              status,
              notes: notes.trim() ? notes : lead.notes,
              lastCallDate: formattedDate,
              lastCallDuration: duration || lead.lastCallDuration,
              nextFollowUpDate: followUpDate || lead.nextFollowUpDate,
              aiSummary: aiSummary || lead.aiSummary,
              callStatement: callStatement || lead.callStatement,
            }
          : lead
      )
    );
  };

  const deleteLead = (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    if (selectedLeadId === leadId) {
      setSelectedLeadId(null);
    }
  };

  const saveCallSummary = (summaryData: Omit<CallSummary, 'id' | 'timestamp'>) => {
    const now = new Date();
    const formattedTimestamp = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newSummary: CallSummary = {
      ...summaryData,
      id: `summary-${Date.now()}`,
      timestamp: formattedTimestamp,
    };

    setCallSummaries((prev) => [newSummary, ...prev]);
    setLastCallSummary(newSummary);

    // Also log to Activity feed
    logActivity({
      repName: 'Alex Morgan',
      action: `completed call with ${newSummary.leadName} (${newSummary.phone}) - ${newSummary.outcome}`,
      leadName: newSummary.leadName,
      phone: newSummary.phone,
      type: 'disposition',
      status: newSummary.outcome,
    });

    return newSummary;
  };

  const clearLastSummary = () => {
    setLastCallSummary(null);
  };

  const addRecording = (recordingData: Omit<CallRecording, 'id' | 'recordedAt'>): CallRecording => {
    const now = new Date();
    const formattedRecordedAt = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newRecording: CallRecording = {
      ...recordingData,
      id: `rec-${Date.now()}`,
      recordedAt: formattedRecordedAt,
    };

    setRecordings((prev) => [newRecording, ...prev]);
    setSelectedRecordingId(newRecording.id);

    logActivity({
      repName: recordingData.repName || 'Alex Morgan',
      action: `recorded & analyzed call with ${recordingData.leadName} (${recordingData.sentimentAnalysis?.overallSentiment || 'Positive'} sentiment)`,
      leadName: recordingData.leadName,
      phone: recordingData.phone,
      type: 'recording',
      status: recordingData.status,
    });

    return newRecording;
  };

  const updateRecordingSentiment = (recordingId: string, sentiment: Partial<SentimentAnalysis>) => {
    setRecordings((prev) =>
      prev.map((rec) => {
        if (rec.id === recordingId) {
          return {
            ...rec,
            sentimentAnalysis: {
              ...rec.sentimentAnalysis,
              ...sentiment,
              analyzedAt: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            },
          };
        }
        return rec;
      })
    );
  };

  const deleteRecording = (recordingId: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== recordingId));
    if (selectedRecordingId === recordingId) {
      const remaining = recordings.filter((r) => r.id !== recordingId);
      setSelectedRecordingId(remaining[0]?.id || null);
    }
  };

  const removeMissedCall = (missedCallId: string) => {
    setMissedCalls((prev) => prev.filter((m) => m.id !== missedCallId));
  };

  const logActivity = (item: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    const newAct: ActivityItem = {
      ...item,
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: 'Just now',
    };
    setActivityFeed((prev) => [newAct, ...prev.slice(0, 19)]);
  };

  const currentLead = leads.find((l) => l.id === selectedLeadId) || leads[0] || null;
  const currentRecording = recordings.find((r) => r.id === selectedRecordingId) || recordings[0] || null;

  return (
    <LeadContext.Provider
      value={{
        leads,
        addLeads,
        assignLead,
        assignMultipleLeads,
        updateLeadDisposition,
        deleteLead,
        selectedLeadId,
        setSelectedLeadId,
        currentLead,
        callSummaries,
        lastCallSummary,
        saveCallSummary,
        clearLastSummary,
        recordings,
        selectedRecordingId,
        setSelectedRecordingId,
        currentRecording,
        addRecording,
        updateRecordingSentiment,
        deleteRecording,
        missedCalls,
        removeMissedCall,
        activityFeed,
        logActivity,
      }}
    >
      {children}
    </LeadContext.Provider>
  );
};

export const useLeads = () => {
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error('useLeads must be used within a LeadProvider');
  }
  return context;
};
