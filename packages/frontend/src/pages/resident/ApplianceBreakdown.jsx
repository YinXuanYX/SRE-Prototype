import { useState, useMemo } from 'react';
import { 
  Cpu, 
  Zap, 
  Edit2, 
  Lock, 
  Lightbulb, 
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { ApplianceCorrectionModal } from '../../components/ApplianceCorrectionModal';
import { db } from '../../db/indexedDB';
import { useLiveQuery } from 'dexie-react-hooks';

export const ApplianceBreakdown = ({ recentTelemetry }) => {
  const [correctionDevice, setCorrectionDevice] = useState(null);

  // Reactively query consent status and label overrides from Dexie IndexedDB
  const consentRecord = useLiveQuery(() => db.consentSettings.get('appliance_breakdown'));
  const labelOverrides = useLiveQuery(() => db.applianceOverrides.toArray());

  const consentGranted = consentRecord ? consentRecord.status === 'Granted' : false;

  const labelOverrideMap = useMemo(() => {
    return new Map((labelOverrides || []).map(o => [o.deviceId, o.correctedLabel]));
  }, [labelOverrides]);

  const sortedDevices = useMemo(() => {
    return Object.values(recentTelemetry || {})
      .map(dev => ({ 
        ...dev, 
        deviceName: labelOverrideMap.get(dev.deviceId) || dev.deviceName 
      }))
      .sort((a, b) => b.loadKw - a.loadKw);
  }, [recentTelemetry, labelOverrideMap]);

  const recommendations = useMemo(() => {
    const tips = [];
    sortedDevices.forEach((dev) => {
      if (dev.status !== 'Active') return;
      if (dev.deviceName.toLowerCase().includes('aircon') || dev.deviceName.toLowerCase().includes('conditioner')) {
        const saved = (dev.loadKw * 0.15 * 6 * 30 * 0.516).toFixed(2);
        tips.push({ 
          id: 'tip-ac', 
          targetDevice: dev.deviceName, 
          message: 'Increase your Air Conditioner temperature target to 24°C instead of 18°C.', 
          savings: `RM ${saved} / month` 
        });
      }
      if (dev.deviceName.toLowerCase().includes('fridge') || dev.deviceName.toLowerCase().includes('refrigerator')) {
        const saved = (dev.loadKw * 0.20 * 24 * 30 * 0.334).toFixed(2);
        tips.push({ 
          id: 'tip-fridge', 
          targetDevice: dev.deviceName, 
          message: 'Clean refrigerator condenser coils and check the rubber door vacuum seals.', 
          savings: `RM ${saved} / month` 
        });
      }
      if (dev.deviceName.toLowerCase().includes('pump') || dev.deviceName.toLowerCase().includes('heater')) {
        const saved = (dev.loadKw * 0.30 * 2 * 30 * 0.516).toFixed(2);
        tips.push({ 
          id: 'tip-pump', 
          targetDevice: dev.deviceName, 
          message: 'Reduce utility duty runtime cycles by scheduling pump runs during low-draw periods.', 
          savings: `RM ${saved} / month` 
        });
      }
    });
    if (tips.length === 0) {
      tips.push({ 
        id: 'tip-default', 
        targetDevice: 'General', 
        message: 'Shift energy-heavy tasks (laundry, cooking) to off-peak periods (after 10:00 PM).', 
        savings: 'RM 12.40 / month' 
      });
    }
    return tips;
  }, [sortedDevices]);

  const handleGrantConsent = async () => {
    await db.consentSettings.put({
      consentType: 'appliance_breakdown',
      status: 'Granted',
      timestamp: new Date().toISOString()
    });
  };

  const handleSaveOverride = async (deviceId, correctedLabel) => {
    await db.applianceOverrides.put({
      deviceId, 
      correctedLabel, 
      timestamp: new Date().toISOString()
    });
    setCorrectionDevice(null);
  };

  return (
    <div style={s.container}>
      <PageHeader 
        title="Appliance Breakdown" 
        subtitle="Granular appliance-level analysis, correction overrides, and savings tips."
        breadcrumb={['Resident Hub', 'Appliance Breakdown']}
      />

      {!consentGranted ? (
        <div className="surface-card" style={s.gatedCard}>
          <div style={s.gatedIconWrapper}>
            <Lock size={32} color="var(--accent-rose)" />
          </div>
          <h3 style={s.gatedTitle}>PDPA Consent Required</h3>
          <p style={s.gatedText}>
            Under the Personal Data Protection Act (PDPA), we require your explicit consent to analyze and display detailed sub-metering appliance breakdown metrics. Granting consent allows GridPulse to analyze load signatures and provide tailored savings recommendations.
          </p>
          <div style={s.gatedFeatures}>
            <div style={s.featureItem}>
              <ShieldCheck size={16} color="var(--accent-emerald)" />
              <span>Secure, localized browser-level data decryption</span>
            </div>
            <div style={s.featureItem}>
              <ShieldCheck size={16} color="var(--accent-emerald)" />
              <span>Full control to revoke consent at any time in Settings</span>
            </div>
          </div>
          <button onClick={handleGrantConsent} className="btn-primary" style={s.grantBtn}>
            Accept & Grant Consent
          </button>
        </div>
      ) : (
        <div style={s.twoCol} className="stagger-children">
          {/* Left: Rankings */}
          <section className="surface-card animate-in" style={s.panel}>
            <div style={s.panelHeader}>
              <div style={s.titleRow}>
                <Cpu size={18} color="var(--accent-blue)" />
                <h3 style={s.sectionTitle}>Appliance Rankings</h3>
              </div>
              <span style={s.subtle}>Sorted by real-time load</span>
            </div>

            <div style={s.deviceList}>
              {sortedDevices.length === 0 ? (
                <div style={s.emptyState}>
                  <Zap size={24} color="var(--accent-amber)" />
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
                    Awaiting device telemetry streams...
                  </p>
                </div>
              ) : (
                sortedDevices.map((dev, index) => (
                  <div key={dev.deviceId} style={s.deviceRow}>
                    <div style={s.deviceLeft}>
                      <span style={s.rankBadge}>#{index + 1}</span>
                      <div style={{
                        ...s.dot,
                        background: dev.status === 'Active' ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                      }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={s.deviceNameRow}>
                          <span style={s.deviceName}>{dev.deviceName}</span>
                          <button onClick={() => setCorrectionDevice(dev)} style={s.editBtn} title="Correct label">
                            <Edit2 size={10} />
                          </button>
                        </div>
                        <div style={s.deviceId}>{dev.deviceId}</div>
                      </div>
                    </div>
                    <div style={s.deviceRight}>
                      <div style={s.loadVal}>{dev.loadKw} <span style={s.unit}>kW</span></div>
                      <div style={s.voltageVal}>{dev.voltage}V</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Right: Saving Tips */}
          <section className="surface-card animate-in" style={s.panel}>
            <div style={s.panelHeader}>
              <div style={s.titleRow}>
                <Lightbulb size={18} color="var(--accent-amber)" />
                <h3 style={s.sectionTitle}>Savings Recommendations</h3>
              </div>
            </div>
            
            <p style={s.tipsIntro}>
              Dynamic energy-efficiency insights generated based on your real-time active appliances:
            </p>

            <div style={s.tipsList}>
              {recommendations.map(rec => (
                <div key={rec.id} style={s.tipCard}>
                  <div style={s.tipHeader}>
                    <span style={s.tipBadge}>{rec.targetDevice}</span>
                    <span style={s.tipSavings}>{rec.savings}</span>
                  </div>
                  <p style={s.tipText}>{rec.message}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {correctionDevice && (
        <ApplianceCorrectionModal 
          device={correctionDevice} 
          onClose={() => setCorrectionDevice(null)} 
          onSave={handleSaveOverride} 
        />
      )}
    </div>
  );
};

const s = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' },
  twoCol: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-lg)', alignItems: 'start' },
  panel: { padding: 'var(--space-lg)' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' },
  sectionTitle: { margin: 0, fontSize: '15px', fontWeight: 600 },
  subtle: { fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' },
  
  deviceList: { display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' },
  deviceRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    transition: 'background var(--duration-fast) ease',
  },
  deviceLeft: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', minWidth: 0 },
  rankBadge: {
    fontSize: '10px', fontWeight: 700, color: 'var(--accent-cyan)',
    background: 'rgba(6, 182, 212, 0.08)', padding: '2px 5px', borderRadius: 'var(--radius-xs)',
    minWidth: '22px', textAlign: 'center',
  },
  dot: { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 },
  deviceNameRow: { display: 'flex', alignItems: 'center', gap: '4px' },
  deviceName: { fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' },
  editBtn: {
    background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
    padding: '2px', display: 'flex', alignItems: 'center', borderRadius: '3px',
    transition: 'color 0.2s',
  },
  deviceId: { fontSize: '10px', color: 'var(--text-muted)' },
  deviceRight: { textAlign: 'right' },
  loadVal: { fontSize: '14px', fontWeight: 700, color: 'var(--accent-cyan)' },
  unit: { fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)' },
  voltageVal: { fontSize: '10px', color: 'var(--text-muted)' },
  emptyState: { padding: 'var(--space-xl)', textAlign: 'center' },

  tipsIntro: { fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 var(--space-md) 0' },
  tipsList: { display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' },
  tipCard: {
    background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)', padding: 'var(--space-md)',
  },
  tipHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  tipBadge: {
    fontSize: '9px', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase',
    background: 'rgba(59, 130, 246, 0.06)', padding: '2px 6px', borderRadius: '3px',
  },
  tipSavings: { fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 700 },
  tipText: { fontSize: '12px', lineHeight: '1.5', color: 'var(--text-secondary)', margin: 0 },

  // Gated Card CSS
  gatedCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-xl) var(--space-lg)',
    textAlign: 'center',
    maxWidth: '560px',
    margin: 'var(--space-xl) auto',
    boxShadow: 'var(--shadow-lg)',
    borderRadius: 'var(--radius-md)',
  },
  gatedIconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'rgba(244, 63, 94, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 'var(--space-md)',
  },
  gatedTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 var(--space-xs) 0',
  },
  gatedText: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: 'var(--text-secondary)',
    margin: '0 0 var(--space-lg) 0',
  },
  gatedFeatures: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)',
    width: '100%',
    maxWidth: '380px',
    marginBottom: 'var(--space-lg)',
    textAlign: 'left',
    background: 'var(--bg-input)',
    padding: 'var(--space-md)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    fontSize: '12px',
    color: 'var(--text-primary)',
  },
  grantBtn: {
    width: '100%',
    maxWidth: '240px',
    padding: '10px 0',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    fontWeight: 600,
  }
};
