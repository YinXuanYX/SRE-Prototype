import { useState, useEffect } from 'react';
import { 
  Heart, 
  Settings, 
  Server, 
  ShieldAlert
} from 'lucide-react';

export const SupportDashboard = ({ recentTelemetry, socketStatus }) => {
  const [time, setTime] = useState(() => Date.now());
  const [heartbeatLogs, setHeartbeatLogs] = useState([
    { id: 'h-1', time: '12:00:05 AM', msg: '[Gateway] Failover setup: TimescaleDB pool failed. IN-MEMORY schema initialized.' },
    { id: 'h-2', time: '12:00:08 AM', msg: '[Gateway] Connected telemetry simulator successfully.' },
    { id: 'h-3', time: '12:03:10 AM', msg: '[Ingestion] Stored 100 cache registry frame sets.' }
  ]);

  // Fluctuate stats periodically
  useEffect(() => {
    const timer = setInterval(() => setTime(Date.now()), 2000);
    return () => clearInterval(timer);
  }, []);

  // Listen to recentTelemetry changes to log warnings in real time
  useEffect(() => {
    const activeDevices = Object.values(recentTelemetry || {});
    activeDevices.forEach((d) => {
      if (d.status === 'Error') {
        const timeStr = new Date().toLocaleTimeString();
        const msg = `[Alert] Node ${d.deviceId.toUpperCase()} reported error status code frame.`;
        setHeartbeatLogs(prev => {
          if (prev.some(p => p.msg.includes(d.deviceId.toUpperCase()) && p.msg.includes('error status'))) return prev;
          return [{ id: Math.random().toString(), time: timeStr, msg }, ...prev].slice(0, 10);
        });
      } else if (d.deviceId === 'device-anomaly-timer' && d.loadKw > 3.0) {
        const timeStr = new Date().toLocaleTimeString();
        const msg = `[Warning] Node ${d.deviceId.toUpperCase()} detected peak over-current: ${d.loadKw} kW.`;
        setHeartbeatLogs(prev => {
          if (prev.some(p => p.msg.includes(d.deviceId.toUpperCase()) && p.msg.includes('peak over-current'))) return prev;
          return [{ id: Math.random().toString(), time: timeStr, msg }, ...prev].slice(0, 10);
        });
      }
    });
  }, [recentTelemetry]);

  const activeDevices = Object.values(recentTelemetry || {});
  const totalNodesCount = activeDevices.length || 3;
  const activeNodesCount = activeDevices.filter(d => d.status === 'Active').length;
  
  // Dynamic Health Percentage
  const healthPercent = totalNodesCount > 0 
    ? Math.round((activeNodesCount / totalNodesCount) * 100) 
    : 100;

  // DB Ingestion active connection pool simulation
  const activeConns = socketStatus === 'Connected' 
    ? Math.round(9 + Math.sin(time / 4000) * 2) 
    : 0;

  // Map active devices to network nodes dynamically
  const supportNodes = activeDevices.length > 0 
    ? activeDevices.map((dev) => {
        const ipMap = {
          'device-aircon-01': '192.168.1.104',
          'device-fridge-01': '192.168.1.108',
          'device-pump-01': '192.168.1.112',
          'device-light-01': '192.168.1.116',
          'device-anomaly-timer': '192.168.1.120',
        };
        const locationMap = {
          'device-aircon-01': 'Zone A - Room 201',
          'device-fridge-01': 'Zone A - Room 201',
          'device-pump-01': 'Zone B - Corridor',
          'device-light-01': 'Ground Lobby',
          'device-anomaly-timer': 'Ground Lobby',
        };
        const typeMap = {
          'device-aircon-01': 'Heavy AC Unit',
          'device-fridge-01': 'Fridge Smart Plug',
          'device-pump-01': 'Utility Pump',
          'device-light-01': 'Lobby Lighting',
          'device-anomaly-timer': 'Facility Timer Plug',
        };

        const pingVal = socketStatus === 'Connected' && dev.status === 'Active'
          ? `${Math.round(12 + (time % 7) + (dev.loadKw * 2) % 6)}ms`
          : 'Offline';

        return {
          id: dev.deviceId.toUpperCase(),
          clientIp: ipMap[dev.deviceId] || '192.168.1.99',
          location: locationMap[dev.deviceId] || 'Unknown Zone',
          ping: pingVal,
          type: typeMap[dev.deviceId] || 'Sub-Meter Node',
        };
      })
    : [
        { id: 'NODE-501', clientIp: '192.168.1.104', location: 'Ground Lobby', ping: '12ms', type: 'Sub-Meter Node' },
        { id: 'NODE-502', clientIp: '192.168.1.108', location: 'Zone B Corridor', ping: '18ms', type: 'Gateway Hub' },
        { id: 'NODE-503', clientIp: '10.0.4.88', location: 'Zone A - Room 102', ping: '45ms', type: 'Smart Plug Plug' }
      ];

  return (
    <div style={styles.container}>
      {/* Diagnostics Cards Row */}
      <section style={styles.metricsGrid} className="stagger-children animate-in">
        
        <div className="card-premium surface-card" style={styles.metricCard}>
          <div style={{ ...styles.iconBadge, background: 'rgba(6, 182, 212, 0.1)' }}>
            <Server size={20} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={styles.metricLabel}>WebSocket Gateway Status</div>
            <div style={{ 
              ...styles.metricVal, 
              color: socketStatus === 'Connected' ? 'var(--accent-emerald)' : 'var(--accent-rose)' 
            }}>
              {socketStatus}
            </div>
          </div>
        </div>

        <div className="card-premium surface-card" style={styles.metricCard}>
          <div style={{ ...styles.iconBadge, background: 'rgba(59, 130, 246, 0.1)' }}>
            <Settings size={20} color="var(--accent-blue)" />
          </div>
          <div>
            <div style={styles.metricLabel}>DB Ingestion Pool</div>
            <div style={styles.metricVal}>
              {activeConns} <span style={styles.metricUnit}>active conns</span>
            </div>
          </div>
        </div>

        <div className="card-premium surface-card" style={styles.metricCard}>
          <div style={{ ...styles.iconBadge, background: 'rgba(16, 185, 129, 0.1)' }}>
            <Heart size={20} color="var(--accent-emerald)" />
          </div>
          <div>
            <div style={styles.metricLabel}>Local Telemetry Health</div>
            <div style={{ 
              ...styles.metricVal, 
              color: healthPercent > 70 ? 'var(--accent-emerald)' : healthPercent > 40 ? 'var(--accent-amber)' : 'var(--accent-rose)' 
            }}>
              {healthPercent}% <span style={styles.metricUnit}>nominal</span>
            </div>
          </div>
        </div>

      </section>

      {/* Node Inventory - Horizontal Scroll Strip */}
      <section className="glass-panel surface-card animate-in" style={styles.nodesCard}>
        <div style={styles.cardHeader}>
          <Settings size={18} color="var(--accent-cyan)" />
          <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>Network Node Inventory</h3>
        </div>

        <div style={styles.nodeList}>
          {supportNodes.map(node => (
            <div key={node.id} style={styles.nodeRow}>
              <div>
                <div style={styles.nodeId}>
                  {node.id} <span style={styles.nodeType}>{node.type}</span>
                </div>
                <div style={styles.nodeIp}>IP Address: {node.clientIp}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  ...styles.nodePing,
                  color: node.ping === 'Offline' ? 'var(--accent-rose)' : 'var(--accent-cyan)'
                }}>
                  {node.ping === 'Offline' ? 'Offline' : `⚡ ${node.ping}`}
                </div>
                <div style={styles.nodeLoc}>{node.location}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Alarm Log Diagnostics */}
      <section className="glass-panel surface-card animate-in" style={styles.alertsCard}>
        <div style={styles.cardHeader}>
          <ShieldAlert size={18} color="var(--accent-rose)" />
          <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>Node Heartbeat Diagnostic Log</h3>
        </div>
        <p style={styles.instruction}>
          Historical telemetry gateway disconnect events or frame corruption alerts.
        </p>

        <div style={styles.alertList}>
          {heartbeatLogs.map((log) => (
            <div 
              key={log.id} 
              style={{
                ...styles.alertRow,
                background: log.msg.includes('[Alert]') || log.msg.includes('[Warning]') ? 'rgba(244, 63, 94, 0.04)' : 'rgba(59, 130, 246, 0.04)',
                borderColor: log.msg.includes('[Alert]') || log.msg.includes('[Warning]') ? 'rgba(244, 63, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              }}
            >
              <span style={{
                ...styles.alertTime,
                color: log.msg.includes('[Alert]') || log.msg.includes('[Warning]') ? 'var(--accent-rose)' : 'var(--accent-blue)',
              }}>{log.time}</span>
              <span style={styles.alertMsg}>{log.msg}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xl)',
    flexGrow: 1,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--space-lg)',
  },
  metricCard: {
    padding: 'var(--space-lg)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    borderRadius: 'var(--radius-md)',
  },
  iconBadge: {
    padding: 'var(--space-sm)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  metricVal: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginTop: 'var(--space-xs)',
  },
  metricUnit: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--text-muted)',
  },
  nodesCard: {
    padding: 'var(--space-lg)',
    borderRadius: 'var(--radius-md)',
  },
  alertsCard: {
    padding: 'var(--space-lg)',
    borderRadius: 'var(--radius-md)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    marginBottom: 'var(--space-md)',
  },
  nodeList: {
    display: 'flex',
    overflowX: 'auto',
    gap: 'var(--space-md)',
    paddingBottom: 'var(--space-xs)',
  },
  nodeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-md) var(--space-lg)',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    minWidth: '280px',
    flexShrink: 0,
  },
  nodeId: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  nodeType: {
    marginLeft: 'var(--space-xs)',
    fontSize: '9px',
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--text-muted)',
    padding: '2px 6px',
    borderRadius: '3px',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  nodeIp: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  nodePing: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--accent-cyan)',
  },
  nodeLoc: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
  instruction: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginTop: 0,
    marginBottom: 'var(--space-md)',
  },
  alertList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)',
  },
  alertRow: {
    padding: 'var(--space-sm)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    display: 'flex',
    gap: 'var(--space-sm)',
  },
  alertTime: {
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
  },
  alertMsg: {
    color: 'var(--text-secondary)',
  },
};
