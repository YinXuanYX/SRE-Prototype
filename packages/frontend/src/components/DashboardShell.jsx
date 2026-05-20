import React, { useState, useEffect } from 'react';
import { 
  LogOut, 
  User, 
  Layers, 
  Shield,
  Sun,
  Moon,
  Home,
  BarChart3,
  Settings,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Database,
  Radio,
  Sliders,
  Bell,
  Lock,
  LineChart,
  Eye,
  Play,
  Pause,
  Filter,
  CheckCircle
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { ResidentDashboard } from './ResidentDashboard';
import { AdminDashboard } from './AdminDashboard';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { SupportDashboard } from './SupportDashboard';
import { ConsentFlow } from './ConsentFlow';
import { db } from '../db/indexedDB';

export const DashboardShell = ({ user, onLogout, recentTelemetry, liveLogs, socketStatus }) => {
  const [activeRole, setActiveRole] = useState(user.role);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const { theme, toggleTheme } = useTheme();

  // Settings sub-state
  const [enablePushes, setEnablePushes] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('5s');
  const [consentGranted, setConsentGranted] = useState(true);
  
  // Terminal sub-state
  const [logFilter, setLogFilter] = useState('all');
  const [terminalPaused, setTerminalPaused] = useState(false);

  useEffect(() => {
    db.consentSettings.get('appliance_breakdown').then((rec) => {
      if (rec) {
        setConsentGranted(rec.status === 'Granted');
      } else {
        setConsentGranted(true);
        db.consentSettings.put({
          consentType: 'appliance_breakdown',
          status: 'Granted',
          timestamp: new Date().toISOString()
        });
      }
    });
  }, []);

  const handleConsentUpdated = async (status) => {
    setConsentGranted(status);
    await db.consentSettings.put({
      consentType: 'appliance_breakdown',
      status: status ? 'Granted' : 'Revoked',
      timestamp: new Date().toISOString()
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return 'var(--accent-emerald)';
      case 'Super Admin': return 'var(--accent-cyan)';
      case 'Support': return 'var(--accent-amber)';
      default: return 'var(--accent-blue)';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'Resident': return 'Resident Hub';
      case 'Admin': return 'Admin Panel';
      case 'Super Admin': return 'Command Center';
      case 'Support': return 'Support Desk';
      default: return role;
    }
  };

  // ── Sub-view rendering ──
  const renderDashboardContent = () => {
    switch (activeRole) {
      case 'Resident':
        return (
          <ResidentDashboard 
            user={user} 
            recentTelemetry={recentTelemetry} 
            liveLogs={liveLogs} 
            socketStatus={socketStatus} 
          />
        );
      case 'Admin':
        return (
          <AdminDashboard 
            user={user} 
            recentTelemetry={recentTelemetry} 
            liveLogs={liveLogs} 
            socketStatus={socketStatus} 
          />
        );
      case 'Super Admin':
        return (
          <SuperAdminDashboard 
            user={user} 
            recentTelemetry={recentTelemetry} 
            liveLogs={liveLogs} 
            socketStatus={socketStatus} 
          />
        );
      case 'Support':
        return (
          <SupportDashboard 
            user={user} 
            recentTelemetry={recentTelemetry} 
            liveLogs={liveLogs} 
            socketStatus={socketStatus} 
          />
        );
      default:
        return (
          <div style={s.errorState}>
            <h3>Unauthorized Access View</h3>
            <p>Your current role assignment '{activeRole}' has no matching dashboard layout.</p>
          </div>
        );
    }
  };

  const renderAnalyticsView = () => {
    const devices = Object.values(recentTelemetry);
    const activeDevices = devices.filter(d => d.status === 'Active');
    const totalLoad = activeDevices.reduce((sum, d) => sum + d.loadKw, 0);

    return (
      <div style={s.subViewContainer} className="animate-in">
        <h2 style={s.subViewTitle}>Energy Analytics Insights</h2>
        <p style={s.subViewDesc}>Detailed telemetry breakdown and historical consumption performance across active sub-meters.</p>
        
        <div style={s.analyticsGrid}>
          <div className="surface-card" style={s.analyticsCard}>
            <LineChart size={24} color="var(--accent-blue)" />
            <h4 style={s.cardHeadline}>Portfolio Load Factor</h4>
            <div style={s.cardMetric}>{(totalLoad * 0.85).toFixed(2)} kW</div>
            <p style={s.cardDetail}>Calculated efficiency factor relative to baseline building draw.</p>
          </div>

          <div className="surface-card" style={s.analyticsCard}>
            <Sliders size={24} color="var(--accent-cyan)" />
            <h4 style={s.cardHeadline}>Active Meter Density</h4>
            <div style={s.cardMetric}>{devices.length} Nodes</div>
            <p style={s.cardDetail}>{activeDevices.length} currently transmitting active telemetry packets.</p>
          </div>

          <div className="surface-card" style={s.analyticsCard}>
            <Database size={24} color="var(--accent-emerald)" />
            <h4 style={s.cardHeadline}>Database Sync Health</h4>
            <div style={s.cardMetric}>99.8%</div>
            <p style={s.cardDetail}>Ingestion pipeline heartbeats stored to IndexedDB cache.</p>
          </div>
        </div>

        <section className="surface-card" style={s.largeChartPlaceholder}>
          <div style={s.placeholderHeader}>
            <LineChart size={18} color="var(--accent-cyan)" />
            <h3 style={{ margin: 0, fontSize: '15px' }}>Spectral Appliance Phase Analysis</h3>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
            High-frequency harmonic distortion and load signature identification waveforms (simulated).
          </p>
          <div style={s.simWaveform}>
            <div style={{ ...s.waveBar, height: '40px', background: 'var(--accent-blue)' }} />
            <div style={{ ...s.waveBar, height: '80px', background: 'var(--accent-cyan)' }} />
            <div style={{ ...s.waveBar, height: '120px', background: 'var(--accent-emerald)' }} />
            <div style={{ ...s.waveBar, height: '90px', background: 'var(--accent-violet)' }} />
            <div style={{ ...s.waveBar, height: '60px', background: 'var(--accent-amber)' }} />
            <div style={{ ...s.waveBar, height: '110px', background: 'var(--accent-rose)' }} />
            <div style={{ ...s.waveBar, height: '70px', background: 'var(--accent-blue)' }} />
            <div style={{ ...s.waveBar, height: '50px', background: 'var(--accent-cyan)' }} />
          </div>
        </section>
      </div>
    );
  };

  const renderTerminalView = () => {
    const filteredLogs = liveLogs.filter(log => {
      if (logFilter === 'all') return true;
      if (logFilter === 'active') return log.status === 'Active';
      if (logFilter === 'offline') return log.status !== 'Active';
      return true;
    });

    return (
      <div style={s.subViewContainer} className="animate-in">
        <div style={s.terminalTitleRow}>
          <div>
            <h2 style={s.subViewTitle}>System Diagnostic Terminal</h2>
            <p style={s.subViewDesc}>Real-time packet inspection of active telemetry websocket streams.</p>
          </div>
          <button 
            onClick={() => setTerminalPaused(prev => !prev)} 
            className="btn-secondary"
            style={s.pauseBtn}
          >
            {terminalPaused ? <Play size={12} style={{ marginRight: '6px' }} /> : <Pause size={12} style={{ marginRight: '6px' }} />}
            <span>{terminalPaused ? 'Resume Terminal' : 'Pause Stream'}</span>
          </button>
        </div>

        <div style={s.filterRow}>
          <Filter size={14} color="var(--text-muted)" />
          <span style={s.filterLabel}>Filter Stream:</span>
          {['all', 'active', 'offline'].map(f => (
            <button
              key={f}
              onClick={() => setLogFilter(f)}
              style={{
                ...s.filterTab,
                background: logFilter === f ? 'var(--sidebar-active)' : 'transparent',
                color: logFilter === f ? 'var(--accent-blue)' : 'var(--text-muted)',
                borderColor: logFilter === f ? 'rgba(59, 130, 246, 0.15)' : 'var(--border-subtle)',
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={s.terminalLogWindow}>
          {terminalPaused ? (
            <div style={s.pausedBanner}>[STREAM INGESTION PAUSED FOR INSPECTION]</div>
          ) : filteredLogs.length === 0 ? (
            <div style={s.emptyLogs}>Awaiting telemetries packets...</div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} style={s.logLine}>
                <span style={s.logTime}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span style={s.logLabel}>[PKT]</span>
                <span style={s.logDev}>{log.deviceName}</span>
                <span style={s.logId}>({log.deviceId})</span>
                <span style={{ 
                  ...s.logStatus,
                  color: log.status === 'Active' ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                }}>
                  {log.status === 'Active' ? `${log.loadKw} kW @ ${log.voltage}V` : 'OFFLINE'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderSettingsView = () => {
    return (
      <div style={s.subViewContainer} className="animate-in">
        <h2 style={s.subViewTitle}>Hub Configuration Settings</h2>
        <p style={s.subViewDesc}>Manage notification parameters, sync frequencies, and privacy settings.</p>

        <div style={s.settingsStack}>
          <div className="surface-card" style={s.settingsGroup}>
            <h3 style={s.settingsHeader}>System Notifications</h3>
            
            <div style={s.settingRow}>
              <div>
                <h4 style={s.settingLabel}>Service Worker Push Notifications</h4>
                <p style={s.settingDesc}>Deliver simulated alert notifications if forecast exceeds budget threshold limits.</p>
              </div>
              <button 
                onClick={() => setEnablePushes(!enablePushes)}
                style={{
                  ...s.toggleSwitch,
                  background: enablePushes ? 'var(--accent-blue)' : 'var(--bg-hover)',
                }}
              >
                <div style={{
                  ...s.toggleKnob,
                  transform: enablePushes ? 'translateX(18px)' : 'translateX(0)',
                }} />
              </button>
            </div>

            <div style={s.settingRow}>
              <div>
                <h4 style={s.settingLabel}>Telemetry Refresh Ingestion Rate</h4>
                <p style={s.settingDesc}>Specify timing cycle window for database packet caches updates.</p>
              </div>
              <select 
                value={refreshInterval} 
                onChange={(e) => setRefreshInterval(e.target.value)}
                className="input-field" 
                style={{ width: '120px', background: 'var(--bg-elevated)' }}
              >
                <option value="1s">High (1s)</option>
                <option value="5s">Nominal (5s)</option>
                <option value="30s">Eco-Mode (30s)</option>
              </select>
            </div>
          </div>

          <div className="surface-card" style={s.settingsGroup}>
            <h3 style={s.settingsHeader}>Authentication & Compliance</h3>
            <div style={s.settingRow}>
              <div>
                <h4 style={s.settingLabel}>User Profile Authority</h4>
                <p style={s.settingDesc}>Authorized scopes linked to user identity tokens.</p>
              </div>
              <span className="badge badge-active" style={{ textTransform: 'none' }}>
                {activeRole} Scope
              </span>
            </div>
            <div style={s.settingRow}>
              <div>
                <h4 style={s.settingLabel}>PDPA Encryption Directory</h4>
                <p style={s.settingDesc}>Data keys are stored inside localized IndexedDB sandbox structures.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--accent-cyan)' }}>
                <Lock size={12} />
                <span>Encrypted AES-256</span>
              </div>
            </div>
          </div>

          <div className="surface-card" style={s.settingsGroup}>
            <h3 style={s.settingsHeader}>Privacy & Consent</h3>
            <p style={s.settingDesc}>Manage compliance permissions to enable high-frequency sub-meter appliance signatures load tracking.</p>
            <div style={{ marginTop: 'var(--space-md)' }}>
              <ConsentFlow 
                userId={user.id} 
                initialConsent={consentGranted} 
                onConsentUpdated={handleConsentUpdated} 
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMainView = () => {
    switch (activeTab) {
      case 'Dashboard':
        return renderDashboardContent();
      case 'Analytics':
        return renderAnalyticsView();
      case 'Terminal':
        return renderTerminalView();
      case 'Settings':
        return renderSettingsView();
      default:
        return renderDashboardContent();
    }
  };

  const navItems = [
    { id: 'Dashboard', icon: Home, label: 'Dashboard' },
    { id: 'Analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'Terminal', icon: Terminal, label: 'Terminal' },
    { id: 'Settings', icon: Settings, label: 'Settings' },
  ];

  const sidebarWidth = sidebarExpanded 
    ? 'var(--sidebar-width-expanded)' 
    : 'var(--sidebar-width-collapsed)';

  return (
    <div style={s.layout}>
      {/* ── SIDEBAR ── */}
      <aside style={{ ...s.sidebar, width: sidebarWidth }}>
        {/* Brand */}
        <div style={{ ...s.sidebarHeader, justifyContent: sidebarExpanded ? 'flex-start' : 'center' }}>
          <div style={s.brandMark}>
            <Layers size={20} color="var(--accent-blue)" />
          </div>
          {sidebarExpanded && (
            <div style={s.brandTextBlock}>
              <span style={s.brandName}>SRE Hub</span>
              <span style={s.brandSub}>Energy Analytics</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={s.nav}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  ...s.navItem,
                  background: isActive ? 'var(--sidebar-active)' : 'transparent',
                  color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                  padding: sidebarExpanded ? '10px 12px' : '10px 0',
                  width: '100%',
                }}
                title={item.label}
              >
                <item.icon size={18} />
                {sidebarExpanded && <span style={s.navLabel}>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Spacer */}
        <div style={{ flexGrow: 1 }} />

        {/* Role Switcher */}
        <div style={s.sidebarSection}>
          {sidebarExpanded && (
            <span style={s.sectionLabel}>View Mode</span>
          )}
          <div style={{ 
            ...s.roleSwitcher, 
            justifyContent: sidebarExpanded ? 'flex-start' : 'center',
            padding: sidebarExpanded ? '8px 10px' : '8px 0',
            width: '100%'
          }}>
            <Shield size={14} color={getRoleColor(activeRole)} />
            {sidebarExpanded ? (
              <select
                value={activeRole}
                onChange={(e) => {
                  setActiveRole(e.target.value);
                  setActiveTab('Dashboard'); // fallback to main dashboard on role switch
                }}
                style={s.switcherSelect}
              >
                <option value="Resident">Resident Hub</option>
                <option value="Admin">Landlord / Admin</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Support">Customer Support</option>
              </select>
            ) : null}
          </div>
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme} 
          style={{
            ...s.themeToggle,
            justifyContent: sidebarExpanded ? 'flex-start' : 'center',
            padding: sidebarExpanded ? '10px 12px' : '10px 0',
            width: '100%'
          }} 
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {sidebarExpanded && (
            <span style={s.themeLabel}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          )}
        </button>

        {/* User & Sign Out */}
        <div style={s.sidebarFooter}>
          <div style={{ ...s.userBlock, justifyContent: sidebarExpanded ? 'flex-start' : 'center' }}>
            <div style={s.avatar}>
              <User size={14} color="var(--text-secondary)" />
            </div>
            {sidebarExpanded && (
              <div style={s.userMeta}>
                <span style={s.userName}>{user.displayName}</span>
                <span style={s.userRole}>{activeRole}</span>
              </div>
            )}
          </div>

          <button 
            onClick={onLogout} 
            style={{
              ...s.logoutBtn,
              justifyContent: sidebarExpanded ? 'flex-start' : 'center',
              padding: sidebarExpanded ? '8px 12px' : '8px 0',
              width: '100%'
            }} 
            title="Sign Out"
          >
            <LogOut size={14} />
            {sidebarExpanded && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarExpanded(prev => !prev)}
          style={s.collapseBtn}
          title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{
        ...s.main,
        marginLeft: sidebarWidth,
      }}>
        {/* Page Header */}
        <header style={s.pageHeader} className="animate-in">
          <div>
            <h1 style={s.pageTitle}>
              {activeTab === 'Dashboard' ? getRoleLabel(activeRole) : activeTab}
            </h1>
            <p style={s.pageSubtitle}>
              Welcome back, {user.displayName}. Here's your real-time overview.
            </p>
          </div>
          <div style={s.headerRight}>
            <div style={{
              ...s.statusDot,
              background: socketStatus === 'Connected' ? 'var(--accent-emerald)' : 'var(--accent-rose)'
            }} />
            <span style={s.statusText}>
              {socketStatus === 'Connected' ? 'Live' : socketStatus}
            </span>
          </div>
        </header>

        {/* Dashboard Content */}
        <div style={s.content} className="animate-in" key={`${activeRole}-${activeTab}`}>
          {renderMainView()}
        </div>
      </main>
    </div>
  );
};

const s = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
  },

  /* ── Sidebar ── */
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    background: 'var(--sidebar-bg)',
    borderRight: '1px solid var(--sidebar-border)',
    display: 'flex',
    flexDirection: 'column',
    padding: 'var(--space-md)',
    gap: 'var(--space-xs)',
    transition: `width var(--duration-normal) var(--ease-out-expo)`,
    overflow: 'hidden',
    zIndex: 50,
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-sm) var(--space-xs)',
    marginBottom: 'var(--space-md)',
  },
  brandMark: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(59, 130, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandTextBlock: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  brandName: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '15px',
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
  },
  brandSub: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },

  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    fontFamily: 'var(--font-sans)',
    transition: `all var(--duration-fast) ease`,
    whiteSpace: 'nowrap',
  },
  navLabel: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  sidebarSection: {
    padding: '0 var(--space-xs)',
    marginBottom: 'var(--space-xs)',
    width: '100%',
  },
  sectionLabel: {
    fontSize: '10px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 'var(--space-xs)',
    display: 'block',
    whiteSpace: 'nowrap',
  },
  roleSwitcher: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    background: 'var(--bg-input)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-primary)',
  },
  switcherSelect: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
    flex: 1,
    minWidth: 0,
  },

  themeToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    fontFamily: 'var(--font-sans)',
    transition: `all var(--duration-fast) ease`,
    whiteSpace: 'nowrap',
  },
  themeLabel: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  sidebarFooter: {
    borderTop: '1px solid var(--border-subtle)',
    paddingTop: 'var(--space-sm)',
    marginTop: 'var(--space-xs)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)',
    width: '100%',
  },
  userBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: '6px var(--space-xs)',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--bg-hover)',
    border: '1px solid var(--border-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userMeta: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  userName: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  userRole: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    background: 'transparent',
    border: '1px solid rgba(244, 63, 94, 0.2)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--accent-rose)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    fontFamily: 'var(--font-sans)',
    transition: `all var(--duration-fast) ease`,
    whiteSpace: 'nowrap',
  },
  collapseBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px',
    marginTop: 'var(--space-xs)',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: `all var(--duration-fast) ease`,
    width: '100%',
  },

  /* ── Main Content ── */
  main: {
    flex: 1,
    minHeight: '100vh',
    padding: 'var(--space-xl)',
    transition: `margin-left var(--duration-normal) var(--ease-out-expo)`,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-lg)',
    maxWidth: '100%',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 'var(--space-md)',
    borderBottom: '1px solid var(--border-subtle)',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 700,
    margin: 0,
  },
  pageSubtitle: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'var(--bg-input)',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--border-subtle)',
  },
  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  content: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  errorState: {
    textAlign: 'center',
    padding: 'var(--space-3xl)',
    background: 'rgba(244, 63, 94, 0.05)',
    border: '1px solid rgba(244, 63, 94, 0.15)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--accent-rose)',
  },

  /* ── Sub-view Styles ── */
  subViewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)',
  },
  subViewTitle: {
    fontSize: '20px',
    fontWeight: 700,
    margin: 0,
  },
  subViewDesc: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--space-md)',
    marginTop: 'var(--space-sm)',
  },
  analyticsCard: {
    padding: 'var(--space-lg)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)',
  },
  cardHeadline: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  cardMetric: {
    fontSize: '24px',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  cardDetail: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
  largeChartPlaceholder: {
    padding: 'var(--space-lg)',
    marginTop: 'var(--space-md)',
  },
  placeholderHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    marginBottom: 'var(--space-xs)',
  },
  simWaveform: {
    height: '150px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: 'var(--space-sm)',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-md) var(--space-xl)',
  },
  waveBar: {
    flex: 1,
    borderRadius: 'var(--radius-xs) var(--radius-xs) 0 0',
    opacity: 0.8,
  },

  /* Terminal */
  terminalTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pauseBtn: {
    padding: '6px 14px',
    fontSize: '12px',
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    marginTop: 'var(--space-sm)',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-muted)',
  },
  filterTab: {
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 600,
    borderRadius: 'var(--radius-xs)',
    border: '1px solid',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  terminalLogWindow: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-md)',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    minHeight: '380px',
    maxHeight: '500px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: 'var(--space-sm)',
  },
  pausedBanner: {
    color: 'var(--accent-emerald)',
    textAlign: 'center',
    padding: 'var(--space-2xl) 0',
    fontWeight: 600,
  },
  emptyLogs: {
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: 'var(--space-2xl) 0',
  },
  logLine: {
    display: 'flex',
    gap: 'var(--space-sm)',
    whiteSpace: 'nowrap',
    overflowX: 'auto',
  },
  logTime: { color: 'var(--text-muted)' },
  logLabel: { color: 'var(--accent-cyan)', fontWeight: 600 },
  logDev: { color: 'var(--accent-blue)', fontWeight: 500 },
  logId: { color: 'var(--text-muted)' },
  logStatus: { fontWeight: 600 },

  /* Settings */
  settingsStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)',
    marginTop: 'var(--space-sm)',
  },
  settingsGroup: {
    padding: 'var(--space-lg)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-lg)',
  },
  settingsHeader: {
    fontSize: '15px',
    fontWeight: 600,
    borderBottom: '1px solid var(--border-subtle)',
    paddingBottom: 'var(--space-xs)',
    margin: 0,
  },
  settingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--space-xl)',
  },
  settingLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  settingDesc: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  toggleSwitch: {
    width: '38px',
    height: '20px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    transition: 'background var(--duration-fast) ease',
  },
  toggleKnob: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: '#fff',
    transition: 'transform var(--duration-fast) var(--ease-spring)',
  },
};
