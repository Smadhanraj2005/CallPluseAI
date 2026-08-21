import React from 'react';
import {
  UserCheck,
  Users,
  PhoneCall,
  LayoutDashboard,
  Sparkles,
  History,
  BarChart3,
} from 'lucide-react';
import { PageType, UserProfile } from '../types';
import { useTheme } from '../context/ThemeContext';

interface MobileNavProps {
  currentPage: PageType;
  user: UserProfile | null;
  onNavigate: (page: PageType) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentPage, user, onNavigate }) => {
  const { theme } = useTheme();
  const isManager = user?.role === 'Manager';

  const managerNavItems = [
    { id: 'manager' as PageType, label: 'Manage', icon: LayoutDashboard },
    { id: 'dashboard' as PageType, label: 'Activity', icon: UserCheck },
    { id: 'leads' as PageType, label: 'Leads', icon: Users },
    { id: 'history' as PageType, label: 'History', icon: History },
    { id: 'reports' as PageType, label: 'Reports', icon: BarChart3 },
  ];

  const employeeNavItems = [
    { id: 'leads' as PageType, label: 'Leads', icon: Users },
    { id: 'dialer' as PageType, label: 'Dialer', icon: PhoneCall },
    { id: 'history' as PageType, label: 'History', icon: History },
    { id: 'sentiment' as PageType, label: 'Sentiment', icon: Sparkles },
    { id: 'reports' as PageType, label: 'Reports', icon: BarChart3 },
  ];

  const navItems = isManager ? managerNavItems : employeeNavItems;

  return (
    <div
      id="mobile-bottom-nav"
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t transition-colors duration-150 ${
        theme === 'dark'
          ? 'bg-slate-900/95 border-slate-800 backdrop-blur-md shadow-lg'
          : 'bg-white/95 border-slate-200 backdrop-blur-md shadow-lg'
      }`}
    >
      <div className="flex items-center justify-around px-1 py-1.5 safe-area-pb">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 cursor-pointer min-w-[56px] ${
                isActive
                  ? theme === 'dark'
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg transition-all duration-150 ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-slate-800 text-blue-400'
                      : 'bg-blue-50 text-blue-600'
                    : ''
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[10px] font-medium mt-0.5 ${
                  isActive ? 'font-semibold text-blue-600 dark:text-blue-400' : ''
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

