import React, { useState } from 'react';
import { Shield, Eye } from 'lucide-react';

export const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('resident@example.com');
  const [displayName, setDisplayName] = useState('John Resident');
  const [role, setRole] = useState('Resident');
  const [customMode, setCustomMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePresetSelect = (presetEmail, presetName, presetRole) => {
    setEmail(presetEmail);
    setDisplayName(presetName);
    setRole(presetRole);
    setCustomMode(false);
    setErrorMsg('');
  };

  const handleSSO = async (provider) => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/sso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          displayName,
          role: customMode ? role : undefined,
          provider,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'SSO Authentication failed');
      }

      console.log('[Login] Successful SSO Token Ingestion:', data.accessToken);
      onLoginSuccess(data.accessToken, data.user);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to authenticate via SSO. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const presets = [
    { email: 'resident@example.com', name: 'John Resident', role: 'Resident', label: 'Resident' },
    { email: 'admin@example.com', name: 'Sarah Admin', role: 'Admin', label: 'Landlord/Admin' },
    { email: 'superadmin@example.com', name: 'David SuperAdmin', role: 'Super Admin', label: 'Super Admin' },
    { email: 'support@example.com', name: 'Alex Support', role: 'Support', label: 'Support Desk' }
  ];

  return (
    <div style={s.container}>
      <div className="surface-card animate-in" style={s.card}>
        <div style={s.glowHeader}>
          <div style={s.pulseDot} className="pulse" />
          <span style={s.glowText}>SMART TELEMETRY ENVIRONMENT</span>
        </div>

        <h1 style={s.title}>Energy Command Center</h1>
        <p style={s.subtitle}>
          Secure PWA portal for building telemetry analytics, automated cost projections, and machine-learning diagnostics.
        </p>

        {errorMsg && (
          <div style={s.errorBanner}>
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        <div style={s.section}>
          <label style={s.label}>Select Simulated Account Profile</label>
          <div style={s.presetList}>
            {presets.map((p) => {
              const isSelected = email === p.email && !customMode;
              return (
                <button
                  key={p.email}
                  onClick={() => handlePresetSelect(p.email, p.name, p.role)}
                  style={{
                    ...s.presetBtn,
                    borderColor: isSelected ? 'var(--accent-blue)' : 'var(--border-primary)',
                    background: isSelected ? 'var(--sidebar-active)' : 'transparent',
                    color: isSelected ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  }}
                >
                  <span style={s.presetLabel}>{p.label}</span>
                  <span style={s.presetEmail}>{p.email}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              setCustomMode(true);
              setEmail('');
              setDisplayName('');
            }}
            style={{
              ...s.customToggle,
              color: customMode ? 'var(--accent-blue)' : 'var(--text-muted)',
              borderColor: customMode ? 'var(--accent-blue)' : 'var(--border-primary)',
              background: customMode ? 'var(--sidebar-active)' : 'transparent',
            }}
          >
            {customMode ? '✓ Custom Sandbox Registration Enabled' : '+ Test Custom User Sign-Up'}
          </button>
        </div>

        {customMode && (
          <div style={s.customContainer} className="animate-in">
            <div style={s.inputGroup}>
              <label style={s.fieldLabel}>Display Name</label>
              <input
                type="text"
                placeholder="e.g. Richard Hendricks"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-field"
              />
            </div>

            <div style={s.inputGroup}>
              <label style={s.fieldLabel}>Email Address</label>
              <input
                type="email"
                placeholder="e.g. richard@piedpiper.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>

            <div style={s.inputGroup}>
              <label style={s.fieldLabel}>Target Role Assignment</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input-field"
                style={{ appearance: 'none', background: 'var(--bg-elevated)', cursor: 'pointer' }}
              >
                <option value="Resident">Resident</option>
                <option value="Admin">Admin</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Support">Customer Support</option>
                <option value="InvalidRole">None / Block Registration</option>
              </select>
            </div>
          </div>
        )}

        <div style={s.divider}>
          <span style={s.dividerText}>SECURE PROTOCOL ACCESS</span>
        </div>

        <div style={s.btnStack}>
          <button
            onClick={() => handleSSO('Google')}
            disabled={isLoading}
            className="btn-primary"
            style={{ ...s.ssoBtn, background: 'var(--accent-blue)', boxShadow: 'none' }}
          >
            <Shield size={14} style={{ marginRight: '6px' }} />
            {isLoading ? 'Processing Ingestion...' : 'Ingest credentials via Google SSO'}
          </button>

          <button
            onClick={() => handleSSO('Apple')}
            disabled={isLoading}
            className="btn-secondary"
            style={{ ...s.ssoBtn }}
          >
            <Eye size={14} style={{ marginRight: '6px' }} />
            {isLoading ? 'Processing Ingestion...' : 'Ingest credentials via Apple SSO'}
          </button>
        </div>
      </div>
    </div>
  );
};

const s = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    padding: 'var(--space-2xl) var(--space-md)',
  },
  card: {
    maxWidth: '500px',
    width: '100%',
    padding: 'var(--space-2xl) var(--space-xl)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-xl)',
    background: 'var(--bg-surface)',
  },
  glowHeader: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    background: 'var(--sidebar-active)',
    border: '1px solid var(--border-primary)',
    padding: '6px 12px',
    borderRadius: 'var(--radius-full)',
    marginBottom: 'var(--space-lg)',
  },
  pulseDot: {
    width: '6px',
    height: '6px',
    background: 'var(--accent-blue)',
    borderRadius: '50%',
  },
  glowText: {
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--accent-blue)',
    letterSpacing: '0.08em',
  },
  title: {
    fontSize: '28px',
    lineHeight: '1.2',
    fontWeight: 800,
    marginBottom: 'var(--space-sm)',
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-xl)',
    lineHeight: '1.5',
    textAlign: 'center',
  },
  errorBanner: {
    background: 'rgba(244, 63, 94, 0.08)',
    border: '1px solid rgba(244, 63, 94, 0.15)',
    borderRadius: 'var(--radius-sm)',
    padding: 'var(--space-md)',
    marginBottom: 'var(--space-lg)',
    color: 'var(--accent-rose)',
    textAlign: 'left',
    fontSize: '12px',
  },
  section: {
    textAlign: 'left',
    marginBottom: 'var(--space-lg)',
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 'var(--space-sm)',
    display: 'block',
  },
  presetList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)',
    marginBottom: 'var(--space-md)',
  },
  presetBtn: {
    border: '1px solid',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 14px',
    textAlign: 'left',
    cursor: 'pointer',
    outline: 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'var(--font-sans)',
    transition: 'all var(--duration-fast) ease',
  },
  presetLabel: {
    fontSize: '13px',
    fontWeight: 600,
  },
  presetEmail: {
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
  },
  customToggle: {
    background: 'transparent',
    border: '1px dashed',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 12px',
    width: '100%',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
    fontFamily: 'var(--font-sans)',
    transition: 'all var(--duration-fast) ease',
  },
  customContainer: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-md)',
    marginBottom: 'var(--space-lg)',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  fieldLabel: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    margin: 'var(--space-lg) 0',
  },
  dividerText: {
    fontSize: '9px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap',
    margin: '0 auto',
  },
  btnStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)',
  },
  ssoBtn: {
    width: '100%',
    justifyContent: 'center',
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    fontWeight: 600,
  },
};
