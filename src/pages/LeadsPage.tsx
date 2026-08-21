import React from 'react';
import { SalespersonLeadsPage } from './SalespersonLeadsPage';
import { Lead } from '../types';

interface LeadsPageProps {
  onNavigate?: (page: any) => void;
  onSelectLeadForDialing: (phone: string | Lead, name?: string) => void;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({
  onNavigate,
  onSelectLeadForDialing,
}) => {
  const handleSelect = (lead: Lead) => {
    onSelectLeadForDialing(lead);
    if (onNavigate) {
      onNavigate('dialer');
    }
  };

  return <SalespersonLeadsPage onSelectLeadForDialing={handleSelect} />;
};
