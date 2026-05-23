import { useState, useEffect, useMemo } from 'react';
import { 
  Sliders, 
  Info,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Award
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { db } from '../../db/indexedDB';
import { useLiveQuery } from 'dexie-react-hooks';

export const BillingBudget = ({ recentTelemetry }) => {
  const [historyData, setHistoryData] = useState([]);
  
  const [budgetLimit, setBudgetLimit] = useState(
    Number(localStorage.getItem('sre_budget_limit') || '150')
  );
  const [budgetInput, setBudgetInput] = useState(budgetLimit.toString());
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch daily telemetry history to calculate precise baseline average
  useEffect(() => {
    const token = localStorage.getItem('sre_token');
    fetch('http://localhost:3000/api/telemetry/history?range=daily', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setHistoryData(data);
      })
      .catch((err) => {
        console.error('[BillingBudget] Failed to load telemetry history:', err);
      });
  }, []);

  const labelOverrides = useLiveQuery(() => db.applianceOverrides.toArray());
  const labelOverrideMap = useMemo(() => {
    return new Map((labelOverrides || []).map(o => [o.deviceId, o.correctedLabel]));
  }, [labelOverrides]);

  const activeDevices = useMemo(() => {
    return Object.values(recentTelemetry || {})
      .map(dev => ({ 
        ...dev, 
        deviceName: labelOverrideMap.get(dev.deviceId) || dev.deviceName 
      }));
  }, [recentTelemetry, labelOverrideMap]);

  const billing = useMemo(() => {
    let totalKw = 0;
    activeDevices.forEach(dev => { 
      if (dev.status === 'Active') totalKw += dev.loadKw; 
    });

    const historicalKwhSum = historyData.reduce((sum, d) => sum + d.kwh, 0);
    const avgHistoricalKwh = historyData.length > 0 ? (historicalKwhSum / historyData.length) : 0;
    
    // Simulate daily/monthly usage
    let simulatedDailyKwh = 12.5;
    if (avgHistoricalKwh > 0) {
      simulatedDailyKwh = avgHistoricalKwh;
    } else if (totalKw > 0) {
      simulatedDailyKwh = totalKw * 8;
    }
    
    const simulatedMonthlyKwh = Math.round(simulatedDailyKwh * 30 * 10) / 10;
    
    // TNB Residential Tariff calculation:
    // First 200 kWh: RM 0.218 / kWh
    // 201 - 300 kWh: RM 0.334 / kWh
    // 301 - 600 kWh: RM 0.516 / kWh
    // > 600 kWh:     RM 0.546 / kWh
    let remaining = simulatedMonthlyKwh;
    let cost = 0;
    const breakdown = [
      { tier: 1, range: '1 - 200 kWh', rate: '0.218', kwh: 0, cost: 0 },
      { tier: 2, range: '201 - 300 kWh', rate: '0.334', kwh: 0, cost: 0 },
      { tier: 3, range: '301 - 600 kWh', rate: '0.516', kwh: 0, cost: 0 },
      { tier: 4, range: '> 600 kWh', rate: '0.546', kwh: 0, cost: 0 },
    ];

    if (remaining > 600) { 
      const amount = remaining - 600;
      cost += amount * 0.546; 
      breakdown[3].kwh = Number(amount.toFixed(1));
      breakdown[3].cost = Number((amount * 0.546).toFixed(2));
      remaining = 600; 
    }
    if (remaining > 300) { 
      const amount = remaining - 300;
      cost += amount * 0.516; 
      breakdown[2].kwh = Number(amount.toFixed(1));
      breakdown[2].cost = Number((amount * 0.516).toFixed(2));
      remaining = 300; 
    }
    if (remaining > 200) { 
      const amount = remaining - 200;
      cost += amount * 0.334; 
      breakdown[1].kwh = Number(amount.toFixed(1));
      breakdown[1].cost = Number((amount * 0.334).toFixed(2));
      remaining = 200; 
    }
    cost += remaining * 0.218;
    breakdown[0].kwh = Number(remaining.toFixed(1));
    breakdown[0].cost = Number((remaining * 0.218).toFixed(2));

    return { 
      kwh: simulatedMonthlyKwh, 
      cost: Number(cost.toFixed(2)),
      breakdown
    };
  }, [activeDevices, historyData]);

  const isBudgetExceeded = billing.cost > budgetLimit;

  const handleSaveBudget = (e) => {
    e.preventDefault();
    const val = Number(budgetInput);
    if (!isNaN(val) && val > 0) {
      setBudgetLimit(val);
      localStorage.setItem('sre_budget_limit', val.toString());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div style={s.container}>
      <PageHeader 
        title="Billing & Budget" 
        subtitle="Configure alerts, evaluate TNB tariff tier distributions, and review projections."
        breadcrumb={['Resident Hub', 'Billing & Budget']}
      />

      <div style={s.twoCol}>
        {/* Left: Summary cards and tier breakdown */}
        <div style={s.leftStack} className="stagger-children animate-in">
          {/* Main cost projection card */}
          <div className="surface-card" style={s.costMainCard}>
            <div style={s.costDetails}>
              <span style={s.cardLabel}>ESTIMATED MONTHLY BILL</span>
              <h1 style={{ ...s.costValue, color: isBudgetExceeded ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                RM {billing.cost}
              </h1>
              <span style={s.kwhSub}>{billing.kwh} kWh projected consumption</span>
            </div>
            <div style={{
              ...s.costBadge,
              background: isBudgetExceeded ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              color: isBudgetExceeded ? 'var(--accent-rose)' : 'var(--accent-emerald)'
            }}>
              {isBudgetExceeded ? <AlertTriangle size={14} /> : <Award size={14} />}
              <span>{isBudgetExceeded ? 'Over Budget' : 'On Track'}</span>
            </div>
          </div>

          {/* TNB Tariff breakdown */}
          <div className="surface-card" style={s.panel}>
            <div style={s.panelHeader}>
              <div style={s.titleRow}>
                <Info size={16} color="var(--accent-cyan)" />
                <h3 style={s.sectionTitle}>TNB Tariff Tier Distribution</h3>
              </div>
              <span style={s.subtle}>Malaysian Domestic Tariff A</span>
            </div>
            
            <p style={s.tierDescription}>
              Your charges are calculated by cascading your projected {billing.kwh} kWh consumption through TNB's residential block rate tiers:
            </p>

            <div style={s.tiersGrid}>
              {billing.breakdown.map((b) => {
                const percentage = billing.kwh > 0 ? (b.kwh / billing.kwh) * 100 : 0;
                return (
                  <div key={b.tier} style={s.tierRow}>
                    <div style={s.tierMeta}>
                      <div style={s.tierNameBlock}>
                        <span style={s.tierTitle}>Tier {b.tier} ({b.range})</span>
                        <span style={s.tierRate}>RM {b.rate} / kWh</span>
                      </div>
                      <div style={s.tierValBlock}>
                        <span style={s.tierKwh}>{b.kwh} kWh</span>
                        <span style={s.tierCost}>RM {b.cost.toFixed(2)}</span>
                      </div>
                    </div>
                    {/* Visual bar indicator */}
                    <div style={s.barContainer}>
                      <div style={{
                        ...s.barFill,
                        width: `${percentage}%`,
                        background: b.tier === 1 ? 'var(--accent-blue)' : b.tier === 2 ? 'var(--accent-cyan)' : b.tier === 3 ? 'var(--accent-amber)' : 'var(--accent-rose)'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Budget Threshold Settings */}
        <div style={s.rightStack} className="animate-in">
          <section className="surface-card" style={s.panel}>
            <div style={s.titleRow}>
              <Sliders size={18} color="var(--accent-amber)" />
              <h3 style={s.sectionTitle}>Configure Budget Alert Threshold</h3>
            </div>
            
            <p style={s.budgetDesc}>
              GridPulse will trigger system alerts and push notifications if your live, active draw projections exceed this threshold.
            </p>

            <form onSubmit={handleSaveBudget} style={s.budgetForm}>
              <div style={s.inputWrapper}>
                <span style={s.currencyPrefix}>RM</span>
                <input
                  type="number" 
                  value={budgetInput} 
                  onChange={(e) => setBudgetInput(e.target.value)}
                  style={s.budgetInput} 
                  placeholder="Set threshold limit…" 
                  min="1" 
                  required
                />
              </div>
              <button type="submit" className="btn-primary" style={s.saveBudgetBtn}>
                Update Target
              </button>
            </form>

            {saveSuccess && (
              <div style={s.successBox} className="animate-in">
                <CheckCircle size={14} color="var(--accent-emerald)" />
                <span>Threshold updated to RM {Number(budgetInput).toFixed(2)}</span>
              </div>
            )}

            <div style={s.alertPreview}>
              <h4 style={s.previewTitle}>Active Configuration:</h4>
              <div style={s.previewRow}>
                <span style={s.previewLabel}>Current Budget Cap</span>
                <span style={s.previewVal}>RM {budgetLimit.toFixed(2)}</span>
              </div>
              <div style={s.previewRow}>
                <span style={s.previewLabel}>Remaining Allowance</span>
                <span style={{ 
                  ...s.previewVal, 
                  color: isBudgetExceeded ? 'var(--accent-rose)' : 'var(--accent-emerald)'
                }}>
                  {isBudgetExceeded ? `Over-run: -RM ${(billing.cost - budgetLimit).toFixed(2)}` : `RM ${(budgetLimit - billing.cost).toFixed(2)}`}
                </span>
              </div>
            </div>
          </section>

          {/* Variance Analysis card */}
          <div className="surface-card" style={s.panel}>
            <div style={s.titleRow}>
              <TrendingUp size={16} color="var(--accent-cyan)" />
              <h4 style={s.sectionTitle}>Consumption Variance</h4>
            </div>
            <p style={{ ...s.tierDescription, marginTop: 'var(--space-sm)' }}>
              Based on the last 24h average load, your daily footprint of {historyData.length > 0 ? (historyData.reduce((sum, d) => sum + d.kwh, 0) / historyData.length).toFixed(1) : '12.5'} kWh suggests a billing rate velocity that matches <strong>{billing.cost > 200 ? 'Tier 3 (High Usage)' : 'Tier 1 (Eco-efficient)'}</strong>. Keep high-draw appliances (A/C, Water Heaters) off during peak midday hours to optimize tiered cost.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const s = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' },
  twoCol: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-lg)', alignItems: 'start' },
  panel: { padding: 'var(--space-lg)' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' },
  sectionTitle: { margin: 0, fontSize: '15px', fontWeight: 600 },
  subtle: { fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' },
  leftStack: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' },
  rightStack: { display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' },

  // Cost main card
  costMainCard: {
    padding: 'var(--space-xl)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--sidebar-bg) 100%)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-md)',
  },
  costDetails: { display: 'flex', flexDirection: 'column' },
  cardLabel: { fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em' },
  costValue: { fontSize: '32px', fontWeight: 800, margin: 'var(--space-xs) 0 2px 0' },
  kwhSub: { fontSize: '12px', color: 'var(--text-secondary)' },
  costBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: 'var(--radius-full)',
    fontSize: '12px',
    fontWeight: 600,
  },

  // Tier description
  tierDescription: { fontSize: '12px', lineHeight: '1.6', color: 'var(--text-secondary)', margin: 0 },
  tiersGrid: { display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' },
  tierRow: { display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' },
  tierMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tierNameBlock: { display: 'flex', flexDirection: 'column' },
  tierTitle: { fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' },
  tierRate: { fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' },
  tierValBlock: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  tierKwh: { fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' },
  tierCost: { fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1px' },

  // Bar container
  barContainer: { height: '6px', background: 'var(--bg-input)', borderRadius: 'var(--radius-full)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease' },

  // Budget configuration
  budgetDesc: { fontSize: '12px', lineHeight: '1.5', color: 'var(--text-secondary)', margin: '0 0 var(--space-md) 0' },
  budgetForm: { display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' },
  inputWrapper: {
    display: 'flex', alignItems: 'center',
    background: 'var(--bg-input)', border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)', padding: '0 var(--space-sm)', flexGrow: 1,
  },
  currencyPrefix: { color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, marginRight: '4px' },
  budgetInput: {
    background: 'transparent', border: 'none', color: 'var(--text-primary)',
    fontSize: '13px', outline: 'none', width: '100%', padding: '8px 0',
    fontFamily: 'var(--font-sans)',
  },
  saveBudgetBtn: {
    padding: '0 var(--space-md)',
    borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 600,
  },

  successBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)',
    borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '11px',
    color: 'var(--text-primary)', marginBottom: 'var(--space-md)',
  },

  alertPreview: {
    borderTop: '1px dashed var(--border-subtle)',
    paddingTop: 'var(--space-md)',
    display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)'
  },
  previewTitle: { margin: '0 0 var(--space-xs) 0', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' },
  previewRow: { display: 'flex', justifyContent: 'space-between', fontSize: '12px' },
  previewLabel: { color: 'var(--text-secondary)' },
  previewVal: { fontWeight: 600, color: 'var(--text-primary)' }
};
