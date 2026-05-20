import React, { useState, useEffect, useMemo } from 'react';
import { EnergyChart } from './EnergyChart';
import { ApplianceCorrectionModal } from './ApplianceCorrectionModal';
import { db } from '../db/indexedDB';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Zap, 
  Activity, 
  Database, 
  Cpu, 
  Radio, 
  DollarSign, 
  Lock,
  AlertTriangle,
  Sliders,
  TrendingUp,
  Edit2,
  Lightbulb
} from 'lucide-react';

export const ResidentDashboard = ({ user, recentTelemetry, liveLogs, socketStatus }) => {
  const [consentGranted, setConsentGranted] = useState(true);
  const [activeRange, setActiveRange] = useState('daily');
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [budgetLimit, setBudgetLimit] = useState(
    Number(localStorage.getItem('sre_budget_limit') || '150')
  );
  const [budgetInput, setBudgetInput] = useState(budgetLimit.toString());
  const [correctionDevice, setCorrectionDevice] = useState(null);

  const telemetryCount = useLiveQuery(() => db.telemetryCache.count()) || 0;
  const labelOverrides = useLiveQuery(() => db.applianceOverrides.toArray()) || [];

  const labelOverrideMap = useMemo(() => {
    return new Map(labelOverrides.map(o => [o.deviceId, o.correctedLabel]));
  }, [labelOverrides]);

  useEffect(() => {
    db.consentSettings.get('appliance_breakdown').then((rec) => {
      if (rec) {
        setConsentGranted(rec.status === 'Granted');
      } else {
        setConsentGranted(true);
        db.consentSettings.put({
          consentType: 'appliance_breakdown',
          status: 'Granted',
          timestamp: new Date().toISOString()
        });
      }
    });
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('sre_token');
      const response = await fetch(`http://localhost:3000/api/telemetry/history?range=${activeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setHistoryData(await response.json());
      }
    } catch (err) {
      console.error('[ResidentDashboard] Error fetching telemetry history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [activeRange]);

  const handleConsentUpdated = async (status) => {
    setConsentGranted(status);
    await db.consentSettings.put({
      consentType: 'appliance_breakdown',
      status: status ? 'Granted' : 'Revoked',
      timestamp: new Date().toISOString()
    });
  };

  const handleSaveBudget = (e) => {
    e.preventDefault();
    const val = Number(budgetInput);
    if (!isNaN(val) && val > 0) {
      setBudgetLimit(val);
      localStorage.setItem('sre_budget_limit', val.toString());
    }
  };

  const handleSaveOverride = async (deviceId, correctedLabel) => {
    await db.applianceOverrides.put({
      deviceId, correctedLabel, timestamp: new Date().toISOString()
    });
    setCorrectionDevice(null);
  };

  const clearLocalDB = async () => { await db.telemetryCache.clear(); };

  const sortedDevices = useMemo(() => {
    return Object.values(recentTelemetry)
      .map(dev => ({ ...dev, deviceName: labelOverrideMap.get(dev.deviceId) || dev.deviceName }))
      .sort((a, b) => b.loadKw - a.loadKw);
  }, [recentTelemetry, labelOverrideMap]);

  const calculateBilling = () => {
    let totalKw = 0;
    sortedDevices.forEach(dev => { if (dev.status === 'Active') totalKw += dev.loadKw; });
    const historicalKwhSum = historyData.reduce((sum, d) => sum + d.kwh, 0);
    const avgHistoricalKwh = historyData.length > 0 ? (historicalKwhSum / historyData.length) : 0;
    let simulatedDailyKwh = 12.5;
    if (activeRange === 'daily' && avgHistoricalKwh > 0) simulatedDailyKwh = avgHistoricalKwh;
    else if (totalKw > 0) simulatedDailyKwh = totalKw * 8;
    const simulatedMonthlyKwh = Math.round(simulatedDailyKwh * 30 * 10) / 10;
    let remaining = simulatedMonthlyKwh;
    let cost = 0;
    if (remaining > 600) { cost += (remaining - 600) * 0.546; remaining = 600; }
    if (remaining > 300) { cost += (remaining - 300) * 0.516; remaining = 300; }
    if (remaining > 200) { cost += (remaining - 200) * 0.334; remaining = 200; }
    cost += remaining * 0.218;
    return { kwh: simulatedMonthlyKwh, cost: Number(cost.toFixed(2)) };
  };

  const billing = calculateBilling();
  const isBudgetExceeded = billing.cost > budgetLimit;

  const recommendations = useMemo(() => {
    const tips = [];
    sortedDevices.forEach((dev) => {
      if (dev.status !== 'Active') return;
      if (dev.deviceName.toLowerCase().includes('aircon') || dev.deviceName.toLowerCase().includes('conditioner')) {
        const saved = (dev.loadKw * 0.15 * 6 * 30 * 0.516).toFixed(2);
        tips.push({ id: 'tip-ac', targetDevice: dev.deviceName, message: 'Increase your Air Conditioner temperature target to 24°C instead of 18°C.', savings: `RM ${saved} / month` });
      }
      if (dev.deviceName.toLowerCase().includes('fridge') || dev.deviceName.toLowerCase().includes('refrigerator')) {
        const saved = (dev.loadKw * 0.20 * 24 * 30 * 0.334).toFixed(2);
        tips.push({ id: 'tip-fridge', targetDevice: dev.deviceName, message: 'Clean refrigerator condenser coils and check the rubber door vacuum seals.', savings: `RM ${saved} / month` });
      }
      if (dev.deviceName.toLowerCase().includes('pump') || dev.deviceName.toLowerCase().includes('heater')) {
        const saved = (dev.loadKw * 0.30 * 2 * 30 * 0.516).toFixed(2);
        tips.push({ id: 'tip-pump', targetDevice: dev.deviceName, message: 'Reduce utility duty runtime cycles by scheduling pump runs during low-draw periods.', savings: `RM ${saved} / month` });
      }
    });
    if (tips.length === 0) {
      tips.push({ id: 'tip-default', targetDevice: 'General', message: 'Shift energy-heavy tasks (laundry, cooking) to off-peak periods (after 10:00 PM).', savings: 'RM 12.40 / month' });
    }
    return tips;
  }, [sortedDevices]);

  return (
    <div style={s.container}>
      {/* ── Summary Stats Strip ── */}
      <section style={s.statsStrip} className="stagger-children">
        <div className="surface-card" style={s.statCard}>
          <DollarSign size={18} color={isBudgetExceeded ? 'var(--accent-rose)' : 'var(--accent-emerald)'} />
          <div>
            <div style={s.statLabel}>Monthly Forecast</div>
            <div style={{ ...s.statValue, color: isBudgetExceeded ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
              RM {billing.cost}
            </div>
          </div>
        </div>
        <div className="surface-card" style={s.statCard}>
          <Zap size={18} color="var(--accent-amber)" />
          <div>
            <div style={s.statLabel}>Est. Monthly kWh</div>
            <div style={s.statValue}>{billing.kwh}</div>
          </div>
        </div>
        <div className="surface-card" style={s.statCard}>
          <Cpu size={18} color="var(--accent-blue)" />
          <div>
            <div style={s.statLabel}>Active Devices</div>
            <div style={s.statValue}>{sortedDevices.filter(d => d.status === 'Active').length}</div>
          </div>
        </div>
        <div className="surface-card" style={s.statCard}>
          <Sliders size={18} color="var(--accent-violet)" />
          <div>
            <div style={s.statLabel}>Budget Limit</div>
            <div style={s.statValue}>RM {budgetLimit.toFixed(0)}</div>
          </div>
        </div>
      </section>

      {/* ── Budget Warning Banner ── */}
      {isBudgetExceeded && (
        <div style={s.warningBanner} className="animate-in">
          <AlertTriangle size={16} color="var(--accent-rose)" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Monthly Budget Over-Run</strong>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Projection (RM {billing.cost}) exceeds your RM {budgetLimit.toFixed(2)} threshold by RM {(billing.cost - budgetLimit).toFixed(2)}.
            </div>
          </div>
        </div>
      )}

      {/* ── Chart Section (Full Width) ── */}
      <section className="surface-card" style={s.chartSection}>
        <div style={s.chartHeader}>
          <div style={s.chartTitleRow}>
            <TrendingUp size={18} color="var(--accent-cyan)" />
            <h3 style={s.sectionTitle}>Consumption Trends</h3>
          </div>
          <div style={s.rangeTabs}>
            {['daily', 'weekly', 'monthly'].map(range => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                style={{
                  ...s.tabBtn,
                  background: activeRange === range ? 'var(--sidebar-active)' : 'transparent',
                  color: activeRange === range ? 'var(--accent-blue)' : 'var(--text-muted)',
                }}
              >
                {range === 'daily' ? '24h' : range === 'weekly' ? '7d' : '30d'}
              </button>
            ))}
          </div>
        </div>
        {historyLoading ? (
          <div style={s.loader}>
            <Activity size={20} className="spin" color="var(--accent-blue)" />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading…</span>
          </div>
        ) : (
          <EnergyChart data={historyData} />
        )}
      </section>

      {/* ── Two-Column Layout: Appliances + Right Panel ── */}
      <div style={s.twoCol}>
        {/* Left: Appliance Rankings */}
        <section className="surface-card" style={s.panel}>
          <div style={s.panelHeader}>
            <div style={s.chartTitleRow}>
              <Cpu size={16} color="var(--accent-blue)" />
              <h3 style={s.sectionTitle}>Appliance Rankings</h3>
            </div>
            <span style={s.subtle}>Sorted by draw</span>
          </div>

          <div style={s.deviceList}>
            {sortedDevices.length === 0 ? (
              <div style={s.emptyState}>
                <Zap size={24} color="var(--accent-amber)" />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
                  No telemetry data yet.
                </p>
              </div>
            ) : (
              sortedDevices.map((dev, index) => {
                const isRestricted = !consentGranted && dev.deviceId !== 'device-light-01' && dev.deviceId !== 'device-anomaly-timer';
                return (
                  <div key={dev.deviceId} style={s.deviceRow}>
                    <div style={s.deviceLeft}>
                      <span style={s.rankBadge}>#{index + 1}</span>
                      <div style={{
                        ...s.dot,
                        background: dev.status === 'Active' ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                      }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={s.deviceNameRow}>
                          <span style={s.deviceName}>{dev.deviceName}</span>
                          {!isRestricted && (
                            <button onClick={() => setCorrectionDevice(dev)} style={s.editBtn} title="Correct label">
                              <Edit2 size={10} />
                            </button>
                          )}
                        </div>
                        <div style={s.deviceId}>{dev.deviceId}</div>
                      </div>
                    </div>
                    {isRestricted ? (
                      <div style={s.restricted}>
                        <Lock size={10} style={{ marginRight: '4px' }} />
                        <span>PDPA Gated</span>
                      </div>
                    ) : (
                      <div style={s.deviceRight}>
                        <div style={s.loadVal}>{dev.loadKw} <span style={s.unit}>kW</span></div>
                        <div style={s.voltageVal}>{dev.voltage}V</div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right: Recommendations + Budget + System */}
        <div style={s.rightStack}>
          {/* Recommendations */}
          <section className="surface-card" style={s.panel}>
            <div style={s.chartTitleRow}>
              <Lightbulb size={16} color="var(--accent-amber)" />
              <h3 style={s.sectionTitle}>Savings Tips</h3>
            </div>
            <div style={s.tipsList}>
              {recommendations.map(rec => (
                <div key={rec.id} style={s.tipCard}>
                  <div style={s.tipHeader}>
                    <span style={s.tipBadge}>{rec.targetDevice}</span>
                    <span style={s.tipSavings}>{rec.savings}</span>
                  </div>
                  <p style={s.tipText}>{rec.message}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Budget Config */}
          <section className="surface-card" style={s.panel}>
            <div style={s.chartTitleRow}>
              <Sliders size={16} color="var(--accent-amber)" />
              <h3 style={s.sectionTitle}>Budget</h3>
            </div>
            <form onSubmit={handleSaveBudget} style={s.budgetForm}>
              <div style={s.inputWrapper}>
                <span style={s.currencyPrefix}>RM</span>
                <input
                  type="number" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)}
                  style={s.budgetInput} placeholder="Set limit…" min="1" required
                />
              </div>
              <button type="submit" style={s.saveBudgetBtn}>Save</button>
            </form>
            <div style={s.budgetMeta}>
              <span>Active: RM {budgetLimit.toFixed(2)}</span>
              <span>30-day cycle</span>
            </div>
          </section>

          {/* System Diagnostics */}
          <section className="surface-card" style={s.panel}>
            <h4 style={s.miniTitle}>System</h4>
            <div style={s.sysRow}>
              <div style={s.sysLabel}><Radio size={12} color="var(--text-muted)" /><span>Gateway</span></div>
              <span className={`badge ${socketStatus === 'Connected' ? 'badge-active' : 'badge-offline'}`} style={{ fontSize: '10px' }}>
                {socketStatus}
              </span>
            </div>
            <div style={s.sysRow}>
              <div style={s.sysLabel}><Database size={12} color="var(--text-muted)" /><span>Cache</span></div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {telemetryCount} pkts
              </span>
            </div>
            {telemetryCount > 0 && (
              <button onClick={clearLocalDB} style={s.clearBtn}>Clear Cache</button>
            )}
          </section>
        </div>
      </div>

      {/* ── Terminal Feed (Full Width) ── */}
      <section className="surface-card" style={s.panel}>
        <div style={s.panelHeader}>
          <div style={s.chartTitleRow}>
            <Activity size={16} color="var(--accent-cyan)" />
            <h3 style={s.sectionTitle}>Ingestion Feed</h3>
          </div>
        </div>
        <div style={s.console}>
          {liveLogs.length === 0 ? (
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Awaiting packets…</span>
          ) : (
            liveLogs.map(log => (
              <div key={log.id} style={s.logLine}>
                <span style={s.logTs}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span style={s.logDev}>{labelOverrideMap.get(log.deviceId) || log.deviceName}:</span>
                <span style={s.logVal}>
                  {log.status === 'Active' ? `${log.loadKw} kW @ ${log.voltage}V` : `STATUS: ${log.status}`}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Correction Modal */}
      {correctionDevice && (
        <ApplianceCorrectionModal device={correctionDevice} onClose={() => setCorrectionDevice(null)} onSave={handleSaveOverride} />
      )}
    </div>
  );
};

const s = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' },

  // Stats strip
  statsStrip: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' },
  statCard: {
    padding: 'var(--space-md) var(--space-lg)',
    display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
  },
  statLabel: { fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' },
  statValue: { fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' },

  // Warning
  warningBanner: {
    display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start',
    padding: 'var(--space-md) var(--space-lg)',
    background: 'rgba(244, 63, 94, 0.06)',
    border: '1px solid rgba(244, 63, 94, 0.15)',
    borderRadius: 'var(--radius-md)',
  },

  // Chart
  chartSection: { padding: 'var(--space-lg)' },
  chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' },
  chartTitleRow: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' },
  sectionTitle: { margin: 0, fontSize: '15px', fontWeight: 600 },
  rangeTabs: {
    display: 'flex', background: 'var(--bg-input)', padding: '2px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)',
  },
  tabBtn: {
    padding: '5px 14px', border: 'none', borderRadius: 'var(--radius-xs)',
    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    transition: 'all var(--duration-fast) ease',
  },
  loader: {
    height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)',
    background: 'var(--bg-input)', borderRadius: 'var(--radius-md)',
  },

  // Two-column
  twoCol: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-lg)', alignItems: 'start' },
  rightStack: { display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' },

  // Panel (generic)
  panel: { padding: 'var(--space-lg)' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' },
  subtle: { fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' },

  // Device list
  deviceList: { display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' },
  deviceRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    transition: 'background var(--duration-fast) ease',
  },
  deviceLeft: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', minWidth: 0 },
  rankBadge: {
    fontSize: '10px', fontWeight: 700, color: 'var(--accent-cyan)',
    background: 'rgba(6, 182, 212, 0.08)', padding: '2px 5px', borderRadius: 'var(--radius-xs)',
    minWidth: '22px', textAlign: 'center',
  },
  dot: { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 },
  deviceNameRow: { display: 'flex', alignItems: 'center', gap: '4px' },
  deviceName: { fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' },
  editBtn: {
    background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
    padding: '2px', display: 'flex', alignItems: 'center', borderRadius: '3px',
  },
  deviceId: { fontSize: '10px', color: 'var(--text-muted)' },
  restricted: {
    fontSize: '10px', color: 'var(--accent-rose)', fontWeight: 600,
    background: 'rgba(244, 63, 94, 0.06)', padding: '4px 8px', borderRadius: 'var(--radius-xs)',
    display: 'flex', alignItems: 'center',
  },
  deviceRight: { textAlign: 'right' },
  loadVal: { fontSize: '14px', fontWeight: 700, color: 'var(--accent-cyan)' },
  unit: { fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)' },
  voltageVal: { fontSize: '10px', color: 'var(--text-muted)' },
  emptyState: { padding: 'var(--space-xl)', textAlign: 'center' },

  // Tips
  tipsList: { display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' },
  tipCard: {
    background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)', padding: 'var(--space-md)',
  },
  tipHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  tipBadge: {
    fontSize: '9px', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase',
    background: 'rgba(59, 130, 246, 0.06)', padding: '2px 6px', borderRadius: '3px',
  },
  tipSavings: { fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 700 },
  tipText: { fontSize: '12px', lineHeight: '1.5', color: 'var(--text-secondary)', margin: 0 },

  // Budget
  budgetForm: { display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' },
  inputWrapper: {
    display: 'flex', alignItems: 'center',
    background: 'var(--bg-input)', border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)', padding: '0 var(--space-sm)', flexGrow: 1,
  },
  currencyPrefix: { color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, marginRight: '4px' },
  budgetInput: {
    background: 'transparent', border: 'none', color: 'var(--text-primary)',
    fontSize: '12px', outline: 'none', width: '100%', padding: '8px 0',
    fontFamily: 'var(--font-sans)',
  },
  saveBudgetBtn: {
    background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)',
    color: 'var(--accent-amber)', padding: '0 var(--space-md)',
    borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    transition: 'all var(--duration-fast) ease',
  },
  budgetMeta: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '10px', color: 'var(--text-muted)', marginTop: 'var(--space-sm)',
  },

  // System
  miniTitle: { margin: '0 0 var(--space-md) 0', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' },
  sysRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' },
  sysLabel: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' },
  clearBtn: {
    width: '100%', background: 'transparent', border: '1px dashed var(--border-primary)',
    color: 'var(--text-muted)', padding: '5px', borderRadius: 'var(--radius-xs)',
    cursor: 'pointer', fontSize: '10px', marginTop: '4px',
    fontFamily: 'var(--font-sans)',
    transition: 'all var(--duration-fast) ease',
  },

  // Console
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
};
