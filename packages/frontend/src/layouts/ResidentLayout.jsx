import { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Clock,
  Cpu,
  DollarSign,
  Bell,
  Settings,
} from 'lucide-react';
import { DashboardShell } from '../components/DashboardShell';
import { ResidentDashboard } from '../components/ResidentDashboard';
import { HistoryComparison } from '../pages/resident/HistoryComparison';
import { NotificationArchive } from '../pages/resident/NotificationArchive';
import { ApplianceBreakdown } from '../pages/resident/ApplianceBreakdown';
import { BillingBudget } from '../pages/resident/BillingBudget';
import { SettingsPage } from '../pages/SettingsPage';
import { ConsentFlow } from '../components/ConsentFlow';
import { db } from '../db/indexedDB';
import { useLiveQuery } from 'dexie-react-hooks';

export const ResidentLayout = ({ user, onLogout, recentTelemetry, liveLogs, socketStatus, onRoleSwitch }) => {
  const [activePage, setActivePage] = useState('overview');
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentGranted, setConsentGranted] = useState(true);
  const enablePushes = true;
  const lastAlertTimeRef = useRef(0);

  const alertCount = useLiveQuery(() => db.alertHistory.count()) || 0;

  // Check consent on mount
  useEffect(() => {
    db.consentSettings.get('appliance_breakdown').then((rec) => {
      if (rec) {
        setConsentGranted(rec.status === 'Granted');
      } else {
        setConsentGranted(false);
      }
      setConsentChecked(true);
    });
  }, [activePage]); // Also re-check when page changes (e.g. if they opt-in from breakdown page)

  // Request notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Budget Breach Checker
  useEffect(() => {
    if (!enablePushes) return;
    const budgetLimit = Number(localStorage.getItem('sre_budget_limit') || '150');
    const activeDevices = Object.values(recentTelemetry);
    if (activeDevices.length === 0) return;

    let totalKw = 0;
    activeDevices.forEach(dev => { if (dev.status === 'Active') totalKw += dev.loadKw; });
    const simulatedDailyKwh = totalKw > 0 ? totalKw * 8 : 12.5;
    const simulatedMonthlyKwh = Math.round(simulatedDailyKwh * 30 * 10) / 10;

    let remaining = simulatedMonthlyKwh;
    let cost = 0;
    if (remaining > 600) { cost += (remaining - 600) * 0.546; remaining = 600; }
    if (remaining > 300) { cost += (remaining - 300) * 0.516; remaining = 300; }
    if (remaining > 200) { cost += (remaining - 200) * 0.334; remaining = 200; }
    cost += remaining * 0.218;
    const projectedCost = Number(cost.toFixed(2));

    if (projectedCost > budgetLimit) {
      const now = Date.now();
      if (now - lastAlertTimeRef.current > 30000) {
        lastAlertTimeRef.current = now;
        db.alertHistory.add({
          timestamp: new Date().toISOString(),
          type: 'budget_alert',
          title: 'Budget Limit Warning Triggered',
          message: `Monthly projection (RM ${projectedCost}) has exceeded the RM ${budgetLimit.toFixed(2)} target threshold.`
        }).catch(err => console.error('[ResidentLayout] Alert save failed:', err));

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('⚠️ GridPulse: Budget Breached', {
            body: `Your monthly forecast of RM ${projectedCost} has overrun your target cap of RM ${budgetLimit.toFixed(2)}.`,
            tag: 'gridpulse-budget-breach'
          });
        }
      }
    }
  }, [recentTelemetry, enablePushes]);

  const handleConsentUpdated = async (status) => {
    setConsentGranted(status);
    await db.consentSettings.put({
      consentType: 'appliance_breakdown',
      status: status ? 'Granted' : 'Revoked',
      timestamp: new Date().toISOString()
    });
  };

  const navItems = [
    { id: 'overview', icon: Home, label: 'Overview' },
    { id: 'history', icon: Clock, label: 'Usage History' },
    { id: 'appliances', icon: Cpu, label: 'Appliance Breakdown' },
    { id: 'billing', icon: DollarSign, label: 'Billing & Budget' },
    { id: 'notifications', icon: Bell, label: 'Notifications', badge: alertCount, badgeType: alertCount > 0 ? 'danger' : null },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return (
          <ResidentDashboard 
            user={user} 
            recentTelemetry={recentTelemetry} 
            liveLogs={liveLogs} 
            socketStatus={socketStatus} 
          />
        );
      case 'history':
        return <HistoryComparison />;
      case 'appliances':
        return <ApplianceBreakdown recentTelemetry={recentTelemetry} />;
      case 'billing':
        return <BillingBudget recentTelemetry={recentTelemetry} />;
      case 'notifications':
        return <NotificationArchive />;
      case 'settings':
        return <SettingsPage user={user} activeRole="Resident" onRoleSwitch={onRoleSwitch} />;
      default:
        return null;
    }
  };

  // Show consent gate modal if consent hasn't been granted yet
  const showConsentGate = consentChecked && !consentGranted && activePage === 'overview';

  return (
    <>
      <DashboardShell
        user={user}
        onLogout={onLogout}
        roleLabel="Resident Hub"
        roleColor="var(--accent-blue)"
        navItems={navItems}
        activePage={activePage}
        onNavigate={setActivePage}
        socketStatus={socketStatus}
      >
        {renderPage()}
      </DashboardShell>

      {/* PDPA Consent Gate Modal */}
      {showConsentGate && (
        <div className="consent-overlay">
          <div className="consent-modal">
            <ConsentFlow 
              userId={user.id} 
              initialConsent={false} 
              onConsentUpdated={handleConsentUpdated} 
              isModal={true}
            />
          </div>
        </div>
      )}
    </>
  );
};
