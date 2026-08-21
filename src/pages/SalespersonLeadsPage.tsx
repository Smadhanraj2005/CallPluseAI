import React, { useState, useMemo } from 'react';
import {
  PhoneCall,
  Search,
  CheckCircle2,
  PhoneOff,
  Calendar,
  X,
  User,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLeads, SALES_REPRESENTATIVES } from '../context/LeadContext';
import { Lead } from '../types';

interface SalespersonLeadsPageProps {
  onSelectLeadForDialing: (lead: Lead) => void;
  currentUser?: string;
}

export const SalespersonLeadsPage: React.FC<SalespersonLeadsPageProps> = ({
  onSelectLeadForDialing,
  currentUser = 'Alex Morgan',
}) => {
  const { theme } = useTheme();
  const { leads, setSelectedLeadId, missedCalls, removeMissedCall } = useLeads();

  const [selectedRep, setSelectedRep] = useState<string>(currentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'my' | 'missed' | 'all'>('my');
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [activeTab, selectedRep]);

  // Filter leads by salesperson tab, status chip, and search query (name or phone)
  const displayedLeads = useMemo(() => {
    return leads.filter((lead) => {
      const q = searchQuery.trim().toLowerCase();
      const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
      const cleanSearch = searchQuery.replace(/[^0-9]/g, '');

      const matchesSearch =
        !q ||
        lead.name.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        (cleanSearch.length >= 3 && cleanPhone.includes(cleanSearch)) ||
        lead.company.toLowerCase().includes(q) ||
        lead.status.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'ALL' || lead.status.toLowerCase() === statusFilter.toLowerCase();

      if (activeTab === 'my') {
        return matchesSearch && matchesStatus && lead.assignedTo === selectedRep;
      }
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, statusFilter, activeTab, selectedRep]);

  const displayedMissed = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return missedCalls.filter((mc) => {
      return (
        !q ||
        mc.name.toLowerCase().includes(q) ||
        mc.phone.toLowerCase().includes(q) ||
        mc.company.toLowerCase().includes(q)
      );
    });
  }, [missedCalls, searchQuery]);

  const handleCallClick = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    onSelectLeadForDialing(lead);
  };

  const handleCallMissedAgain = (leadId: string, missedId: string) => {
    const targetLead = leads.find((l) => l.id === leadId);
    removeMissedCall(missedId);
    if (targetLead) {
      handleCallClick(targetLead);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 h-20"></div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-28 h-10 rounded-xl bg-slate-200/70 dark:bg-slate-800/70"></div>
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 h-20 flex items-center justify-between">
              <div className="space-y-2">
                <div className="w-36 h-4 rounded bg-slate-300 dark:bg-slate-700"></div>
                <div className="w-48 h-3 rounded bg-slate-300 dark:bg-slate-700"></div>
              </div>
              <div className="w-24 h-9 rounded-xl bg-slate-300 dark:bg-slate-700"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Rep Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className={`text-xl sm:text-2xl font-semibold tracking-tight ${
              theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
            }`}
          >
            Assigned Leads
          </h1>
          <p
            className={`text-xs sm:text-sm font-normal mt-1 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Choose a contact and tap Call to start dialing with real-time call tracking
          </p>
        </div>

        {/* Salesperson Filter Switcher */}
        <div className="flex items-center gap-2">
          <label htmlFor="salesperson-view-filter" className="text-xs font-normal text-slate-400">
            Queue:
          </label>
          <select
            id="salesperson-view-filter"
            value={selectedRep}
            onChange={(e) => {
              setSelectedRep(e.target.value);
              setActiveTab('my');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium outline-none cursor-pointer transition-colors ${
              theme === 'dark'
                ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600'
                : 'bg-white text-slate-800 border border-slate-200 shadow-xs'
            }`}
          >
            {SALES_REPRESENTATIVES.map((rep) => (
              <option key={rep} value={rep} className={theme === 'dark' ? 'bg-slate-900 text-slate-200' : ''}>
                {rep} {rep === currentUser ? '(You)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Bar & Tabs */}
      <div className="space-y-3">
        {/* Prominent Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="leads-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by contact name, phone number, company..."
            className={`w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm font-normal outline-none transition-colors ${
              theme === 'dark'
                ? 'bg-slate-800 text-slate-200 border border-slate-700 focus:border-blue-500'
                : 'bg-white text-slate-800 border border-slate-200 focus:border-blue-600 shadow-xs'
            }`}
          />
          {searchQuery && (
            <button
              id="clear-leads-search-btn"
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tabs & Quick Status Chips */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Main Segmented Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
            {/* My Leads Tab */}
            <button
              id="tab-my-leads"
              type="button"
              onClick={() => setActiveTab('my')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'my'
                  ? theme === 'dark'
                    ? 'bg-slate-800 text-blue-400 border border-slate-700'
                    : 'bg-white text-slate-800 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              My Queue ({leads.filter((l) => l.assignedTo === selectedRep).length})
            </button>

            {/* Missed Calls Tab with badge */}
            <button
              id="tab-missed-leads"
              type="button"
              onClick={() => setActiveTab('missed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === 'missed'
                  ? theme === 'dark'
                    ? 'bg-slate-800 text-rose-400 border border-slate-700'
                    : 'bg-white text-rose-700 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Missed Calls</span>
              {missedCalls.length > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  {missedCalls.length}
                </span>
              )}
            </button>

            {/* All Team Leads */}
            <button
              id="tab-all-leads"
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? theme === 'dark'
                    ? 'bg-slate-800 text-blue-400 border border-slate-700'
                    : 'bg-white text-slate-800 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All Leads ({leads.length})
            </button>
          </div>

          {/* Quick Status Filter Chips */}
          {activeTab !== 'missed' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['ALL', 'Hot Lead', 'Interested', 'Call Back', 'New'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    statusFilter === status
                      ? theme === 'dark'
                        ? 'bg-slate-700 text-blue-400 border border-slate-600'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                      : theme === 'dark'
                      ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-0.5">
          <span>
            Showing <strong className={theme === 'dark' ? 'text-slate-200 font-medium' : 'text-slate-700 font-medium'}>{activeTab === 'missed' ? displayedMissed.length : displayedLeads.length}</strong> {activeTab === 'missed' ? 'missed calls' : 'leads'}
            {searchQuery ? ` matching "${searchQuery}"` : ''}
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-blue-500 hover:underline cursor-pointer font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      </div>

      {/* Missed Calls Tab */}
      {activeTab === 'missed' ? (
        <div className="space-y-3">
          {displayedMissed.length === 0 ? (
            <div
              className={`p-10 text-center rounded-xl ${
                theme === 'dark' ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-white border border-slate-200 text-slate-500 shadow-xs'
              }`}
            >
              <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">No missed calls in queue</p>
              <p className="text-xs mt-1 font-normal text-slate-400">All callback requests are up to date.</p>
            </div>
          ) : (
            displayedMissed.map((mc) => (
              <div
                key={mc.id}
                id={`missed-lead-row-${mc.id}`}
                className={`p-4 rounded-xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  theme === 'dark'
                    ? 'bg-slate-800 border border-slate-700 hover:border-slate-600'
                    : 'bg-white border border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-medium text-sm ${
                      theme === 'dark'
                        ? 'bg-rose-950/70 text-rose-300 border border-rose-800'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <PhoneOff className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                        }`}
                      >
                        {mc.name}
                      </h3>
                      <span className="text-[10px] font-medium text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                        Missed {mc.timeAgo}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs mt-0.5 flex-wrap font-normal">
                      <span className="font-mono text-xs text-rose-500">
                        {mc.phone}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {mc.company}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Call Again Button */}
                <button
                  id={`tab-call-again-btn-${mc.id}`}
                  type="button"
                  onClick={() => handleCallMissedAgain(mc.leadId, mc.id)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call Back</span>
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Regular Leads List */
        <div className="space-y-3">
          {displayedLeads.length === 0 ? (
            <div
              className={`p-10 text-center rounded-xl ${
                theme === 'dark' ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-white border border-slate-200 text-slate-500 shadow-xs'
              }`}
            >
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">No leads match your filter criteria.</p>
              <p className="text-xs mt-1 font-normal text-slate-400">Try adjusting your search terms or clearing the status filter.</p>
            </div>
          ) : (
            displayedLeads.map((lead) => {
              return (
                <div
                  key={lead.id}
                  id={`lead-card-${lead.id}`}
                  className={`p-4 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    theme === 'dark'
                      ? 'bg-slate-800 border border-slate-700 hover:border-slate-600'
                      : 'bg-white border border-slate-200 shadow-xs hover:border-slate-300'
                  }`}
                >
                  {/* Left: Lead Identity & Phone Info */}
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Lead Avatar */}
                    <div
                      className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-medium text-sm ${
                        theme === 'dark'
                          ? 'bg-slate-700 text-slate-200 border border-slate-600'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {lead.name.charAt(0)}
                    </div>

                    {/* Name, Phone & Company */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`text-sm font-medium ${
                            theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                          }`}
                        >
                          {lead.name}
                        </h3>

                        {/* Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
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
                              : lead.status === 'Wrong Number'
                              ? theme === 'dark'
                                ? 'bg-rose-950/70 text-rose-300 border border-rose-800'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                              : theme === 'dark'
                              ? 'bg-slate-700/60 text-slate-300 border border-slate-600'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs mt-0.5 flex-wrap font-normal">
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                          {lead.phone}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {lead.company}
                        </span>
                        {lead.assignedTo && activeTab === 'all' && (
                          <>
                            <span className="text-slate-400">•</span>
                            <span className="text-blue-600 dark:text-blue-400 text-[11px]">
                              {lead.assignedTo}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Next Follow Up appointment if available */}
                      {lead.nextFollowUpDate && (
                        <div className="flex items-center gap-1 text-[11px] mt-1 text-amber-600 dark:text-amber-400 font-normal">
                          <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>Follow up: {lead.nextFollowUpDate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Call Action Button */}
                  <div className="flex items-center gap-2 sm:self-center">
                    <button
                      id={`call-lead-btn-${lead.id}`}
                      type="button"
                      onClick={() => handleCallClick(lead)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Call Lead</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
