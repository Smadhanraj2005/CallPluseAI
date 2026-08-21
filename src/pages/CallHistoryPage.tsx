import React, { useState, useEffect, useRef } from 'react';
import {
  History,
  Clock,
  Play,
  Pause,
  Volume2,
  Brain,
  Sparkles,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  User,
  Building2,
  Calendar,
  Layers,
  Eye,
  RefreshCw,
  Trash2,
  Sliders,
  ChevronRight,
  Maximize2,
  Minimize2,
  Filter,
  Search,
  Zap,
  ArrowUpRight,
  Check,
  Activity,
  Mic,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLeads } from '../context/LeadContext';
import { PageType, UserProfile, LeadStatus, AiCallStatement } from '../types';
import { AiCallStatementCard } from '../components/AiCallStatementCard';

interface CallHistoryPageProps {
  user: UserProfile | null;
  onNavigate: (page: PageType) => void;
}

interface CallHistoryRecord {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  phone: string;
  repName: string;
  duration: number; // in seconds
  durationFormatted: string; // e.g. "3m 42s"
  durationMinutes: number; // e.g. 3.7
  timestamp: string; // e.g. "Today, 10:30 AM"
  isoTimestamp: string;
  outcome: LeadStatus | string;
  summary: string;
  notes?: string;
  waveformPeaks: number[];
  transcript: Array<{
    id: string;
    timestamp: string;
    speaker: 'Sales Rep' | 'Consumer';
    text: string;
    sentiment?: 'Positive' | 'Neutral' | 'Negative' | 'Hesitant' | 'Enthusiastic';
    sentimentScore?: number;
    emotion?: string;
    isKeyMoment?: boolean;
  }>;
  sentimentAnalysis: {
    overallSentiment: 'Positive' | 'Neutral' | 'Negative' | 'Mixed';
    sentimentScore: number;
    customerSatisfactionScore: number;
    buyingIntentLevel: 'High' | 'Moderate' | 'Low' | 'Critical Risk';
    consumerTone: string;
    consumerEmotions: Array<{ emotion: string; percentage: number; color: string }>;
    keyBuyingSignals: string[];
    consumerPainPoints: string[];
    customerObjections: string[];
    talkListenRatio: { repPercent: number; consumerPercent: number };
    recommendedNextSteps: string[];
    executiveAiSummary: string;
    isAiPowered: boolean;
    analyzedAt: string;
  };
}

