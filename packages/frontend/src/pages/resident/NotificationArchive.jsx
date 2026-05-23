import { Bell } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { db } from '../../db/indexedDB';
import { useLiveQuery } from 'dexie-react-hooks';

export const NotificationArchive = () => {
  const alertHistory = useLiveQuery(() => db.alertHistory.toArray()) || [];

  const handleClearAlerts = async () => { await db.alertHistory.clear(); };

  const handleCreateMockAlert = async () => {
    await db.alertHistory.add({
      timestamp: new Date().toISOString(),
      type: 'budget_alert',
      title: 'Budget Limit Warning Triggered',
      message: `Your projected monthly TNB billing cost has exceeded your configured limit threshold.`
    });
  };

  return (
    <div style={s.container}>
      <PageHeader 
        title="Notification Archive" 
        subtitle="Browse historical warning logs stored in local IndexedDB cache."
        breadcrumb={['Resident Hub', 'Notifications']}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button onClick={handleCreateMockAlert} style={s.seedBtn}>+ Trigger Test Alert</button>
            {alertHistory.length > 0 && (
              <button onClick={handleClearAlerts} style={s.clearBtn}>Clear All Logs</button>
            )}
          </div>
        }
      />

      <div style={s.list}>
        {alertHistory.length === 0 ? (
          <div className="surface-card" style={s.empty}>
            <Bell size={28} color="var(--text-muted)" />
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
              No warnings logged in local IndexedDB archive.
            </p>
          </div>
        ) : (
          [...alertHistory].reverse().map(alert => (
            <div key={alert.id} className="surface-card" style={s.alertItem}>
              <div style={s.alertHeader}>
                <span style={{
                  ...s.alertBadge,
                  background: alert.type === 'budget_alert' ? 'rgba(244, 63, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  color: alert.type === 'budget_alert' ? 'var(--accent-rose)' : 'var(--accent-amber)',
                }}>
                  {alert.type === 'budget_alert' ? 'BUDGET LIMIT' : 'SYSTEM ALARM'}
                </span>
                <span style={s.alertTime}>{new Date(alert.timestamp).toLocaleString()}</span>
              </div>
              <h4 style={s.alertTitle}>{alert.title}</h4>
              <p style={s.alertMsg}>{alert.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const s = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' },
  list: { display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' },
  empty: { padding: 'var(--space-3xl)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  alertItem: {
    padding: 'var(--space-md) var(--space-lg)', display: 'flex', flexDirection: 'column', gap: '4px',
  },
  alertHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  alertBadge: { fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px' },
  alertTime: { fontSize: '10px', color: 'var(--text-muted)' },
  alertTitle: { margin: 'var(--space-xs) 0 2px 0', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' },
  alertMsg: { margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' },
  seedBtn: {
    background: 'transparent', border: '1px dashed var(--border-primary)',
    color: 'var(--text-muted)', padding: '6px 12px', borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-sans)',
  },
  clearBtn: {
    background: 'transparent', border: '1px solid rgba(244, 63, 94, 0.3)',
    color: 'var(--accent-rose)', padding: '6px 12px', borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-sans)',
  },
};
