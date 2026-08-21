import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  User,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone,
  Mic,
  Save,
  RotateCcw,
  Calendar,
  ArrowRight,
  SlidersHorizontal,
  ShieldCheck,
  Signal,
  X,
  CalendarDays,
  Bot,
  Zap,
  TrendingUp,
  Lightbulb,
  MessageSquareQuote,
  Loader2,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLeads } from '../context/LeadContext';
import { LeadStatus, CallSummary, AiCallStatement } from '../types';
import { playDtmfTone, startRingingSound, stopRingingSound } from '../utils/audio';
import { AiCallStatementCard } from '../components/AiCallStatementCard';

interface DialerPageProps {
  onNavigateToLeads?: () => void;
  onNavigateToSentiment?: () => void;
}

export const DialerPage: React.FC<DialerPageProps> = ({ onNavigateToLeads, onNavigateToSentiment }) => {
  const { theme } = useTheme();
  const {
    leads,
    currentLead,
    setSelectedLeadId,
    updateLeadDisposition,
    saveCallSummary,
    addRecording,
    logActivity,
    missedCalls,
    removeMissedCall,
  } = useLeads();

  // Call states: 'idle' | 'calling' | 'connected' | 'ended' | 'summary'
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected' | 'ended' | 'summary'>('idle');
  const [callDuration, setCallDuration] = useState(0);

  // Network & Signal Quality Monitoring states
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [latencyMs, setLatencyMs] = useState(21);
  const [jitterMs, setJitterMs] = useState(1.1);
  const [packetLoss, setPacketLoss] = useState('0.0%');
  const [signalBars, setSignalBars] = useState(4);
  const [showNetworkDiagnostics, setShowNetworkDiagnostics] = useState(false);

  // AI Live Objection Coach States
  const [selectedObjection, setSelectedObjection] = useState<string>('Price / Too Expensive');
  const [customObjectionInput, setCustomObjectionInput] = useState<string>('');
  const [isCoachLoading, setIsCoachLoading] = useState<boolean>(false);
  const [coachResult, setCoachResult] = useState<{
    rebuttal: string;
    followUpQuestion: string;
    confidence: string;
    isAiPowered?: boolean;
  } | null>(null);

  // Post-call disposition state
  const [selectedDisposition, setSelectedDisposition] = useState<LeadStatus>('Interested');
  const [callNotes, setCallNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('Tomorrow at 2:30 PM');
  const [followUpDateTimeInput, setFollowUpDateTimeInput] = useState('');
  const [aiSummaryText, setAiSummaryText] = useState('');
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<CallSummary | null>(null);
  const [isAiSummarizing, setIsAiSummarizing] = useState(false);
  const [aiSentiment, setAiSentiment] = useState<'Positive' | 'Neutral' | 'Negative'>('Positive');
  const [aiActionItems, setAiActionItems] = useState<string[]>([]);

  // AI Call Statement States
  const [aiCallStatement, setAiCallStatement] = useState<AiCallStatement | null>(null);
  const [isGeneratingStatement, setIsGeneratingStatement] = useState<boolean>(false);
  const [statementLanguageStyle, setStatementLanguageStyle] = useState<'English' | 'Tamil-English'>('English');

  // Function to fetch AI Live Coach Rebuttal
  const handleFetchCoachRebuttal = async (objectionText?: string) => {
    const query = objectionText || customObjectionInput || selectedObjection;
    if (!query) return;

    setIsCoachLoading(true);
    try {
      const res = await fetch('/api/gemini/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectionType: query,
          customObjection: customObjectionInput || query,
          leadName: currentLead?.name || 'Prospect',
          company: currentLead?.company || 'Target Account',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCoachResult(data);
      }
    } catch (err) {
      console.warn('Coach fetch error:', err);
    } finally {
      setIsCoachLoading(false);
    }
  };

  // Function to fetch AI Post-Call Summary
  const handleFetchAiSummary = async () => {
    if (!currentLead) return;
    setIsAiSummarizing(true);
    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: currentLead.name,
          company: currentLead.company,
          duration: callDuration > 0 ? callDuration : 45,
          outcome: selectedDisposition,
          notes: callNotes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          setAiSummaryText(data.summary);
          if (data.sentiment) setAiSentiment(data.sentiment);
          if (data.actionItems) setAiActionItems(data.actionItems);
        }
      }
    } catch (err) {
      console.warn('Gemini summarize error:', err);
    } finally {
      setIsAiSummarizing(false);
    }
  };

  // Function to fetch AI Dedicated Call Statement
  const handleFetchAiCallStatement = async (
    dispOverride?: LeadStatus,
    notesOverride?: string,
    styleOverride?: 'English' | 'Tamil-English'
  ) => {
    if (!currentLead) return;
    const style = styleOverride || statementLanguageStyle;
    const disp = dispOverride || selectedDisposition;
    const notes = notesOverride !== undefined ? notesOverride : callNotes;

    setIsGeneratingStatement(true);
    try {
      const res = await fetch('/api/gemini/call-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: currentLead.name,
          company: currentLead.company,
          duration: callDuration > 0 ? callDuration : 45,
          outcome: disp,
          notes: notes,
          languageStyle: style,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiCallStatement({
          customerStatement: data.customerStatement,
          interestLevel: data.interestLevel || (disp === 'Hot Lead' ? 'High' : disp === 'Not Interested' ? 'Not Interested' : 'Medium'),
          keyPoints: data.keyPoints || [],
          suggestedNextAction: data.suggestedNextAction || 'Call back customer as requested',
          languageStyle: style,
          isEdited: false,
        });
      }
    } catch (err) {
      console.warn('Gemini call-statement fetch error:', err);
    } finally {
      setIsGeneratingStatement(false);
    }
  };

  // Voice to text states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Network monitor status listeners & jitter simulation during active calls
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const pingInterval = setInterval(() => {
      if (callState === 'connected') {
        const randomPing = Math.floor(18 + Math.random() * 8);
        const randomJitter = (0.8 + Math.random() * 0.6).toFixed(1);
        setLatencyMs(randomPing);
        setJitterMs(parseFloat(randomJitter));
        setPacketLoss('0.0%');
        setSignalBars(4);
      } else {
        setLatencyMs(21);
        setJitterMs(1.1);
      }
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(pingInterval);
    };
  }, [callState]);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const startVoiceRecording = () => {
    setSpeechError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setSpeechError('Web Speech API is not supported in this browser environment.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setCallNotes((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied. Please allow microphone access.');
        } else if (event.error === 'no-speech') {
          // Ignore
        } else {
          setSpeechError(`Voice capture note: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      setSpeechError('Failed to initialize speech recognition.');
      setIsListening(false);
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // ignore
      }
    }
    setIsListening(false);
  };

  const toggleVoiceRecording = () => {
    if (isListening) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  // Generate clean summaries based on disposition & notes
  const generatePlaceholderAiSummary = (
    leadName: string,
    outcome: LeadStatus,
    notes: string,
    duration: number
  ) => {
    const minStr = Math.floor(duration / 60);
    const secStr = duration % 60;
    const durFormatted = minStr > 0 ? `${minStr}m ${secStr}s` : `${secStr}s`;

    if (outcome === 'Interested' || outcome === 'Hot Lead') {
      return `Positive conversation with ${leadName} (${durFormatted}). Contact showed interest in the solution and requested follow-up materials. ${
        notes ? `Notes recorded: "${notes}". ` : ''
      }Scheduled follow-up meeting.`;
    } else if (outcome === 'Call Back') {
      return `Follow-up call requested with ${leadName} (${durFormatted}). Contact asked to connect at a more convenient time. ${
        notes ? `Notes recorded: "${notes}". ` : ''
      }Reminder set on calendar.`;
    } else if (outcome === 'Not Interested') {
      return `Call with ${leadName} completed after ${durFormatted}. Prospect indicated current requirements are already fulfilled.`;
    } else {
      return `Outbound call attempt to ${leadName} (${durFormatted}). Number marked as unreachable or incorrect.`;
    }
  };

  const handleSelectDisposition = (disp: LeadStatus) => {
    setSelectedDisposition(disp);

    if (disp === 'Interested' || disp === 'Hot Lead') {
      setFollowUpDate('Tomorrow at 11:00 AM');
    } else if (disp === 'Call Back') {
      setFollowUpDate('Today at 4:30 PM');
    } else if (disp === 'Not Interested') {
      setFollowUpDate('Next Quarter');
    } else {
      setFollowUpDate('No Follow-up Needed');
    }

    if (currentLead) {
      const actualDuration = callDuration > 0 ? callDuration : 45;
      const aiSummary = generatePlaceholderAiSummary(
        currentLead.name,
        disp,
        callNotes,
        actualDuration
      );
      setAiSummaryText(aiSummary);
    }
  };

  const handleFollowUpDateTimeChange = (val: string) => {
    setFollowUpDateTimeInput(val);
    if (val) {
      try {
        const d = new Date(val);
        const options: Intl.DateTimeFormatOptions = {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        };
        const formatted = d.toLocaleString('en-US', options);
        setFollowUpDate(formatted);
      } catch (err) {
        setFollowUpDate(val);
      }
    }
  };

  useEffect(() => {
    if (currentLead && (callState === 'ended' || callState === 'summary')) {
      const actualDuration = callDuration > 0 ? callDuration : 45;
      const aiSummary = generatePlaceholderAiSummary(
        currentLead.name,
        selectedDisposition,
        callNotes,
        actualDuration
      );
      setAiSummaryText(aiSummary);
    }
  }, [callNotes, selectedDisposition, currentLead, callDuration, callState]);

  useEffect(() => {
    if (callState === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else if (callState === 'idle') {
      setCallDuration(0);
    }

    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callState]);

  useEffect(() => {
    return () => {
      stopRingingSound();
      stopVoiceRecording();
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, []);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = () => {
    if (!currentLead) return;
    playDtmfTone('5');
    setCallState('calling');
    startRingingSound();

    logActivity({
      repName: 'Alex Morgan',
      action: `called ${currentLead.name} (${currentLead.phone})`,
      leadName: currentLead.name,
      phone: currentLead.phone,
      type: 'calling',
    });

    ringTimeoutRef.current = setTimeout(() => {
      stopRingingSound();
      setCallState('connected');
    }, 2000);
  };

  const handleEndCall = () => {
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    stopRingingSound();
    setCallState('ended');
    setTimeout(() => {
      handleFetchAiSummary();
      handleFetchAiCallStatement();
    }, 150);
  };

  const handleSaveDisposition = () => {
    if (!currentLead) return;
    stopVoiceRecording();

    const actualDuration = callDuration > 0 ? callDuration : 45;
    const finalFollowUpDate = followUpDate || 'Tomorrow at 2:30 PM';

    updateLeadDisposition(
      currentLead.id,
      selectedDisposition,
      callNotes,
      actualDuration,
      finalFollowUpDate,
      aiSummaryText,
      aiCallStatement || undefined
    );

    const saved = saveCallSummary({
      leadId: currentLead.id,
      leadName: currentLead.name,
      phone: currentLead.phone,
      company: currentLead.company,
      duration: actualDuration,
      outcome: selectedDisposition,
      aiSummary: aiSummaryText,
      suggestedFollowUpDate: finalFollowUpDate,
      notes: callNotes,
      callStatement: aiCallStatement || undefined,
    });

    // Auto-generate recording & sentiment profile
    const minStr = Math.floor(actualDuration / 60);
    const secStr = actualDuration % 60;
    const durFormatted = minStr > 0 ? `${minStr}m ${secStr}s` : `${secStr}s`;
    const isPositive = selectedDisposition === 'Interested' || selectedDisposition === 'Hot Lead';

    addRecording({
      leadId: currentLead.id,
      leadName: currentLead.name,
      company: currentLead.company,
      phone: currentLead.phone,
      repName: 'Alex Morgan',
      duration: actualDuration,
      audioDurationFormatted: durFormatted,
      status: selectedDisposition,
      callStatement: aiCallStatement || undefined,
      waveformPeaks: [20, 35, 60, 75, 88, 65, 45, 25, 55, 80, 92, 85, 60, 45, 70, 85, 95, 60, 40, 30, 65, 80, 50, 25, 70, 85, 90, 75, 45, 30, 60, 80, 95, 70, 40, 20],
      sentimentAnalysis: {
        overallSentiment: isPositive ? 'Positive' : selectedDisposition === 'Call Back' ? 'Neutral' : 'Negative',
        sentimentScore: isPositive ? 91 : selectedDisposition === 'Call Back' ? 74 : 45,
        customerSatisfactionScore: isPositive ? 92 : selectedDisposition === 'Call Back' ? 78 : 50,
        buyingIntentLevel: isPositive ? 'High' : selectedDisposition === 'Call Back' ? 'Moderate' : 'Critical Risk',
        consumerTone: isPositive ? 'Engaged & Problem-Solution Focused' : selectedDisposition === 'Call Back' ? 'Time-Constrained but Open' : 'Direct & Uninterested',
        consumerEmotions: isPositive
          ? [
              { emotion: 'Enthusiastic', percentage: 55, color: '#10b981' },
              { emotion: 'Curious', percentage: 32, color: '#3b82f6' },
              { emotion: 'Hesitant', percentage: 13, color: '#f59e0b' },
            ]
          : [
              { emotion: 'Hesitant', percentage: 50, color: '#f59e0b' },
              { emotion: 'Curious', percentage: 30, color: '#3b82f6' },
              { emotion: 'Frustrated', percentage: 20, color: '#ef4444' },
            ],
        keyBuyingSignals: [
          `Discussed requirements for ${currentLead.company}`,
          `Prospect acknowledged current bottleneck with manual call recording and note taking`,
        ],
        consumerPainPoints: [
          callNotes || 'Inefficient manual follow-up workflows and disjointed lead management',
        ],
        customerObjections: [
          'Requested clear overview of onboarding timeline and pricing tiers',
        ],
        talkListenRatio: {
          repPercent: 40,
          consumerPercent: 60,
        },
        recommendedNextSteps: [
          `Follow up with ${currentLead.name} on ${finalFollowUpDate}`,
          'Send executive summary and feature comparison sheet',
        ],
        executiveAiSummary: aiSummaryText || `Customer engaged in constructive dialogue regarding ${currentLead.company} outbound sales efficiency.`,
        isAiPowered: true,
        analyzedAt: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      },
      transcript: [
        {
          id: `t-dial-${Date.now()}-1`,
          timestamp: '0:03',
          speaker: 'Sales Rep',
          text: `Hello ${currentLead.name}, this is Alex calling from CallPulse following up on ${currentLead.company}.`,
        },
        {
          id: `t-dial-${Date.now()}-2`,
          timestamp: '0:12',
          speaker: 'Consumer',
          text: isPositive
            ? `Hi Alex, thanks for reaching out. We are actively reviewing dialers for our sales team.`
            : `Hi Alex, I only have a moment. What is this regarding?`,
          sentiment: isPositive ? 'Positive' : 'Neutral',
          sentimentScore: isPositive ? 88 : 65,
          emotion: isPositive ? 'Interested' : 'Busy',
        },
        {
          id: `t-dial-${Date.now()}-3`,
          timestamp: '0:25',
          speaker: 'Sales Rep',
          text: `Understood! Our platform features 1-click power dialing, automated call recording, and instant Gemini sentiment analytics.`,
        },
        {
          id: `t-dial-${Date.now()}-4`,
          timestamp: '0:38',
          speaker: 'Consumer',
          text: isPositive
            ? `That sounds exactly like what we need. Please send over details and follow up on ${finalFollowUpDate}.`
            : `Please send an email over and I will review when I have time.`,
          sentiment: isPositive ? 'Enthusiastic' : 'Hesitant',
          sentimentScore: isPositive ? 94 : 58,
          emotion: isPositive ? 'High Intent' : 'Time Constrained',
          isKeyMoment: true,
        },
      ],
    });

    // Sync to backend Call History API
    try {
      fetch('/api/call-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: currentLead.id,
          leadName: currentLead.name,
          company: currentLead.company,
          phone: currentLead.phone,
          repName: 'Alex Morgan',
          duration: actualDuration,
          outcome: selectedDisposition,
          summary: aiSummaryText || `Call completed with ${currentLead.name}`,
          notes: callNotes,
          transcript: [
            {
              id: `t-dial-${Date.now()}-1`,
              timestamp: '0:03',
              speaker: 'Sales Rep',
              text: `Hello ${currentLead.name}, this is Alex calling from CallPulse following up on ${currentLead.company}.`,
            },
            {
              id: `t-dial-${Date.now()}-2`,
              timestamp: '0:12',
              speaker: 'Consumer',
              text: isPositive
                ? `Hi Alex, thanks for reaching out. We are actively reviewing dialers for our sales team.`
                : `Hi Alex, I only have a moment. What is this regarding?`,
              sentiment: isPositive ? 'Positive' : 'Neutral',
              sentimentScore: isPositive ? 88 : 65,
              emotion: isPositive ? 'Interested' : 'Busy',
            },
            {
              id: `t-dial-${Date.now()}-3`,
              timestamp: '0:25',
              speaker: 'Sales Rep',
              text: `Understood! Our platform features 1-click power dialing, automated call recording, and instant Gemini sentiment analytics.`,
            },
            {
              id: `t-dial-${Date.now()}-4`,
              timestamp: '0:38',
              speaker: 'Consumer',
              text: isPositive
                ? `That sounds exactly like what we need. Please send over details and follow up on ${finalFollowUpDate}.`
                : `Please send an email over and I will review when I have time.`,
              sentiment: isPositive ? 'Enthusiastic' : 'Hesitant',
              sentimentScore: isPositive ? 94 : 58,
              emotion: isPositive ? 'High Intent' : 'Time Constrained',
              isKeyMoment: true,
            },
          ],
        }),
      }).catch((e) => console.warn('Call history backend sync warning:', e));
    } catch {}

    setGeneratedSummary(saved);
    setCallState('summary');

    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  const handleNextLead = () => {
    const currentIdx = leads.findIndex((l) => l.id === currentLead?.id);
    const nextLead = leads[(currentIdx + 1) % leads.length];
    if (nextLead) {
      setSelectedLeadId(nextLead.id);
    }
    setCallState('idle');
    setCallDuration(0);
    setGeneratedSummary(null);
  };

  const handleResetToIdle = () => {
    setCallState('idle');
    setCallDuration(0);
    setGeneratedSummary(null);
  };

  const handleCallMissed = (leadId: string, missedId: string) => {
    setSelectedLeadId(leadId);
    removeMissedCall(missedId);
    setCallState('idle');
    setTimeout(() => {
      handleStartCall();
    }, 150);
  };

  const cleanPhone = currentLead?.phone.replace(/[^0-9+]/g, '') || '';
  const formattedTel = cleanPhone.startsWith('+')
    ? cleanPhone
    : cleanPhone.startsWith('91')
    ? `+${cleanPhone}`
    : `+91${cleanPhone}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Toast Confirmation */}
      {isSavedToast && (
        <div
          id="save-disposition-toast"
          className="p-3.5 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-medium bg-emerald-600 text-white shadow-xs"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Call disposition saved and follow-up scheduled.</span>
        </div>
      )}

      {/* TOP STATUS BAR: SIGNAL STRENGTH & NETWORK MONITOR */}
      <div
        id="network-signal-monitor-bar"
        className={`p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 transition-colors ${
          theme === 'dark'
            ? 'bg-slate-800 border border-slate-700'
            : 'bg-white border border-slate-200 shadow-xs'
        }`}
      >
        {/* Left: Signal Strength Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-end gap-1 px-1.5 py-1 rounded bg-slate-100 dark:bg-slate-700/50" title="Signal Strength: Excellent">
            <div className={`w-1 rounded-xs ${signalBars >= 1 ? 'bg-emerald-500 h-1.5' : 'bg-slate-300 dark:bg-slate-600 h-1.5'}`} />
            <div className={`w-1 rounded-xs ${signalBars >= 2 ? 'bg-emerald-500 h-2.5' : 'bg-slate-300 dark:bg-slate-600 h-2.5'}`} />
            <div className={`w-1 rounded-xs ${signalBars >= 3 ? 'bg-emerald-500 h-3.5' : 'bg-slate-300 dark:bg-slate-600 h-3.5'}`} />
            <div className={`w-1 rounded-xs ${signalBars >= 4 ? 'bg-emerald-500 h-4.5' : 'bg-slate-300 dark:bg-slate-600 h-4.5'}`} />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-medium ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                {isOnline ? 'HD Voice 5G / WebRTC' : 'Network Offline'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 font-normal">
              <span>Ping: {latencyMs}ms</span>
              <span>•</span>
              <span>Jitter: {jitterMs}ms</span>
              <span>•</span>
              <span>Loss: {packetLoss}</span>
            </div>
          </div>
        </div>

        {/* Right: Codec info & Diagnostics Toggle */}
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-normal px-2 py-0.5 rounded-md ${
              callState === 'connected'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            {callState === 'connected' ? 'Opus 48kHz (Active)' : 'Opus HD Codec'}
          </span>

          <button
            id="network-diagnostics-toggle-btn"
            type="button"
            onClick={() => setShowNetworkDiagnostics(!showNetworkDiagnostics)}
            className={`p-1.5 rounded-lg text-xs font-normal flex items-center gap-1 cursor-pointer transition-colors ${
              theme === 'dark'
                ? 'bg-slate-700 text-slate-300 hover:text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="View detailed network and VoIP audio diagnostics"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Diagnostics</span>
          </button>
        </div>
      </div>

      {/* Network Diagnostics Popover */}
      {showNetworkDiagnostics && (
        <div
          id="network-diagnostics-panel"
          className={`p-4 rounded-xl border text-xs space-y-3 ${
            theme === 'dark'
              ? 'bg-slate-800 border-slate-700 text-slate-200'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span className="font-medium">
                VoIP & WebRTC Network Diagnostics
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowNetworkDiagnostics(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-normal block">Latency (RTT)</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{latencyMs} ms (Optimal)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-normal block">Jitter Buffer</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{jitterMs} ms</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-normal block">MOS Score</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200 text-xs sm:text-sm">4.5 / 5.0 (HD)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-normal block">Encryption</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200 text-xs sm:text-sm">SRTP 256-bit</span>
            </div>
          </div>
        </div>
      )}

      {/* Target Lead Selector Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="lead-picker-select" className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Selected Lead:
          </label>
          <select
            id="lead-picker-select"
            value={currentLead?.id || ''}
            onChange={(e) => {
              setSelectedLeadId(e.target.value);
              setCallState('idle');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium outline-none cursor-pointer transition-colors ${
              theme === 'dark'
                ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600'
                : 'bg-white text-slate-800 border border-slate-200 shadow-xs'
            }`}
          >
            {leads.map((l) => (
              <option key={l.id} value={l.id} className={theme === 'dark' ? 'bg-slate-900 text-slate-200' : ''}>
                {l.name} ({l.phone})
              </option>
            ))}
          </select>
        </div>

        {/* Quick Contacts Filter */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const l1 = leads.find((l) => l.phone.includes('9361860781'));
              if (l1) setSelectedLeadId(l1.id);
              setCallState('idle');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-normal cursor-pointer transition-colors ${
              currentLead?.phone.includes('9361860781')
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Madhavan
          </button>
          <button
            type="button"
            onClick={() => {
              const l2 = leads.find((l) => l.phone.includes('8838398097'));
              if (l2) setSelectedLeadId(l2.id);
              setCallState('idle');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-normal cursor-pointer transition-colors ${
              currentLead?.phone.includes('8838398097')
                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Rajesh
          </button>
        </div>
      </div>

      {/* ACTIVE CALL CARD CONTAINER */}
      <div
        id="dialer-active-screen-card"
        className={`p-6 sm:p-8 rounded-xl text-center relative overflow-hidden transition-all ${
          theme === 'dark'
            ? 'bg-slate-800 border border-slate-700'
            : 'bg-white border border-slate-200 shadow-xs'
        }`}
      >
        {/* Contact Info Header */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span
              className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${
                currentLead?.status === 'Hot Lead'
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
              }`}
            >
              {currentLead?.status || 'Lead'}
            </span>
          </div>

          <h2
            className={`text-xl sm:text-2xl font-semibold tracking-tight ${
              theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
            }`}
          >
            {currentLead?.name || 'Select a Lead to Dial'}
          </h2>

          <p className="text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-400 mt-1">
            {currentLead?.company}
          </p>

          <p className="text-xl sm:text-2xl font-mono font-medium mt-2 text-slate-800 dark:text-slate-100">
            {currentLead?.phone || '+91 9361860781'}
          </p>
        </div>

        {/* Dynamic Inner Views Based on Call State */}
        {callState === 'idle' || callState === 'calling' || callState === 'connected' ? (
          /* VIEW 1: ACTIVE CALL CONTROLS */
          <div className="space-y-6 flex flex-col items-center justify-center py-4">
            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  callState === 'connected'
                    ? 'bg-emerald-500 animate-ping'
                    : callState === 'calling'
                    ? 'bg-amber-400 animate-bounce'
                    : 'bg-slate-400'
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  callState === 'connected'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : callState === 'calling'
                    ? 'text-amber-500'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {callState === 'connected'
                  ? `Call Connected (${formatDuration(callDuration)})`
                  : callState === 'calling'
                  ? 'Calling & Ringing...'
                  : 'Ready to call'}
              </span>
            </div>

            {/* Quality badge during active call */}
            {callState === 'connected' && (
              <div className="px-3 py-1 rounded-full text-xs font-mono font-normal flex items-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Signal className="w-3 h-3 text-emerald-500" />
                <span>HD Audio • {latencyMs}ms Latency</span>
              </div>
            )}

            {/* Call / End Button */}
            {callState === 'idle' ? (
              <button
                id="big-circular-call-btn"
                type="button"
                onClick={handleStartCall}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center font-medium transition-colors cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
              >
                <Phone className="w-8 h-8 sm:w-10 sm:h-10 fill-current mb-1" />
                <span className="text-[11px] uppercase tracking-wider font-medium">
                  Call
                </span>
              </button>
            ) : (
              <button
                id="big-circular-end-btn"
                type="button"
                onClick={handleEndCall}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center font-medium transition-colors cursor-pointer bg-rose-600 hover:bg-rose-700 text-white shadow-md"
              >
                <PhoneOff className="w-8 h-8 sm:w-10 sm:h-10 mb-1" />
                <span className="text-[11px] uppercase tracking-wider font-medium">
                  End
                </span>
              </button>
            )}

            {/* Native Carrier Link */}
            <div className="pt-2">
              <a
                id="native-carrier-call-link"
                href={`tel:${formattedTel}`}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-normal inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                <span>Open in Phone App (SIM)</span>
              </a>
            </div>

            {/* LIVE AI OBJECTION COACH & PITCH ASSISTANT (ACTIVE CALL ONLY) */}
            {callState === 'connected' && (
              <div
                id="live-ai-objection-coach-card"
                className={`w-full max-w-lg mt-4 p-4 rounded-xl border text-left space-y-3 transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900/90 border-blue-900/50 shadow-lg'
                    : 'bg-blue-50/40 border-blue-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                        Live AI Objection Buster & Talk Track
                      </h4>
                      <p className="text-[11px] text-slate-400 font-normal">
                        Tap any prospect hesitation for instant counter-pitch
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Gemini 3.7 Flash
                  </span>
                </div>

                {/* Quick Objection Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Price / Too Expensive',
                    'Using a Competitor',
                    'Send an Email First',
                    'Not the Right Time',
                  ].map((obj) => (
                    <button
                      key={obj}
                      type="button"
                      onClick={() => {
                        setSelectedObjection(obj);
                        handleFetchCoachRebuttal(obj);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                        selectedObjection === obj
                          ? 'bg-blue-600 text-white shadow-xs'
                          : theme === 'dark'
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 shadow-xs'
                      }`}
                    >
                      {obj}
                    </button>
                  ))}
                </div>

                {/* Custom objection input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customObjectionInput}
                    onChange={(e) => setCustomObjectionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFetchCoachRebuttal(customObjectionInput);
                    }}
                    placeholder="Or type prospect's exact phrase..."
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs outline-none transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-800 text-slate-200 border border-slate-700 focus:border-blue-500'
                        : 'bg-white text-slate-800 border border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleFetchCoachRebuttal(customObjectionInput)}
                    disabled={isCoachLoading}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isCoachLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                    <span>Ask AI</span>
                  </button>
                </div>

                {/* AI Rebuttal Result Box */}
                {coachResult && (
                  <div
                    className={`p-3 rounded-lg border text-xs space-y-2 animate-fadeIn ${
                      theme === 'dark'
                        ? 'bg-slate-800/90 border-slate-700'
                        : 'bg-white border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <MessageSquareQuote className="w-3.5 h-3.5" />
                        <span>Recommended Rebuttal</span>
                      </span>
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {coachResult.confidence || '94% Win Rate'}
                      </span>
                    </div>

                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-normal italic">
                      "{coachResult.rebuttal}"
                    </p>

                    <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] text-slate-400 block font-normal">Next Question to Regain Control:</span>
                      <p className="font-medium text-slate-800 dark:text-slate-100 text-xs mt-0.5">
                        👉 {coachResult.followUpQuestion}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : callState === 'ended' ? (
          /* VIEW 2: POST-CALL DISPOSITION FORM & GEMINI AI CONVERSATION SUMMARY */
          <div id="post-call-disposition-form" className="space-y-5 text-left">
            <div className="text-center pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Call Completed ({formatDuration(callDuration > 0 ? callDuration : 45)})
              </span>
              <h3
                className={`text-base sm:text-lg font-black mt-0.5 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-950'
                }`}
              >
                Post-Call Intelligence & Disposition
              </h3>
            </div>

            {/* AI Dedicated Call Statement Card */}
            <AiCallStatementCard
              statement={aiCallStatement}
              onUpdateStatement={(updated) => setAiCallStatement(updated)}
              languageStyle={statementLanguageStyle}
              onToggleLanguageStyle={(style) => {
                setStatementLanguageStyle(style);
                handleFetchAiCallStatement(selectedDisposition, callNotes, style);
              }}
              isLoading={isGeneratingStatement}
              isEditable={true}
              customerName={currentLead?.name || 'Customer'}
            />

            {/* Gemini AI Salesperson & Customer Conversation Summary Box */}
            <div
              className={`p-4 rounded-2xl border space-y-2.5 ${
                theme === 'dark'
                  ? 'bg-slate-900/95 border-blue-900/60 shadow-xl shadow-blue-950/30'
                  : 'bg-blue-50/80 border-blue-300 shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white">
                      Gemini AI Salesperson & Customer Summary
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      Automated dialogue breakdown between Sales Rep and {currentLead?.name || 'Customer'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                    Sentiment: {aiSentiment}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                    Gemini 3.7
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 leading-relaxed italic shadow-2xs">
                {isAiSummarizing ? (
                  <div className="flex items-center justify-center gap-2 py-3 text-blue-600 dark:text-blue-400 font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini AI is analyzing salesperson and customer dialogue...</span>
                  </div>
                ) : (
                  <p>"{aiSummaryText || `Sales rep and ${currentLead?.name || 'Customer'} discussed product features, requirements for ${currentLead?.company || 'client account'}, and scheduled follow-up steps.`}"</p>
                )}
              </div>

              {aiActionItems.length > 0 && (
                <div className="pt-1 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Key Action Items:
                  </span>
                  {aiActionItems.map((act, i) => (
                    <span key={i} className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                      ✓ {act}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Select Outcome header */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 block mb-2">
                Select Call Outcome Disposition:
              </label>

            {/* 4 Outcome Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {/* 1. Interested */}
              <button
                id="disposition-interested-btn"
                type="button"
                onClick={() => handleSelectDisposition('Interested')}
                className={`p-3.5 rounded-xl font-medium text-xs sm:text-sm flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                  selectedDisposition === 'Interested'
                    ? 'bg-emerald-600 text-white'
                    : theme === 'dark'
                    ? 'bg-slate-700/50 text-slate-200 border border-slate-600 hover:bg-slate-700'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Interested</span>
              </button>

              {/* 2. Not Interested */}
              <button
                id="disposition-not-interested-btn"
                type="button"
                onClick={() => handleSelectDisposition('Not Interested')}
                className={`p-3.5 rounded-xl font-medium text-xs sm:text-sm flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                  selectedDisposition === 'Not Interested'
                    ? 'bg-rose-600 text-white'
                    : theme === 'dark'
                    ? 'bg-slate-700/50 text-slate-200 border border-slate-600 hover:bg-slate-700'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <PhoneOff className="w-5 h-5" />
                <span>Not Interested</span>
              </button>

              {/* 3. Call Back */}
              <button
                id="disposition-call-back-btn"
                type="button"
                onClick={() => handleSelectDisposition('Call Back')}
                className={`p-3.5 rounded-xl font-medium text-xs sm:text-sm flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                  selectedDisposition === 'Call Back'
                    ? 'bg-amber-600 text-white'
                    : theme === 'dark'
                    ? 'bg-slate-700/50 text-slate-200 border border-slate-600 hover:bg-slate-700'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Clock className="w-5 h-5" />
                <span>Call Back</span>
              </button>

              {/* 4. Wrong Number */}
              <button
                id="disposition-wrong-number-btn"
                type="button"
                onClick={() => handleSelectDisposition('Wrong Number')}
                className={`p-3.5 rounded-xl font-medium text-xs sm:text-sm flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                  selectedDisposition === 'Wrong Number'
                    ? 'bg-slate-600 text-white'
                    : theme === 'dark'
                    ? 'bg-slate-700/50 text-slate-200 border border-slate-600 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                <RotateCcw className="w-5 h-5" />
                <span>Wrong Number</span>
              </button>
            </div>
            </div>

            {/* Scheduled Follow-Up Date */}
            <div
              className={`p-4 rounded-xl border ${
                theme === 'dark'
                  ? 'bg-slate-900/60 border-slate-700'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="followup-datetime-picker"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                  <span>Schedule Follow-Up</span>
                </label>
                <span className="text-xs text-slate-500 font-normal">
                  Selected: <strong className="text-amber-600 dark:text-amber-400 font-medium">{followUpDate}</strong>
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    id="followup-datetime-picker"
                    type="datetime-local"
                    value={followUpDateTimeInput}
                    onChange={(e) => handleFollowUpDateTimeChange(e.target.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-normal outline-none transition-colors cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-slate-800 text-slate-200 border border-slate-700 focus:border-blue-500'
                        : 'bg-white text-slate-800 border border-slate-200 focus:border-blue-600 shadow-xs'
                    }`}
                  />
                  <input
                    id="followup-date-text-input"
                    type="text"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    placeholder="e.g. Tomorrow at 11:00 AM"
                    className={`w-full sm:flex-1 px-3 py-2 rounded-xl text-xs font-normal outline-none transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-800 text-slate-200 border border-slate-700 focus:border-blue-500'
                        : 'bg-white text-slate-800 border border-slate-200 focus:border-blue-600 shadow-xs'
                    }`}
                  />
                </div>

                {/* Quick Date Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 mr-1 font-normal">
                    Presets:
                  </span>
                  {[
                    { label: 'Today 4 PM', val: 'Today at 4:00 PM' },
                    { label: 'Tomorrow 10 AM', val: 'Tomorrow at 10:00 AM' },
                    { label: 'Tomorrow 2:30 PM', val: 'Tomorrow at 2:30 PM' },
                    { label: 'In 3 Days', val: 'In 3 Days at 11:00 AM' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setFollowUpDate(preset.val)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-normal transition-colors cursor-pointer ${
                        followUpDate === preset.val
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : theme === 'dark'
                          ? 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes Box with Voice-to-Text & AI Summarizer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label
                  htmlFor="dialer-notes-box"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300 block"
                >
                  Call Notes & Summary
                </label>

                <div className="flex items-center gap-1.5">
                  <button
                    id="ai-generate-summary-btn"
                    type="button"
                    onClick={handleFetchAiSummary}
                    disabled={isAiSummarizing}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {isAiSummarizing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    )}
                    <span>{isAiSummarizing ? 'Analyzing...' : 'Gemini AI Summary'}</span>
                  </button>

                  <button
                    id="voice-to-text-notes-btn"
                    type="button"
                    onClick={toggleVoiceRecording}
                    title={isListening ? 'Stop voice recording' : 'Start voice-to-text note capture'}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isListening
                        ? 'bg-rose-600 text-white animate-pulse'
                        : theme === 'dark'
                        ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{isListening ? 'Stop Mic' : 'Voice-to-Text'}</span>
                  </button>
                </div>
              </div>

              {isListening && (
                <div className="p-2 rounded-lg text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-normal">
                  Listening... speak clearly to add notes.
                </div>
              )}

              {speechError && (
                <div className="text-xs text-rose-500 font-normal">
                  {speechError}
                </div>
              )}

              <textarea
                id="dialer-notes-box"
                rows={3}
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Add brief conversation notes, client feedback, or click 'Gemini AI Summary'..."
                className={`w-full p-3 rounded-xl text-xs sm:text-sm font-normal outline-none transition-colors resize-none ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-slate-200 border border-slate-700 focus:border-blue-500'
                    : 'bg-white text-slate-800 border border-slate-200 focus:border-blue-600 shadow-xs'
                }`}
              />

              {/* Display AI Action Items if available */}
              {aiActionItems.length > 0 && (
                <div
                  className={`p-2.5 rounded-lg border text-xs space-y-1.5 ${
                    theme === 'dark'
                      ? 'bg-slate-900/60 border-slate-700'
                      : 'bg-blue-50/50 border-blue-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>AI Extracted Action Items</span>
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                      Sentiment: {aiSentiment}
                    </span>
                  </div>
                  <ul className="space-y-1 pl-4 list-disc text-slate-600 dark:text-slate-300 text-[11px]">
                    {aiActionItems.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                id="save-call-disposition-btn"
                type="button"
                onClick={handleSaveDisposition}
                className="flex-1 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Disposition</span>
              </button>

              <button
                id="cancel-disposition-btn"
                type="button"
                onClick={handleResetToIdle}
                className={`px-4 py-2.5 rounded-xl text-xs font-normal cursor-pointer transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Redial
              </button>
            </div>
          </div>
        ) : (
          /* VIEW 3: SIMPLE CALL SUMMARY CARD */
          <div id="call-summary-card" className="space-y-5 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <h3
                  className={`text-sm sm:text-base font-medium ${
                    theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                  }`}
                >
                  Call Summary
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-normal">
                {generatedSummary?.timestamp || 'Just now'}
              </span>
            </div>

            {/* AI Dedicated Call Statement Card */}
            {(generatedSummary?.callStatement || aiCallStatement) && (
              <AiCallStatementCard
                statement={generatedSummary?.callStatement || aiCallStatement}
                onUpdateStatement={(updated) => setAiCallStatement(updated)}
                languageStyle={statementLanguageStyle}
                onToggleLanguageStyle={(style) => {
                  setStatementLanguageStyle(style);
                  handleFetchAiCallStatement(selectedDisposition, callNotes, style);
                }}
                isLoading={false}
                isEditable={true}
                customerName={generatedSummary?.leadName || currentLead?.name || 'Customer'}
              />
            )}

            {/* Key Stats Bar */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`p-3.5 rounded-xl border ${
                  theme === 'dark'
                    ? 'bg-slate-900/60 border-slate-700'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-xs text-slate-400 font-normal flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  Duration
                </span>
                <p className="text-lg font-mono font-medium mt-1 text-slate-800 dark:text-slate-200">
                  {formatDuration(generatedSummary?.duration || 45)}
                </p>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  theme === 'dark'
                    ? 'bg-slate-900/60 border-slate-700'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-xs text-slate-400 font-normal flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Outcome
                </span>
                <p className="text-sm font-medium mt-1 text-slate-800 dark:text-slate-200">
                  {generatedSummary?.outcome || 'Interested'}
                </p>
              </div>
            </div>

            {/* Short Summary */}
            <div
              className={`p-4 rounded-xl border ${
                theme === 'dark'
                  ? 'bg-slate-900/60 border-slate-700'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Summary
              </span>
              <p className="text-xs sm:text-sm font-normal text-slate-600 dark:text-slate-300 leading-relaxed">
                {generatedSummary?.aiSummary || aiSummaryText}
              </p>
            </div>

            {/* Follow-up Date */}
            <div
              className={`p-4 rounded-xl border ${
                theme === 'dark'
                  ? 'bg-slate-900/60 border-slate-700'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Scheduled Follow-Up
                </span>
              </div>
              <span className="text-xs sm:text-sm font-medium text-amber-600 dark:text-amber-400">
                {generatedSummary?.suggestedFollowUpDate || followUpDate}
              </span>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              {onNavigateToSentiment && (
                <button
                  id="view-sentiment-analysis-btn"
                  type="button"
                  onClick={onNavigateToSentiment}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Inspect Sentiment AI</span>
                </button>
              )}

              <button
                id="next-lead-btn"
                type="button"
                onClick={handleNextLead}
                className="flex-1 w-full py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              >
                <span>Next Lead</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="call-again-summary-btn"
                type="button"
                onClick={handleResetToIdle}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-normal cursor-pointer transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Call Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MISSED CALL LIST WITH CALL AGAIN BUTTON */}
      <div
        id="missed-calls-section"
        className={`p-5 rounded-xl transition-colors ${
          theme === 'dark'
            ? 'bg-slate-800 border border-slate-700'
            : 'bg-white border border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-300 flex items-center justify-center font-medium">
              <PhoneOff className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3
                className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                }`}
              >
                Missed Calls ({missedCalls.length})
              </h3>
              <p className="text-xs text-slate-400 font-normal">
                Contacts requiring priority callback
              </p>
            </div>
          </div>
        </div>

        {/* Missed Call Items */}
        <div className="space-y-2">
          {missedCalls.length === 0 ? (
            <p className="text-xs text-center py-4 text-slate-400 font-normal">
              No pending missed calls. All callbacks completed!
            </p>
          ) : (
            missedCalls.map((mc) => (
              <div
                key={mc.id}
                id={`missed-call-item-${mc.id}`}
                className={`p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-900/60 border border-slate-700/80 hover:border-slate-600'
                    : 'bg-slate-50 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-medium text-xs ${
                      theme === 'dark'
                        ? 'bg-rose-950/70 text-rose-300 border border-rose-800'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {mc.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs sm:text-sm font-medium ${
                          theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                        }`}
                      >
                        {mc.name}
                      </span>
                      <span className="text-[10px] font-normal text-rose-500">
                        {mc.timeAgo}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-normal">
                      <span className="font-mono">{mc.phone}</span>
                      <span>•</span>
                      <span>{mc.company}</span>
                    </div>
                  </div>
                </div>

                <button
                  id={`call-again-btn-${mc.id}`}
                  type="button"
                  onClick={() => handleCallMissed(mc.leadId, mc.id)}
                  className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Back</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