export const CallHistoryPage: React.FC<CallHistoryPageProps> = ({ user, onNavigate }) => {
  const { theme } = useTheme();
  const { leads, setSelectedLeadId } = useLeads();

  // Call history records from backend & context
  const [historyItems, setHistoryItems] = useState<CallHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backendConnected, setBackendConnected] = useState<boolean>(true);
  const [selectedRecord, setSelectedRecord] = useState<CallHistoryRecord | null>(null);

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'duration' | 'sentiment'>('newest');

  // 3D View Preferences
  const [view3DMode, setView3DMode] = useState<'perspective' | 'isometric' | 'deck' | 'flat'>('perspective');
  const [enable3DTilt, setEnable3DTilt] = useState<boolean>(true);
  const [is3DInspectorOpen, setIs3DInspectorOpen] = useState<boolean>(false);
  const [inspector3DView, setInspector3DView] = useState<'front' | 'angled' | 'isometric'>('angled');

  // Audio Playback Simulation State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);
  const [analysisToast, setAnalysisToast] = useState<string | null>(null);

  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch from backend /api/call-history
  const fetchBackendHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/call-history');
      if (res.ok) {
        const data = await res.json();
        if (data.history && Array.isArray(data.history)) {
          setHistoryItems(data.history);
          setBackendConnected(true);
          if (data.history.length > 0 && !selectedRecord) {
            setSelectedRecord(data.history[0]);
          }
        }
      } else {
        setBackendConnected(false);
      }
    } catch (err) {
      console.warn('Backend call history fetch error, using resilient store:', err);
      setBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendHistory();
  }, []);

  // Audio playback simulation loop
  useEffect(() => {
    if (isPlaying) {
      audioIntervalRef.current = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1 * playbackSpeed;
        });
      }, 300);
    } else {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  const handleOpen3DAnalysis = (record: CallHistoryRecord) => {
    setSelectedRecord(record);
    setIs3DInspectorOpen(true);
    setPlaybackProgress(0);
    setIsPlaying(false);
  };

  const handleReanalyzeWithAi = async () => {
    if (!selectedRecord) return;
    setIsAnalyzingAi(true);

    try {
      const res = await fetch('/api/call-history/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: selectedRecord.transcript,
          leadName: selectedRecord.leadName,
          company: selectedRecord.company,
          duration: selectedRecord.durationFormatted,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedRecord: CallHistoryRecord = {
          ...selectedRecord,
          sentimentAnalysis: {
            overallSentiment: data.overallSentiment || selectedRecord.sentimentAnalysis.overallSentiment,
            sentimentScore: data.sentimentScore ?? selectedRecord.sentimentAnalysis.sentimentScore,
            customerSatisfactionScore: data.customerSatisfactionScore ?? selectedRecord.sentimentAnalysis.customerSatisfactionScore,
            buyingIntentLevel: data.buyingIntentLevel || selectedRecord.sentimentAnalysis.buyingIntentLevel,
            consumerTone: data.consumerTone || selectedRecord.sentimentAnalysis.consumerTone,
            consumerEmotions: data.consumerEmotions || selectedRecord.sentimentAnalysis.consumerEmotions,
            keyBuyingSignals: data.keyBuyingSignals || selectedRecord.sentimentAnalysis.keyBuyingSignals,
            consumerPainPoints: data.consumerPainPoints || selectedRecord.sentimentAnalysis.consumerPainPoints,
            customerObjections: data.customerObjections || selectedRecord.sentimentAnalysis.customerObjections,
            talkListenRatio: data.talkListenRatio || selectedRecord.sentimentAnalysis.talkListenRatio,
            recommendedNextSteps: data.recommendedNextSteps || selectedRecord.sentimentAnalysis.recommendedNextSteps,
            executiveAiSummary: data.executiveAiSummary || selectedRecord.sentimentAnalysis.executiveAiSummary,
            isAiPowered: true,
            analyzedAt: new Date().toISOString(),
          },
        };

        setSelectedRecord(updatedRecord);
        setHistoryItems((prev) =>
          prev.map((item) => (item.id === updatedRecord.id ? updatedRecord : item))
        );
        setAnalysisToast('Gemini 3.7 Flash: 3D Sentiment Analysis re-calculated successfully!');
        setTimeout(() => setAnalysisToast(null), 3000);
      }
    } catch (err) {
      console.warn('Re-analysis error:', err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleDeleteRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/call-history/${id}`, { method: 'DELETE' });
    } catch {}

    setHistoryItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedRecord?.id === id) {
      setSelectedRecord(null);
      setIs3DInspectorOpen(false);
    }
  };

  // CSV Export Functions
  const downloadCallHistoryCSV = (recordsToExport: CallHistoryRecord[] = historyItems) => {
    if (recordsToExport.length === 0) {
      setAnalysisToast('No call records available to export.');
      setTimeout(() => setAnalysisToast(null), 3000);
      return;
    }

    // CSV Headers
    const headers = [
      'Call ID',
      'Contact Name',
      'Company',
      'Phone Number',
      'Sales Rep',
      'Date & Time',
      'Duration (Seconds)',
      'Duration (Formatted)',
      'Duration (Minutes)',
      'Call Outcome / Disposition',
      'Sentiment Level',
      'Sentiment Score (%)',
      'CSAT Score (%)',
      'Buying Intent',
      'Consumer Tone',
      'Spoken Conversation Turns',
      'Key Buying Signals',
      'Consumer Pain Points',
      'Executive Summary',
      'Full Transcript (Call Pesunathu)',
    ];

    // Helper to safely format CSV values
    const cleanCSVCell = (str: any) => {
      if (str === null || str === undefined) return '""';
      const cellText = String(str).replace(/"/g, '""');
      return `"${cellText}"`;
    };

    const rows = recordsToExport.map((rec) => {
      const transcriptText = rec.transcript
        .map((t) => `[${t.timestamp}] ${t.speaker}: ${t.text}`)
        .join(' | ');
      const keySignals = (rec.sentimentAnalysis?.keyBuyingSignals || []).join('; ');
      const painPoints = (rec.sentimentAnalysis?.consumerPainPoints || []).join('; ');

      return [
        cleanCSVCell(rec.id),
        cleanCSVCell(rec.leadName),
        cleanCSVCell(rec.company),
        cleanCSVCell(rec.phone),
        cleanCSVCell(rec.repName),
        cleanCSVCell(rec.timestamp),
        cleanCSVCell(rec.duration),
        cleanCSVCell(rec.durationFormatted),
        cleanCSVCell(rec.durationMinutes),
        cleanCSVCell(rec.outcome),
        cleanCSVCell(rec.sentimentAnalysis?.overallSentiment || 'Neutral'),
        cleanCSVCell(rec.sentimentAnalysis?.sentimentScore || 0),
        cleanCSVCell(rec.sentimentAnalysis?.customerSatisfactionScore || 0),
        cleanCSVCell(rec.sentimentAnalysis?.buyingIntentLevel || 'Moderate'),
        cleanCSVCell(rec.sentimentAnalysis?.consumerTone || 'Professional'),
        cleanCSVCell(rec.transcript?.length || 0),
        cleanCSVCell(keySignals),
        cleanCSVCell(painPoints),
        cleanCSVCell(rec.sentimentAnalysis?.executiveAiSummary || rec.summary),
        cleanCSVCell(transcriptText),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `callpulse_call_history_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setAnalysisToast(`Successfully exported ${recordsToExport.length} call records to CSV!`);
    setTimeout(() => setAnalysisToast(null), 3000);
  };

  const downloadSingleCallCSV = (rec: CallHistoryRecord) => {
    downloadCallHistoryCSV([rec]);
  };

  // Filtered & Sorted items
  const filteredItems = historyItems
    .filter((item) => {
      const matchesSearch =
        item.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone.includes(searchQuery) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'All' || item.outcome === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'duration') return b.duration - a.duration;
      if (sortBy === 'sentiment') return b.sentimentAnalysis.sentimentScore - a.sentimentAnalysis.sentimentScore;
      return new Date(b.isoTimestamp).getTime() - new Date(a.isoTimestamp).getTime();
    });

  // Calculate summary metrics
  const totalMinutes = historyItems.reduce((acc, item) => acc + item.durationMinutes, 0);
  const avgDurationMins = historyItems.length > 0 ? (totalMinutes / historyItems.length).toFixed(1) : '0.0';
  const avgSentiment =
    historyItems.length > 0
      ? Math.round(
          historyItems.reduce((acc, item) => acc + item.sentimentAnalysis.sentimentScore, 0) /
            historyItems.length
        )
      : 0;

  // Helper for 3D Card mouse tilt calculation
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enable3DTilt) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02) translateZ(10px)`;
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    if (view3DMode === 'isometric') {
      card.style.transform = 'perspective(1000px) rotateX(10deg) rotateY(-8deg) translateZ(0px)';
    } else if (view3DMode === 'deck') {
      card.style.transform = 'perspective(1000px) rotateX(6deg) rotateY(0deg) translateZ(5px)';
    } else {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translateZ(0px)';
    }
  };

  return (
    <div id="call-history-page" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {analysisToast && (
        <div className="fixed top-20 right-8 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white shadow-2xl flex items-center gap-2 border border-slate-700 animate-fadeIn text-xs font-medium">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>{analysisToast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 shadow-md relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              <History className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
              <span>Call History & AI Intelligence</span>
              <span className="text-[10px] uppercase font-extrabold tracking-widest px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 shadow-xs">
                AI Verified
              </span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
            Real-time call timestamps, spoken dialogue transcripts, call durations in minutes, and AI sentiment inspection.
          </p>
        </div>

        {/* Action Buttons: Export CSV */}
        <div className="flex items-center gap-2.5 flex-wrap z-10">
          {/* Export All CSV Button */}
          <button
            type="button"
            onClick={() => downloadCallHistoryCSV(filteredItems)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all cursor-pointer hover:scale-[1.02]"
            title="Download full Call History as a CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV ({filteredItems.length})</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                backendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{backendConnected ? 'Backend Connected' : 'Local Storage Mode'}</span>
          </div>
        </div>
      </div>

      {/* 3D Telemetry Summary Stats (Total Talk Time in Mins, Call Volume, CSAT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Calls Logged</span>
            <PhoneCall className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-950 dark:text-white">
            {historyItems.length}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Recorded in backend history</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Talk Duration</span>
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-slate-950 dark:text-white">
            {totalMinutes.toFixed(1)} <span className="text-sm font-bold text-slate-500">mins</span>
          </div>
          <div className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 font-semibold">
            Avg: {avgDurationMins} mins per call
          </div>
        </div>

        <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">AI Sentiment Score</span>
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-700 dark:text-purple-400">
            {avgSentiment}%
          </div>
          <div className="text-[11px] text-purple-700 dark:text-purple-400 mt-1 font-bold">
            High buyer conversion signal
          </div>
        </div>

        <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Spoken Audio Analysis</span>
            <Brain className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-950 dark:text-white">
            100%
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-bold">
            Gemini NLP transcription synced
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search contact, company, notes, or spoken words..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1">
            {['All', 'Hot Lead', 'Interested', 'Call Back'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer"
          >
            <option value="newest">Sort: Newest Time</option>
            <option value="duration">Sort: Longest Minutes</option>
            <option value="sentiment">Sort: Highest Sentiment</option>
          </select>
        </div>
      </div>

      {/* 3D Interactive Call History Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-500 space-y-3">
          <History className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-200">
            No Call History Records Found
          </h3>
          <p className="text-xs font-medium max-w-sm mx-auto text-slate-600 dark:text-slate-400">
            Place a call from the Sales Dialer or adjust your search filter to inspect 3D call telemetry.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('dialer')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Open Sales Dialer</span>
          </button>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          style={{ perspective: '1200px' }}
        >
          {filteredItems.map((record) => {
            const isSelected = selectedRecord?.id === record.id;
            const isHotLead = record.outcome === 'Hot Lead';
            const isInterested = record.outcome === 'Interested';
            const isCallBack = record.outcome === 'Call Back';

            const cardTransform =
              view3DMode === 'isometric'
                ? 'perspective(1000px) rotateX(10deg) rotateY(-8deg) translateZ(0px)'
                : view3DMode === 'deck'
                ? 'perspective(1000px) rotateX(6deg) rotateY(0deg) translateZ(5px)'
                : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';

            return (
              <div
                key={record.id}
                id={`call-card-${record.id}`}
                onClick={() => handleOpen3DAnalysis(record)}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
                className={`group relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                  theme === 'dark'
                    ? 'bg-slate-900/95 border-slate-800 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/20'
                    : 'bg-white border-slate-300 hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/20'
                }`}
                style={{
                  transform: cardTransform,
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.15s ease-out, box-shadow 0.2s ease, border-color 0.2s ease',
                }}
              >
                {/* 3D Specular Sheen Gradient Overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10"
                  style={{ transform: 'translateZ(1px)' }}
                />

                {/* Top Row: Time, Mins Badge & Outcome */}
                <div
                  className="flex items-start justify-between gap-2 mb-3"
                  style={{ transform: 'translateZ(20px)' }}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{record.timestamp}</span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Rep: <span className="text-slate-900 dark:text-slate-200">{record.repName}</span>
                    </div>
                  </div>

                  {/* 3D Extruded Duration Badge (Mins) */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black font-mono bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700 shadow-xs">
                      ⏱ {record.durationFormatted} ({record.durationMinutes} mins)
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isHotLead
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          : isInterested
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                          : isCallBack
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                      }`}
                    >
                      {record.outcome}
                    </span>
                  </div>
                </div>

                {/* Contact & Company Details */}
                <div className="space-y-1 mb-3" style={{ transform: 'translateZ(25px)' }}>
                  <h3 className="text-base font-black text-slate-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-between">
                    <span>{record.leadName}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 font-bold" />
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="text-slate-900 dark:text-slate-100 font-bold">{record.company}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">{record.phone}</span>
                  </div>
                </div>

                {/* Call Pesunathu (Spoken dialogue snippet & what was discussed) */}
                <div
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 space-y-1.5 mb-3.5"
                  style={{ transform: 'translateZ(15px)' }}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                    <MessageSquare className="w-3 h-3 text-purple-600" />
                    <span>Call Pesunathu (Spoken Dialogue)</span>
                  </div>
                  <p className="text-xs text-slate-900 dark:text-slate-100 font-medium line-clamp-2 italic leading-relaxed">
                    "{record.transcript[record.transcript.length - 1]?.text || record.summary}"
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 pt-0.5">
                    <span>{record.transcript.length} speech turns</span>
                    <span>•</span>
                    <span>Tone: <strong className="text-slate-900 dark:text-slate-200">{record.sentimentAnalysis.consumerTone}</strong></span>
                  </div>
                </div>

                {/* 3D Waveform Mini Visualizer Bars */}
                <div
                  className="space-y-1.5 mb-3.5"
                  style={{ transform: 'translateZ(20px)' }}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-700 dark:text-slate-300 font-bold">
                    <span>Audio Stream Track</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">
                      CSAT: {record.sentimentAnalysis.customerSatisfactionScore}%
                    </span>
                  </div>
                  <div className="flex items-end gap-0.5 h-6 w-full bg-slate-200 dark:bg-slate-800 p-1 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
                    {record.waveformPeaks.slice(0, 32).map((peak, idx) => (
                      <div
                        key={idx}
                        className="flex-1 rounded-xs transition-all duration-300"
                        style={{
                          height: `${Math.max(15, peak)}%`,
                          backgroundColor:
                            idx % 3 === 0
                              ? '#2563eb'
                              : idx % 3 === 1
                              ? '#9333ea'
                              : '#059669',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Bottom Row: Sentiment Score, CSV download & 3D Click Action */}
                <div
                  className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs"
                  style={{ transform: 'translateZ(30px)' }}
                >
                  <div className="flex items-center gap-1.5 font-black text-purple-700 dark:text-purple-400">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>{record.sentimentAnalysis.sentimentScore}% Sentiment</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Single Call CSV Export */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadSingleCallCSV(record);
                      }}
                      className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                      title="Download this Call Record as CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteRecord(record.id, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Call Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-xs font-extrabold text-blue-700 dark:text-blue-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>3D View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3D HOLOGRAPHIC CALL RECORD ANALYSIS INSPECTOR MODAL */}
      {is3DInspectorOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div
            className="relative w-full max-w-5xl my-auto rounded-3xl border border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden transition-all duration-300 flex flex-col max-h-[92vh]"
            style={{
              transform:
                inspector3DView === 'angled'
                  ? 'perspective(1200px) rotateX(4deg) rotateY(-2deg)'
                  : inspector3DView === 'isometric'
                  ? 'perspective(1200px) rotateX(8deg) rotateY(-6deg)'
                  : 'none',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/20">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {selectedRecord.leadName}
                    </h2>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {selectedRecord.company}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>⏱ {selectedRecord.durationFormatted} ({selectedRecord.durationMinutes} mins)</span>
                    <span>•</span>
                    <span>Time: {selectedRecord.timestamp}</span>
                    <span>•</span>
                    <span>Phone: {selectedRecord.phone}</span>
                  </div>
                </div>
              </div>

              {/* Inspector Angle View Controls & Close */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center p-1 rounded-xl bg-slate-200 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 text-xs">
                  <button
                    type="button"
                    onClick={() => setInspector3DView('front')}
                    className={`px-2 py-1 rounded-lg font-medium transition-all ${
                      inspector3DView === 'front' ? 'bg-white dark:bg-slate-800 shadow-xs text-blue-600 font-bold' : 'text-slate-500'
                    }`}
                  >
                    Front
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspector3DView('angled')}
                    className={`px-2 py-1 rounded-lg font-medium transition-all ${
                      inspector3DView === 'angled' ? 'bg-white dark:bg-slate-800 shadow-xs text-blue-600 font-bold' : 'text-slate-500'
                    }`}
                  >
                    3D Perspective
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspector3DView('isometric')}
                    className={`px-2 py-1 rounded-lg font-medium transition-all ${
                      inspector3DView === 'isometric' ? 'bg-white dark:bg-slate-800 shadow-xs text-blue-600 font-bold' : 'text-slate-500'
                    }`}
                  >
                    3D Studio
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => downloadSingleCallCSV(selectedRecord)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-colors"
                  title="Export this call as CSV spreadsheet"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleReanalyzeWithAi}
                  disabled={isAnalyzingAi}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingAi ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isAnalyzingAi ? 'Analyzing...' : 'AI Re-Scan'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIs3DInspectorOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body with 3D Depth Layers */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Top Layer: 3D Audio Visualizer Player */}
              <div className="p-4 sm:p-5 rounded-2xl border bg-slate-900 text-white border-slate-800 shadow-xl space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      3D High-Fidelity Audio Telemetry
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-emerald-400 font-semibold">
                      Talk: {selectedRecord.durationFormatted}
                    </span>
                    <span className="text-slate-500">|</span>
                    <span className="text-blue-400">
                      Ratio: {selectedRecord.sentimentAnalysis.talkListenRatio.repPercent}% Rep / {selectedRecord.sentimentAnalysis.talkListenRatio.consumerPercent}% Buyer
                    </span>
                  </div>
                </div>

                {/* Interactive 3D Audio Waveform Bars */}
                <div className="h-16 flex items-end gap-1 px-2 py-1 bg-slate-950/70 rounded-xl border border-slate-800/80 overflow-hidden">
                  {selectedRecord.waveformPeaks.map((peak, idx) => {
                    const isPlayed = (idx / selectedRecord.waveformPeaks.length) * 100 <= playbackProgress;
                    return (
                      <div
                        key={idx}
                        className="flex-1 rounded-sm transition-all duration-150"
                        style={{
                          height: `${Math.max(12, isPlaying ? peak * (0.8 + Math.random() * 0.4) : peak)}%`,
                          backgroundColor: isPlayed
                            ? '#38bdf8'
                            : idx % 2 === 0
                            ? '#6366f1'
                            : '#8b5cf6',
                          transform: isPlaying ? 'scaleY(1.05)' : 'scaleY(1)',
                        }}
                      />
                    );
                  })}
                </div>

                {/* Player Controls Bar */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 cursor-pointer transition-colors"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>

                    <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg text-xs font-mono text-slate-300">
                      {[1, 1.25, 1.5, 2].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => setPlaybackSpeed(spd)}
                          className={`px-1.5 py-0.5 rounded ${
                            playbackSpeed === spd ? 'bg-blue-600 text-white font-bold' : 'hover:text-white'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scrubber */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={playbackProgress}
                    onChange={(e) => setPlaybackProgress(Number(e.target.value))}
                    className="flex-1 accent-blue-500 cursor-pointer"
                  />

                  <span className="text-xs font-mono text-slate-400">
                    {Math.round(playbackProgress)}%
                  </span>
                </div>
              </div>

              {/* AI Dedicated Call Statement Card */}
              <AiCallStatementCard
                statement={
                  selectedRecord.callStatement || {
                    customerStatement: `Customer discussed requirements for ${selectedRecord.company} and requested next steps.`,
                    interestLevel:
                      selectedRecord.outcome === 'Hot Lead'
                        ? 'High'
                        : selectedRecord.outcome === 'Not Interested'
                        ? 'Not Interested'
                        : 'Medium',
                    keyPoints: [
                      `Discussed workflow with ${selectedRecord.leadName}`,
                      'Key buying signals captured during call',
                    ],
                    suggestedNextAction: 'Follow up as per scheduled date in CRM',
                    languageStyle: 'English',
                  }
                }
                onUpdateStatement={(updated) => {
                  setSelectedRecord({
                    ...selectedRecord,
                    callStatement: updated,
                  });
                }}
                isEditable={true}
                customerName={selectedRecord.leadName}
              />

              {/* Mid Layer: 2-Column Split (Left: Call Pesunathu Transcript | Right: 3D Sentiment Vectors) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Column Left (7 cols): Spoken Conversation / Transcript */}
                <div className="lg:col-span-7 p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-purple-600" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Call Pesunathu (Full Conversation Transcript)
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {selectedRecord.transcript.length} turns recorded
                    </span>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {selectedRecord.transcript.map((turn) => {
                      const isRep = turn.speaker === 'Sales Rep';
                      return (
                        <div
                          key={turn.id}
                          className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                            isRep
                              ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200/70 dark:border-blue-900/50 ml-4'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 mr-4'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isRep ? 'bg-blue-500' : 'bg-emerald-500'
                                }`}
                              />
                              {turn.speaker}
                            </span>
                            <div className="flex items-center gap-2 text-slate-400 font-mono">
                              {turn.emotion && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-semibold">
                                  {turn.emotion}
                                </span>
                              )}
                              <span>{turn.timestamp}</span>
                            </div>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {turn.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column Right (5 cols): Deep NLP Record Analysis */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Sentiment Metric Card */}
                  <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <Brain className="w-4 h-4 text-emerald-500" />
                        <span>Record Analysis Scores</span>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Intent: {selectedRecord.sentimentAnalysis.buyingIntentLevel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          {selectedRecord.sentimentAnalysis.sentimentScore}%
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          Sentiment Index
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                        <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                          {selectedRecord.sentimentAnalysis.customerSatisfactionScore}%
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          CSAT Rating
                        </div>
                      </div>
                    </div>

                    {/* Emotion Distribution Vector */}
                    <div className="space-y-2 pt-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Consumer Emotion Breakdown:
                      </span>
                      <div className="space-y-1.5 text-xs">
                        {selectedRecord.sentimentAnalysis.consumerEmotions.map((em) => (
                          <div key={em.emotion} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
                              <span>{em.emotion}</span>
                              <span className="font-mono">{em.percentage}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${em.percentage}%`,
                                  backgroundColor: em.color || '#3b82f6',
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Key Buying Signals & Next Steps */}
                  <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Key Buying Signals & Pain Points</span>
                    </span>

                    <div className="space-y-2 text-xs">
                      {selectedRecord.sentimentAnalysis.keyBuyingSignals.map((signal, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 flex items-start gap-2"
                        >
                          <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500 font-bold" />
                          <span>{signal}</span>
                        </div>
                      ))}

                      {selectedRecord.sentimentAnalysis.consumerPainPoints.map((point, pIdx) => (
                        <div
                          key={pIdx}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-start gap-2"
                        >
                          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Layer: Executive AI Summary & Next Action Items */}
              <div className="p-5 rounded-2xl border bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-900 dark:to-slate-800/80 border-blue-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Executive AI Call Summary</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {selectedRecord.sentimentAnalysis.executiveAiSummary || selectedRecord.summary}
                </p>
                <div className="pt-2 flex items-center gap-2 flex-wrap">
                  {selectedRecord.sentimentAnalysis.recommendedNextSteps.map((step, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>{step}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
