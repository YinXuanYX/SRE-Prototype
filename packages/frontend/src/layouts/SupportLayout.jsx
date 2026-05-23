import { useState } from 'react';
import { 
  Heart, 
  Terminal, 
  Settings,
} from 'lucide-react';
import { DashboardShell } from '../components/DashboardShell';
import { SupportDashboard } from '../components/SupportDashboard';
import { SettingsPage } from '../pages/SettingsPage';

import { DiagnosticTerminal } from '../pages/support/DiagnosticTerminal';

export const SupportLayout = ({ user, onLogout, recentTelemetry, liveLogs, socketStatus, onRoleSwitch }) => {
  const [activePage, setActivePage] = useState('health');

  const navItems = [
    { id: 'health', icon: Heart, label: 'System Health' },
    { id: 'terminal', icon: Terminal, label: 'Diagnostic Terminal' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'health':
        return (
          <SupportDashboard 
            recentTelemetry={recentTelemetry} 
            liveLogs={liveLogs} 
            socketStatus={socketStatus} 
          />
        );
      case 'terminal':
        return <DiagnosticTerminal liveLogs={liveLogs} socketStatus={socketStatus} />;
      case 'settings':
        return <SettingsPage user={user} activeRole="Support" onRoleSwitch={onRoleSwitch} />;
      default:
        return null;
    }
  };

  return (
    <DashboardShell
      user={user}
      onLogout={onLogout}
      roleLabel="Support Desk"
      roleColor="var(--accent-amber)"
      navItems={navItems}
      activePage={activePage}
      onNavigate={setActivePage}
      socketStatus={socketStatus}
    >
      {renderPage()}
    </DashboardShell>
  );
};
