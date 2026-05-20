import React, { useState } from 'react';
import { LogOut, User, Layers, Shield } from 'lucide-react';
import { ResidentDashboard } from './ResidentDashboard';
import { AdminDashboard } from './AdminDashboard';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { SupportDashboard } from './SupportDashboard';

export const DashboardShell = ({ user, onLogout, recentTelemetry, liveLogs, socketStatus }) => {
  // Allow overriding the active role on-the-fly for quick prototyping/review
  const [activeRole, setActiveRole] = useState(user.role);

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
          <div style={styles.errorState}>
            <h3>Unauthorized Access View</h3>
            <p>Your current role assignment '{activeRole}' has no matching dashboard layout.</p>
          </div>
        );
    }
  };

  return (
    <div style={styles.layoutContainer}>
      {/* Top Navbar */}
      <header style={styles.navbar} className="glass-panel">
        <div style={styles.brand}>
          <Layers size={20} color="var(--accent-blue)" />
          <span style={styles.brandText}>Real-Time Energy Hub</span>
        </div>

        {/* Navigation & Controls */}
        <div style={styles.controls}>
          {/* Quick-Switch Role Selector for Prototyping */}
          <div style={styles.roleSwitcherContainer}>
            <Shield size={14} color="var(--accent-cyan)" />
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value)}
              style={styles.switcherSelect}
            >
              <option value="Resident">View: Resident Hub</option>
              <option value="Admin">View: Landlord/Admin</option>
              <option value="Super Admin">View: Super Admin</option>
              <option value="Support">View: Customer Support</option>
            </select>
          </div>

          <div style={styles.userInfo}>
            <div style={styles.userBadge}>
              <User size={13} style={{ marginRight: '6px' }} />
              <span>{user.displayName}</span>
              <span style={{ ...styles.roleLabel, background: getRoleColor(activeRole) }}>
                {activeRole}
              </span>
            </div>
            
            <button onClick={onLogout} style={styles.logoutBtn}>
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Area */}
      <div style={styles.pageBody}>
        {renderDashboardContent()}
      </div>
    </div>
  );
};

const getRoleColor = (role) => {
  switch (role) {
    case 'Admin': return 'var(--accent-emerald)';
    case 'Super Admin': return 'var(--accent-cyan)';
    case 'Support': return 'var(--accent-amber)';
    default: return 'var(--accent-blue)';
  }
};

const styles = {
  layoutContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
    padding: '24px',
    maxWidth: '1280px',
    margin: '0 auto',
  },
  navbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderRadius: '16px',
    marginBottom: '24px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  brandText: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '16px',
    letterSpacing: '0.05em',
    color: '#fff',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  roleSwitcherContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(6, 182, 212, 0.08)',
    border: '1px solid rgba(6, 182, 212, 0.15)',
    borderRadius: '20px',
    padding: '4px 12px',
  },
  switcherSelect: {
    background: 'transparent',
    border: 'none',
    color: 'var(--accent-cyan)',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-color)',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 500,
  },
  roleLabel: {
    marginLeft: '8px',
    padding: '2px 6px',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'transparent',
    border: '1px solid rgba(244, 63, 94, 0.3)',
    color: 'var(--accent-rose)',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  pageBody: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  errorState: {
    textAlign: 'center',
    padding: '48px',
    background: 'rgba(244, 63, 94, 0.08)',
    border: '1px solid rgba(244, 63, 94, 0.2)',
    borderRadius: '16px',
    color: 'var(--accent-rose)',
  },
};
