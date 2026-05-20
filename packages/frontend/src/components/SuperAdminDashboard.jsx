import React, { useState } from 'react';
import { 
  Network, 
  MapPin, 
  Download, 
  FileText, 
  CheckCircle, 
  Loader2, 
  ShieldCheck 
} from 'lucide-react';

export const SuperAdminDashboard = () => {
  const [exporting, setExporting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('All');
  const [reportFormat, setReportFormat] = useState('PDF');

  // Seed mock properties for portfolio management
  const properties = [
    { id: 'PROP-01', name: 'Mont Kiara Residencies', location: 'Kuala Lumpur', load: '142.6 kW', status: 'Optimal', activeMeters: 45, alarms: 0 },
    { id: 'PROP-02', name: 'Bangsar Heights Suites', location: 'Kuala Lumpur', load: '98.4 kW', status: 'Warning', activeMeters: 32, alarms: 1 },
    { id: 'PROP-03', name: 'Damansara Heights Tower', location: 'Petaling Jaya', load: '210.8 kW', status: 'Optimal', activeMeters: 68, alarms: 0 },
    { id: 'PROP-04', name: 'Penang Gurney Marina', location: 'George Town', load: '0.0 kW', status: 'Offline', activeMeters: 0, alarms: 1 }
  ];

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
      <div style={styles.propertyGrid}>
        {properties.map(p => (
          <div key={p.id} className="card-premium" style={styles.propCard}>
            <div style={styles.propHeader}>
              <div>
                <h4 style={styles.propName}>{p.name}</h4>
                <div style={styles.propLoc}>
                  <MapPin size={12} style={{ marginRight: '4px' }} />
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
                color: p.status === 'Optimal' 
                  ? 'var(--accent-emerald)' 
                  : p.status === 'Warning' 
                    ? 'var(--accent-amber)' 
                    : 'var(--accent-rose)',
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
            <h3 style={{ margin: 0, fontSize: '16px' }}>Accounting Export Utility</h3>
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
                <Loader2 size={16} className="spin" style={{ marginRight: '8px' }} />
                <span>Compiling database hypertable streams...</span>
              </>
            ) : (
              <>
                <FileText size={16} style={{ marginRight: '8px' }} />
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
            <h3 style={{ margin: 0, fontSize: '16px' }}>Tenant Multi-Property Security Profile</h3>
          </div>
          <p style={{ ...styles.instruction, marginBottom: '20px' }}>
            Zone configurations and landlord scopes are synchronized with security credentials automatically.
          </p>

          <div style={styles.securityBullet}>
            <ShieldCheck size={16} color="var(--accent-cyan)" style={{ marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#fff', fontSize: '13px' }}>Enterprise SSO Gateways:</strong>
              <div style={styles.bulletDetail}>LDAP, Okta, and Active Directory federations are managed by DNS record sets.</div>
            </div>
          </div>

          <div style={styles.securityBullet}>
            <ShieldCheck size={16} color="var(--accent-cyan)" style={{ marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#fff', fontSize: '13px' }}>Digital Sub-Metering Isolation:</strong>
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
    gap: '16px',
    flexGrow: 1,
  },
  sectionHeader: {
    fontSize: '16px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 12px 0',
  },
  propertyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    marginBottom: '16px',
  },
  propCard: {
    padding: '20px',
  },
  propHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '12px',
    marginBottom: '16px',
  },
  propName: {
    fontSize: '15px',
    color: '#fff',
    margin: 0,
  },
  propLoc: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    marginTop: '2px',
  },
  statusBadge: {
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  propStatsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  statLabel: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#fff',
    marginTop: '4px',
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '24px',
  },
  exportCard: {
    padding: '24px',
  },
  infoCard: {
    padding: '24px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  instruction: {
    fontSize: '13px',
    lineHeight: '1.5',
    color: 'var(--text-secondary)',
    marginTop: 0,
    marginBottom: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  select: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '10px',
    color: '#fff',
    outline: 'none',
    fontSize: '13px',
    cursor: 'pointer',
  },
  exportBtn: {
    width: '100%',
    justifyContent: 'center',
    padding: '12px',
  },
  exportToast: {
    marginTop: '16px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '12px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  securityBullet: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    marginBottom: '16px',
  },
  bulletDetail: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '2px',
    lineHeight: '1.4',
  },
};
