import React from 'react';
import { PhoneCall, LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { PageType, UserProfile } from '../types';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  currentPage: PageType;
  user: UserProfile | null;
  onNavigate: (page: PageType) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  user,
  onNavigate,
  onLogout,
}) => {
  const { theme } = useTheme();
  const isManager = user?.role === 'Manager';

  return (
    <header
      id="main-app-header"
      className={`sticky top-0 z-30 w-full transition-colors duration-150 ${
        theme === 'dark'
          ? 'bg-slate-900/95 border-b border-slate-800 backdrop-blur-md'
          : 'bg-white border-b border-slate-300 backdrop-blur-md shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onNavigate(user ? (isManager ? 'manager' : 'leads') : 'login')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                theme === 'dark'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              }`}
            >
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-base font-black tracking-tight ${
                    theme === 'dark' ? 'text-white' : 'text-slate-950'
                  }`}
                >
                  Call<span className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}>Pulse</span>
                </span>
                {user && (
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-xs ${
                      isManager
                        ? theme === 'dark'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-purple-100 text-purple-800 border border-purple-300'
                        : theme === 'dark'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}
                  >
                    {isManager ? 'Manager' : 'Employee'}
                  </span>
                )}
              </div>
              <p
                className={`text-xs hidden sm:block font-semibold ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-700'
                }`}
              >
                Sales Dialer & Call Management
              </p>
            </div>
          </div>
        </div>

        {/* Center: Top Navigation Links */}
        {user && (
          <nav className="hidden md:flex items-center gap-1.5">
            {isManager ? (
              <>
                <button
                  onClick={() => onNavigate('manager')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === 'manager' || currentPage === 'dashboard'
                      ? theme === 'dark'
                        ? 'bg-slate-800 text-blue-400 border border-slate-700'
                        : 'bg-blue-600 text-white shadow-xs'
                      : theme === 'dark'
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => onNavigate('leads')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === 'leads'
                      ? theme === 'dark'
                        ? 'bg-slate-800 text-blue-400 border border-slate-700'
                        : 'bg-blue-600 text-white shadow-xs'
                      : theme === 'dark'
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  Leads & Assignment
                </button>
                <button
                  onClick={() => onNavigate('history')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    currentPage === 'history'
                      ? theme === 'dark'
                        ? 'bg-slate-800 text-blue-400 border border-slate-700'
                        : 'bg-blue-600 text-white shadow-xs'
                      : theme === 'dark'
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <span>Call History</span>
                </button>
                <button
                  onClick={() => onNavigate('sentiment')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === 'sentiment'
                      ? theme === 'dark'
                        ? 'bg-slate-800 text-blue-400 border border-slate-700'
                        : 'bg-blue-600 text-white shadow-xs'
                      : theme === 'dark'
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  Sentiment AI
                </button>
                <button
                  onClick={() => onNavigate('reports')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === 'reports'
                      ? theme === 'dark'
                        ? 'bg-slate-800 text-blue-400 border border-slate-700'
                        : 'bg-blue-600 text-white shadow-xs'
                      : theme === 'dark'
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  Reports
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('leads')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === 'leads'
                      ? theme === 'dark'
                        ? 'bg-slate-800 text-blue-400 border border-slate-700'
                        : 'bg-blue-600 text-white shadow-xs'
                      : theme === 'dark'
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  My Assigned Leads
                </button>
                <button
                  onClick={() => onNavigate('dialer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === 'dialer'
                      ? theme === 'dark'
                        ? 'bg-slate-800 text-blue-400 border border-slate-700'
                        : 'bg-blue-600 text-white shadow-xs'
                      : theme === 'dark'
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  Dialer Screen
                </button>
                <button
                  onClick={() => onNavigate('history')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    currentPage === 'history'
                      ? theme === 'dark'
                        ? 'bg-slate-800 text-blue-400 border border-slate-700'
                        : 'bg-blue-600 text-white shadow-xs'
                      : theme === 'dark'
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <span>Call History</span>
                </button>
                <button
                  onClick={() => onNavigate('sentiment')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === 'sentiment'
                      ? theme === 'dark'
                        ? 'bg-slate-800 text-blue-400 border border-slate-700'
                        : 'bg-blue-600 text-white shadow-xs'
                      : theme === 'dark'
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  Sentiment AI
                </button>
                <button
                  onClick={() => onNavigate('reports')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === 'reports'
                      ? theme === 'dark'
                        ? 'bg-slate-800 text-blue-400 border border-slate-700'
                        : 'bg-blue-600 text-white shadow-xs'
                      : theme === 'dark'
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  Performance Stats
                </button>
              </>
            )}
          </nav>
        )}

        {/* Right: Theme Toggle & User Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle id="header-theme-toggle" />

          {user ? (
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="hidden sm:flex flex-col text-right">
                <span
                  className={`text-xs font-medium ${
                    theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  {user.name}
                </span>
                <span
                  className={`text-[11px] font-normal ${
                    isManager
                      ? theme === 'dark'
                        ? 'text-purple-400'
                        : 'text-purple-600'
                      : theme === 'dark'
                        ? 'text-blue-400'
                        : 'text-blue-600'
                  }`}
                >
                  {user.role}
                </span>
              </div>

              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-medium text-xs ${
                  isManager
                    ? theme === 'dark'
                      ? 'bg-purple-950/80 text-purple-300 border border-purple-700'
                      : 'bg-purple-100 text-purple-700 border border-purple-200'
                    : theme === 'dark'
                    ? 'bg-blue-950/80 text-blue-300 border border-blue-700'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}
                title={user.name}
              >
                {user.name.charAt(0)}
              </div>

              <button
                id="header-logout-btn"
                onClick={onLogout}
                title="Logout"
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                    : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span className="sr-only">Sign out</span>
              </button>
            </div>
          ) : (
            <button
              id="login-header-btn"
              onClick={() => onNavigate('login')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

