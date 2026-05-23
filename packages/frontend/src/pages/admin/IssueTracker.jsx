import { useState, useEffect, useRef } from 'react';
import { 
  ClipboardList, 
  CheckCircle,
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';

export const IssueTracker = ({ user }) => {
  const [alarms, setAlarms] = useState([
    { id: 'AL-091', title: 'Common Area Facility Timer Failure', zone: 'Ground Lobby', severity: 'Critical', type: 'Stuck Timer', status: 'Open', assignedTo: 'None', notes: '' },
    { id: 'AL-092', title: 'Sustained Heavy Appliance Draw (Possible Crypto Mining)', zone: 'Zone B - Room 302', severity: 'High', type: 'Over-Current Draw', status: 'In Progress', assignedTo: 'Technician Kumar', notes: '' },
    { id: 'AL-093', title: 'Smart Meter Node Heartbeat Offline Timeout', zone: 'Zone A - Room 105', severity: 'Medium', type: 'Offline Timeout', status: 'Resolved', assignedTo: 'Technician Lee', notes: 'Plug re-seated. Wifi signal stabilized.' }
  ]);

  const [auditLogs, setAuditLogs] = useState([
    { id: 1, timestamp: '12:00:10 AM', actor: 'Sarah Admin', action: 'Created task assignment for Alarm AL-092 to Technician Kumar.' },
    { id: 2, timestamp: '12:03:45 AM', actor: 'Sarah Admin', action: 'Resolved Alarm AL-093. Completion note: Plug re-seated. Wifi signal stabilized.' }
  ]);

  const [resolvingAlarmId, setResolvingAlarmId] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const seenAlertIds = useRef(new Set());

  // Listen for live anomaly alerts
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3000/telemetry');
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'anomaly_alert') {
          const alert = payload.data;
          if (seenAlertIds.current.has(alert.id)) return;
          seenAlertIds.current.add(alert.id);
          setAlarms(prev => [{
            id: alert.id, title: alert.title, zone: alert.zone,
            severity: alert.severity, type: alert.type, status: 'Open',
            assignedTo: 'None', notes: `Auto-detected: ${alert.type}. Value: ${alert.value}, Threshold: ${alert.threshold}`
          }, ...prev]);
          setAuditLogs(logs => [{
            id: Date.now(), timestamp: new Date().toLocaleTimeString(),
            actor: 'System (Anomaly Engine)',
            action: `Auto-generated alarm ${alert.id}: ${alert.title} [${alert.severity}]`
          }, ...logs]);
        }
      } catch (err) {
        console.error('[IssueTracker] Error parsing alert:', err);
      }
    };
    return () => socket.close();
  }, []);

  const handleAssignTask = (alarmId, technician) => {
    setAlarms(prev => prev.map(a => {
      if (a.id === alarmId) {
        setAuditLogs(logs => [{ id: Date.now(), timestamp: new Date().toLocaleTimeString(), actor: `${user.displayName} (Admin)`, action: `Assigned Alarm ${alarmId} to ${technician}.` }, ...logs]);
        return { ...a, status: 'In Progress', assignedTo: technician };
      }
      return a;
    }));
  };

  const triggerResolveForm = (alarmId) => { setResolvingAlarmId(alarmId); setResolutionNote(''); };

  const handleResolveAlarmSubmit = (e) => {
    e.preventDefault();
    if (!resolutionNote.trim()) return;
    setAlarms(prev => prev.map(a => {
      if (a.id === resolvingAlarmId) {
        setAuditLogs(logs => [{ id: Date.now(), timestamp: new Date().toLocaleTimeString(), actor: `${user.displayName} (Admin)`, action: `Resolved Alarm ${resolvingAlarmId}. Completion note: ${resolutionNote}` }, ...logs]);
        return { ...a, status: 'Resolved', notes: resolutionNote };
      }
      return a;
    }));
    setResolvingAlarmId(null);
  };

  const getSeverityColor = (sev) => {
    if (sev === 'Critical') return 'var(--accent-rose)';
    if (sev === 'High') return 'var(--accent-amber)';
    return 'var(--accent-blue)';
  };

  const openCount = alarms.filter(a => a.status !== 'Resolved').length;

  return (
    <div style={s.container}>
      <PageHeader 
        title="Issue Tracker" 
        subtitle={`${openCount} open issue${openCount !== 1 ? 's' : ''} require attention.`}
        breadcrumb={['Admin Panel', 'Issue Tracker']}
      />

      <div style={s.grid}>
        {/* Alarm Board */}
        <section className="surface-card" style={{ ...s.panel, position: 'relative' }}>
          <div style={s.panelHeader}>
            <div style={s.titleRow}><ClipboardList size={16} color="var(--accent-cyan)" /><h3 style={s.title}>Alarm Board</h3></div>
            <span style={s.badge}>{openCount} open</span>
          </div>
          <div style={s.alarmList}>
            {alarms.map(alarm => (
              <div key={alarm.id} style={{ ...s.alarmRow, borderLeftColor: getSeverityColor(alarm.severity) }}>
                <div style={s.alarmHeader}>
                  <div style={s.alarmMeta}>
                    <span style={{ ...s.sevBadge, color: getSeverityColor(alarm.severity), background: `color-mix(in srgb, ${getSeverityColor(alarm.severity)} 10%, transparent)` }}>
                      {alarm.severity}
                    </span>
                    <span style={s.alarmId}>{alarm.id}</span>
                    <span style={s.alarmZone}>📍 {alarm.zone}</span>
                  </div>
                  <span style={{ ...s.statusText, color: alarm.status === 'Resolved' ? 'var(--accent-emerald)' : alarm.status === 'In Progress' ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>
                    {alarm.status.toUpperCase()}
                  </span>
                </div>
                <h4 style={s.alarmTitle}>{alarm.title}</h4>
                <div style={s.alarmActions}>
                  {alarm.status === 'Open' && (
                    <div style={s.actionRow}>
                      <button onClick={() => handleAssignTask(alarm.id, 'Technician Kumar')} style={s.actionBtn}>Assign to Kumar</button>
                      <button onClick={() => triggerResolveForm(alarm.id)} style={s.resolveBtn}>Resolve</button>
                    </div>
                  )}
                  {alarm.status === 'In Progress' && (
                    <div style={s.actionDetails}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Assigned: <strong>{alarm.assignedTo}</strong></span>
                      <button onClick={() => triggerResolveForm(alarm.id)} style={s.resolveBtn}>Complete</button>
                    </div>
                  )}
                  {alarm.status === 'Resolved' && (
                    <div style={s.resolved}><CheckCircle size={11} color="var(--accent-emerald)" /><span>{alarm.notes}</span></div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {resolvingAlarmId && (
            <form onSubmit={handleResolveAlarmSubmit} style={s.resolveForm}>
              <h4 style={{ margin: '0 0 var(--space-md) 0', fontSize: '14px', color: 'var(--accent-cyan)' }}>
                Resolve: {resolvingAlarmId}
              </h4>
              <textarea
                placeholder="Enter completion notes…"
                value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)}
                required style={s.textarea}
              />
              <div style={s.formBtns}>
                <button type="button" onClick={() => setResolvingAlarmId(null)} style={s.cancelBtn}>Cancel</button>
                <button type="submit" style={s.submitBtn}>Submit</button>
              </div>
            </form>
          )}
        </section>

        {/* Audit Log Preview */}
        <section className="surface-card" style={s.panel}>
          <div style={s.panelHeader}>
            <h3 style={s.title}>Recent Audit Log</h3>
          </div>
          <p style={s.logInstr}>Write-only system records for liability trails.</p>
          <div style={s.logList}>
            {auditLogs.slice(0, 8).map(log => (
              <div key={log.id} style={s.logRow}>
                <div style={s.logHeader}>
                  <span style={s.logTime}>{log.timestamp}</span>
                  <span style={{ ...s.logActor, color: log.actor.includes('System') ? 'var(--accent-rose)' : 'var(--accent-blue)' }}>{log.actor}</span>
                </div>
                <div style={s.logAction}>
                  <span>{log.action}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const s = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' },
  grid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-lg)', alignItems: 'start' },
  panel: { padding: 'var(--space-lg)' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' },
  title: { margin: 0, fontSize: '15px', fontWeight: 600 },
  badge: { fontSize: '10px', fontWeight: 700, color: 'var(--accent-amber)', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 'var(--radius-full)' },
  alarmList: { display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', maxHeight: '540px', overflowY: 'auto' },
  alarmRow: {
    background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
    borderLeft: '3px solid', borderRadius: 'var(--radius-sm)', padding: 'var(--space-md)',
  },
  alarmHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  alarmMeta: { display: 'flex', alignItems: 'center', gap: '6px' },
  sevBadge: { fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 5px', borderRadius: '3px' },
  alarmId: { fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' },
  alarmZone: { fontSize: '11px', color: 'var(--text-secondary)' },
  statusText: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em' },
  alarmTitle: { fontSize: '13px', color: 'var(--text-primary)', margin: '0 0 var(--space-sm) 0', lineHeight: '1.4' },
  alarmActions: { borderTop: '1px dashed var(--border-subtle)', paddingTop: 'var(--space-sm)' },
  actionRow: { display: 'flex', gap: 'var(--space-sm)' },
  actionBtn: {
    background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.15)',
    color: 'var(--accent-blue)', padding: '4px 10px', borderRadius: 'var(--radius-xs)',
    fontSize: '11px', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-sans)',
  },
  resolveBtn: {
    background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)',
    color: 'var(--accent-emerald)', padding: '4px 10px', borderRadius: 'var(--radius-xs)',
    fontSize: '11px', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-sans)',
  },
  actionDetails: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  resolved: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' },
  resolveForm: {
    position: 'absolute', inset: 'var(--space-lg)',
    background: 'var(--bg-surface)', border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)',
    zIndex: 10, display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)',
  },
  textarea: {
    flexGrow: 1, background: 'var(--bg-input)', border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)', padding: 'var(--space-md)',
    color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: '12px',
    resize: 'none', marginBottom: 'var(--space-md)', outline: 'none',
  },
  formBtns: { display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' },
  cancelBtn: {
    background: 'transparent', border: '1px solid var(--border-primary)',
    color: 'var(--text-secondary)', padding: '6px 14px', borderRadius: 'var(--radius-sm)',
    fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
  submitBtn: {
    background: 'var(--accent-emerald)', border: 'none', color: '#fff',
    padding: '6px 14px', borderRadius: 'var(--radius-sm)',
    fontSize: '12px', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-sans)',
  },
  logInstr: { fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 var(--space-md) 0' },
  logList: { display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', maxHeight: '420px', overflowY: 'auto' },
  logRow: {
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xs)',
  },
  logHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' },
  logTime: { fontFamily: 'var(--font-mono)' },
  logActor: { fontWeight: 600 },
  logAction: { fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start' },
};
