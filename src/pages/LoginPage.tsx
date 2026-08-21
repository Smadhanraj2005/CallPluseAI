import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Mail,
  Lock,
  Eye,
  EyeOff,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { PageType, UserProfile } from '../types';

type LoginRole = 'Manager' | 'Employee';

interface LoginPageProps {
  onLogin: (user: UserProfile, targetPage?: PageType) => void;
  onNavigate?: (page: PageType) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { theme } = useTheme();

  // Selected Role: 'Manager' | 'Employee'
  const [selectedRole, setSelectedRole] = useState<LoginRole>('Manager');

  // Input states
  const [email, setEmail] = useState('manager@salesdialer.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  // Status feedback states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Switch role tabs
  const handleRoleChange = (role: LoginRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    setErrorDetails(null);
    setSuccessMessage(null);

    if (role === 'Manager') {
      setEmail('manager@salesdialer.com');
      setPassword('password123');
    } else {
      setEmail('alex.morgan@company.com');
      setPassword('password123');
    }
  };

  // Demo autofill helper for fast testing
  const handlePresetFill = (role: LoginRole, mismatchTest: boolean = false) => {
    setErrorMessage(null);
    setErrorDetails(null);
    setSuccessMessage(null);

    if (mismatchTest) {
      if (selectedRole === 'Manager') {
        setEmail('alex.morgan@company.com');
        setPassword('password123');
      } else {
        setEmail('manager@salesdialer.com');
        setPassword('password123');
      }
      return;
    }

    if (role === 'Manager') {
      setSelectedRole('Manager');
      setEmail('manager@salesdialer.com');
      setPassword('password123');
    } else {
      setSelectedRole('Employee');
      setEmail('alex.morgan@company.com');
      setPassword('password123');
    }
  };

  // Submission handler with RBAC validation
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorDetails(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setErrorMessage('Please fill in both email and password');
      setErrorDetails('Credentials are required to sign in.');
      return;
    }

    // Role mismatch check
    const isEmployeeEmail =
      trimmedEmail.includes('alex') ||
      trimmedEmail.includes('employee') ||
      trimmedEmail.includes('rajesh') ||
      trimmedEmail.includes('rep') ||
      trimmedEmail.includes('agent');

    const isManagerEmail =
      trimmedEmail.includes('manager') ||
      trimmedEmail.includes('sarah') ||
      trimmedEmail.includes('admin') ||
      trimmedEmail.includes('director');

    if (selectedRole === 'Manager' && isEmployeeEmail) {
      setErrorMessage('You selected the wrong login type');
      setErrorDetails('This account is registered as an Employee. Please select "Employee Login" above.');
      return;
    }

    if (selectedRole === 'Employee' && isManagerEmail) {
      setErrorMessage('You selected the wrong login type');
      setErrorDetails('This account is registered as a Manager. Please select "Manager Login" above.');
      return;
    }

    setIsSubmitting(true);

    if (selectedRole === 'Manager') {
      setSuccessMessage('Login successful! Redirecting to Manager Dashboard...');
      setTimeout(() => {
        onLogin(
          {
            name: 'Sarah Jenkins',
            email: trimmedEmail,
            role: 'Manager',
          },
          'manager'
        );
      }, 700);
    } else {
      setSuccessMessage('Login successful! Redirecting to Employee Leads...');
      setTimeout(() => {
        onLogin(
          {
            name: trimmedEmail.includes('rajesh') ? 'Rajesh Kumar' : 'Alex Morgan',
            email: trimmedEmail,
            role: 'Sales Representative',
          },
          'leads'
        );
      }, 700);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Top Right Corner Theme Toggle Button */}
      <div className="absolute top-3 right-3 sm:top-5 sm:right-6 z-20">
        <ThemeToggle id="login-corner-theme-toggle" showLabel />
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto">
        <div
          id="login-card-container"
          className={`p-6 sm:p-8 rounded-xl transition-all duration-200 ${
            theme === 'dark'
              ? 'bg-slate-800 border border-slate-700 subtle-glow-blue'
              : 'bg-white border border-slate-200 shadow-sm'
          }`}
        >
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div
              className={`w-11 h-11 mx-auto rounded-xl flex items-center justify-center mb-3 transition-all ${
                theme === 'dark'
                  ? selectedRole === 'Manager'
                    ? 'bg-purple-950/70 text-purple-300 border border-purple-800'
                    : 'bg-blue-950/70 text-blue-300 border border-blue-800'
                  : selectedRole === 'Manager'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              <PhoneCall className="w-5 h-5" />
            </div>

            <h1
              className={`text-xl sm:text-2xl font-semibold tracking-tight ${
                theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
              }`}
            >
              Sign In to Call<span className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}>Pulse</span>
            </h1>
            <p
              className={`text-xs sm:text-sm font-normal mt-1 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Select your role to access your workspace
            </p>
          </div>

          {/* 1. ROLE SELECTION: TWO BUTTONS AT TOP */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              {/* Manager Login Option */}
              <button
                id="manager-login-tab-btn"
                type="button"
                onClick={() => handleRoleChange('Manager')}
                className={`py-2.5 px-3 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
                  selectedRole === 'Manager'
                    ? theme === 'dark'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-purple-600 text-white shadow-xs'
                    : theme === 'dark'
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Manager Login</span>
              </button>

              {/* Employee Login Option */}
              <button
                id="employee-login-tab-btn"
                type="button"
                onClick={() => handleRoleChange('Employee')}
                className={`py-2.5 px-3 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
                  selectedRole === 'Employee'
                    ? theme === 'dark'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-blue-600 text-white shadow-xs'
                    : theme === 'dark'
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Employee Login</span>
              </button>
            </div>
          </div>

          {/* Error Message Banner */}
          {errorMessage && (
            <div
              id="login-error-banner"
              className={`mb-5 p-3 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm transition-all ${
                theme === 'dark'
                  ? 'bg-rose-950/60 border border-rose-800/80 text-rose-200'
                  : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="block font-medium">{errorMessage}</span>
                {errorDetails && <p className="mt-0.5 text-xs text-rose-500/90 dark:text-rose-300/80 font-normal">{errorDetails}</p>}
              </div>
            </div>
          )}

          {/* Success Message Banner */}
          {successMessage && (
            <div
              id="login-success-banner"
              className={`mb-5 p-3 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 2. EMAIL, PASSWORD & LOGIN BUTTON */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Work Email Field */}
            <div>
              <label
                htmlFor="login-email-input"
                className={`block text-xs font-medium uppercase tracking-wider mb-1.5 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) {
                      setErrorMessage(null);
                      setErrorDetails(null);
                    }
                  }}
                  placeholder="name@company.com"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm font-normal outline-none transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-900 text-slate-100 border border-slate-700 focus:border-blue-500'
                      : 'bg-slate-50 text-slate-900 border border-slate-300 focus:bg-white focus:border-blue-600'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="login-password-input"
                className={`block text-xs font-medium uppercase tracking-wider mb-1.5 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) {
                      setErrorMessage(null);
                      setErrorDetails(null);
                    }
                  }}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-normal outline-none transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-900 text-slate-100 border border-slate-700 focus:border-blue-500'
                      : 'bg-slate-50 text-slate-900 border border-slate-300 focus:bg-white focus:border-blue-600'
                  }`}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Large Primary Login Button */}
            <div className="pt-2">
              <button
                id="main-login-btn"
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-xl font-medium text-sm tracking-normal flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
                  selectedRole === 'Manager'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                }`}
              >
                <span>{isSubmitting ? 'Signing in...' : `Sign in as ${selectedRole}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
