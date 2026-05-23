import { useState } from 'react';
import { 
  Shield, 
  Eye, 
  Home, 
  Building, 
  Layers, 
  Terminal, 
  Loader2 
} from 'lucide-react';

export const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('resident@example.com');
  const [displayName, setDisplayName] = useState('John Resident');
  const [role, setRole] = useState('Resident');
  const [customMode, setCustomMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Welcome transition state
  const [welcomeUser, setWelcomeUser] = useState(null);

  const presets = [
    { 
      email: 'resident@example.com', 
      name: 'John Resident', 
      role: 'Resident', 
      label: 'Resident Hub',
      icon: Home,
      desc: 'Evaluate utility bill projections, track hourly usage charts, and manage privacy consent.',
      color: 'var(--accent-blue)'
    },
    { 
      email: 'admin@example.com', 
      name: 'Sarah Admin', 
      role: 'Admin', 
      label: 'Landlord Panel',
      icon: Building,
      desc: 'Monitor real-time building demand statistics, map sub-metering zones, and manage alarms.',
      color: 'var(--accent-emerald)'
    },
    { 
      email: 'superadmin@example.com', 
      name: 'David SuperAdmin', 
      role: 'Super Admin', 
      label: 'Command Center',
      icon: Layers,
      desc: 'Verify aggregated grid load balances across multi-property portfolio holdings and export reports.',
      color: 'var(--accent-cyan)'
    },
    { 
      email: 'support@example.com', 
      name: 'Alex Support', 
      role: 'Support', 
      label: 'Support Desk',
      icon: Terminal,
      desc: 'Inspect network node latency states, view gateway errors, and pause WebSocket feeds.',
      color: 'var(--accent-amber)'
    }
  ];

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
      
      // Trigger "Welcome" transition
      setWelcomeUser(data.user);
      
      setTimeout(() => {
        onLoginSuccess(data.accessToken, data.user);
      }, 1800);

    } catch (err) {
      setErrorMsg(err.message || 'Failed to authenticate via SSO. Please try again.');
      setIsLoading(false);
    }
  };

  if (welcomeUser) {
    return (
      <div className="animated-login-bg">
        <style>{`
          @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animated-login-bg {
            background: linear-gradient(-45deg, #05070f, #0c0f20, #08142a, #03060f);
            background-size: 400% 400%;
            animation: gradientBG 12s ease infinite;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            font-family: var(--font-sans);
          }
          .welcome-box {
            background: rgba(13, 17, 30, 0.65);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: var(--radius-lg);
            padding: var(--space-xl) var(--space-lg);
            text-align: center;
            max-width: 440px;
            width: 90%;
            box-shadow: var(--shadow-2xl);
            animation: welcomeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes welcomeIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          .welcome-title {
            font-size: 22px;
            font-weight: 700;
            color: var(--text-primary);
            margin: var(--space-md) 0 var(--space-xs) 0;
          }
          .welcome-role {
            font-size: 11px;
            font-weight: 700;
            color: var(--accent-blue);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: var(--space-lg);
          }
          .welcome-sub {
            font-size: 13px;
            color: var(--text-secondary);
            margin-bottom: var(--space-lg);
          }
        `}</style>
        <div className="welcome-box">
          <Loader2 size={36} color="var(--accent-blue)" className="spin" style={{ margin: '0 auto' }} />
          <h2 className="welcome-title">Welcome back, {welcomeUser.displayName}</h2>
          <div className="welcome-role">{welcomeUser.role} Portal</div>
          <p className="welcome-sub">Synchronizing cryptographic gateway logs and caching active telemetry streams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animated-login-bg">
      <style>{`
        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animated-login-bg {
          background: linear-gradient(-45deg, #05070f, #0c0f20, #08142a, #03060f);
          background-size: 400% 400%;
          animation: gradientBG 12s ease infinite;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          font-family: var(--font-sans);
          overflow-y: auto;
          padding: var(--space-xl) 0;
        }
        .preset-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: var(--space-md);
          text-align: left;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          gap: var(--space-md);
          width: 100%;
        }
        .preset-card:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.04);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
        .preset-icon-box {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .preset-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .preset-desc {
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1.4;
          margin: 4px 0;
        }
        .preset-email {
          font-size: 10px;
          color: var(--accent-blue);
          font-family: var(--font-mono);
        }
      `}</style>
      
      <div className="surface-card animate-in" style={s.card}>
        <div style={s.glowHeader}>
          <div style={s.pulseDot} className="pulse" />
          <span style={s.glowText}>SMART TELEMETRY ENVIRONMENT</span>
        </div>

        <h1 style={s.title}>GridPulse Command Center</h1>
        <p style={s.subtitle}>
          Secure PWA portal for high-frequency residential telemetry, real-time demand alerts, and dynamic billing analytics.
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
              const Icon = p.icon;
              return (
                <button
                  key={p.email}
                  onClick={() => handlePresetSelect(p.email, p.name, p.role)}
                  className="preset-card"
                  style={{
                    borderColor: isSelected ? p.color : 'var(--border-subtle)',
                    background: isSelected ? 'rgba(255,255,255,0.03)' : 'transparent',
                    boxShadow: isSelected ? `0 0 10px rgba(59, 130, 246, 0.05)` : 'none'
                  }}
                >
                  <div className="preset-icon-box" style={{ background: `color-mix(in srgb, ${p.color} 10%, transparent)` }}>
                    <Icon size={18} color={p.color} />
                  </div>
                  <div>
                    <div style={s.presetMetaRow}>
                      <span className="preset-title">{p.label}</span>
                    </div>
                    <p className="preset-desc">{p.desc}</p>
                    <span className="preset-email">{p.email}</span>
                  </div>
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
  card: {
    maxWidth: '520px',
    width: '100%',
    padding: 'var(--space-xl) var(--space-lg)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-2xl)',
    background: 'rgba(13, 17, 30, 0.45)',
    backdropFilter: 'blur(16px)',
  },
  glowHeader: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    background: 'rgba(59, 130, 246, 0.08)',
    border: '1px solid rgba(59, 130, 246, 0.15)',
    padding: '6px 12px',
    borderRadius: 'var(--radius-full)',
    marginBottom: 'var(--space-md)',
  },
  pulseDot: {
    width: '6px',
    height: '6px',
    background: 'var(--accent-blue)',
    borderRadius: '50%',
  },
  glowText: {
    fontSize: '9px',
    fontWeight: 700,
    color: 'var(--accent-blue)',
    letterSpacing: '0.08em',
  },
  title: {
    fontSize: '24px',
    lineHeight: '1.2',
    fontWeight: 800,
    marginBottom: '4px',
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-lg)',
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
    marginBottom: 'var(--space-md)',
  },
  label: {
    fontSize: '10px',
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
  customToggle: {
    background: 'transparent',
    border: '1px dashed var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 12px',
    width: '100%',
    fontSize: '11px',
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
    margin: 'var(--space-md) 0',
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
