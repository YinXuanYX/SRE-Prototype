import { useState, useEffect, useMemo } from 'react';
import { 
  Network, 
  MapPin, 
  ShieldCheck,
  Building,
  TrendingUp,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { PageHeader } from './PageHeader';

export const SuperAdminDashboard = ({ recentTelemetry, socketStatus }) => {
  // Trigger periodic updates for fluctuation effect
  const [time, setTime] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setTime(Date.now()), 2000);
    return () => clearInterval(timer);
  }, []);

  const activeDevices = Object.values(recentTelemetry || {});
  const liveLoadKw = activeDevices
    .filter(d => d.status === 'Active')
    .reduce((acc, d) => acc + d.loadKw, 0);
  
  const liveAlarms = activeDevices.filter(d => 
    d.status === 'Error' || 
    (d.deviceId === 'device-anomaly-timer' && d.loadKw > 3.0)
  ).length;

  const liveMeterCount = activeDevices.length;
  
  let bangsarStatus = 'Optimal';
  if (socketStatus !== 'Connected') {
    bangsarStatus = 'Offline';
  } else if (liveAlarms > 0) {
    bangsarStatus = 'Warning';
  }

  // Aggregate properties list with live binding for Bangsar Heights Suites
  const properties = useMemo(() => {
    return [
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
  }, [time, liveLoadKw, liveMeterCount, liveAlarms, socketStatus, bangsarStatus]);

  const portfolioStats = useMemo(() => {
    let totalLoad = 0;
    let totalMeters = 0;
    let totalAlarms = 0;
    properties.forEach(p => {
      totalLoad += parseFloat(p.load) || 0;
      totalMeters += p.activeMeters;
      totalAlarms += p.alarms;
    });
    return {
      load: totalLoad.toFixed(1),
      meters: totalMeters,
      alarms: totalAlarms,
      propertiesCount: properties.length
    };
  }, [properties]);

  const getStatusAccentColor = (status) => {
    if (status === 'Optimal') return 'var(--accent-emerald)';
    if (status === 'Warning') return 'var(--accent-amber)';
    return 'var(--accent-rose)';
  };

  return (
    <div style={s.container}>
      <PageHeader 
        title="Portfolio Overview" 
        subtitle="Aggregated multi-property load balances, node telemetry status, and security compliance."
        breadcrumb={['Command Center', 'Portfolio Overview']}
      />

      {/* ── Portfolio Stats Strip ── */}
      <section style={s.metricsGrid} className="stagger-children animate-in">
        <div className="surface-card" style={s.metricCard}>
          <div style={{ ...s.iconBadge, background: 'rgba(59, 130, 246, 0.08)' }}>
            <Building size={18} color="var(--accent-blue)" />
          </div>
          <div>
            <div style={s.metricLabel}>Managed Properties</div>
            <div style={s.metricVal}>{portfolioStats.propertiesCount} <span style={s.metricUnit}>sites</span></div>
          </div>
        </div>
        <div className="surface-card" style={s.metricCard}>
          <div style={{ ...s.iconBadge, background: 'rgba(6, 182, 212, 0.08)' }}>
            <TrendingUp size={18} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={s.metricLabel}>Portfolio Draw</div>
            <div style={s.metricVal}>{portfolioStats.load} <span style={s.metricUnit}>kW</span></div>
          </div>
        </div>
        <div className="surface-card" style={s.metricCard}>
          <div style={{ ...s.iconBadge, background: 'rgba(16, 185, 129, 0.08)' }}>
            <Activity size={18} color="var(--accent-emerald)" />
          </div>
          <div>
            <div style={s.metricLabel}>Total Sub-Meters</div>
            <div style={s.metricVal}>{portfolioStats.meters} <span style={s.metricUnit}>online</span></div>
          </div>
        </div>
        <div className="surface-card" style={s.metricCard}>
          <div style={{ ...s.iconBadge, background: 'rgba(244, 63, 94, 0.08)' }}>
            <AlertTriangle size={18} color="var(--accent-rose)" />
          </div>
          <div>
            <div style={s.metricLabel}>Active Alarms</div>
            <div style={{ ...s.metricVal, color: portfolioStats.alarms > 0 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
              {portfolioStats.alarms} <span style={s.metricUnit}>unresolved</span>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Command Cards */}
      <h3 style={s.sectionHeader}>Aggregate Portfolio Overview</h3>
      
      <div className="stagger-children style={s.propertyGrid}" style={s.propertyGrid}>
        {properties.map(p => (
          <div
            key={p.id}
            className="card-premium surface-card"
            style={{
              ...s.propCard,
              borderLeft: `3px solid ${getStatusAccentColor(p.status)}`,
            }}
          >
            <div style={s.propHeader}>
              <div>
                <h4 style={s.propName}>{p.name}</h4>
                <div style={s.propLoc}>
                  <MapPin size={12} style={{ marginRight: 'var(--space-xs)' }} />
                  <span>{p.location} (ID: {p.id})</span>
                </div>
              </div>

              <span style={{
                ...s.statusBadge,
                background: p.status === 'Optimal' 
                  ? 'rgba(16, 185, 129, 0.08)' 
                  : p.status === 'Warning' 
                    ? 'rgba(245, 158, 11, 0.08)' 
                    : 'rgba(244, 63, 94, 0.08)',
                color: getStatusAccentColor(p.status),
              }}>
                {p.status}
              </span>
            </div>

            <div style={s.propStatsRow}>
              <div>
                <div style={s.statLabel}>Load Demand</div>
                <div style={s.statVal}>{p.load}</div>
              </div>
              <div>
                <div style={s.statLabel}>Active Nodes</div>
                <div style={s.statVal}>{p.activeMeters}</div>
              </div>
              <div>
                <div style={s.statLabel}>Alarms</div>
                <div style={{ ...s.statVal, color: p.alarms > 0 ? 'var(--accent-rose)' : 'inherit' }}>{p.alarms}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Global configuration status */}
      <div style={s.bottomRow} className="animate-in">
        <section className="surface-card" style={s.infoCard}>
          <div style={s.cardHeader}>
            <Network size={18} color="var(--accent-blue)" />
            <h3 style={s.cardTitle}>Tenant Multi-Property Security Profile</h3>
          </div>
          <p style={s.instruction}>
            Zone configurations and landlord scopes are synchronized with security credentials automatically.
          </p>

          <div style={s.securityGrid}>
            <div style={s.securityBullet}>
              <ShieldCheck size={16} color="var(--accent-cyan)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={s.bulletTitle}>Enterprise SSO Gateways:</strong>
                <div style={s.bulletDetail}>LDAP, Okta, and Active Directory federations are managed by DNS record sets.</div>
              </div>
            </div>

            <div style={s.securityBullet}>
              <ShieldCheck size={16} color="var(--accent-cyan)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={s.bulletTitle}>Digital Sub-Metering Isolation:</strong>
                <div style={s.bulletDetail}>Virtual plug networks are isolated in distinct security hypertable shards to enforce tenancy privacy directives.</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const s = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' },
  metricCard: { padding: 'var(--space-md) var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' },
  iconBadge: { padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  metricLabel: { fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' },
  metricVal: { fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' },
  metricUnit: { fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)' },
  
  sectionHeader: {
    fontSize: '13px',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: 'var(--space-md) 0 var(--space-xs) 0',
  },
  propertyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--space-lg)',
  },
  propCard: {
    padding: 'var(--space-lg)',
    borderRadius: 'var(--radius-md)',
  },
  propHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid var(--border-subtle)',
    paddingBottom: 'var(--space-md)',
    marginBottom: 'var(--space-md)',
  },
  propName: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: 0,
  },
  propLoc: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    marginTop: '4px',
  },
  statusBadge: {
    fontSize: '9px',
    fontWeight: 700,
    textTransform: 'uppercase',
    padding: '2px 6px',
    borderRadius: '3px',
  },
  propStatsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--space-md)',
  },
  statLabel: {
    fontSize: '9px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  statVal: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginTop: '4px',
  },
  bottomRow: { display: 'flex', flexDirection: 'column' },
  infoCard: { padding: 'var(--space-lg)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' },
  cardTitle: { margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' },
  instruction: { fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 var(--space-lg) 0' },
  securityGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-lg)' },
  securityBullet: { display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' },
  bulletTitle: { color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600 },
  bulletDetail: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }
};
