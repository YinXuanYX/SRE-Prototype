import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Building, 
  TrendingUp, 
  ShieldAlert,
  Radio,
  Zap,
  Activity
} from 'lucide-react';
import { PageHeader } from './PageHeader';

export const AdminDashboard = ({ recentTelemetry, liveLogs, socketStatus }) => {
  const [alarms] = useState([
    { id: 'AL-091', status: 'Open' },
    { id: 'AL-092', status: 'In Progress' }
  ]);

  const [liveAnomalyCount, setLiveAnomalyCount] = useState(0);
  const seenAlertIds = useRef(new Set());

  // Count live anomalies from WebSocket connection
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3000/telemetry');
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'anomaly_alert') {
          const alert = payload.data;
          if (seenAlertIds.current.has(alert.id)) return;
          seenAlertIds.current.add(alert.id);
          setLiveAnomalyCount(prev => prev + 1);
        }
      } catch (err) {
        console.warn('Error parsing live anomaly telemetry:', err);
      }
    };
    return () => socket.close();
  }, []);

  const stats = useMemo(() => {
    let activeCount = 0;
    let totalKw = 0;
    let avgVoltage = 240;
    const devs = Object.values(recentTelemetry || {});
    devs.forEach(dev => { 
      if (dev.status === 'Active') { 
        activeCount++; 
        totalKw += dev.loadKw; 
      } 
    });
    if (devs.length > 0) {
      avgVoltage = Math.round(devs.reduce((s, d) => s + d.voltage, 0) / devs.length);
    }
    return { activeCount, totalKw: totalKw.toFixed(2), averageVoltage: avgVoltage };
  }, [recentTelemetry]);

  return (
    <div style={s.container}>
      <PageHeader 
        title="Building Overview" 
        subtitle="Real-time building load tracking, meter status aggregation, and zone load preview."
        breadcrumb={['Admin Panel', 'Building Overview']}
      />

      {/* ── Metrics Strip ── */}
      <section style={s.metricsGrid} className="stagger-children animate-in">
        <div className="surface-card" style={s.metricCard}>
          <div style={{ ...s.iconBadge, background: 'rgba(59, 130, 246, 0.08)' }}>
            <Building size={18} color="var(--accent-blue)" />
          </div>
          <div>
            <div style={s.metricLabel}>Total Building Load</div>
            <div style={s.metricVal}>{stats.totalKw} <span style={s.metricUnit}>kW</span></div>
          </div>
        </div>
        <div className="surface-card" style={s.metricCard}>
          <div style={{ ...s.iconBadge, background: 'rgba(16, 185, 129, 0.08)' }}>
            <TrendingUp size={18} color="var(--accent-emerald)" />
          </div>
          <div>
            <div style={s.metricLabel}>Active Sub-Meters</div>
            <div style={s.metricVal}>{stats.activeCount} <span style={s.metricUnit}>online</span></div>
          </div>
        </div>
        <div className="surface-card" style={s.metricCard}>
          <div style={{ ...s.iconBadge, background: 'rgba(245, 158, 11, 0.08)' }}>
            <ShieldAlert size={18} color="var(--accent-amber)" />
          </div>
          <div>
            <div style={s.metricLabel}>Open System Alarms</div>
            <div style={s.metricVal}>
              {alarms.length} <span style={s.metricUnit}>active</span>
            </div>
          </div>
        </div>
        <div className="surface-card" style={s.metricCard}>
          <div style={{ ...s.iconBadge, background: 'rgba(244, 63, 94, 0.08)' }}>
            <Zap size={18} color="var(--accent-rose)" />
          </div>
          <div>
            <div style={s.metricLabel}>Session Anomalies</div>
            <div style={{ ...s.metricVal, color: liveAnomalyCount > 0 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
              {liveAnomalyCount} <span style={s.metricUnit}>flags</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Connection Bar ── */}
      <div style={s.connBar} className="animate-in">
        <Radio size={12} color={socketStatus === 'Connected' ? 'var(--accent-emerald)' : 'var(--accent-rose)'} />
        <span style={s.connText}>
          Gateway Telemetry Connection: <strong style={{ color: socketStatus === 'Connected' ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>{socketStatus}</strong>
        </span>
        <span style={s.connSub}>Average Voltage: {stats.averageVoltage}V</span>
      </div>

      <div style={s.twoCol} className="stagger-children">
        {/* Left: Building Status Report */}
        <section className="surface-card animate-in" style={s.panel}>
          <div style={s.panelHeader}>
            <div style={s.titleRow}>
              <Activity size={16} color="var(--accent-cyan)" />
              <h3 style={s.title}>Real-time Activity Feed</h3>
            </div>
          </div>
          <p style={s.description}>
            Live administrative sub-meter telemetry packets currently parsed by local broker client:
          </p>
          <div style={s.console}>
            {liveLogs.length === 0 ? (
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Awaiting data packets…</span>
            ) : (
              liveLogs.slice(0, 8).map(log => (
                <div key={log.id} style={s.logLine}>
                  <span style={s.logTs}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span style={s.logDev}>{log.deviceId.toUpperCase()}:</span>
                  <span style={s.logVal}>
                    {log.status === 'Active' ? `${log.loadKw} kW @ ${log.voltage}V` : `STATUS: ${log.status}`}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right: Building Info Card */}
        <section className="surface-card animate-in" style={s.panel}>
          <div style={s.panelHeader}>
            <div style={s.titleRow}>
              <Building size={16} color="var(--accent-blue)" />
              <h3 style={s.title}>Facility Status Summary</h3>
            </div>
          </div>
          
          <div style={s.infoList}>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Property Name</span>
              <span style={s.infoVal}>Bangsar Heights Suites</span>
            </div>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Sub-metering Zones</span>
              <span style={s.infoVal}>Zone A, Zone B, Lobby</span>
            </div>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Fractional Billing Matrix</span>
              <span style={s.infoVal}>Active (Dexie Cached)</span>
            </div>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Encryption Status</span>
              <span style={s.infoVal}>TLS 1.3 / AES-GCM 256</span>
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

  connBar: {
    display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)',
  },
  connText: { fontSize: '11px', color: 'var(--text-secondary)' },
  connSub: { fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto' },

  twoCol: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-lg)', alignItems: 'start' },
  panel: { padding: 'var(--space-lg)' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' },
  title: { margin: 0, fontSize: '15px', fontWeight: 600 },
  description: { fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 var(--space-md) 0' },

  console: {
    background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)', padding: 'var(--space-md)',
    fontFamily: 'var(--font-mono)', fontSize: '11px',
    maxHeight: '180px', overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: '4px',
  },
  logLine: { display: 'flex', gap: '6px' },
  logTs: { color: 'var(--text-muted)' },
  logDev: { color: 'var(--accent-blue)', fontWeight: 500 },
  logVal: { color: 'var(--text-secondary)' },

  infoList: { display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' },
  infoRow: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-sm)' },
  infoLabel: { fontSize: '12px', color: 'var(--text-secondary)' },
  infoVal: { fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }
};
