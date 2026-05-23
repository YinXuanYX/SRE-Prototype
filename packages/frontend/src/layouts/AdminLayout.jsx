import { useState } from 'react';
import { 
  Building, 
  ClipboardList, 
  Map,
  Settings,
  ScrollText,
} from 'lucide-react';
import { DashboardShell } from '../components/DashboardShell';
import { AdminDashboard } from '../components/AdminDashboard';
import { IssueTracker } from '../pages/admin/IssueTracker';
import { ZoneMapper } from '../components/ZoneMapper';
import { PageHeader } from '../components/PageHeader';
import { SettingsPage } from '../pages/SettingsPage';

import { AuditLog } from '../pages/admin/AuditLog';

export const AdminLayout = ({ user, onLogout, recentTelemetry, liveLogs, socketStatus, onRoleSwitch }) => {
  const [activePage, setActivePage] = useState('overview');

  const navItems = [
    { id: 'overview', icon: Building, label: 'Building Overview' },
    { id: 'issues', icon: ClipboardList, label: 'Issue Tracker' },
    { id: 'zones', icon: Map, label: 'Zone Management' },
    { id: 'audit', icon: ScrollText, label: 'Audit Log' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return (
          <AdminDashboard 
            user={user} 
            recentTelemetry={recentTelemetry} 
            liveLogs={liveLogs} 
            socketStatus={socketStatus} 
          />
        );
      case 'issues':
        return (
          <IssueTracker 
            user={user} 
            recentTelemetry={recentTelemetry} 
            socketStatus={socketStatus} 
          />
        );
      case 'zones':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <PageHeader 
              title="Zone Management" 
              subtitle="Map virtual sensors to zones and link tenant cards for fractional billing."
              breadcrumb={['Admin Panel', 'Zone Management']}
            />
            <div className="surface-card" style={{ padding: 'var(--space-lg)' }}>
              <ZoneMapper user={user} />
            </div>
          </div>
        );
      case 'audit':
        return <AuditLog user={user} />;
      case 'settings':
        return <SettingsPage user={user} activeRole="Admin" onRoleSwitch={onRoleSwitch} />;
      default:
        return null;
    }
  };

  return (
    <DashboardShell
      user={user}
      onLogout={onLogout}
      roleLabel="Admin Panel"
      roleColor="var(--accent-emerald)"
      navItems={navItems}
      activePage={activePage}
      onNavigate={setActivePage}
      socketStatus={socketStatus}
    >
      {renderPage()}
    </DashboardShell>
  );
};
