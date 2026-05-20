import React, { useState } from 'react';
import { 
  Heart, 
  Terminal, 
  Settings, 
  Server, 
  ShieldAlert,
  Play,
  Pause
} from 'lucide-react';

export const SupportDashboard = ({ user, recentTelemetry, liveLogs, socketStatus }) => {
  const [logsPaused, setLogsPaused] = useState(false);

  // Seed mock client node connections
  const supportNodes = [
    { id: 'NODE-501', clientIp: '192.168.1.104', location: 'G-Lobby Panel', ping: '12ms', type: 'Sub-Meter Node' },
    { id: 'NODE-502', clientIp: '192.168.1.108', location: 'Zone B Corridor', ping: '18ms', type: 'Gateway Hub' },
    { id: 'NODE-503', clientIp: '10.0.4.88', location: 'Zone A - Room 102', ping: '45ms', type: 'Smart Plug Plug' }
  ];

  return (
    <div style={styles.container}>
      {/* Diagnostics Cards Row */}
      <section style={styles.metricsGrid}>
        
        <div className="card-premium" style={styles.metricCard}>
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

        <div className="card-premium" style={styles.metricCard}>
          <div style={{ ...styles.iconBadge, background: 'rgba(59, 130, 246, 0.1)' }}>
            <Settings size={20} color="var(--accent-blue)" />
          </div>
          <div>
            <div style={styles.metricLabel}>DB Ingestion Pool</div>
            <div style={styles.metricVal}>
              10 <span style={styles.metricUnit}>active conns</span>
            </div>
          </div>
        </div>

        <div className="card-premium" style={styles.metricCard}>
          <div style={{ ...styles.iconBadge, background: 'rgba(16, 185, 129, 0.1)' }}>
            <Heart size={20} color="var(--accent-emerald)" />
          </div>
          <div>
            <div style={styles.metricLabel}>Local Telemetry Health</div>
            <div style={styles.metricVal}>
              100% <span style={styles.metricUnit}>nominal</span>
            </div>
          </div>
        </div>

      </section>

      {/* Diagnostics Details */}
      <div style={styles.layoutGrid}>
        
        {/* Node connections list */}
        <section className="glass-panel" style={styles.nodesCard}>
          <div style={styles.cardHeader}>
            <Settings size={18} color="var(--accent-cyan)" />
            <h3 style={{ margin: 0, fontSize: '16px' }}>Network Node Inventory</h3>
          </div>

          <div style={styles.nodeList}>
            {supportNodes.map(node => (
              <div key={node.id} style={styles.nodeRow}>
                <div>
                  <div style={styles.nodeId}>{node.id} <span style={styles.nodeType}>{node.type}</span></div>
                  <div style={styles.nodeIp}>IP Address: {node.clientIp}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={styles.nodePing}>⚡ {node.ping}</div>
                  <div style={styles.nodeLoc}>{node.location}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Alarm Log Diagnostics */}
        <section className="glass-panel" style={styles.alertsCard}>
          <div style={styles.cardHeader}>
            <ShieldAlert size={18} color="var(--accent-rose)" />
            <h3 style={{ margin: 0, fontSize: '16px' }}>Node Heartbeat Diagnostic Log</h3>
          </div>
          <p style={styles.instruction}>
            Historical telemetry gateway disconnect events or frame corruption alerts.
          </p>

          <div style={styles.alertList}>
            <div style={styles.alertRow}>
              <span style={styles.alertTime}>12:00:05 AM</span>
              <span style={styles.alertMsg}>[Gateway] Initialized failover to mock repository storage.</span>
            </div>
            <div style={styles.alertRow}>
              <span style={styles.alertTime}>12:00:08 AM</span>
              <span style={styles.alertMsg}>[WS Client] Connected telemetry simulator successfully.</span>
            </div>
            <div style={styles.alertRow}>
              <span style={styles.alertTime}>12:03:10 AM</span>
              <span style={styles.alertMsg}>[Ingestion] Stored 100 frame sets to IndexedDB cache registry.</span>
            </div>
          </div>
        </section>

      </div>

      {/* Live Console Terminal log - full width */}
      <section className="glass-panel" style={styles.consoleCard}>
        <div style={styles.consoleHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} color="var(--accent-cyan)" />
            <h3 style={{ margin: 0, fontSize: '16px' }}>Diagnostic Stream Terminal Log</h3>
          </div>
          <button 
            onClick={() => setLogsPaused(!logsPaused)} 
            style={{
              ...styles.pauseBtn,
              color: logsPaused ? 'var(--accent-emerald)' : 'var(--text-secondary)',
              borderColor: logsPaused ? 'var(--accent-emerald)' : 'var(--border-color)'
            }}
          >
            {logsPaused ? (
              <>
                <Play size={12} style={{ marginRight: '4px' }} />
                <span>Resume Feed</span>
              </>
            ) : (
              <>
                <Pause size={12} style={{ marginRight: '4px' }} />
                <span>Pause Feed</span>
              </>
            )}
          </button>
        </div>

        <div style={styles.consoleContainer}>
          {logsPaused ? (
            <div style={styles.pausedIndicator}>[FEED PAUSED FOR INSPECTION]</div>
          ) : liveLogs.length === 0 ? (
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Awaiting WebSocket packets...</span>
          ) : (
            liveLogs.map((log) => (
              <div key={log.id} style={styles.consoleLogLine}>
                <span style={styles.logTimestamp}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span style={styles.logTag}>[TELEMETRY]</span>
                <span style={styles.logDevice}>{log.deviceName} (ID: {log.deviceId})</span>
                <span style={styles.logValue}>
                  {log.status === 'Active' ? `Load: ${log.loadKw} kW / Volts: ${log.voltage} V` : `STATUS: ${log.status}`}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    flexGrow: 1,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
  },
  metricCard: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconBadge: {
    padding: '12px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  metricVal: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#fff',
    marginTop: '4px',
  },
  metricUnit: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-muted)',
  },
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '24px',
  },
  nodesCard: {
    padding: '24px',
  },
  alertsCard: {
    padding: '24px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  nodeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  nodeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.15)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
  },
  nodeId: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#fff',
  },
  nodeType: {
    marginLeft: '6px',
    fontSize: '9px',
    background: 'var(--border-color)',
    color: 'var(--text-secondary)',
    padding: '2px 6px',
    borderRadius: '4px',
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
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: 0,
    marginBottom: '16px',
  },
  alertList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  alertRow: {
    padding: '10px',
    background: 'rgba(244, 63, 94, 0.04)',
    border: '1px solid rgba(244, 63, 94, 0.1)',
    borderRadius: '6px',
    fontSize: '12px',
    display: 'flex',
    gap: '10px',
  },
  alertTime: {
    color: 'var(--accent-rose)',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
  },
  alertMsg: {
    color: 'var(--text-secondary)',
  },
  consoleCard: {
    padding: '24px',
  },
  consoleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  pauseBtn: {
    background: 'transparent',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  consoleContainer: {
    background: 'rgba(5, 5, 8, 0.75)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '16px',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    maxHeight: '200px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  pausedIndicator: {
    color: 'var(--accent-emerald)',
    textAlign: 'center',
    fontWeight: 600,
    padding: '20px 0',
  },
  consoleLogLine: {
    display: 'flex',
    gap: '8px',
    whiteSpace: 'nowrap',
  },
  logTimestamp: {
    color: 'var(--text-muted)',
  },
  logTag: {
    color: 'var(--accent-cyan)',
    fontWeight: 600,
  },
  logDevice: {
    color: 'var(--accent-blue)',
    fontWeight: 500,
  },
  logValue: {
    color: '#e5e7eb',
  },
};
