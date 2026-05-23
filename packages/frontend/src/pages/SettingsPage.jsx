import { useState, useEffect } from 'react';
import { 
  Bell, 
  Lock, 
  Shield, 
  Palette
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ConsentFlow } from '../components/ConsentFlow';
import { db } from '../db/indexedDB';

export const SettingsPage = ({ user, activeRole, onRoleSwitch }) => {
  const [enablePushes, setEnablePushes] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('5s');
  const [consentGranted, setConsentGranted] = useState(true);

  useEffect(() => {
    db.consentSettings.get('appliance_breakdown').then((rec) => {
      if (rec) {
        setConsentGranted(rec.status === 'Granted');
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

  return (
    <div style={s.container}>
      <PageHeader 
        title="Settings" 
        subtitle="Manage notification parameters, sync frequencies, and privacy settings."
        breadcrumb={[activeRole === 'Resident' ? 'Resident Hub' : activeRole === 'Admin' ? 'Admin Panel' : activeRole === 'Super Admin' ? 'Command Center' : 'Support Desk', 'Settings']}
      />

      <div style={s.stack}>
        {/* Notifications */}
        <div className="surface-card" style={s.group}>
          <h3 style={s.groupHeader}>
            <Bell size={16} color="var(--accent-blue)" />
            <span>System Notifications</span>
          </h3>
          
          <div style={s.settingRow}>
            <div>
              <h4 style={s.settingLabel}>Service Worker Push Notifications</h4>
              <p style={s.settingDesc}>Deliver simulated alert notifications if forecast exceeds budget threshold limits.</p>
            </div>
            <button 
              onClick={() => {
                const newEnable = !enablePushes;
                setEnablePushes(newEnable);
                if (newEnable && 'Notification' in window) {
                  Notification.requestPermission();
                }
              }}
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

        {/* Auth & Compliance */}
        <div className="surface-card" style={s.group}>
          <h3 style={s.groupHeader}>
            <Shield size={16} color="var(--accent-cyan)" />
            <span>Authentication & Compliance</span>
          </h3>
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

        {/* Privacy & Consent (Resident only) */}
        {activeRole === 'Resident' && (
          <div className="surface-card" style={s.group}>
            <h3 style={s.groupHeader}>
              <Lock size={16} color="var(--accent-emerald)" />
              <span>Privacy & Consent</span>
            </h3>
            <p style={s.settingDesc}>Manage compliance permissions to enable high-frequency sub-meter appliance signatures load tracking.</p>
            <div style={{ marginTop: 'var(--space-md)' }}>
              <ConsentFlow 
                userId={user.id} 
                initialConsent={consentGranted} 
                onConsentUpdated={handleConsentUpdated} 
              />
            </div>
          </div>
        )}

        {/* Dev Role Switcher */}
        <div className="surface-card" style={{ ...s.group, borderLeft: '3px solid var(--accent-violet)' }}>
          <h3 style={s.groupHeader}>
            <Palette size={16} color="var(--accent-violet)" />
            <span>Developer Mode — Role Switcher</span>
          </h3>
          <p style={s.settingDesc}>Prototype testing tool. Switch your active dashboard layout to preview other roles without logging out.</p>
          <div style={s.roleSwitcherGrid}>
            {[
              { role: 'Resident', label: 'Resident Hub', color: 'var(--accent-blue)' },
              { role: 'Admin', label: 'Landlord / Admin', color: 'var(--accent-emerald)' },
              { role: 'Super Admin', label: 'Super Admin', color: 'var(--accent-cyan)' },
              { role: 'Support', label: 'Customer Support', color: 'var(--accent-amber)' },
            ].map(r => (
              <button
                key={r.role}
                onClick={() => onRoleSwitch(r.role)}
                style={{
                  ...s.roleSwitchBtn,
                  borderColor: activeRole === r.role ? r.color : 'var(--border-primary)',
                  background: activeRole === r.role ? `color-mix(in srgb, ${r.color} 8%, transparent)` : 'transparent',
                  color: activeRole === r.role ? r.color : 'var(--text-secondary)',
                }}
              >
                <div style={{ ...s.roleDot, background: r.color }} />
                <span style={{ fontWeight: activeRole === r.role ? 700 : 500 }}>{r.label}</span>
                {activeRole === r.role && <span style={s.activeTag}>ACTIVE</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const s = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' },
  stack: { display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' },
  group: { padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' },
  groupHeader: { 
    fontSize: '15px', fontWeight: 600, 
    borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-xs)', margin: 0,
    display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
  },
  settingRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-xl)' },
  settingLabel: { fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 },
  settingDesc: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' },
  toggleSwitch: {
    width: '38px', height: '20px', borderRadius: '10px', border: 'none',
    cursor: 'pointer', position: 'relative', padding: '2px',
    display: 'flex', alignItems: 'center',
    transition: 'background var(--duration-fast) ease',
  },
  toggleKnob: {
    width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
    transition: 'transform var(--duration-fast) var(--ease-spring)',
  },
  roleSwitcherGrid: { 
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)',
    marginTop: 'var(--space-sm)',
  },
  roleSwitchBtn: {
    display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
    padding: '10px 14px', border: '1px solid', borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-sans)',
    transition: 'all var(--duration-fast) ease', background: 'transparent',
  },
  roleDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  activeTag: { 
    fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em',
    marginLeft: 'auto', opacity: 0.7,
  },
};
