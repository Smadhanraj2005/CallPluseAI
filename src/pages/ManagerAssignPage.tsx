import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  UserCheck,
  CheckCircle2,
  Users,
  Search,
  Plus,
  Sparkles,
  PhoneCall,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLeads, SALES_REPRESENTATIVES } from '../context/LeadContext';
import { LeadStatus } from '../types';

interface ManagerAssignPageProps {
  onNavigateToDialer?: () => void;
}

export const ManagerAssignPage: React.FC<ManagerAssignPageProps> = () => {
  const { theme } = useTheme();
  const { leads, addLeads, assignLead, assignMultipleLeads, activityFeed } = useLeads();

  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkSalesperson, setBulkSalesperson] = useState<string>(SALES_REPRESENTATIVES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter leads based on search query and status
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Toggle single lead selection
  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle select all filtered leads
  const toggleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  // Bulk Assign Action
  const handleBulkAssign = () => {
    if (selectedLeadIds.length === 0) {
      showToast('Please select at least one lead from the table to assign.');
      return;
    }
    assignMultipleLeads(selectedLeadIds, bulkSalesperson);
    showToast(`Successfully assigned ${selectedLeadIds.length} lead(s) to ${bulkSalesperson}`);
    setSelectedLeadIds([]);
  };

  // Individual lead assign dropdown handler
  const handleSingleAssign = (leadId: string, salesperson: string) => {
    assignLead(leadId, salesperson);
    showToast(`Lead assigned to ${salesperson}`);
  };

  // Handle Excel/CSV file upload simulation & parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const lines = content.split('\n').filter((line) => line.trim().length > 0);
        const imported: Array<{
          name: string;
          phone: string;
          company: string;
          status: LeadStatus;
          assignedTo: string;
          notes: string;
        }> = [];

        const startIdx = lines[0].toLowerCase().includes('name') ? 1 : 0;

        for (let i = startIdx; i < lines.length; i++) {
          const cols = lines[i].split(/[,;\t]/).map((c) => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length >= 2 && cols[0]) {
            imported.push({
              name: cols[0],
              phone: cols[1] || '+91 9000000000',
              company: cols[2] || 'Enterprise Client',
              status: 'New',
              assignedTo: 'Unassigned',
              notes: cols[3] || 'Imported via Excel upload',
            });
          }
        }

        if (imported.length > 0) {
          addLeads(imported);
          showToast(`Uploaded ${imported.length} new leads from ${file.name}`);
        } else {
          loadSampleExcelBatch();
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Preset sample batch loader
  const loadSampleExcelBatch = () => {
    const sampleBatch: Array<{
      name: string;
      phone: string;
      company: string;
      status: LeadStatus;
      assignedTo: string;
      notes: string;
    }> = [
      {
        name: 'Venkatesh Raman',
        phone: '+91 9884511223',
        company: 'Indus Infra Tech',
        status: 'New',
        assignedTo: 'Unassigned',
        notes: 'Requested Q3 software deployment proposal',
      },
      {
        name: 'Sneha Nambiar',
        phone: '+91 9741255889',
        company: 'Orion Logistics Asia',
        status: 'New',
        assignedTo: 'Unassigned',
        notes: 'Inbound enquiry from product webinar',
      },
      {
        name: 'Arjun Somani',
        phone: '+91 9611844772',
        company: 'FinEdge Capital',
        status: 'New',
        assignedTo: 'Unassigned',
        notes: 'Evaluating cloud dialer solutions for 25 agents',
      },
    ];
    addLeads(sampleBatch);
    showToast('Imported 3 sample Excel sheet leads into queue');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          id="manager-toast"
          className={`p-3.5 rounded-xl flex items-center justify-between text-xs sm:text-sm font-medium transition-all ${
            theme === 'dark'
              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer font-medium px-2 text-slate-400"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner: Title & Excel Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className={`text-xl sm:text-2xl font-semibold tracking-tight ${
              theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
            }`}
          >
            Lead Assignment & Team Control
          </h1>
          <p
            className={`text-xs sm:text-sm font-normal mt-1 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Import lead sheets, distribute contacts to sales reps, and monitor live status
          </p>
        </div>

        {/* Upload Excel Button & Sample Loader */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv, .txt"
            className="hidden"
            id="excel-file-input"
          />

          {/* Main Upload Excel Button */}
          <button
            id="upload-excel-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload Excel</span>
          </button>

          {/* Sample Preset Button */}
          <button
            id="sample-excel-btn"
            type="button"
            onClick={loadSampleExcelBatch}
            title="Import demo Excel records"
            className={`px-3 py-2 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Add Sample Leads</span>
          </button>
        </div>
      </div>

      {/* Real-time Team Activity Stream */}
      <div
        id="manager-realtime-activity-feed"
        className={`p-4 sm:p-5 rounded-xl transition-all ${
          theme === 'dark'
            ? 'bg-slate-800 border border-slate-700'
            : 'bg-white border border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            <h2
              className={`text-sm font-medium ${
                theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              Live Activity Stream
            </h2>
          </div>
          <span className="text-[11px] font-normal text-slate-400">
            Real-time updates
          </span>
        </div>

        <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-700/60 max-h-40 overflow-y-auto pr-1">
          {activityFeed.slice(0, 4).map((item) => (
            <div
              key={item.id}
              id={`activity-item-${item.id}`}
              className="py-2 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    item.type === 'calling'
                      ? theme === 'dark'
                        ? 'bg-blue-950/70 text-blue-400 border border-blue-800'
                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                      : theme === 'dark'
                      ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}
                >
                  {item.type === 'calling' ? (
                    <PhoneCall className="w-3 h-3" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                </div>

                <span
                  className={`font-normal ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  {item.action}
                </span>
              </div>

              <span className="text-[11px] shrink-0 text-slate-400 font-normal">
                {item.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Batch Assignment Action Bar */}
      <div
        id="bulk-assign-bar"
        className={`p-4 sm:p-5 rounded-xl transition-all ${
          theme === 'dark'
            ? 'bg-slate-800 border border-slate-700'
            : 'bg-white border border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs ${
                theme === 'dark'
                  ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2
                className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                Batch Assign Leads
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                {selectedLeadIds.length > 0
                  ? `${selectedLeadIds.length} lead(s) selected in table`
                  : 'Select checkboxes in the table below to assign multiple leads at once'}
              </p>
            </div>
          </div>

          {/* Salesperson Dropdown + Assign Button */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <div className="w-full sm:w-auto">
              <label htmlFor="bulk-salesperson-select" className="sr-only">
                Select Salesperson
              </label>
              <select
                id="bulk-salesperson-select"
                value={bulkSalesperson}
                onChange={(e) => setBulkSalesperson(e.target.value)}
                className={`w-full sm:w-52 px-3 py-2 rounded-xl text-xs sm:text-sm font-normal outline-none transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-slate-200 border border-slate-700 focus:border-blue-500'
                    : 'bg-slate-50 text-slate-800 border border-slate-300 focus:border-blue-600'
                }`}
              >
                {SALES_REPRESENTATIVES.map((rep) => (
                  <option key={rep} value={rep} className={theme === 'dark' ? 'bg-slate-900 text-slate-200' : ''}>
                    Assign to: {rep}
                  </option>
                ))}
              </select>
            </div>

            <button
              id="big-assign-btn"
              type="button"
              onClick={handleBulkAssign}
              className="w-full sm:w-auto px-5 py-2 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              <UserCheck className="w-4 h-4" />
              <span>Assign Leads</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="manager-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, phone, company..."
            className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-xs sm:text-sm font-normal outline-none transition-colors ${
              theme === 'dark'
                ? 'bg-slate-800 text-slate-200 border border-slate-700 focus:border-blue-500'
                : 'bg-white text-slate-800 border border-slate-200 focus:border-blue-600'
            }`}
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'New', 'Hot Lead', 'Interested', 'Call Back'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? theme === 'dark'
                    ? 'bg-slate-700 text-blue-400 border border-slate-600'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                  : theme === 'dark'
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st === 'all' ? 'All Statuses' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div
        id="leads-assignment-table-card"
        className={`rounded-xl overflow-hidden transition-all ${
          theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200 shadow-xs'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={`border-b text-xs font-medium ${
                  theme === 'dark'
                    ? 'bg-slate-900/60 border-slate-700 text-slate-400'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <th className="p-3.5 w-12 text-center">
                  <input
                    type="checkbox"
                    id="select-all-leads-checkbox"
                    checked={
                      filteredLeads.length > 0 &&
                      selectedLeadIds.length === filteredLeads.length
                    }
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded cursor-pointer accent-blue-600"
                  />
                </th>
                <th className="p-3.5">Lead Name</th>
                <th className="p-3.5">Phone Number</th>
                <th className="p-3.5 hidden md:table-cell">Company</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Assigned To</th>
                <th className="p-3.5 text-right">Quick Assign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs sm:text-sm">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-normal">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.id);

                  return (
                    <tr
                      key={lead.id}
                      id={`lead-row-${lead.id}`}
                      className={`transition-colors ${
                        isSelected
                          ? theme === 'dark'
                            ? 'bg-blue-950/30'
                            : 'bg-blue-50/50'
                          : theme === 'dark'
                          ? 'hover:bg-slate-700/40'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          id={`lead-check-${lead.id}`}
                          checked={isSelected}
                          onChange={() => toggleSelectLead(lead.id)}
                          className="w-3.5 h-3.5 rounded cursor-pointer accent-blue-600"
                        />
                      </td>

                      {/* Lead Name */}
                      <td className="p-3.5 font-medium">
                        <div className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>
                          {lead.name}
                        </div>
                        <div className="text-xs font-normal text-slate-400 md:hidden">
                          {lead.company}
                        </div>
                      </td>

                      {/* Phone Number */}
                      <td className="p-3.5 font-mono text-xs font-normal">
                        <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
                          {lead.phone}
                        </span>
                      </td>

                      {/* Company */}
                      <td className="p-3.5 hidden md:table-cell font-normal">
                        <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                          {lead.company}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium inline-block ${
                            lead.status === 'Hot Lead'
                              ? theme === 'dark'
                                ? 'bg-purple-950/70 text-purple-300 border border-purple-800'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                              : lead.status === 'Interested'
                              ? theme === 'dark'
                                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : lead.status === 'Call Back'
                              ? theme === 'dark'
                                ? 'bg-amber-950/70 text-amber-300 border border-amber-800'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                              : theme === 'dark'
                              ? 'bg-slate-700/60 text-slate-300 border border-slate-600'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>

                      {/* Current Assigned To */}
                      <td className="p-3.5 font-normal">
                        <span
                          className={
                            lead.assignedTo === 'Unassigned'
                              ? 'text-amber-500 italic'
                              : theme === 'dark'
                              ? 'text-blue-400'
                              : 'text-blue-600'
                          }
                        >
                          {lead.assignedTo}
                        </span>
                      </td>

                      {/* Dropdown to assign lead */}
                      <td className="p-3.5 text-right">
                        <select
                          id={`assign-select-${lead.id}`}
                          value={lead.assignedTo}
                          onChange={(e) => handleSingleAssign(lead.id, e.target.value)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-normal outline-none cursor-pointer transition-colors ${
                            theme === 'dark'
                              ? 'bg-slate-900 text-slate-200 border border-slate-700 hover:border-blue-500'
                              : 'bg-slate-50 text-slate-800 border border-slate-200 hover:bg-white'
                          }`}
                        >
                          <option value="Unassigned">Unassigned</option>
                          {SALES_REPRESENTATIVES.map((rep) => (
                            <option key={rep} value={rep} className={theme === 'dark' ? 'bg-slate-900 text-slate-200' : ''}>
                              {rep}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
