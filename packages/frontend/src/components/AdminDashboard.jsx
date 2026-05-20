import React, { useState, useEffect, useRef } from 'react';
import { ZoneMapper } from './ZoneMapper';
import { 
  Building, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ClipboardList, 
  TrendingUp, 
  ShieldAlert,
  ArrowRight,
  Radio,
  Zap
} from 'lucide-react';

export const AdminDashboard = ({ user, recentTelemetry, liveLogs, socketStatus }) => {
  // Seed initial mock alarms for View B (Issue Tracker)
  const [alarms, setAlarms] = useState([
    { 
      id: 'AL-091', 
      title: 'Common Area Facility Timer Failure', 
      zone: 'Ground Lobby', 
      severity: 'Critical', 
      type: 'Stuck Timer', 
      status: 'Open', 
      assignedTo: 'None',
      notes: ''
    },
    { 
      id: 'AL-092', 
      title: 'Sustained Heavy Appliance Draw (Possible Crypto Mining)', 
      zone: 'Zone B - Room 302', 
      severity: 'High', 
      type: 'Over-Current Draw', 
      status: 'In Progress', 
      assignedTo: 'Technician Kumar',
      notes: ''
    },
    { 
      id: 'AL-093', 
      title: 'Smart Meter Node Heartbeat Offline Timeout', 
      zone: 'Zone A - Room 105', 
      severity: 'Medium', 
      type: 'Offline Timeout', 
      status: 'Resolved', 
      assignedTo: 'Technician Lee',
      notes: 'Plug re-seated. Wifi signal stabilized.'
    }
  ]);

  // Immutable Administrative Audit Log state (appends actions dynamically)
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, timestamp: '12:00:10 AM', actor: 'Sarah Admin', action: 'Created task assignment for Alarm AL-092 to Technician Kumar.' },
    { id: 2, timestamp: '12:03:45 AM', actor: 'Sarah Admin', action: 'Resolved Alarm AL-093. Completion note: Plug re-seated. Wifi signal stabilized.' }
  ]);

  // Live anomaly alert count (from WebSocket)
  const [liveAnomalyCount, setLiveAnomalyCount] = useState(0);

  // States to manage the resolution form input
  const [resolvingAlarmId, setResolvingAlarmId] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');

  // Active tab: 'issues' or 'zones'
  const [activeTab, setActiveTab] = useState('issues');

  // Track seen anomaly IDs to prevent duplicates
  const seenAlertIds = useRef(new Set());

  // --- Live WebSocket listener for anomaly_alert events ---
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3000/telemetry');

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'anomaly_alert') {
          const alert = payload.data;

          // Deduplicate by alert ID
          if (seenAlertIds.current.has(alert.id)) return;
          seenAlertIds.current.add(alert.id);

          setLiveAnomalyCount(prev => prev + 1);

          // Inject the anomaly into the alarm board as a new Open alarm
          const newAlarm = {
            id: alert.id,
            title: alert.title,
            zone: alert.zone,
            severity: alert.severity,
            type: alert.type,
            status: 'Open',
            assignedTo: 'None',
            notes: `Auto-detected: ${alert.type}. Value: ${alert.value}, Threshold: ${alert.threshold}`
          };

          setAlarms(prev => [newAlarm, ...prev]);

          // Append to audit log
          const timestamp = new Date().toLocaleTimeString();
          setAuditLogs(logs => [
            {
              id: Date.now(),
              timestamp,
              actor: 'System (Anomaly Engine)',
              action: `Auto-generated alarm ${alert.id}: ${alert.title} [${alert.severity}]`
            },
            ...logs
          ]);
        }
      } catch (err) {
        // Ignore non-anomaly messages
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  // Calculate building stats (View A) from live telemetry
  const calculateStats = () => {
    let activeCount = 0;
    let totalKw = 0;
    let avgVoltage = 240;
    const devs = Object.values(recentTelemetry);
    devs.forEach(dev => {
      if (dev.status === 'Active') {
        activeCount++;
        totalKw += dev.loadKw;
      }
    });
    if (devs.length > 0) {
      avgVoltage = Math.round(devs.reduce((sum, d) => sum + d.voltage, 0) / devs.length);
    }

    return {
      activeCount,
      totalKw: totalKw.toFixed(2),
      averageVoltage: avgVoltage
    };
  };

  const stats = calculateStats();

  const handleAssignTask = (alarmId, technician) => {
    setAlarms(prev => prev.map(a => {
      if (a.id === alarmId) {
        const updated = { ...a, status: 'In Progress', assignedTo: technician };
        
        const timestamp = new Date().toLocaleTimeString();
        setAuditLogs(logs => [
          {
            id: Date.now(),
            timestamp,
            actor: `${user.displayName} (Admin)`,
            action: `Assigned Alarm ${alarmId} to ${technician}.`
          },
          ...logs
        ]);

        return updated;
      }
      return a;
    }));
  };

  const triggerResolveForm = (alarmId) => {
    setResolvingAlarmId(alarmId);
    setResolutionNote('');
  };

  const handleResolveAlarmSubmit = (e) => {
    e.preventDefault();
    if (!resolutionNote.trim()) return;

    setAlarms(prev => prev.map(a => {
      if (a.id === resolvingAlarmId) {
        const updated = { ...a, status: 'Resolved', notes: resolutionNote };

        const timestamp = new Date().toLocaleTimeString();
        setAuditLogs(logs => [
          {
            id: Date.now(),
            timestamp,
            actor: `${user.displayName} (Admin)`,
            action: `Resolved Alarm ${resolvingAlarmId}. Completion note: ${resolutionNote}`
          },
          ...logs
        ]);

        return updated;
      }
      return a;
    }));

    setResolvingAlarmId(null);
  };

  return (
    <div style={styles.container}>
      {/* View A: Operational Metrics Grid */}
      <section style={styles.metricsGrid}>
        <div className="card-premium" style={styles.metricCard}>
          <div style={{ ...styles.iconBadge, background: 'rgba(59, 130, 246, 0.1)' }}>
            <Building size={20} color="var(--accent-blue)" />
          </div>
          <div>
            <div style={styles.metricLabel}>Total Building Load</div>
            <div style={styles.metricVal}>{stats.totalKw} <span style={styles.metricUnit}>kW</span></div>
          </div>
        </div>

        <div className="card-premium" style={styles.metricCard}>
          <div style={{ ...styles.iconBadge, background: 'rgba(16, 185, 129, 0.1)' }}>
            <TrendingUp size={20} color="var(--accent-emerald)" />
          </div>
          <div>
            <div style={styles.metricLabel}>Active Smart Plugs</div>
            <div style={styles.metricVal}>{stats.activeCount} <span style={styles.metricUnit}>online</span></div>
          </div>
        </div>

        <div className="card-premium" style={styles.metricCard}>
          <div style={{ ...styles.iconBadge, background: 'rgba(245, 158, 11, 0.1)' }}>
            <ShieldAlert size={20} color="var(--accent-amber)" />
          </div>
          <div>
            <div style={styles.metricLabel}>Unresolved Alarms</div>
            <div style={styles.metricVal}>
              {alarms.filter(a => a.status !== 'Resolved').length} <span style={styles.metricUnit}>active</span>
            </div>
          </div>
        </div>

        <div className="card-premium" style={styles.metricCard}>
          <div style={{ ...styles.iconBadge, background: 'rgba(244, 63, 94, 0.1)' }}>
            <Zap size={20} color="var(--accent-rose)" />
          </div>
          <div>
            <div style={styles.metricLabel}>Live Anomalies Detected</div>
            <div style={{ ...styles.metricVal, color: liveAnomalyCount > 0 ? 'var(--accent-rose)' : '#fff' }}>
              {liveAnomalyCount} <span style={styles.metricUnit}>this session</span>
            </div>
          </div>
        </div>
      </section>

      {/* Connection Status Indicator */}
      <div style={styles.connectionBar}>
        <Radio size={14} color={socketStatus === 'Connected' ? 'var(--accent-emerald)' : 'var(--accent-rose)'} />
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Anomaly Detection Engine: <strong style={{ color: socketStatus === 'Connected' ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>{socketStatus}</strong>
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Building metrics & alarm board connected to live WebSocket streams
        </span>
      </div>

      {/* Tab Switcher: Issues / Zones */}
      <div style={styles.tabBar}>
        <button
          onClick={() => setActiveTab('issues')}
          style={{
            ...styles.tabButton,
            background: activeTab === 'issues' ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
            color: activeTab === 'issues' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            borderColor: activeTab === 'issues' ? 'rgba(6, 182, 212, 0.2)' : 'transparent'
          }}
        >
          <ClipboardList size={14} style={{ marginRight: '6px' }} />
          Issue Tracker & Alarms
        </button>
        <button
          onClick={() => setActiveTab('zones')}
          style={{
            ...styles.tabButton,
            background: activeTab === 'zones' ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
            color: activeTab === 'zones' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            borderColor: activeTab === 'zones' ? 'rgba(6, 182, 212, 0.2)' : 'transparent'
          }}
        >
          <Building size={14} style={{ marginRight: '6px' }} />
          Zone Management
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'issues' ? (
        <div style={styles.layoutGrid}>
          {/* View B: Issue Tracker */}
          <section className="glass-panel" style={styles.issueTrackerCard}>
            <div style={styles.cardHeader}>
              <ClipboardList size={18} color="var(--accent-cyan)" />
              <h3 style={{ margin: 0, fontSize: '16px' }}>Tenant Issue Tracker & Alarm Board</h3>
            </div>

            <div style={styles.alarmList}>
              {alarms.map(alarm => (
                <div key={alarm.id} style={styles.alarmRow}>
                  <div style={styles.alarmRowHeader}>
                    <div style={styles.alarmMeta}>
                      <span style={{ 
                        ...styles.severityBadge, 
                        background: alarm.severity === 'Critical' 
                          ? 'rgba(244, 63, 94, 0.15)' 
                          : alarm.severity === 'High' 
                            ? 'rgba(245, 158, 11, 0.15)' 
                            : 'rgba(59, 130, 246, 0.15)',
                        color: alarm.severity === 'Critical' 
                          ? 'var(--accent-rose)' 
                          : alarm.severity === 'High' 
                            ? 'var(--accent-amber)' 
                            : 'var(--accent-blue)',
                      }}>
                        {alarm.severity}
                      </span>
                      <span style={styles.alarmId}>{alarm.id}</span>
                      <span style={styles.alarmZone}>📍 {alarm.zone}</span>
                    </div>

                    <span style={{
                      ...styles.statusLabel,
                      color: alarm.status === 'Resolved' 
                        ? 'var(--accent-emerald)' 
                        : alarm.status === 'In Progress' 
                          ? 'var(--accent-amber)' 
                          : 'var(--accent-rose)'
                    }}>
                      {alarm.status.toUpperCase()}
                    </span>
                  </div>

                  <h4 style={styles.alarmTitle}>{alarm.title}</h4>

                  {/* Sub-actions depending on status */}
                  <div style={styles.alarmActions}>
                    {alarm.status === 'Open' && (
                      <div style={styles.actionRow}>
                        <button 
                          onClick={() => handleAssignTask(alarm.id, 'Technician Kumar')} 
                          style={styles.actionBtn}
                        >
                          Assign to Kumar
                        </button>
                        <button 
                          onClick={() => triggerResolveForm(alarm.id)} 
                          style={styles.resolveBtn}
                        >
                          Mark as Resolved
                        </button>
                      </div>
                    )}

                    {alarm.status === 'In Progress' && (
                      <div style={styles.actionDetails}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Assigned to: <strong>{alarm.assignedTo}</strong>
                        </span>
                        <button 
                          onClick={() => triggerResolveForm(alarm.id)} 
                          style={styles.resolveBtn}
                        >
                          Complete & Resolve
                        </button>
                      </div>
                    )}

                    {alarm.status === 'Resolved' && (
                      <div style={styles.resolutionDetails}>
                        <CheckCircle size={12} color="var(--accent-emerald)" style={{ marginRight: '6px' }} />
                        <span>Resolution: {alarm.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Resolution Modal Overlay inside Card */}
            {resolvingAlarmId && (
              <form onSubmit={handleResolveAlarmSubmit} style={styles.resolveForm}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--accent-cyan)' }}>
                  Resolve Alarm: {resolvingAlarmId}
                </h4>
                <textarea
                  placeholder="Enter completion notes (e.g. Cleared schedule rules, reset breaker)..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  required
                  style={styles.notesTextarea}
                />
                <div style={styles.formButtons}>
                  <button type="button" onClick={() => setResolvingAlarmId(null)} style={styles.cancelBtn}>
                    Cancel
                  </button>
                  <button type="submit" style={styles.submitBtn}>
                    Submit Completion Notes
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Immutable Administrative Audit Log */}
          <section className="glass-panel" style={styles.auditLogCard}>
            <div style={styles.cardHeader}>
              <Clock size={18} color="var(--accent-amber)" />
              <h3 style={{ margin: 0, fontSize: '16px' }}>Immutable Administrative Audit Log</h3>
            </div>
            <p style={styles.logInstruction}>
              System records for liability and operations audit trails. These logs are write-only.
            </p>

            <div style={styles.logList}>
              {auditLogs.map(log => (
                <div key={log.id} style={styles.logRow}>
                  <div style={styles.logHeader}>
                    <span style={styles.logTime}>{log.timestamp}</span>
                    <span style={{
                      ...styles.logActor,
                      color: log.actor.includes('System') ? 'var(--accent-rose)' : 'var(--accent-blue)'
                    }}>{log.actor}</span>
                  </div>
                  <div style={styles.logAction}>
                    <ArrowRight size={10} style={{ marginRight: '6px', flexShrink: 0, marginTop: '3px' }} />
                    <span>{log.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* Zone Management Tab */
        <div className="glass-panel" style={{ padding: '24px' }}>
          <ZoneMapper user={user} />
        </div>
      )}
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
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
  },
  metricCard: {
    padding: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  iconBadge: {
    padding: '12px',
    borderRadius: '12px',
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
    fontWeight: 800,
    color: '#fff',
    marginTop: '4px',
  },
  metricUnit: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--text-muted)',
  },
  connectionBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: 'rgba(0,0,0,0.15)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
  },
  tabBar: {
    display: 'flex',
    gap: '8px',
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    border: '1px solid',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '24px',
    alignItems: 'stretch',
  },
  issueTrackerCard: {
    padding: '24px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  auditLogCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  alarmList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    overflowY: 'auto',
    flexGrow: 1,
    maxHeight: '480px',
  },
  alarmRow: {
    background: 'rgba(0, 0, 0, 0.15)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '16px',
  },
  alarmRowHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  alarmMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  severityBadge: {
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  alarmId: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  alarmZone: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  statusLabel: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.05em',
  },
  alarmTitle: {
    fontSize: '14px',
    color: '#fff',
    margin: '0 0 12px 0',
    lineHeight: '1.4',
  },
  alarmActions: {
    borderTop: '1px dashed var(--border-color)',
    paddingTop: '12px',
  },
  actionRow: {
    display: 'flex',
    gap: '10px',
  },
  actionBtn: {
    background: 'rgba(59, 130, 246, 0.08)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    color: 'var(--accent-blue)',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  resolveBtn: {
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    color: 'var(--accent-emerald)',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  actionDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resolutionDetails: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  resolveForm: {
    position: 'absolute',
    top: '24px',
    left: '24px',
    right: '24px',
    bottom: '24px',
    background: '#0d0f19',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '20px',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 15px 30px rgba(0,0,0,0.6)',
  },
  notesTextarea: {
    flexGrow: 1,
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '12px',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '13px',
    resize: 'none',
    marginBottom: '16px',
    outline: 'none',
  },
  formButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  cancelBtn: {
    background: 'transparent',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  submitBtn: {
    background: 'var(--accent-emerald)',
    border: 'none',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  logInstruction: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginBottom: '16px',
    marginTop: 0,
  },
  logList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
    flexGrow: 1,
    maxHeight: '380px',
  },
  logRow: {
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '8px',
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginBottom: '4px',
  },
  logTime: {
    fontFamily: 'var(--font-mono)',
  },
  logActor: {
    fontWeight: 600,
  },
  logAction: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'flex-start',
  },
};
