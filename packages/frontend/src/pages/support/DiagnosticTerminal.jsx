import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';

export const DiagnosticTerminal = ({ liveLogs }) => {
  const [logsPaused, setLogsPaused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <PageHeader 
        title="Diagnostic Terminal" 
        subtitle="Real-time packet inspection of active telemetry websocket streams."
        breadcrumb={['Support Desk', 'Terminal']}
        actions={
          <button 
            onClick={() => setLogsPaused(!logsPaused)} 
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            {logsPaused ? '▶ Resume Feed' : '⏸ Pause Feed'}
          </button>
        }
      />

      <section className="surface-card animate-in" style={{ padding: 'var(--space-lg)' }}>
        <div style={terminalStyle}>
          {logsPaused ? (
            <div style={{ color: 'var(--accent-emerald)', textAlign: 'center', fontWeight: 600, padding: 'var(--space-xl) 0' }}>
              [FEED PAUSED FOR INSPECTION]
            </div>
          ) : liveLogs.length === 0 ? (
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Awaiting WebSocket packets...</span>
          ) : (
            liveLogs.map((log) => (
              <div key={log.id} style={{ display: 'flex', gap: 'var(--space-sm)', whiteSpace: 'nowrap' }}>
                <span style={{ color: 'var(--text-muted)' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>[TELEMETRY]</span>
                <span style={{ color: 'var(--accent-blue)', fontWeight: 500 }}>{log.deviceName} (ID: {log.deviceId})</span>
                <span style={{ color: 'var(--text-secondary)' }}>
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

const terminalStyle = {
  background: 'var(--bg-input)', border: '1px solid var(--border-primary)',
  borderRadius: 'var(--radius-md)', padding: 'var(--space-md)',
  fontFamily: 'var(--font-mono)', fontSize: '12px',
  maxHeight: '500px', overflowY: 'auto',
  display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)',
};
