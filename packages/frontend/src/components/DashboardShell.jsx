import { useState, useEffect } from 'react';
import { 
  LogOut, 
  User, 
  Layers, 
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Radio,
  WifiOff,
} from 'lucide-react';
import { useTheme } from './ThemeProvider';

export const DashboardShell = ({ 
  user, 
  onLogout, 
  roleLabel, 
  roleColor, 
  navItems, 
  activePage, 
  onNavigate, 
  socketStatus,
  children 
}) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const { theme, toggleTheme } = useTheme();
  
  // Track internet network connectivity status
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isOffline = !isOnline;
  const isWsDisconnected = socketStatus === 'Disconnected' || socketStatus === 'Error' || socketStatus === 'Connecting...';

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
              <span style={s.brandName}>GridPulse</span>
              <span style={s.brandSub}>Smart Energy Sentry</span>
            </div>
          )}
        </div>

        {/* Role Indicator */}
        {sidebarExpanded && (
          <div style={{ ...s.roleIndicator, borderLeftColor: roleColor || 'var(--accent-blue)' }}>
            <span style={s.roleLabel}>{roleLabel || user.role}</span>
          </div>
        )}

        {/* Navigation */}
        <nav style={s.nav}>
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={isActive ? 'nav-item-active' : ''}
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
                {sidebarExpanded && (
                  <span style={s.navLabel}>{item.label}</span>
                )}
                {sidebarExpanded && item.badge != null && item.badge > 0 && (
                  <span 
                    className={`nav-badge ${item.badgeType === 'danger' ? 'nav-badge-danger' : item.badgeType === 'warning' ? 'nav-badge-warning' : 'nav-badge-info'}`}
                    style={{ marginLeft: 'auto' }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Spacer */}
        <div style={{ flexGrow: 1 }} />

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
                <span style={s.userRole}>{user.role}</span>
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
        {isOffline ? (
          <div style={s.offlineBanner}>
            <WifiOff size={14} style={{ marginRight: '8px', flexShrink: 0 }} />
            <span>Internet Connection Offline — Diverting data cache routes to local IndexedDB storage</span>
          </div>
        ) : isWsDisconnected ? (
          <div style={s.websocketBanner}>
            <Radio size={14} style={{ marginRight: '8px', flexShrink: 0 }} className="pulse" />
            <span>Local Gateway Disconnected — Operating in offline synchronization mode (caching telemetry frames)</span>
          </div>
        ) : null}

        {/* Page Content */}
        <div style={s.content} className="page-transition" key={activePage}>
          {children}
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
    marginBottom: 'var(--space-sm)',
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

  roleIndicator: {
    borderLeft: '3px solid var(--accent-blue)',
    padding: '6px 10px',
    marginBottom: 'var(--space-sm)',
    background: 'var(--bg-input)',
    borderRadius: '0 var(--radius-xs) var(--radius-xs) 0',
  },
  roleLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
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
    position: 'relative',
    overflow: 'visible',
  },
  navLabel: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
  content: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  offlineBanner: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(244, 63, 94, 0.08)',
    border: '1px solid rgba(244, 63, 94, 0.2)',
    borderRadius: 'var(--radius-md)',
    padding: '12px var(--space-md)',
    color: 'var(--accent-rose)',
    fontSize: '12px',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
  },
  websocketBanner: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(245, 158, 11, 0.08)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    borderRadius: 'var(--radius-md)',
    padding: '12px var(--space-md)',
    color: 'var(--accent-amber)',
    fontSize: '12px',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
  },
};
