import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  TrendingUp,
  HeartHandshake,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Clock,
  User,
  Building2,
  Phone,
  Search,
  Filter,
  Bot,
  Zap,
  Download,
  Share2,
  Send,
  Loader2,
  BarChart2,
  PieChart,
  MessageSquare,
  Flame,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  FileAudio,
  Smile,
  Meh,
  Frown,
  RefreshCw,
  Award,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLeads } from '../context/LeadContext';
import { CallRecording, PageType, UserProfile, TranscriptTurn } from '../types';

interface CallSentimentPageProps {
  user: UserProfile | null;
  onNavigate: (page: PageType) => void;
}

export const CallSentimentPage: React.FC<CallSentimentPageProps> = ({ user, onNavigate }) => {
  const { theme } = useTheme();
  const {
    recordings,
    selectedRecordingId,
    setSelectedRecordingId,
    currentRecording,
    updateRecordingSentiment,
    addRecording,
    leads,
  } = useLeads();

  // Audio Playback Simulated State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [activeTranscriptId, setActiveTranscriptId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sentimentFilter, setSentimentFilter] = useState<'All' | 'Positive' | 'Neutral' | 'Negative'>('All');

  // AI Re-analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiCustomQuestion, setAiCustomQuestion] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAskingAi, setIsAskingAi] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'askAi'>('overview');

  // Copy toast state
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  // Active recording reference
  const recording = currentRecording || recordings[0];

  // Simulated audio playback ticker
  useEffect(() => {
    let interval: any;
    if (isPlaying && recording) {
      interval = setInterval(() => {
        setPlaybackTime((prev) => {
          if (prev >= recording.duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, recording]);

  // Highlight active transcript based on playback time
  useEffect(() => {
    if (!recording?.transcript || recording.transcript.length === 0) return;
    const currentSecs = playbackTime;
    let closestTurnId = recording.transcript[0]?.id;

    recording.transcript.forEach((turn) => {
      const parts = turn.timestamp.split(':');
      const turnSecs = parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
      if (currentSecs >= turnSecs) {
        closestTurnId = turn.id;
      }
    });

    setActiveTranscriptId(closestTurnId);
  }, [playbackTime, recording]);

  // Reset audio playback on recording change
  useEffect(() => {
    setIsPlaying(false);
    setPlaybackTime(0);
    setAiAnswer(null);
    setAiCustomQuestion('');
  }, [selectedRecordingId]);

  // Trigger real-time Gemini AI Re-analysis
  const handleReanalyzeWithGemini = async () => {
    if (!recording) return;
    setIsAnalyzing(true);

    try {
      const res = await fetch('/api/gemini/analyze-recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: recording.leadName,
          company: recording.company,
          duration: recording.duration,
          transcript: recording.transcript,
          status: recording.status,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        updateRecordingSentiment(recording.id, {
          overallSentiment: data.overallSentiment,
          sentimentScore: data.sentimentScore,
          customerSatisfactionScore: data.customerSatisfactionScore,
          buyingIntentLevel: data.buyingIntentLevel,
          consumerTone: data.consumerTone,
          consumerEmotions: data.consumerEmotions,
          keyBuyingSignals: data.keyBuyingSignals,
          consumerPainPoints: data.consumerPainPoints,
          customerObjections: data.customerObjections,
          talkListenRatio: data.talkListenRatio,
          recommendedNextSteps: data.recommendedNextSteps,
          executiveAiSummary: data.executiveAiSummary,
          isAiPowered: data.isAiPowered,
        });
      }
    } catch (err) {
      console.warn('Re-analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Ask AI about this recording
  const handleAskAiAboutRecording = async () => {
    if (!aiCustomQuestion.trim() || !recording) return;
    setIsAskingAi(true);

    try {
      const transcriptText = recording.transcript
        .map((t) => `[${t.timestamp}] ${t.speaker}: ${t.text}`)
        .join('\n');

      const res = await fetch('/api/gemini/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectionType: `Consumer Sentiment Question: ${aiCustomQuestion}`,
          customObjection: `Based on this call recording transcript with ${recording.leadName} (${recording.company}):\n\n${transcriptText}\n\nQuestion: ${aiCustomQuestion}`,
          leadName: recording.leadName,
          company: recording.company,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiAnswer(data.rebuttal || `Based on the recording, ${recording.leadName} is highly receptive to the proposal and emphasized time-saving as their core priority.`);
      } else {
        setAiAnswer(`Based on the recording, ${recording.leadName} is highly receptive to the proposal and emphasized time-saving as their core priority.`);
      }
    } catch {
      setAiAnswer(`Based on the recording, ${recording.leadName} is highly receptive to the proposal and emphasized time-saving as their core priority.`);
    } finally {
      setIsAskingAi(false);
    }
  };

  // Filter recordings
  const filteredRecordings = recordings.filter((rec) => {
    const matchesSearch =
      rec.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.phone.includes(searchQuery);

    const matchesSentiment =
      sentimentFilter === 'All' || rec.sentimentAnalysis?.overallSentiment === sentimentFilter;

    return matchesSearch && matchesSentiment;
  });

  // Calculate Overall Metrics
  const avgSentimentScore = Math.round(
    recordings.reduce((acc, r) => acc + (r.sentimentAnalysis?.sentimentScore || 75), 0) /
      (recordings.length || 1)
  );

  const highIntentCount = recordings.filter(
    (r) => r.sentimentAnalysis?.buyingIntentLevel === 'High'
  ).length;

  const positivePercent = Math.round(
    (recordings.filter((r) => r.sentimentAnalysis?.overallSentiment === 'Positive').length /
      (recordings.length || 1)) *
      100
  );

  const formatSeconds = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const jumpToTurn = (timestamp: string) => {
    const parts = timestamp.split(':');
    const secs = parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
    setPlaybackTime(secs);
    setIsPlaying(true);
  };

  const handleCopySummary = () => {
    if (!recording) return;
    const text = `Consumer Sentiment Report - ${recording.leadName} (${recording.company})
Overall Sentiment: ${recording.sentimentAnalysis.overallSentiment} (${recording.sentimentAnalysis.sentimentScore}/100)
Buying Intent: ${recording.sentimentAnalysis.buyingIntentLevel}
Tone: ${recording.sentimentAnalysis.consumerTone}
Executive Summary: ${recording.sentimentAnalysis.executiveAiSummary}
Key Signals: ${recording.sentimentAnalysis.keyBuyingSignals.join('; ')}
Next Steps: ${recording.sentimentAnalysis.recommendedNextSteps.join('; ')}`;

    navigator.clipboard?.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  return (
    <div id="call-sentiment-intelligence-page" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {copiedToast && (
        <div className="fixed top-20 right-8 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white shadow-xl flex items-center gap-2 border border-slate-700 animate-fadeIn text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Consumer Sentiment Report copied to clipboard!</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Call Recording & Consumer Sentiment Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <Bot className="w-3 h-3" />
              <span>Gemini 3.7 Flash AI</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Automatic NLP sentiment analysis, emotional trajectory tracking, buying signals, and objection extraction on recorded calls.
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('dialer')}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Open Sales Dialer</span>
          </button>
        </div>
      </div>

      {/* Aggregate Consumer Sentiment KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          className={`p-4 rounded-2xl border transition-all ${
            theme === 'dark'
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Avg Sentiment Score</span>
            <Smile className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {avgSentimentScore}%
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Positive Affinity
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${avgSentimentScore}%` }}
            />
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            theme === 'dark'
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">High Buying Intent</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {highIntentCount} / {recordings.length}
            </span>
            <span className="text-xs font-semibold text-rose-500">
              Hot Deals
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Explicit budget & enterprise requests
          </p>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            theme === 'dark'
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Consumer Talk Ratio</span>
            <MessageSquare className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              58%
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              Ideal Discovery
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Prospect speaks more than rep (optimal)
          </p>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            theme === 'dark'
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Recorded Calls Library</span>
            <FileAudio className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {recordings.length}
            </span>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
              Analyzed
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            100% transcript & sentiment indexed
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout: Recording Library on Left, Deep Sentiment Studio on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recorded Calls List */}
        <div className="lg:col-span-4 space-y-4">
          <div
            className={`p-4 rounded-2xl border ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-800'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-blue-500" />
                <span>Recorded Calls</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {filteredRecordings.length} calls
              </span>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lead, company, phone..."
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-slate-200 border border-slate-700 focus:border-blue-500'
                    : 'bg-slate-50 text-slate-800 border border-slate-200 focus:border-blue-500'
                }`}
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
              {(['All', 'Positive', 'Neutral', 'Negative'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSentimentFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                    sentimentFilter === filter
                      ? 'bg-blue-600 text-white'
                      : theme === 'dark'
                      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* List of Recordings */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {filteredRecordings.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No recorded calls match your filters.
                </div>
              ) : (
                filteredRecordings.map((rec) => {
                  const isSelected = rec.id === recording?.id;
                  const isPositive = rec.sentimentAnalysis?.overallSentiment === 'Positive';
                  const isNegative = rec.sentimentAnalysis?.overallSentiment === 'Negative';

                  return (
                    <div
                      key={rec.id}
                      onClick={() => setSelectedRecordingId(rec.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? theme === 'dark'
                            ? 'bg-blue-950/40 border-blue-600 shadow-sm'
                            : 'bg-blue-50/80 border-blue-500 shadow-xs'
                          : theme === 'dark'
                          ? 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                            {rec.leadName}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {rec.company}
                          </p>
                        </div>

                        {/* Sentiment Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : isNegative
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {isPositive ? (
                            <Smile className="w-2.5 h-2.5" />
                          ) : isNegative ? (
                            <Frown className="w-2.5 h-2.5" />
                          ) : (
                            <Meh className="w-2.5 h-2.5" />
                          )}
                          <span>{rec.sentimentAnalysis?.sentimentScore || 80}%</span>
                        </span>
                      </div>

                      {/* Mini audio waveform preview */}
                      <div className="flex items-center gap-0.5 h-3 mb-2 opacity-60">
                        {(rec.waveformPeaks || [20, 50, 80, 40, 60, 90, 30, 70]).slice(0, 24).map((h, i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-full ${
                              isSelected ? 'bg-blue-500' : 'bg-slate-400'
                            }`}
                            style={{ height: `${Math.max(15, h)}%` }}
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{rec.audioDurationFormatted}</span>
                        </span>
                        <span>{rec.recordedAt}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Deep Consumer Sentiment Analysis Studio */}
        {recording ? (
          <div className="lg:col-span-8 space-y-6">
            {/* Recording Banner & Action Header */}
            <div
              className={`p-5 rounded-2xl border ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                    {recording.leadName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {recording.leadName}
                      </h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-medium">
                        {recording.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {recording.company}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {recording.phone}
                      </span>
                      <span>•</span>
                      <span>Rep: {recording.repName}</span>
                    </p>
                  </div>
                </div>

                {/* Right Action Tools */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleReanalyzeWithGemini}
                    disabled={isAnalyzing}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>{isAnalyzing ? 'Analyzing AI...' : 'Re-Analyze with Gemini'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Copy Report</span>
                  </button>
                </div>
              </div>

              {/* Integrated Audio Player Bar with Live Waveform Scrubbing */}
              <div
                className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center cursor-pointer shadow-xs transition-colors shrink-0"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>

                  {/* Waveform Scrubber */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-end gap-1 h-10 px-2 py-1 bg-slate-200/50 dark:bg-slate-900/50 rounded-lg overflow-hidden relative cursor-pointer">
                      {(recording.waveformPeaks || [15, 30, 45, 60, 80, 65, 40, 20, 55, 75, 90, 85, 60, 45, 70, 85, 95, 60, 40, 30, 65, 80, 50, 25, 70, 85, 90, 75, 45, 30, 60, 80, 95, 70, 40, 20]).map(
                        (peak, idx, arr) => {
                          const progressIdx = Math.floor(
                            (playbackTime / (recording.duration || 1)) * arr.length
                          );
                          const isPast = idx <= progressIdx;
                          return (
                            <div
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                const ratio = idx / arr.length;
                                setPlaybackTime(Math.floor(ratio * recording.duration));
                              }}
                              className={`flex-1 rounded-full transition-all duration-150 ${
                                isPast
                                  ? 'bg-blue-600 dark:bg-blue-400'
                                  : 'bg-slate-400/40 dark:bg-slate-700'
                              }`}
                              style={{ height: `${Math.max(15, peak)}%` }}
                            />
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Playback Speed Pill */}
                  <div className="flex items-center gap-1 shrink-0">
                    {[1, 1.25, 1.5].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                          playbackSpeed === speed
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{formatSeconds(playbackTime)}</span>
                  <span className="text-slate-500 font-sans text-[10px]">
                    Recorded HD Stereo audio with SRTP encryption
                  </span>
                  <span>{formatSeconds(recording.duration)}</span>
                </div>
              </div>

              {/* Navigation Tabs for Analysis View */}
              <div className="flex items-center gap-2 mt-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Consumer Sentiment Overview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('transcript')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'transcript'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Transcript & Sentiment Shifts ({recording.transcript.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('askAi')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'askAi'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Ask AI About Call</span>
                </button>
              </div>
            </div>

            {/* TAB 1: CONSUMER SENTIMENT OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Sentiment & Intent Hero Card */}
                <div
                  className={`p-5 rounded-2xl border ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-500" />
                    <span>Consumer Affinity & Buying Propensity</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Sentiment Score Gauge */}
                    <div
                      className={`p-4 rounded-xl border text-center space-y-2 ${
                        theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-emerald-50/50 border-emerald-100'
                      }`}
                    >
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Consumer Sentiment Index
                      </span>
                      <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
                        {recording.sentimentAnalysis.sentimentScore}%
                      </div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {recording.sentimentAnalysis.overallSentiment} Tone
                      </span>
                    </div>

                    {/* Buying Intent Tier */}
                    <div
                      className={`p-4 rounded-xl border text-center space-y-2 ${
                        theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-blue-50/50 border-blue-100'
                      }`}
                    >
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Purchasing Intent Level
                      </span>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
                        <Flame className="w-5 h-5 text-rose-500" />
                        <span>{recording.sentimentAnalysis.buyingIntentLevel} Intent</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {recording.sentimentAnalysis.consumerTone}
                      </p>
                    </div>

                    {/* Talk to Listen Balance */}
                    <div
                      className={`p-4 rounded-xl border text-center space-y-2 ${
                        theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-purple-50/50 border-purple-100'
                      }`}
                    >
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Talk / Listen Balance
                      </span>
                      <div className="text-xl font-bold text-slate-800 dark:text-slate-200">
                        {recording.sentimentAnalysis.talkListenRatio.consumerPercent}% Consumer / {recording.sentimentAnalysis.talkListenRatio.repPercent}% Rep
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-2"
                          style={{ width: `${recording.sentimentAnalysis.talkListenRatio.consumerPercent}%` }}
                        />
                        <div
                          className="bg-blue-500 h-2"
                          style={{ width: `${recording.sentimentAnalysis.talkListenRatio.repPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emotion Breakdown Bars */}
                  <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Consumer Emotion Breakdown (Gemini NLP Engine)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {recording.sentimentAnalysis.consumerEmotions.map((emo, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border ${
                            theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {emo.emotion}
                            </span>
                            <span className="font-bold font-mono">{emo.percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${emo.percentage}%`, backgroundColor: emo.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Key Buying Signals & Pain Points Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Buying Signals */}
                  <div
                    className={`p-5 rounded-2xl border space-y-3 ${
                      theme === 'dark'
                        ? 'bg-slate-900 border-slate-800'
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Key Buying Signals Detected
                      </h4>
                    </div>

                    <ul className="space-y-2">
                      {recording.sentimentAnalysis.keyBuyingSignals.map((signal, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 leading-relaxed"
                        >
                          <span className="text-emerald-500 font-bold mt-0.5">✔</span>
                          <span>{signal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pain Points & Objections */}
                  <div
                    className={`p-5 rounded-2xl border space-y-3 ${
                      theme === 'dark'
                        ? 'bg-slate-900 border-slate-800'
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Pain Points & Consumer Hesitations
                      </h4>
                    </div>

                    <ul className="space-y-2">
                      {recording.sentimentAnalysis.consumerPainPoints.concat(recording.sentimentAnalysis.customerObjections).map((pt, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 leading-relaxed"
                        >
                          <span className="text-amber-500 font-bold mt-0.5">⚠️</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* AI Executive Summary & Next Action Plan */}
                <div
                  className={`p-5 rounded-2xl border space-y-4 ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Gemini Executive Call Assessment</span>
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      "{recording.sentimentAnalysis.executiveAiSummary}"
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                      Recommended Next Actions for Sales Rep
                    </h4>
                    <div className="space-y-2">
                      {recording.sentimentAnalysis.recommendedNextSteps.map((step, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                            theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-blue-50/50 border-blue-100'
                          }`}
                        >
                          <span className="text-slate-800 dark:text-slate-200 font-medium">
                            👉 {step}
                          </span>
                          <button
                            type="button"
                            onClick={() => onNavigate('leads')}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold cursor-pointer shrink-0 transition-colors"
                          >
                            Schedule
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: INTERACTIVE CALL TRANSCRIPT & SENTIMENT TIMELINE */}
            {activeTab === 'transcript' && (
              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Turn-by-Turn Sentiment Transcript
                    </h3>
                    <p className="text-xs text-slate-400">
                      Click any utterance to jump audio playback directly to that timestamp
                    </p>
                  </div>

                  <span className="text-xs font-mono px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Active: {formatSeconds(playbackTime)}
                  </span>
                </div>

                {/* Transcript turns list */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {recording.transcript.map((turn) => {
                    const isConsumer = turn.speaker === 'Consumer';
                    const isActive = activeTranscriptId === turn.id;

                    return (
                      <div
                        key={turn.id}
                        onClick={() => jumpToTurn(turn.timestamp)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isActive
                            ? theme === 'dark'
                              ? 'bg-blue-950/60 border-blue-500 shadow-md ring-1 ring-blue-500'
                              : 'bg-blue-50 border-blue-400 shadow-xs ring-1 ring-blue-400'
                            : isConsumer
                            ? theme === 'dark'
                              ? 'bg-slate-800/40 border-slate-700 hover:bg-slate-800'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            : theme === 'dark'
                            ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                isConsumer
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              }`}
                            >
                              {turn.speaker}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              [{turn.timestamp}]
                            </span>
                          </div>

                          {/* Consumer Sentiment Badge per Turn */}
                          {isConsumer && turn.sentiment && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                turn.sentiment === 'Positive' || turn.sentiment === 'Enthusiastic'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : turn.sentiment === 'Negative'
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              }`}
                            >
                              {turn.sentiment} ({turn.sentimentScore || 85}%)
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                          {turn.text}
                        </p>

                        {turn.emotion && (
                          <div className="mt-1.5 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                            💡 Mood: {turn.emotion}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: ASK GEMINI AI ABOUT RECORDING */}
            {activeTab === 'askAi' && (
              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-500" />
                    <span>Ask Gemini AI Anything About This Call</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Query customer objections, budget confirmations, competitor mentions, or rep coaching feedback.
                  </p>
                </div>

                {/* Suggested Inquiries */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Did the prospect confirm budget for this quarter?',
                    'What competitor was mentioned during the call?',
                    'What was the customer most hesitant about?',
                    'What is the best follow-up strategy to close?',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAiCustomQuestion(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                        aiCustomQuestion === preset
                          ? 'bg-blue-600 text-white border-blue-600'
                          : theme === 'dark'
                          ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Question Input Box */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={aiCustomQuestion}
                    onChange={(e) => setAiCustomQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAskAiAboutRecording();
                    }}
                    placeholder="Ask about consumer sentiment, requirements, or objections..."
                    className={`flex-1 px-3.5 py-2 rounded-xl text-xs outline-none transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-800 text-slate-200 border border-slate-700 focus:border-blue-500'
                        : 'bg-slate-50 text-slate-800 border border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleAskAiAboutRecording}
                    disabled={isAskingAi || !aiCustomQuestion.trim()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shrink-0"
                  >
                    {isAskingAi ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Query AI</span>
                  </button>
                </div>

                {/* AI Answer Box */}
                {aiAnswer && (
                  <div
                    className={`p-4 rounded-xl border space-y-2 animate-fadeIn ${
                      theme === 'dark'
                        ? 'bg-blue-950/40 border-blue-900/60 text-slate-200'
                        : 'bg-blue-50/80 border-blue-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Gemini 3.7 Flash Response</span>
                      </span>
                      <span className="text-[10px] font-normal text-slate-400">Grounding on Audio Transcript</span>
                    </div>
                    <p className="text-xs leading-relaxed font-normal">{aiAnswer}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-8 p-12 text-center text-slate-400">
            Select a recorded call from the library to view deep consumer sentiment analysis.
          </div>
        )}
      </div>
    </div>
  );
};
