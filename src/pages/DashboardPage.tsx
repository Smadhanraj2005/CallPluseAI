import React, { useState, useMemo } from 'react';
import {
  PhoneCall,
  Clock,
  Award,
  Calendar,
  Play,
  TrendingUp,
  Target,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { useLeads } from '../context/LeadContext';
import { PageType, UserProfile, Lead } from '../types';

interface DashboardPageProps {
  user: UserProfile | null;
  onNavigate: (page: PageType) => void;
  onSelectLeadForDialing?: (phone: string, name: string) => void;
}

type TimeRange = 'today' | 'week' | 'month';

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  onNavigate,
  onSelectLeadForDialing,
}) => {
  const { theme } = useTheme();
  const { leads, setSelectedLeadId } = useLeads();
  const [viewMode, setViewMode] = useState<'manager' | 'salesperson'>('manager');
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 750);
    return () => clearTimeout(timer);
  }, [timeRange, viewMode]);

  // Handle direct call from follow-ups list
  const handleQuickDialLead = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    if (onSelectLeadForDialing) {
      onSelectLeadForDialing(lead.phone, lead.name);
    } else {
      onNavigate('dialer');
    }
  };

  // Lead status distribution for Recharts Donut chart
  const leadStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {
      Interested: 0,
      'Not Interested': 0,
      'Call Back': 0,
      'Hot Lead': 0,
      New: 0,
      'Wrong Number': 0,
    };

    leads.forEach((l) => {
      if (statusCounts[l.status] !== undefined) {
        statusCounts[l.status]++;
      } else {
        statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
      }
    });

    const colors: Record<string, { dark: string; light: string }> = {
      Interested: { dark: '#10B981', light: '#10B981' },
      'Not Interested': { dark: '#F43F5E', light: '#EF4444' },
      'Call Back': { dark: '#F59E0B', light: '#F59E0B' },
      'Hot Lead': { dark: '#A855F7', light: '#8B5CF6' },
      New: { dark: '#38BDF8', light: '#3B82F6' },
      'Wrong Number': { dark: '#94A3B8', light: '#64748B' },
    };

    return Object.keys(statusCounts)
      .map((key) => ({
        name: key,
        value: statusCounts[key],
        color: theme === 'dark' ? colors[key].dark : colors[key].light,
      }))
      .filter((item) => item.value > 0);
  }, [leads, theme]);

  // Calls trend data based on selected filter
  const callsTrendData = useMemo(() => {
    if (timeRange === 'today') {
      return [
        { label: '9 AM', calls: 14, connected: 7 },
        { label: '10 AM', calls: 28, connected: 16 },
        { label: '11 AM', calls: 32, connected: 19 },
        { label: '12 PM', calls: 18, connected: 8 },
        { label: '1 PM', calls: 12, connected: 5 },
        { label: '2 PM', calls: 26, connected: 15 },
        { label: '3 PM', calls: 35, connected: 21 },
        { label: '4 PM', calls: 22, connected: 12 },
      ];
    } else if (timeRange === 'week') {
      return [
        { label: 'Mon', calls: 124, connected: 68 },
        { label: 'Tue', calls: 142, connected: 81 },
        { label: 'Wed', calls: 156, connected: 94 },
        { label: 'Thu', calls: 168, connected: 102 },
        { label: 'Fri', calls: 135, connected: 76 },
      ];
    } else {
      return [
        { label: 'Week 1', calls: 580, connected: 310 },
        { label: 'Week 2', calls: 640, connected: 362 },
        { label: 'Week 3', calls: 710, connected: 420 },
        { label: 'Week 4', calls: 690, connected: 395 },
      ];
    }
  }, [timeRange]);

  // Leaderboard data for Manager table
  const leaderboardData = useMemo(() => {
    const multiplier = timeRange === 'today' ? 1 : timeRange === 'week' ? 4.5 : 18;
    return [
      {
        id: '1',
        name: 'Alex Morgan',
        avatar: 'A',
        role: 'Senior SDR',
        calls: Math.round(42 * multiplier),
        talkTime: timeRange === 'today' ? '1h 52m' : timeRange === 'week' ? '8h 24m' : '34h 10m',
        conversions: Math.round(8 * multiplier),
        connectRate: '48%',
        isCurrentUser: true,
      },
      {
        id: '2',
        name: 'Priya Sharma',
        avatar: 'P',
        role: 'Account Exec',
        calls: Math.round(38 * multiplier),
        talkTime: timeRange === 'today' ? '1h 45m' : timeRange === 'week' ? '7h 50m' : '31h 40m',
        conversions: Math.round(7 * multiplier),
        connectRate: '45%',
      },
      {
        id: '3',
        name: 'Rahul Verma',
        avatar: 'R',
        role: 'Sales Rep',
        calls: Math.round(35 * multiplier),
        talkTime: timeRange === 'today' ? '1h 30m' : timeRange === 'week' ? '6h 40m' : '28h 15m',
        conversions: Math.round(6 * multiplier),
        connectRate: '43%',
      },
      {
        id: '4',
        name: 'Sarah Jenkins',
        avatar: 'S',
        role: 'Sales Rep',
        calls: Math.round(33 * multiplier),
        talkTime: timeRange === 'today' ? '1h 25m' : timeRange === 'week' ? '6h 15m' : '26h 30m',
        conversions: Math.round(5 * multiplier),
        connectRate: '41%',
      },
      {
        id: '5',
        name: 'Ravi Kumar',
        avatar: 'R',
        role: 'Sales Rep',
        calls: Math.round(31 * multiplier),
        talkTime: timeRange === 'today' ? '1h 18m' : timeRange === 'week' ? '5h 50m' : '24h 45m',
        conversions: Math.round(4 * multiplier),
        connectRate: '39%',
      },
    ];
  }, [timeRange]);

  const pendingFollowUps = useMemo(() => {
    return leads.filter((l) => l.nextFollowUpDate || l.status === 'Call Back');
  }, [leads]);

  const totalCalls = timeRange === 'today' ? '187' : timeRange === 'week' ? '920' : '3,650';
  const totalTalkTime = timeRange === 'today' ? '6h 42m' : timeRange === 'week' ? '32h 15m' : '135h 20m';
  const totalConversions = timeRange === 'today' ? '29' : timeRange === 'week' ? '142' : '560';
  const pendingFollowupsCount = pendingFollowUps.length;

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 h-24"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 p-5 space-y-3">
              <div className="w-8 h-8 rounded-xl bg-slate-300 dark:bg-slate-700"></div>
              <div className="w-24 h-4 rounded bg-slate-300 dark:bg-slate-700"></div>
              <div className="w-16 h-6 rounded bg-slate-300 dark:bg-slate-700"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 p-6"></div>
          <div className="h-80 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 p-6"></div>
        </div>
        <div className="h-64 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 p-6"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header with Switcher between Manager & Salesperson View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className={`text-xl sm:text-2xl font-semibold tracking-tight ${
              theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
            }`}
          >
            {viewMode === 'manager' ? 'Manager Dashboard' : 'My Performance Overview'}
          </h1>
          <p
            className={`text-xs sm:text-sm font-normal mt-1 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {viewMode === 'manager'
              ? 'Real-time sales team overview, daily call analytics & performance'
              : 'Personal calling targets, metrics pacing & pending follow-ups'}
          </p>
        </div>

        {/* View Switcher & Time Filter */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Manager / Salesperson Tab Switcher */}
          <div className="p-1 rounded-xl flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              id="view-manager-btn"
              type="button"
              onClick={() => setViewMode('manager')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'manager'
                  ? theme === 'dark'
                    ? 'bg-slate-800 text-blue-400 border border-slate-700'
                    : 'bg-white text-slate-800 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Manager View
            </button>
            <button
              id="view-salesperson-btn"
              type="button"
              onClick={() => setViewMode('salesperson')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'salesperson'
                  ? theme === 'dark'
                    ? 'bg-slate-800 text-blue-400 border border-slate-700'
                    : 'bg-white text-slate-800 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              My Stats
            </button>
          </div>

          {/* Time Filter Pill */}
          {viewMode === 'manager' && (
            <div className="p-1 rounded-xl flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              {(['today', 'week', 'month'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  id={`filter-timerange-${range}`}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                    timeRange === range
                      ? theme === 'dark'
                        ? 'bg-slate-800 text-blue-400 border border-slate-700'
                        : 'bg-white text-slate-800 shadow-xs border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {range === 'today' ? 'Today' : range === 'week' ? 'Week' : 'Month'}
                </button>
              ))}
            </div>
          )}

          {/* Quick Launch Dialer */}
          <button
            id="dashboard-launch-dialer-btn"
            type="button"
            onClick={() => onNavigate('dialer')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Open Dialer</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-pulse pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 p-5 space-y-3">
                <div className="w-8 h-8 rounded-xl bg-slate-300 dark:bg-slate-700"></div>
                <div className="w-24 h-4 rounded bg-slate-300 dark:bg-slate-700"></div>
                <div className="w-16 h-6 rounded bg-slate-300 dark:bg-slate-700"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 p-6"></div>
            <div className="h-80 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 p-6"></div>
          </div>
          <div className="h-64 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 p-6"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {viewMode === 'manager' && (
            <div className="space-y-6">
              {/* 4 Cards at Top */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Calls */}
            <div
              id="manager-stat-total-calls"
              className={`p-4 sm:p-5 rounded-xl transition-all flex flex-col justify-between ${
                theme === 'dark'
                  ? 'bg-slate-800 border border-slate-700'
                  : 'bg-white border border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Total Calls {timeRange === 'today' ? 'Today' : timeRange === 'week' ? '(Week)' : '(Month)'}
                </span>
                <div
                  className={`p-2 rounded-lg ${
                    theme === 'dark'
                      ? 'bg-blue-950/70 text-blue-300 border border-blue-800'
                      : 'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}
                >
                  <PhoneCall className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div
                  className={`text-2xl sm:text-3xl font-semibold tracking-tight ${
                    theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                  }`}
                >
                  {totalCalls}
                </div>
                <div className="flex items-center gap-1 text-xs font-medium pt-1 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>+18.4% vs last period</span>
                </div>
              </div>
            </div>

            {/* Card 2: Total Talk Time */}
            <div
              id="manager-stat-talk-time"
              className={`p-4 sm:p-5 rounded-xl transition-all flex flex-col justify-between ${
                theme === 'dark'
                  ? 'bg-slate-800 border border-slate-700'
                  : 'bg-white border border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Total Talk Time
                </span>
                <div
                  className={`p-2 rounded-lg ${
                    theme === 'dark'
                      ? 'bg-purple-950/70 text-purple-300 border border-purple-800'
                      : 'bg-purple-50 text-purple-600 border border-purple-100'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div
                  className={`text-2xl sm:text-3xl font-semibold tracking-tight ${
                    theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                  }`}
                >
                  {totalTalkTime}
                </div>
                <div className="text-xs font-normal pt-1 text-slate-500 dark:text-slate-400">
                  <span>Avg 2m 45s per call</span>
                </div>
              </div>
            </div>

            {/* Card 3: Conversions */}
            <div
              id="manager-stat-conversions"
              className={`p-4 sm:p-5 rounded-xl transition-all flex flex-col justify-between ${
                theme === 'dark'
                  ? 'bg-slate-800 border border-slate-700'
                  : 'bg-white border border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Conversions
                </span>
                <div
                  className={`p-2 rounded-lg ${
                    theme === 'dark'
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}
                >
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div
                  className={`text-2xl sm:text-3xl font-semibold tracking-tight ${
                    theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                  }`}
                >
                  {totalConversions}
                </div>
                <div className="text-xs font-normal pt-1 text-emerald-600 dark:text-emerald-400">
                  <span>15.5% conversion rate</span>
                </div>
              </div>
            </div>

            {/* Card 4: Pending Follow-ups */}
            <div
              id="manager-stat-pending-followups"
              className={`p-4 sm:p-5 rounded-xl transition-all flex flex-col justify-between ${
                theme === 'dark'
                  ? 'bg-slate-800 border border-slate-700'
                  : 'bg-white border border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Pending Follow-ups
                </span>
                <div
                  className={`p-2 rounded-lg ${
                    theme === 'dark'
                      ? 'bg-amber-950/70 text-amber-300 border border-amber-800'
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div
                  className={`text-2xl sm:text-3xl font-semibold tracking-tight ${
                    theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                  }`}
                >
                  {pendingFollowupsCount}
                </div>
                <div className="text-xs font-normal pt-1 text-amber-600 dark:text-amber-400">
                  <span>Scheduled across team</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Bar Chart for Activity */}
            <div
              id="daily-calls-chart-card"
              className={`lg:col-span-8 p-5 sm:p-6 rounded-xl transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 border border-slate-700'
                  : 'bg-white border border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2
                    className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                    }`}
                  >
                    Calling Volume & Connection Rate
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-normal">
                    Total outbound dials vs connected calls
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-normal">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                    <span className="text-slate-500 dark:text-slate-400">Dials</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                    <span className="text-slate-500 dark:text-slate-400">Connected</span>
                  </div>
                </div>
              </div>

              {/* Recharts Bar Chart */}
              <div className="h-60 sm:h-68 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={callsTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      stroke={theme === 'dark' ? '#64748B' : '#94A3B8'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke={theme === 'dark' ? '#64748B' : '#94A3B8'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                        borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
                        borderRadius: '10px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                        fontWeight: 400,
                        color: theme === 'dark' ? '#F1F5F9' : '#1E293B',
                      }}
                    />
                    <Bar
                      dataKey="calls"
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                      name="Total Calls"
                    />
                    <Bar
                      dataKey="connected"
                      fill="#8B5CF6"
                      radius={[4, 4, 0, 0]}
                      name="Connected"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Status Breakdown Donut Chart */}
            <div
              id="lead-status-donut-chart-card"
              className={`lg:col-span-4 p-5 sm:p-6 rounded-xl transition-all flex flex-col justify-between ${
                theme === 'dark'
                  ? 'bg-slate-800 border border-slate-700'
                  : 'bg-white border border-slate-200 shadow-xs'
              }`}
            >
              <div>
                <h2
                  className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                  }`}
                >
                  Lead Status Distribution
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-normal">
                  Status breakdown of {leads.length} contacts
                </p>
              </div>

              <div className="relative h-48 sm:h-52 w-full flex items-center justify-center my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={72}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {leadStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                        borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
                        borderRadius: '10px',
                        fontSize: '12px',
                        color: theme === 'dark' ? '#F1F5F9' : '#1E293B',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span
                    className={`text-xl sm:text-2xl font-semibold ${
                      theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                    }`}
                  >
                    {leads.length}
                  </span>
                  <span className="text-[10px] font-normal text-slate-400">
                    Total Leads
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-2">
                {leadStatusData.map((item) => (
                  <div
                    key={item.name}
                    className={`px-2 py-1 rounded-lg text-xs font-normal flex items-center justify-between border ${
                      theme === 'dark'
                        ? 'bg-slate-900/60 border-slate-700/60'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate text-slate-600 dark:text-slate-400">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div
            id="manager-leaderboard-card"
            className={`p-5 sm:p-6 rounded-xl transition-all ${
              theme === 'dark'
                ? 'bg-slate-800 border border-slate-700'
                : 'bg-white border border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2
                  className={`text-sm font-medium flex items-center gap-2 ${
                    theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                  }`}
                >
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Sales Representative Leaderboard</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-normal">
                  Rankings based on calling activity, talk time, and closed leads
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr
                    className={`border-b text-xs font-medium ${
                      theme === 'dark'
                        ? 'border-slate-700 text-slate-400'
                        : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    <th className="pb-3 pl-2">Rank & Representative</th>
                    <th className="pb-3 text-center">Calls</th>
                    <th className="pb-3 text-center">Talk Time</th>
                    <th className="pb-3 text-center">Conversions</th>
                    <th className="pb-3 text-right pr-2">Connect Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {leaderboardData.map((rep, idx) => (
                    <tr
                      key={rep.id}
                      className={`transition-colors ${
                        rep.isCurrentUser
                          ? theme === 'dark'
                            ? 'bg-blue-950/20'
                            : 'bg-blue-50/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                      }`}
                    >
                      <td className="py-3 pl-2">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-medium text-xs ${
                              idx === 0
                                ? 'bg-amber-100 text-amber-700 border border-amber-300'
                                : idx === 1
                                ? 'bg-slate-200 text-slate-700'
                                : idx === 2
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-medium text-xs ${
                                rep.isCurrentUser
                                  ? 'bg-blue-600 text-white'
                                  : theme === 'dark'
                                  ? 'bg-slate-700 text-slate-300'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {rep.avatar}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`font-medium ${
                                    theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                                  }`}
                                >
                                  {rep.name}
                                </span>
                                {rep.isCurrentUser && (
                                  <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 font-normal">{rep.role}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 text-center font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
                        {rep.calls}
                      </td>

                      <td className="py-3 text-center font-mono text-xs font-normal text-slate-500 dark:text-slate-400">
                        {rep.talkTime}
                      </td>

                      <td className="py-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md font-medium text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {rep.conversions} closed
                        </span>
                      </td>

                      <td className="py-3 text-right pr-2 font-mono text-xs font-medium text-blue-600 dark:text-blue-400">
                        {rep.connectRate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. SALESPERSON PERFORMANCE VIEW */}
      {viewMode === 'salesperson' && (
        <div className="space-y-6">
          {/* Target Progress Bar */}
          <div
            id="salesperson-target-progress-card"
            className={`p-5 sm:p-6 rounded-xl transition-all ${
              theme === 'dark'
                ? 'bg-slate-800 border border-slate-700'
                : 'bg-white border border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <h2
                    className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                    }`}
                  >
                    Daily Calling Quota Progress
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-normal">
                  Target: 40 calls per day • 12 calls remaining
                </p>
              </div>

              <div>
                <span className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                  70% Reached
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="w-full h-2.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  style={{ width: '70%' }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 font-normal">
                <span>28 Calls Completed</span>
                <span>Target: 40 Calls</span>
              </div>
            </div>
          </div>

          {/* Personal Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              id="rep-stat-calls"
              className={`p-4 rounded-xl transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 border border-slate-700'
                  : 'bg-white border border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  My Calls Today
                </span>
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-300">
                  <PhoneCall className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`text-2xl font-semibold ${
                  theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                }`}
              >
                28
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-normal mt-0.5">+6 ahead of pace</p>
            </div>

            <div
              id="rep-stat-talk-time"
              className={`p-4 rounded-xl transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 border border-slate-700'
                  : 'bg-white border border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  My Talk Time
                </span>
                <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/70 dark:text-purple-300">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`text-2xl font-semibold ${
                  theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                }`}
              >
                1h 52m
              </div>
              <p className="text-xs text-slate-400 font-normal mt-0.5">Avg 2m 45s / lead</p>
            </div>

            <div
              id="rep-stat-conversions"
              className={`p-4 rounded-xl transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 border border-slate-700'
                  : 'bg-white border border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  My Conversions
                </span>
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-300">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`text-2xl font-semibold ${
                  theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                }`}
              >
                6
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-normal mt-0.5">21.4% connect rate</p>
            </div>

            <div
              id="rep-stat-efficiency"
              className={`p-4 rounded-xl transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 border border-slate-700'
                  : 'bg-white border border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Team Rank
                </span>
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-300">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`text-2xl font-semibold ${
                  theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                }`}
              >
                #1
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-normal mt-0.5">Top Performer today</p>
            </div>
          </div>

          {/* Pending Follow-ups */}
          <div
            id="salesperson-pending-followups-card"
            className={`p-5 sm:p-6 rounded-xl transition-all ${
              theme === 'dark'
                ? 'bg-slate-800 border border-slate-700'
                : 'bg-white border border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2
                  className={`text-sm font-medium flex items-center gap-2 ${
                    theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span>Scheduled Follow-ups & Callbacks</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-normal">
                  Contacts with callbacks due today
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('leads')}
                className="text-xs font-medium flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <span>View All</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {pendingFollowUps.length === 0 ? (
                <div
                  className={`p-6 text-center rounded-xl ${
                    theme === 'dark' ? 'bg-slate-900/60 text-slate-400 border border-slate-700' : 'bg-slate-50 text-slate-500 border border-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">No scheduled callbacks pending</p>
                </div>
              ) : (
                pendingFollowUps.map((lead) => {
                  return (
                    <div
                      key={lead.id}
                      id={`pending-followup-${lead.id}`}
                      className={`p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        theme === 'dark'
                          ? 'bg-slate-900/60 border border-slate-700/80 hover:border-slate-600'
                          : 'bg-slate-50 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-medium text-xs shrink-0 ${
                            theme === 'dark'
                              ? 'bg-slate-800 text-slate-200 border border-slate-700'
                              : 'bg-white text-slate-700 border border-slate-200'
                          }`}
                        >
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3
                              className={`text-xs sm:text-sm font-medium ${
                                theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                              }`}
                            >
                              {lead.name}
                            </h3>
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                                lead.status === 'Hot Lead'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800'
                              }`}
                            >
                              {lead.status}
                            </span>
                            {lead.nextFollowUpDate && (
                              <span className="text-[10px] font-normal text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {lead.nextFollowUpDate}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                            {lead.company} • <span className="font-mono">{lead.phone}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          id={`quick-call-lead-${lead.id}`}
                          type="button"
                          onClick={() => handleQuickDialLead(lead)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Call Lead</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      </div>
      )}
    </div>
  );
};
