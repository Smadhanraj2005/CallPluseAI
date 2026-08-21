import React, { useState } from 'react';
import {
  TrendingUp,
  Download,
  Calendar,
  CheckCircle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Search,
  ArrowDownToLine,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLeads } from '../context/LeadContext';

export const ReportsPage: React.FC = () => {
  const { theme } = useTheme();
  const { leads, callSummaries } = useLeads();

  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  const outcomes = [
    { label: 'Connected / Discussed', count: 19, percent: '45%', color: 'blue' },
    { label: 'Follow-up Scheduled', count: 12, percent: '28%', color: 'amber' },
    { label: 'No Answer / Ringout', count: 7, percent: '17%', color: 'slate' },
    { label: 'Gatekeeper / Busy', count: 4, percent: '10%', color: 'slate' },
  ];

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const combinedLogs = React.useMemo(() => {
    const logs = [...callSummaries].map((cs) => {
      const associatedLead = leads.find((l) => l.id === cs.leadId);
      const isConverted = cs.outcome === 'Interested' || cs.outcome === 'Hot Lead';
      return {
        id: cs.id,
        timestamp: cs.timestamp,
        leadName: cs.leadName,
        phone: cs.phone,
        company: cs.company,
        assignedTo: associatedLead?.assignedTo || 'Alex Morgan',
        durationSec: cs.duration,
        durationFormatted: formatDuration(cs.duration),
        outcome: cs.outcome,
        isConverted: isConverted ? 'Yes (Qualified)' : 'No',
        nextFollowUp: cs.suggestedFollowUpDate || associatedLead?.nextFollowUpDate || 'None',
        notes: cs.notes || associatedLead?.notes || '',
        aiSummary: cs.aiSummary || '',
      };
    });

    leads.forEach((l) => {
      if (!logs.some((log) => log.phone === l.phone && log.leadName === l.name)) {
        const isConverted = l.status === 'Interested' || l.status === 'Hot Lead';
        logs.push({
          id: `lead-log-${l.id}`,
          timestamp: l.lastCallDate || 'Today, 10:30 AM',
          leadName: l.name,
          phone: l.phone,
          company: l.company,
          assignedTo: l.assignedTo || 'Alex Morgan',
          durationSec: 120,
          durationFormatted: '02:00',
          outcome: l.status,
          isConverted: isConverted ? 'Yes (Qualified)' : 'No',
          nextFollowUp: l.nextFollowUpDate || 'None',
          notes: l.notes || '',
          aiSummary: l.aiSummary || '',
        });
      }
    });

    return logs;
  }, [callSummaries, leads]);

  const filteredLogs = React.useMemo(() => {
    return combinedLogs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        log.leadName.toLowerCase().includes(q) ||
        log.phone.toLowerCase().includes(q) ||
        log.company.toLowerCase().includes(q) ||
        log.assignedTo.toLowerCase().includes(q) ||
        log.outcome.toLowerCase().includes(q);

      const matchesOutcome =
        outcomeFilter === 'ALL' ||
        (outcomeFilter === 'CONVERTED' && (log.outcome === 'Interested' || log.outcome === 'Hot Lead')) ||
        log.outcome.toLowerCase() === outcomeFilter.toLowerCase();

      return matchesQuery && matchesOutcome;
    });
  }, [combinedLogs, searchQuery, outcomeFilter]);

  const handleDownloadCSV = () => {
    const headers = [
      'Call ID',
      'Date & Time',
      'Lead Name',
      'Phone Number',
      'Company Name',
      'Assigned Sales Rep',
      'Call Duration (Seconds)',
      'Call Duration (Formatted)',
      'Call Outcome / Disposition',
      'Conversion Qualified',
      'Next Follow-Up Scheduled',
      'Call Notes',
      'AI Call Summary',
    ];

    const csvRows = [headers.join(',')];

    combinedLogs.forEach((row) => {
      const clean = (val: string | number) => {
        const str = String(val ?? '').replace(/"/g, '""');
        return `"${str}"`;
      };

      const values = [
        clean(row.id),
        clean(row.timestamp),
        clean(row.leadName),
        clean(row.phone),
        clean(row.company),
        clean(row.assignedTo),
        clean(row.durationSec),
        clean(row.durationFormatted),
        clean(row.outcome),
        clean(row.isConverted),
        clean(row.nextFollowUp),
        clean(row.notes),
        clean(row.aiSummary),
      ];

      csvRows.push(values.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));
    const downloadAnchor = document.createElement('a');
    const todayStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `sales_call_reports_and_conversions_${todayStr}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);

    setDownloadSuccessToast(`Exported ${combinedLogs.length} call logs and conversion records to CSV.`);
    setTimeout(() => {
      setDownloadSuccessToast(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {downloadSuccessToast && (
        <div
          id="export-success-toast"
          className="p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm font-medium bg-emerald-600 text-white shadow-xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{downloadSuccessToast}</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/20 font-normal">
            CSV Ready
          </span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className={`text-xl sm:text-2xl font-semibold tracking-tight ${
              theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
            }`}
          >
            Reports & Analytics
          </h1>
          <p
            className={`text-xs sm:text-sm font-normal mt-1 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Review calling velocity, disposition metrics, conversion rates, and export CSV logs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="download-csv-reports-btn"
            type="button"
            onClick={handleDownloadCSV}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Dials (Week)', value: '284', sub: '+24% vs last week' },
          { title: 'Connection Rate', value: '46.8%', sub: 'Target: >40%' },
          { title: 'Positive Outcome', value: '31.2%', sub: '14 Qualified Leads' },
          { title: 'Avg Call Duration', value: '3m 12s', sub: 'Optimal pitch length' },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className={`p-4 sm:p-5 rounded-xl transition-colors flex flex-col justify-between ${
              theme === 'dark'
                ? 'bg-slate-800 border border-slate-700'
                : 'bg-white border border-slate-200 shadow-xs'
            }`}
          >
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              {kpi.title}
            </p>
            <div
              className={`text-2xl sm:text-3xl font-semibold tracking-tight ${
                theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
              }`}
            >
              {kpi.value}
            </div>
            <p className="text-xs font-normal text-emerald-600 dark:text-emerald-400 mt-1">
              {kpi.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Call Dispositions */}
        <div
          id="call-outcomes-card"
          className={`lg:col-span-7 p-5 sm:p-6 rounded-xl transition-colors ${
            theme === 'dark'
              ? 'bg-slate-800 border border-slate-700'
              : 'bg-white border border-slate-200 shadow-xs'
          }`}
        >
          <div className="mb-4">
            <h2
              className={`text-sm font-medium ${
                theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
              }`}
            >
              Call Outcome Breakdown
            </h2>
            <p className="text-xs text-slate-400 font-normal mt-0.5">
              Disposition ratios across 42 dials today
            </p>
          </div>

          <div className="space-y-3.5">
            {outcomes.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-normal">
                  <span className="text-slate-600 dark:text-slate-300">
                    {item.label}
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {item.count} ({item.percent})
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full ${
                      item.color === 'blue'
                        ? 'bg-blue-600'
                        : item.color === 'amber'
                        ? 'bg-amber-500'
                        : 'bg-slate-400 dark:bg-slate-500'
                    }`}
                    style={{ width: item.percent }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Optimal Calling Windows */}
        <div
          id="hourly-activity-card"
          className={`lg:col-span-5 p-5 sm:p-6 rounded-xl transition-colors ${
            theme === 'dark'
              ? 'bg-slate-800 border border-slate-700'
              : 'bg-white border border-slate-200 shadow-xs'
          }`}
        >
          <h2
            className={`text-sm font-medium mb-0.5 ${
              theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
            }`}
          >
            Optimal Calling Windows
          </h2>
          <p className="text-xs text-slate-400 font-normal mb-4">
            Highest connect rates detected across your campaigns
          </p>

          <div className="space-y-2.5">
            {[
              { time: '10:00 AM – 11:30 AM', rate: '58% Connect Rate', status: 'Peak Window' },
              { time: '02:00 PM – 03:30 PM', rate: '49% Connect Rate', status: 'High Volume' },
              { time: '04:00 PM – 05:00 PM', rate: '32% Connect Rate', status: 'Wrap-up' },
            ].map((slot, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg flex items-center justify-between border ${
                  theme === 'dark'
                    ? 'bg-slate-900/60 border-slate-700/60'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {slot.time}
                  </p>
                  <p className="text-[11px] font-normal text-blue-600 dark:text-blue-400 mt-0.5">
                    {slot.rate}
                  </p>
                </div>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {slot.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EXPORTABLE CALL LOGS TABLE */}
      <div
        id="call-logs-export-section"
        className={`p-5 sm:p-6 rounded-xl transition-colors ${
          theme === 'dark'
            ? 'bg-slate-800 border border-slate-700'
            : 'bg-white border border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-500" />
              <h2
                className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                }`}
              >
                Call Logs & Conversion Data
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-normal mt-0.5">
              Complete audit trail of calls, dispositions, and scheduled follow-ups
            </p>
          </div>

          <button
            id="table-download-csv-btn"
            type="button"
            onClick={handleDownloadCSV}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV ({combinedLogs.length} Records)</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search call logs by lead name, phone, rep, or outcome..."
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs font-normal outline-none transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-900 text-slate-200 border border-slate-700 focus:border-blue-500'
                  : 'bg-white text-slate-800 border border-slate-200 focus:border-blue-600 shadow-xs'
              }`}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'CONVERTED', 'Interested', 'Hot Lead', 'Call Back', 'Not Interested'].map((out) => (
              <button
                key={out}
                type="button"
                onClick={() => setOutcomeFilter(out)}
                className={`px-2.5 py-1 rounded-lg text-xs font-normal cursor-pointer whitespace-nowrap transition-colors ${
                  outcomeFilter === out
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium'
                    : theme === 'dark'
                    ? 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-700'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {out}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr
                className={`border-b text-xs font-medium ${
                  theme === 'dark'
                    ? 'border-slate-700 text-slate-400'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                <th className="py-2.5 px-3">Lead & Contact</th>
                <th className="py-2.5 px-3">Sales Rep</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Outcome</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Follow-Up</th>
                <th className="py-2.5 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400 font-normal">
                    No call logs match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={`transition-colors ${
                      theme === 'dark' ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{log.leadName}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 font-normal">
                        <span className="font-mono">{log.phone}</span>
                        <span>•</span>
                        <span>{log.company}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-normal">
                      <span className="text-slate-700 dark:text-slate-300">
                        {log.assignedTo}
                      </span>
                      <div className="text-[11px] text-slate-400">{log.timestamp}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300 font-normal">
                      {log.durationFormatted}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                          log.outcome === 'Hot Lead'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : log.outcome === 'Interested'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : log.outcome === 'Call Back'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {log.outcome}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {log.isConverted.startsWith('Yes') ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle className="w-3 h-3" />
                          <span>Qualified</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-normal">Nurturing</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-normal">
                        {log.nextFollowUp}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                      {log.aiSummary || log.notes || 'No notes added'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
