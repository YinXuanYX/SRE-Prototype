import React, { useState, useEffect } from 'react';
import { 
  Network, 
  MapPin, 
  Download, 
  FileText, 
  CheckCircle, 
  Loader2, 
  ShieldCheck 
} from 'lucide-react';

export const SuperAdminDashboard = ({ recentTelemetry, socketStatus }) => {
  const [exporting, setExporting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('All');
  const [reportFormat, setReportFormat] = useState('PDF');
  
  // Trigger periodic rerenders to show real-time numerical fluctuations
  const [time, setTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setTime(Date.now()), 2000);
    return () => clearInterval(timer);
  }, []);

  const activeDevices = Object.values(recentTelemetry || {});
  const liveLoadKw = activeDevices
    .filter(d => d.status === 'Active')
    .reduce((acc, d) => acc + d.loadKw, 0);
  
  // Count devices with status 'Error' or the anomaly timer device drawing current
  const liveAlarms = activeDevices.filter(d => 
    d.status === 'Error' || 
    (d.deviceId === 'device-anomaly-timer' && d.loadKw > 3.0)
  ).length;

  const liveMeterCount = activeDevices.length;
  
  // Compute dynamic status for Bangsar Heights Suites
  let bangsarStatus = 'Optimal';
  if (socketStatus !== 'Connected') {
    bangsarStatus = 'Offline';
  } else if (liveAlarms > 0) {
    bangsarStatus = 'Warning';
  }

  // Aggregate properties list with live binding for Bangsar Heights Suites
  const properties = [
    { 
      id: 'PROP-01', 
      name: 'Mont Kiara Residencies', 
      location: 'Kuala Lumpur', 
      load: `${(142.6 + Math.sin(time / 15000) * 4.2).toFixed(1)} kW`, 
      status: 'Optimal', 
      activeMeters: 45, 
      alarms: 0 
    },
    { 
      id: 'PROP-02', 
      name: 'Bangsar Heights Suites', 
      location: 'Kuala Lumpur', 
      load: socketStatus === 'Connected' ? `${liveLoadKw.toFixed(1)} kW` : '0.0 kW', 
      status: bangsarStatus, 
      activeMeters: socketStatus === 'Connected' ? liveMeterCount : 0, 
      alarms: socketStatus === 'Connected' ? liveAlarms : 0 
    },
    { 
      id: 'PROP-03', 
      name: 'Damansara Heights Tower', 
      location: 'Petaling Jaya', 
      load: `${(210.8 + Math.cos(time / 18000) * 6.7).toFixed(1)} kW`, 
      status: 'Optimal', 
      activeMeters: 68, 
      alarms: 0 
    },
    { 
      id: 'PROP-04', 
      name: 'Penang Gurney Marina', 
      location: 'George Town', 
      load: '0.0 kW', 
      status: 'Offline', 
      activeMeters: 0, 
      alarms: 1 
    }
  ];

  const getStatusAccentColor = (status) => {
    if (status === 'Optimal') return 'var(--accent-emerald)';
    if (status === 'Warning') return 'var(--accent-amber)';
    return 'var(--accent-rose)';
  };

  const handleExport = () => {
    setExporting(true);
    setToastMsg('');
    
    // Simulate generation latency
    setTimeout(() => {
      setExporting(false);
      setToastMsg(`✓ Accounting report generated successfully: SRE_UtilityReport_${selectedProperty}_2026.${reportFormat.toLowerCase()}`);
      setTimeout(() => setToastMsg(''), 4000);
    }, 2000);
  };

  return (
    <div style={styles.container}>
      {/* Portfolio Command Cards */}
      <h3 style={styles.sectionHeader}>Aggregate Portfolio Overview</h3>
      <div className="stagger-children" style={styles.propertyGrid}>
        {properties.map(p => (
          <div
            key={p.id}
            className="card-premium"
            style={{
              ...styles.propCard,
              borderLeft: `3px solid ${getStatusAccentColor(p.status)}`,
            }}
          >
            <div style={styles.propHeader}>
              <div>
                <h4 style={styles.propName}>{p.name}</h4>
                <div style={styles.propLoc}>
                  <MapPin size={12} style={{ marginRight: 'var(--space-xs)' }} />
                  <span>{p.location} (ID: {p.id})</span>
                </div>
              </div>

              <span style={{
                ...styles.statusBadge,
                background: p.status === 'Optimal' 
                  ? 'rgba(16, 185, 129, 0.15)' 
                  : p.status === 'Warning' 
                    ? 'rgba(245, 158, 11, 0.15)' 
                    : 'rgba(244, 63, 94, 0.15)',
                color: getStatusAccentColor(p.status),
              }}>
                {p.status}
              </span>
            </div>

            <div style={styles.propStatsRow}>
              <div>
                <div style={styles.statLabel}>Load Demand</div>
                <div style={styles.statVal}>{p.load}</div>
              </div>
              <div>
                <div style={styles.statLabel}>Active Nodes</div>
                <div style={styles.statVal}>{p.activeMeters}</div>
              </div>
              <div>
                <div style={styles.statLabel}>Alarms</div>
                <div style={{ ...styles.statVal, color: p.alarms > 0 ? 'var(--accent-rose)' : 'inherit' }}>{p.alarms}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Accounting Exporter widget */}
      <div style={styles.bottomGrid}>
        <section className="glass-panel" style={styles.exportCard}>
          <div style={styles.cardHeader}>
            <Download size={18} color="var(--accent-cyan)" />
            <h3 style={styles.cardTitle}>Accounting Export Utility</h3>
          </div>

          <p style={styles.instruction}>
            Compile and export aggregated sub-metering datasets and tenant billing summaries for tax and financial filing.
          </p>

          <div style={styles.formRow}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Select Target Property</label>
              <select 
                value={selectedProperty} 
                onChange={(e) => setSelectedProperty(e.target.value)}
                style={styles.select}
              >
                <option value="All">All Portfolio Properties</option>
                <option value="MontKiara">Mont Kiara Residencies</option>
                <option value="Bangsar">Bangsar Heights Suites</option>
                <option value="Damansara">Damansara Heights Tower</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>File Extension Target</label>
              <select 
                value={reportFormat} 
                onChange={(e) => setReportFormat(e.target.value)}
                style={styles.select}
              >
                <option value="PDF">Document Format (.PDF)</option>
                <option value="CSV">Data Sheet (.CSV)</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleExport} 
            disabled={exporting} 
            className="btn-primary" 
            style={styles.exportBtn}
          >
            {exporting ? (
              <>
                <Loader2 size={16} className="spin" style={{ marginRight: 'var(--space-sm)' }} />
                <span>Compiling database hypertable streams...</span>
              </>
            ) : (
              <>
                <FileText size={16} style={{ marginRight: 'var(--space-sm)' }} />
                <span>Generate Billing Report</span>
              </>
            )}
          </button>

          {toastMsg && (
            <div style={styles.exportToast}>
              <CheckCircle size={14} color="var(--accent-emerald)" />
              <span>{toastMsg}</span>
            </div>
          )}
        </section>

        {/* Global configuration status */}
        <section className="glass-panel" style={styles.infoCard}>
          <div style={styles.cardHeader}>
            <Network size={18} color="var(--accent-blue)" />
            <h3 style={styles.cardTitle}>Tenant Multi-Property Security Profile</h3>
          </div>
          <p style={styles.instructionSpaced}>
            Zone configurations and landlord scopes are synchronized with security credentials automatically.
          </p>

          <div style={styles.securityBullet}>
            <ShieldCheck size={16} color="var(--accent-cyan)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <strong style={styles.bulletTitle}>Enterprise SSO Gateways:</strong>
              <div style={styles.bulletDetail}>LDAP, Okta, and Active Directory federations are managed by DNS record sets.</div>
            </div>
          </div>

          <div style={styles.securityBullet}>
            <ShieldCheck size={16} color="var(--accent-cyan)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <strong style={styles.bulletTitle}>Digital Sub-Metering Isolation:</strong>
              <div style={styles.bulletDetail}>Virtual plug networks are isolated in distinct security hypertable shards to enforce tenancy privacy directives.</div>
            </div>
          </div>
        </section>
      </div>

    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-lg)',
    flexGrow: 1,
  },
  sectionHeader: {
    fontSize: '16px',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 var(--space-sm) 0',
  },
  propertyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--space-lg)',
    marginBottom: 'var(--space-md)',
  },
  propCard: {
    padding: 'var(--space-lg)',
    borderRadius: 'var(--radius-lg)',
    transition: `box-shadow var(--duration-normal) var(--ease-out-expo)`,
  },
  propHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid var(--border-primary)',
    paddingBottom: 'var(--space-md)',
    marginBottom: 'var(--space-md)',
  },
  propName: {
    fontSize: '15px',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-primary)',
    margin: 0,
  },
  propLoc: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    marginTop: 'var(--space-xs)',
  },
  statusBadge: {
    fontSize: '10px',
    fontWeight: 700,
    fontFamily: 'var(--font-sans)',
    textTransform: 'uppercase',
    padding: 'var(--space-xs) var(--space-sm)',
    borderRadius: 'var(--radius-sm)',
  },
  propStatsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--space-md)',
  },
  statLabel: {
    fontSize: '10px',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: '15px',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginTop: 'var(--space-xs)',
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: 'var(--space-xl)',
  },
  exportCard: {
    padding: 'var(--space-lg)',
    borderRadius: 'var(--radius-lg)',
  },
  infoCard: {
    padding: 'var(--space-lg)',
    borderRadius: 'var(--radius-lg)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    marginBottom: 'var(--space-md)',
  },
  cardTitle: {
    margin: 0,
    fontSize: '16px',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-primary)',
  },
  instruction: {
    fontSize: '13px',
    lineHeight: '1.5',
    color: 'var(--text-secondary)',
    marginTop: 0,
    marginBottom: 'var(--space-lg)',
  },
  instructionSpaced: {
    fontSize: '13px',
    lineHeight: '1.5',
    color: 'var(--text-secondary)',
    marginTop: 0,
    marginBottom: 'var(--space-xl)',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--space-lg)',
    marginBottom: 'var(--space-lg)',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)',
  },
  label: {
    fontSize: '12px',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  select: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-sm) var(--space-md)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontSize: '13px',
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    transition: `border-color var(--duration-normal) var(--ease-out-expo)`,
  },
  exportBtn: {
    width: '100%',
    justifyContent: 'center',
    padding: 'var(--space-md)',
    borderRadius: 'var(--radius-md)',
  },
  exportToast: {
    marginTop: 'var(--space-md)',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-sm) var(--space-md)',
    fontSize: '12px',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
  },
  securityBullet: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-lg)',
  },
  bulletTitle: {
    color: 'var(--text-primary)',
    fontSize: '13px',
    fontFamily: 'var(--font-sans)',
  },
  bulletDetail: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: 'var(--space-xs)',
    lineHeight: '1.4',
  },
};
