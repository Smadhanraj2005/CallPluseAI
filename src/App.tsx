import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LeadProvider, useLeads } from './context/LeadContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ManagerAssignPage } from './pages/ManagerAssignPage';
import { SalespersonLeadsPage } from './pages/SalespersonLeadsPage';
import { DialerPage } from './pages/DialerPage';
import { ReportsPage } from './pages/ReportsPage';
import { CallSentimentPage } from './pages/CallSentimentPage';
import { CallHistoryPage } from './pages/CallHistoryPage';
import { PageType, UserProfile, Lead } from './types';

const MainLayout: React.FC = () => {
  const { theme } = useTheme();
  const { setSelectedLeadId } = useLeads();
  const [currentPage, setCurrentPage] = useState<PageType>('login');
  const [user, setUser] = useState<UserProfile | null>(null);

  const handleLogin = (newUser: UserProfile, targetPage?: PageType) => {
    setUser(newUser);
    if (targetPage) {
      setCurrentPage(targetPage);
    } else if (newUser.role === 'Manager') {
      setCurrentPage('manager');
    } else {
      setCurrentPage('leads');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('login');
  };

  const handleSelectLeadForDialing = (leadOrPhone: Lead | string, name?: string) => {
    if (typeof leadOrPhone === 'object') {
      setSelectedLeadId(leadOrPhone.id);
    }
    setCurrentPage('dialer');
  };

  return (
    <div
      id="app-root-container"
      className={`min-h-screen flex flex-col transition-colors duration-300 font-sans ${
        theme === 'dark'
          ? 'bg-black text-white'
          : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Header */}
      <Header
        currentPage={currentPage}
        user={user}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      />

      {/* Main Body Shell */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {/* Desktop Sidebar */}
        {user && currentPage !== 'login' && (
          <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} user={user} />
        )}

        {/* Dynamic Page Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 w-full max-w-full overflow-x-hidden">
          {currentPage === 'login' && (
            <LoginPage onLogin={handleLogin} onNavigate={setCurrentPage} />
          )}

          {/* 1. Manager Lead Assignment page */}
          {currentPage === 'manager' && (
            <ManagerAssignPage onNavigateToDialer={() => setCurrentPage('dialer')} />
          )}

          {/* 2. Salesperson Leads List */}
          {currentPage === 'leads' && (
            <SalespersonLeadsPage
              onSelectLeadForDialing={(lead) => handleSelectLeadForDialing(lead)}
              currentUser={user?.name || 'Alex Morgan'}
            />
          )}

          {/* 3. Dialer Screen */}
          {currentPage === 'dialer' && (
            <DialerPage
              onNavigateToLeads={() => setCurrentPage('leads')}
              onNavigateToSentiment={() => setCurrentPage('sentiment')}
            />
          )}

          {/* 3D Call History & Record Intelligence */}
          {currentPage === 'history' && (
            <CallHistoryPage user={user} onNavigate={setCurrentPage} />
          )}

          {/* Supporting Overview & Reports */}
          {currentPage === 'dashboard' && (
            <DashboardPage
              user={user}
              onNavigate={setCurrentPage}
              onSelectLeadForDialing={(phone, name) => handleSelectLeadForDialing(phone, name)}
            />
          )}

          {currentPage === 'reports' && <ReportsPage />}

          {/* 4. Consumer Sentiment Analysis for Recorded Calls */}
          {currentPage === 'sentiment' && (
            <CallSentimentPage user={user} onNavigate={setCurrentPage} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {user && currentPage !== 'login' && (
        <MobileNav currentPage={currentPage} onNavigate={setCurrentPage} user={user} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LeadProvider>
        <MainLayout />
      </LeadProvider>
    </ThemeProvider>
  );
}

