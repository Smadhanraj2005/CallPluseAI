import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  id?: string;
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  id = 'theme-toggle-btn',
  className = '',
  showLabel = false,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      id={id}
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
        theme === 'dark'
          ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:border-blue-500/40 hover:text-white'
          : 'bg-white text-slate-600 border border-slate-200 shadow-xs hover:bg-slate-50 hover:text-slate-900'
      } ${className}`}
      title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-slate-500" />
      )}
      {showLabel && (
        <span className="text-xs hidden sm:inline font-medium text-slate-500 dark:text-slate-400">
          {theme === 'dark' ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};
