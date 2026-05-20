import React, { useState } from 'react';

export const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('resident@example.com');
  const [displayName, setDisplayName] = useState('John Resident');
  const [role, setRole] = useState('Resident');
  const [customMode, setCustomMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Preset Selection
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
          role: customMode ? role : undefined, // pass custom role only in custom registration mode
          provider,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'SSO Authentication failed');
      }

      // Success
      console.log('[Login] Successful SSO Token Ingestion:', data.accessToken);
      onLoginSuccess(data.accessToken, data.user);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to authenticate via SSO. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-panel" style={styles.card}>
        <div style={styles.glowHeader}>
          <div style={styles.pulseDot} />
          <span style={styles.glowText}>SMART TELEMETRY ENVIRONMENT</span>
        </div>

        <h1 style={styles.title}>Simulated Energy Hub</h1>
        <p style={styles.subtitle}>
          Secure PWA portal for real-time electrical analytics and tenant consumption forecasting.
        </p>

        {errorMsg && (
          <div style={styles.errorBanner}>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>⚠️ {errorMsg}</span>
          </div>
        )}

        {/* Roles Quick-Select Panel */}
        <div style={styles.section}>
          <label style={styles.label}>Select Simulated Account Profile:</label>
          <div style={styles.presetGrid}>
            <button
              onClick={() => handlePresetSelect('resident@example.com', 'John Resident', 'Resident')}
              style={{
                ...styles.presetButton,
                borderColor: email === 'resident@example.com' && !customMode ? 'var(--accent-blue)' : 'var(--border-color)',
                background: email === 'resident@example.com' && !customMode ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              }}
            >
              <div style={styles.presetTitle}>Resident View</div>
              <div style={styles.presetDetail}>resident@example.com</div>
            </button>

            <button
              onClick={() => handlePresetSelect('admin@example.com', 'Sarah Admin', 'Admin')}
              style={{
                ...styles.presetButton,
                borderColor: email === 'admin@example.com' && !customMode ? 'var(--accent-emerald)' : 'var(--border-color)',
                background: email === 'admin@example.com' && !customMode ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
              }}
            >
              <div style={styles.presetTitle}>Landlord / Admin</div>
              <div style={styles.presetDetail}>admin@example.com</div>
            </button>

            <button
              onClick={() => handlePresetSelect('superadmin@example.com', 'David SuperAdmin', 'Super Admin')}
              style={{
                ...styles.presetButton,
                borderColor: email === 'superadmin@example.com' && !customMode ? 'var(--accent-cyan)' : 'var(--border-color)',
                background: email === 'superadmin@example.com' && !customMode ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
              }}
            >
              <div style={styles.presetTitle}>Super Admin</div>
              <div style={styles.presetDetail}>superadmin@example.com</div>
            </button>

            <button
              onClick={() => handlePresetSelect('support@example.com', 'Alex Support', 'Support')}
              style={{
                ...styles.presetButton,
                borderColor: email === 'support@example.com' && !customMode ? 'var(--accent-amber)' : 'var(--border-color)',
                background: email === 'support@example.com' && !customMode ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
              }}
            >
              <div style={styles.presetTitle}>Support Desk</div>
              <div style={styles.presetDetail}>support@example.com</div>
            </button>
          </div>

          <button
            onClick={() => {
              setCustomMode(true);
              setEmail('');
              setDisplayName('');
            }}
            style={{
              ...styles.customToggle,
              color: customMode ? 'var(--accent-blue)' : 'var(--text-secondary)',
              borderColor: customMode ? 'var(--accent-blue)' : 'var(--border-color)',
            }}
          >
            {customMode ? '✓ Custom Registration Active' : '+ Test Custom User Sign-Up (PDPA Rule)'}
          </button>
        </div>

        {/* Custom Registration Inputs */}
        {customMode && (
          <div style={styles.customContainer}>
            <div style={styles.inputGroup}>
              <label style={styles.fieldLabel}>Display Name</label>
              <input
                type="text"
                placeholder="e.g. Richard Hendricks"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-field"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.fieldLabel}>Email Address</label>
              <input
                type="email"
                placeholder="e.g. richard@piedpiper.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.fieldLabel}>Target Role Assignment</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input-field"
                style={{ appearance: 'none', background: 'rgba(0,0,0,0.4)', cursor: 'pointer' }}
              >
                <option value="Resident">Resident</option>
                <option value="Admin">Admin</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Support">Customer Support</option>
                <option value="InvalidRole">None / Block Registration (PB-0102)</option>
              </select>
            </div>
          </div>
        )}

        <div style={styles.divider}>
          <span style={styles.dividerText}>SECURE SSO ACCESS</span>
        </div>

        {/* SSO Trigger Buttons */}
        <div style={styles.btnStack}>
          <button
            onClick={() => handleSSO('Google')}
            disabled={isLoading}
            className="btn-primary"
            style={{ ...styles.ssoBtn, background: '#4285f4', color: '#fff', boxShadow: 'none' }}
          >
            <svg style={styles.icon} viewBox="0 0 24 24">
              <path fill="currentColor" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.478 0-6.3-2.823-6.3-6.3 0-3.478 2.822-6.3 6.3-6.3 1.63 0 3.107.621 4.228 1.634l3.13-3.13C19.123 2.257 15.892 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.783 0 10.609-4.148 10.609-10.61 0-.693-.08-1.185-.21-1.585H12.24Z"/>
            </svg>
            {isLoading ? 'Connecting Google SSO...' : 'Sign in with Google'}
          </button>

          <button
            onClick={() => handleSSO('Apple')}
            disabled={isLoading}
            className="btn-secondary"
            style={{ ...styles.ssoBtn, background: '#000', border: '1px solid #333', color: '#fff' }}
          >
            <svg style={styles.icon} viewBox="0 0 24 24">
              <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.64.73-1.2 1.87-1.05 2.97 1.12.09 2.27-.56 3-1.41Z"/>
            </svg>
            {isLoading ? 'Connecting Apple SSO...' : 'Sign in with Apple'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    padding: '40px 20px',
  },
  card: {
    maxWidth: '520px',
    width: '100%',
    padding: '40px',
    textAlign: 'center',
  },
  glowHeader: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(59, 130, 246, 0.08)',
    border: '1px solid rgba(59, 130, 246, 0.15)',
    padding: '6px 14px',
    borderRadius: '20px',
    marginBottom: '24px',
  },
  pulseDot: {
    width: '6px',
    height: '6px',
    background: 'var(--accent-blue)',
    borderRadius: '50%',
    boxShadow: '0 0 10px var(--accent-blue)',
  },
  glowText: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--accent-blue)',
    letterSpacing: '0.1em',
  },
  title: {
    fontSize: '36px',
    lineHeight: '1.1',
    marginBottom: '12px',
    background: 'linear-gradient(to right, #fff, var(--text-secondary))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '14px',
    marginBottom: '32px',
  },
  errorBanner: {
    background: 'rgba(244, 63, 94, 0.1)',
    border: '1px solid rgba(244, 63, 94, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '24px',
    color: 'var(--accent-rose)',
    textAlign: 'left',
  },
  section: {
    textAlign: 'left',
    marginBottom: '24px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '12px',
    display: 'block',
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  },
  presetButton: {
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '14px',
    textAlign: 'left',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  presetTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '2px',
  },
  presetDetail: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  customToggle: {
    background: 'transparent',
    border: '1px dashed var(--border-color)',
    borderRadius: '8px',
    padding: '10px',
    width: '100%',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s ease',
  },
  customContainer: {
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
    textAlign: 'left',
  },
  inputGroup: {
    marginBottom: '14px',
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
    display: 'block',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '24px 0',
  },
  dividerText: {
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    letterSpacing: '0.1em',
    whiteSpace: 'nowrap',
  },
  btnStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  ssoBtn: {
    width: '100%',
    justifyContent: 'center',
    padding: '14px',
  },
  icon: {
    width: '18px',
    height: '18px',
  },
};
