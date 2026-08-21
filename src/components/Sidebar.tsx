import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  PhoneCall,
  BarChart3,
  Sparkles,
  History,
} from 'lucide-react';
import { PageType, UserProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLeads } from '../context/LeadContext';

interface SidebarProps {
  currentPage: PageType;
  user: UserProfile | null;
  onNavigate: (page: PageType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, user, onNavigate }) => {
  const { theme } = useTheme();
  const { leads, recordings } = useLeads();

  const isManager = user?.role === 'Manager';
  const unassignedCount = leads.filter((l) => l.assignedTo === 'Unassigned').length;

  const managerNavItems = [
    {
      id: 'manager' as PageType,
      label: 'Manager Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'dashboard' as PageType,
      label: 'Live Activity & Roster',
      icon: UserCheck,
      badge: unassignedCount > 0 ? `${unassignedCount} new` : null,
    },
    {
      id: 'leads' as PageType,
      label: 'Leads & Assignments',
      icon: Users,
      badge: `${leads.length}`,
    },
    {
      id: 'history' as PageType,
      label: 'Call History',
      icon: History,
      badge: null,
    },
    {
      id: 'sentiment' as PageType,
      label: 'Call Sentiment AI',
      icon: Sparkles,
      badge: `${recordings.length}`,
    },
    {
      id: 'reports' as PageType,
      label: 'Team Reports & CSV',
      icon: BarChart3,
      badge: null,
    },
  ];

  const employeeNavItems = [
    {
      id: 'leads' as PageType,
      label: 'Assigned Leads',
      icon: Users,
      badge: `${leads.filter((l) => l.assignedTo === (user?.name || 'Alex Morgan')).length || leads.length}`,
    },
    {
      id: 'dialer' as PageType,
      label: 'Dialer Screen',
      icon: PhoneCall,
      badge: 'Speed',
    },
    {
      id: 'history' as PageType,
      label: 'Call History',
      icon: History,
      badge: null,
    },
    {
      id: 'sentiment' as PageType,
      label: 'Call Sentiment AI',
      icon: Sparkles,
      badge: 'AI NLP',
    },
    {
      id: 'reports' as PageType,
      label: 'My Performance',
      icon: BarChart3,
      badge: null,
    },
  ];

  const navItems = isManager ? managerNavItems : employeeNavItems;

  return (
    <aside
      id="desktop-sidebar"
      className={`hidden md:flex flex-col w-64 shrink-0 transition-colors duration-150 ${
        theme === 'dark'
          ? 'bg-slate-900 border-r border-slate-800'
          : 'bg-white border-r border-slate-300'
      }`}
    >
      {/* Navigation items */}
      <div className="flex-1 py-6 px-3.5 space-y-4">
        <div className="px-3 flex items-center justify-between">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isManager ? 'Management' : 'Sales Workspace'}
          </p>
          <span
            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs ${
              isManager
                ? theme === 'dark'
                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                  : 'bg-purple-100 text-purple-800 border border-purple-300'
                : theme === 'dark'
                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                : 'bg-blue-100 text-blue-800 border border-blue-300'
            }`}
          >
            {isManager ? 'Manager' : 'Rep'}
          </span>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentPage === item.id ||
              (item.id === 'manager' && currentPage === 'manager') ||
              (item.id === 'dashboard' && currentPage === 'dashboard');

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-slate-800 text-blue-400 border border-slate-700'
                      : 'bg-blue-600 text-white shadow-md shadow-blue-600/25 border border-blue-600'
                    : theme === 'dark'
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                    : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? theme === 'dark'
                          ? 'text-blue-400'
                          : 'text-white'
                        : theme === 'dark'
                        ? 'text-slate-400'
                        : 'text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isActive
                        ? theme === 'dark'
                          ? 'bg-blue-900 text-blue-300'
                          : 'bg-white/20 text-white'
                        : item.badge === 'Live'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        : item.badge === '3D'
                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                        : theme === 'dark'
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>


      {/* Role description panel */}
      <div className="p-3.5 border-t border-slate-200 dark:border-slate-800">
        <div
          className={`p-3 rounded-xl border transition-all ${
            theme === 'dark'
              ? 'bg-slate-800/60 border-slate-700/60 text-slate-300'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
              Active Mode
            </span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {user?.role || 'Guest'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {isManager
              ? 'Lead assignment, rep roster & reports.'
              : 'Assigned dialer queue & personal tracking.'}
          </p>
        </div>
      </div>
    </aside>
  );
};
