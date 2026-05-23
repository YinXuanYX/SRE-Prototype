import { useState } from 'react';
import { 
  Network, 
  Download,
  Settings,
} from 'lucide-react';
import { DashboardShell } from '../components/DashboardShell';
import { SuperAdminDashboard } from '../components/SuperAdminDashboard';
import { SettingsPage } from '../pages/SettingsPage';

import { ReportsExporter } from '../pages/superadmin/ReportsExporter';

export const SuperAdminLayout = ({ user, onLogout, recentTelemetry, socketStatus, onRoleSwitch }) => {
  const [activePage, setActivePage] = useState('portfolio');

  const navItems = [
    { id: 'portfolio', icon: Network, label: 'Portfolio Overview' },
    { id: 'reports', icon: Download, label: 'Reports & Exports' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'portfolio':
        return (
          <SuperAdminDashboard 
            recentTelemetry={recentTelemetry} 
            socketStatus={socketStatus} 
          />
        );
      case 'reports':
        return <ReportsExporter recentTelemetry={recentTelemetry} socketStatus={socketStatus} />;
      case 'settings':
        return <SettingsPage user={user} activeRole="Super Admin" onRoleSwitch={onRoleSwitch} />;
      default:
        return null;
    }
  };

  return (
    <DashboardShell
      user={user}
      onLogout={onLogout}
      roleLabel="Command Center"
      roleColor="var(--accent-cyan)"
      navItems={navItems}
      activePage={activePage}
      onNavigate={setActivePage}
      socketStatus={socketStatus}
    >
      {renderPage()}
    </DashboardShell>
  );
};
