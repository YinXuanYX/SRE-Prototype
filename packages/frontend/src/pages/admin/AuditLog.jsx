import { useState } from 'react';
import { 
  Clock, 
  Search, 
  Filter,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';

export const AuditLog = () => {
  const [logs] = useState([
    { id: 1, timestamp: '2026-05-23T22:00:10.000Z', actor: 'Sarah Admin', action: 'Created task assignment for Alarm AL-092 to Technician Kumar.', module: 'Access Control' },
    { id: 2, timestamp: '2026-05-23T22:03:45.000Z', actor: 'Sarah Admin', action: 'Resolved Alarm AL-093. Completion note: Plug re-seated. Wifi signal stabilized.', module: 'Devices' },
    { id: 3, timestamp: '2026-05-23T21:40:12.000Z', actor: 'System (Anomaly Engine)', action: 'Auto-detected over-current anomaly on Bangladesh AirCon unit (device-ac-01).', module: 'Analytics' },
    { id: 4, timestamp: '2026-05-23T19:15:30.000Z', actor: 'John Tech Support', action: 'Polled diagnostic terminal node mapping cache logs.', module: 'Diagnostics' },
    { id: 5, timestamp: '2026-05-23T18:02:11.000Z', actor: 'Sarah Admin', action: 'Updated budget threshold parameters in building virtual profile.', module: 'Billing' },
    { id: 6, timestamp: '2026-05-23T15:22:45.000Z', actor: 'System (Security Gateway)', action: 'Refreshed API sub-meter JWT tokens for tenant portals.', module: 'Security' }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('All');

  // Filter logs based on search and selected module
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.action.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesModule = selectedModule === 'All' || log.module === selectedModule;
    
    return matchesSearch && matchesModule;
  });

  const modules = ['All', 'Devices', 'Analytics', 'Billing', 'Diagnostics', 'Security', 'Access Control'];

  return (
    <div style={s.container}>
      <PageHeader 
        title="Audit Log" 
        subtitle="Immutable ledger registry of administrative tasks and virtual gateway adjustments."
        breadcrumb={['Admin Panel', 'Audit Log']}
        actions={
          <button 
            onClick={() => alert('Exporting log ledger as CSV... (Prototype)')}
            className="btn-secondary"
            style={s.exportBtn}
          >
            <FileSpreadsheet size={14} />
            <span>Export Ledger</span>
          </button>
        }
      />

      <section className="surface-card animate-in" style={s.panel}>
        {/* Filters strip */}
        <div style={s.filterBar}>
          <div style={s.searchWrapper}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search actors or actions..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={s.searchInput}
            />
          </div>
          
          <div style={s.filterWrapper}>
            <Filter size={14} color="var(--text-muted)" />
            <select 
              value={selectedModule} 
              onChange={(e) => setSelectedModule(e.target.value)}
              style={s.selectInput}
            >
              {modules.map(mod => (
                <option key={mod} value={mod}>{mod} Module</option>
              ))}
            </select>
          </div>
        </div>

        <div style={s.metaInfo}>
          <ShieldCheck size={14} color="var(--accent-emerald)" />
          <span>Ledger database state: cryptographic signature verified (SHA-256)</span>
          <span style={{ marginLeft: 'auto' }}>Showing {filteredLogs.length} audit frames</span>
        </div>

        {/* Ledger List */}
        <div style={s.logList}>
          {filteredLogs.length === 0 ? (
            <div style={s.emptyState}>
              <Clock size={24} color="var(--text-muted)" />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                No audit entries match the filters.
              </p>
            </div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} style={s.logRow}>
                <div style={s.logHeader}>
                  <div style={s.actorBlock}>
                    <span style={{ 
                      ...s.logActor, 
                      color: log.actor.includes('System') ? 'var(--accent-rose)' : 'var(--accent-blue)' 
                    }}>
                      {log.actor}
                    </span>
                    <span style={s.moduleBadge}>{log.module}</span>
                  </div>
                  <span style={s.logTime}>
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <div style={s.logAction}>
                  <ArrowRight size={10} style={{ marginRight: '6px', flexShrink: 0, marginTop: '3px' }} />
                  <span>{log.action}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

const s = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' },
  panel: { padding: 'var(--space-lg)' },
  exportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 600,
  },
  filterBar: {
    display: 'flex',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-md)',
    flexWrap: 'wrap'
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)',
    padding: '0 var(--space-sm)',
    flexGrow: 1,
    minWidth: '240px',
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '12px',
    outline: 'none',
    width: '100%',
    padding: '8px 0',
    fontFamily: 'var(--font-sans)',
  },
  filterWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)',
    padding: '0 var(--space-sm)',
  },
  selectInput: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '12px',
    outline: 'none',
    padding: '8px 0',
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
  },
  metaInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: 'var(--space-xs) var(--space-md)',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xs)',
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginBottom: 'var(--space-md)',
  },
  logList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)',
    maxHeight: '520px',
    overflowY: 'auto',
  },
  logRow: {
    padding: 'var(--space-md)',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)',
    transition: 'background 0.2s',
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actorBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
  },
  logActor: {
    fontSize: '12px',
    fontWeight: 700,
  },
  moduleBadge: {
    fontSize: '9px',
    fontWeight: 700,
    background: 'rgba(255,255,255,0.06)',
    padding: '1px 6px',
    borderRadius: '3px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  logTime: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  logAction: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'flex-start',
    lineHeight: '1.4',
  },
  emptyState: {
    padding: 'var(--space-xl)',
    textAlign: 'center',
  }
};
