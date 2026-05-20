import React, { useState, useEffect, useMemo } from 'react';
import { ConsentFlow } from './ConsentFlow';
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
  const [consentGranted, setConsentGranted] = useState(false);
  
  // Historical Analytics States
  const [activeRange, setActiveRange] = useState('daily');
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Budgeting States
  const [budgetLimit, setBudgetLimit] = useState(
    Number(localStorage.getItem('sre_budget_limit') || '150')
  );
  const [budgetInput, setBudgetInput] = useState(budgetLimit.toString());

  // Correction Modal State
  const [correctionDevice, setCorrectionDevice] = useState(null);

  // Sync cache counts & label overrides from Dexie.js
  const telemetryCount = useLiveQuery(() => db.telemetryCache.count()) || 0;
  const labelOverrides = useLiveQuery(() => db.applianceOverrides.toArray()) || [];

  // Map label overrides for quick lookup
  const labelOverrideMap = useMemo(() => {
    return new Map(labelOverrides.map(o => [o.deviceId, o.correctedLabel]));
  }, [labelOverrides]);

  // Retrieve initial consent status
  useEffect(() => {
    db.consentSettings.get('appliance_breakdown').then((rec) => {
      if (rec) {
        setConsentGranted(rec.status === 'Granted');
      }
    });
  }, []);

  // Fetch historical metrics from backend REST API
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('sre_token');
      const response = await fetch(`http://localhost:3000/api/telemetry/history?range=${activeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
      } else {
        console.error('[ResidentDashboard] Failed to fetch telemetry metrics:', response.statusText);
      }
    } catch (err) {
      console.error('[ResidentDashboard] Error fetching telemetry history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [activeRange]);

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
      deviceId,
      correctedLabel,
      timestamp: new Date().toISOString()
    });
    setCorrectionDevice(null);
  };

  const clearLocalDB = async () => {
    await db.telemetryCache.clear();
  };

  // Process devices list: apply local overrides and sort in descending order of current power draw (kW)
  const sortedDevices = useMemo(() => {
    return Object.values(recentTelemetry)
      .map(dev => ({
        ...dev,
        deviceName: labelOverrideMap.get(dev.deviceId) || dev.deviceName
      }))
      .sort((a, b) => b.loadKw - a.loadKw);
  }, [recentTelemetry, labelOverrideMap]);

  // Calculate simulated monthly energy load & TNB tiered billing cost
  const calculateBilling = () => {
    let totalKw = 0;
    sortedDevices.forEach(dev => {
      if (dev.status === 'Active') {
        totalKw += dev.loadKw;
      }
    });

    const historicalKwhSum = historyData.reduce((sum, d) => sum + d.kwh, 0);
    const avgHistoricalKwh = historyData.length > 0 ? (historicalKwhSum / historyData.length) : 0;

    let simulatedDailyKwh = 12.5;
    if (activeRange === 'daily' && avgHistoricalKwh > 0) {
      simulatedDailyKwh = avgHistoricalKwh;
    } else if (totalKw > 0) {
      simulatedDailyKwh = totalKw * 8; // Extrapolate active loads * 8 hours
    }

    const simulatedMonthlyKwh = Math.round(simulatedDailyKwh * 30 * 10) / 10;

    // Apply Tenaga Nasional Berhad (TNB) Tiered Pricing blocks:
    let remaining = simulatedMonthlyKwh;
    let cost = 0;

    if (remaining > 600) {
      cost += (remaining - 600) * 0.546;
      remaining = 600;
    }
    if (remaining > 300) {
      cost += (remaining - 300) * 0.516;
      remaining = 300;
    }
    if (remaining > 200) {
      cost += (remaining - 200) * 0.334;
      remaining = 200;
    }
    cost += remaining * 0.218;

    return {
      kwh: simulatedMonthlyKwh,
      cost: Number(cost.toFixed(2))
    };
  };

  const billing = calculateBilling();
  const isBudgetExceeded = billing.cost > budgetLimit;

  // Generate dynamic actionable energy-saving recommendations based on high drawing devices
  const recommendations = useMemo(() => {
    const tips = [];
    
    // Find active high consumer
    sortedDevices.forEach((dev) => {
      if (dev.status !== 'Active') return;

      // Air Conditioner Draw Tip
      if (dev.deviceName.toLowerCase().includes('aircon') || dev.deviceName.toLowerCase().includes('conditioner')) {
        const potentialSavingsKwh = dev.loadKw * 0.15 * 6 * 30; // 15% reduction in usage * 6 hours * 30 days
        const savedCost = (potentialSavingsKwh * 0.516).toFixed(2); // Tier 3 rate RM 0.516
        tips.push({
          id: 'tip-ac',
          targetDevice: dev.deviceName,
          message: 'Increase your Air Conditioner temperature target to 24°C instead of 18°C.',
          savings: `RM ${savedCost} / month`
        });
      }

      // Refrigerator Cycle Draw Tip
      if (dev.deviceName.toLowerCase().includes('fridge') || dev.deviceName.toLowerCase().includes('refrigerator')) {
        const potentialSavingsKwh = dev.loadKw * 0.20 * 24 * 30; // 20% reduction (seals repair) * 24 hours * 30 days
        const savedCost = (potentialSavingsKwh * 0.334).toFixed(2); // Tier 2 rate
        tips.push({
          id: 'tip-fridge',
          targetDevice: dev.deviceName,
          message: 'Clean refrigerator condenser coils and check the rubber door vacuum seals.',
          savings: `RM ${savedCost} / month`
        });
      }

      // Heavy Draw (Water heater / Pump) Draw Tip
      if (dev.deviceName.toLowerCase().includes('pump') || dev.deviceName.toLowerCase().includes('heater')) {
        const potentialSavingsKwh = dev.loadKw * 0.30 * 2 * 30; // 30% reduction * 2 hours * 30 days
        const savedCost = (potentialSavingsKwh * 0.516).toFixed(2);
        tips.push({
          id: 'tip-pump',
          targetDevice: dev.deviceName,
          message: 'Reduce utility duty runtime cycles by scheduling pump runs during low-draw periods.',
          savings: `RM ${savedCost} / month`
        });
      }
    });

    // Default tip if no specific active devices found
    if (tips.length === 0) {
      tips.push({
        id: 'tip-default',
        targetDevice: 'General',
        message: 'Shift energy-heavy tasks (laundry, cooking) to off-peak periods (after 10:00 PM).',
        savings: 'RM 12.40 / month'
      });
    }

    return tips;
  }, [sortedDevices]);

  return (
    <div style={styles.grid}>
      {/* Left Column: Charts, Terminal logs, and Recommendations */}
      <div style={styles.leftCol}>
        
        {/* Historical Trends Widget */}
        <div className="glass-panel" style={{ ...styles.widget, padding: '24px' }}>
          <div style={styles.widgetHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="var(--accent-cyan)" />
              <h3 style={{ margin: 0, fontSize: '18px' }}>Historical Consumption Trends</h3>
            </div>
            
            {/* Toggle Range buttons */}
            <div style={styles.rangeTabs}>
              <button 
                onClick={() => setActiveRange('daily')} 
                style={{
                  ...styles.tabBtn,
                  background: activeRange === 'daily' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: activeRange === 'daily' ? 'var(--accent-blue)' : 'var(--text-secondary)'
                }}
              >
                24 Hours
              </button>
              <button 
                onClick={() => setActiveRange('weekly')} 
                style={{
                  ...styles.tabBtn,
                  background: activeRange === 'weekly' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: activeRange === 'weekly' ? 'var(--accent-blue)' : 'var(--text-secondary)'
                }}
              >
                7 Days
              </button>
              <button 
                onClick={() => setActiveRange('monthly')} 
                style={{
                  ...styles.tabBtn,
                  background: activeRange === 'monthly' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: activeRange === 'monthly' ? 'var(--accent-blue)' : 'var(--text-secondary)'
                }}
              >
                30 Days
              </button>
            </div>
          </div>

          {historyLoading ? (
            <div style={styles.loaderContainer}>
              <Activity size={24} className="spin" color="var(--accent-blue)" />
              <span style={{ marginLeft: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Querying database aggregates...</span>
            </div>
          ) : (
            <EnergyChart data={historyData} />
          )}
        </div>

        {/* Dynamic Actionable Recommendations Panel */}
        <div className="glass-panel" style={{ ...styles.widget, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Lightbulb size={20} color="var(--accent-amber)" />
            <h3 style={{ margin: 0, fontSize: '18px' }}>Actionable Savings Recommendations</h3>
          </div>

          <div style={styles.recommendationList}>
            {recommendations.map((rec) => (
              <div key={rec.id} style={styles.tipCard}>
                <div style={styles.tipHeader}>
                  <span style={styles.tipTargetBadge}>{rec.targetDevice} Target</span>
                  <span style={styles.tipSavingsVal}>Est. Savings: {rec.savings}</span>
                </div>
                <p style={styles.tipText}>{rec.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live Logs Terminal console */}
        <div className="glass-panel" style={{ ...styles.widget, padding: '24px', flexGrow: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Activity size={20} color="var(--accent-cyan)" />
            <h3 style={{ margin: 0, fontSize: '18px' }}>Ingestion Terminal Feed</h3>
          </div>

          <div style={styles.consoleContainer}>
            {liveLogs.length === 0 ? (
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Awaiting WebSocket packets...</span>
            ) : (
              liveLogs.map((log) => (
                <div key={log.id} style={styles.consoleLogLine}>
                  <span style={styles.logTimestamp}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span style={styles.logDevice}>{labelOverrideMap.get(log.deviceId) || log.deviceName}:</span>
                  <span style={styles.logValue}>
                    {log.status === 'Active' ? `${log.loadKw} kW @ ${log.voltage}V` : `STATUS: ${log.status}`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Right Column: Telemetry list, Budget config, PDPA */}
      <div style={styles.rightCol}>
        
        {/* Cost & Forecasting widget */}
        <div 
          className="glass-panel" 
          style={{ 
            ...styles.widget, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px',
            borderColor: isBudgetExceeded ? 'rgba(244, 63, 94, 0.4)' : 'var(--border-color)',
            background: isBudgetExceeded ? 'rgba(244, 63, 94, 0.02)' : 'rgba(17, 19, 34, 0.4)'
          }}
        >
          {/* Budget Limit exceeded Warning Banner */}
          {isBudgetExceeded && (
            <div style={styles.warningBanner}>
              <AlertTriangle size={18} color="var(--accent-rose)" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#fff', fontSize: '13px' }}>Monthly Budget Over-Run</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Month-end projection (RM {billing.cost}) exceeds your RM {budgetLimit.toFixed(2)} threshold by RM {(billing.cost - budgetLimit).toFixed(2)}.
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{
              ...styles.costIconContainer,
              background: isBudgetExceeded ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              borderColor: isBudgetExceeded ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)'
            }}>
              <DollarSign size={24} color={isBudgetExceeded ? 'var(--accent-rose)' : 'var(--accent-emerald)'} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Estimated Monthly Cost (TNB Pricing)
              </h4>
              <div style={styles.costAmount}>
                RM {billing.cost} <span style={styles.costSub}>({billing.kwh} kWh / month)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Configurator Form */}
        <div className="card-premium" style={{ ...styles.widget, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Sliders size={18} color="var(--accent-amber)" />
            <h3 style={{ margin: 0, fontSize: '15px' }}>Monthly Budget Configuration</h3>
          </div>

          <form onSubmit={handleSaveBudget} style={styles.budgetForm}>
            <div style={styles.inputWrapper}>
              <span style={styles.currencyPrefix}>RM</span>
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                style={styles.budgetInput}
                placeholder="Set budget threshold..."
                min="1"
                required
              />
            </div>
            <button type="submit" style={styles.saveBudgetBtn}>
              Save Target
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>
            <span>Active Limit: RM {budgetLimit.toFixed(2)}</span>
            <span>Billing cycle: 30 days</span>
          </div>
        </div>

        {/* System sync status */}
        <div className="card-premium" style={{ ...styles.widget, padding: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', marginBottom: '16px' }}>System Diagnostics</h3>
          
          <div style={styles.statusRow}>
            <div style={styles.statusLabelContainer}>
              <Radio size={14} color="var(--text-secondary)" />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Gateway Sync:</span>
            </div>
            <span className={`badge ${
              socketStatus === 'Connected' 
                ? 'badge-active' 
                : socketStatus === 'Connecting...' 
                  ? 'badge-error' 
                  : 'badge-offline'
            }`} style={{ fontSize: '10px' }}>
              {socketStatus}
            </span>
          </div>

          <div style={styles.statusRow}>
            <div style={styles.statusLabelContainer}>
              <Database size={14} color="var(--text-secondary)" />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Offline Cache:</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600 }}>
              {telemetryCount} packets
            </span>
          </div>

          {telemetryCount > 0 && (
            <button onClick={clearLocalDB} style={styles.clearBtn}>
              Clear Cache Registry
            </button>
          )}
        </div>

        {/* Telemetry Stream Display - Ranked in order of draw */}
        <div className="glass-panel" style={{ ...styles.widget, padding: '24px' }}>
          <div style={styles.widgetHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={20} color="var(--accent-blue)" />
              <h3 style={{ margin: 0, fontSize: '18px' }}>Active Appliance Rankings</h3>
            </div>
            <span style={styles.updateFreq}>Sorted by draw</span>
          </div>

          <div style={styles.deviceList}>
            {sortedDevices.length === 0 ? (
              <div style={styles.fallback}>
                <Zap size={32} color="var(--accent-amber)" style={{ marginBottom: '12px' }} />
                <p>No active telemetry packets received yet.</p>
                <p style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-muted)' }}>
                  Awaiting node simulator start (`npm run dev:simulator`)...
                </p>
              </div>
            ) : (
              sortedDevices.map((dev, index) => {
                // PDPA Rule: Gated private loads
                const isConsentRestricted = !consentGranted && dev.deviceId !== 'device-light-01' && dev.deviceId !== 'device-anomaly-timer';
                
                return (
                  <div key={dev.deviceId} style={styles.deviceRow}>
                    <div style={styles.deviceLeft}>
                      <div style={styles.rankBadge}>
                        #{index + 1}
                      </div>
                      <div style={{
                        ...styles.dotIndicator,
                        background: dev.status === 'Active' ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                      }} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={styles.deviceName}>{dev.deviceName}</span>
                          {!isConsentRestricted && (
                            <button 
                              onClick={() => setCorrectionDevice(dev)} 
                              style={styles.editNameBtn}
                              title="Correct appliance classification"
                            >
                              <Edit2 size={10} />
                            </button>
                          )}
                        </div>
                        <div style={styles.deviceId}>ID: {dev.deviceId}</div>
                      </div>
                    </div>

                    {isConsentRestricted ? (
                      <div style={styles.restrictedLabel}>
                        <Lock size={12} style={{ marginRight: '4px' }} />
                        <span>Consent Gated (PDPA)</span>
                      </div>
                    ) : (
                      <div style={styles.deviceRight}>
                        <div style={styles.loadVal}>{dev.loadKw} <span style={styles.unit}>kW</span></div>
                        <div style={styles.voltageVal}>{dev.voltage} V</div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PDPA Consent Flow */}
        <ConsentFlow 
          userId={user.id} 
          initialConsent={consentGranted} 
          onConsentUpdated={handleConsentUpdated} 
        />
      </div>

      {/* Appliance Name Override Modal */}
      {correctionDevice && (
        <ApplianceCorrectionModal
          device={correctionDevice}
          onClose={() => setCorrectionDevice(null)}
          onSave={handleSaveOverride}
        />
      )}
    </div>
  );
};

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '24px',
    alignItems: 'stretch',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  widget: {
    padding: '24px',
  },
  widgetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  rangeTabs: {
    display: 'flex',
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid var(--border-color)',
    padding: '2px',
    borderRadius: '8px',
  },
  tabBtn: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  loaderContainer: {
    height: '220px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.15)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  statusLabelContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  clearBtn: {
    width: '100%',
    background: 'transparent',
    border: '1px dashed var(--border-color)',
    color: 'var(--text-secondary)',
    padding: '6px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '11px',
    marginTop: '6px',
    transition: 'all 0.2s ease',
  },
  costIconContainer: {
    border: '1px solid',
    padding: '14px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  costAmount: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#fff',
    marginTop: '4px',
  },
  costSub: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  warningBanner: {
    display: 'flex',
    gap: '10px',
    background: 'rgba(244, 63, 94, 0.08)',
    border: '1px solid rgba(244, 63, 94, 0.2)',
    borderRadius: '10px',
    padding: '12px',
    alignItems: 'flex-start',
  },
  budgetForm: {
    display: 'flex',
    gap: '10px',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '0 12px',
    flexGrow: 1,
  },
  currencyPrefix: {
    color: 'var(--text-muted)',
    fontSize: '13px',
    fontWeight: 600,
    marginRight: '6px',
  },
  budgetInput: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    padding: '10px 0',
  },
  saveBudgetBtn: {
    background: 'rgba(245, 158, 11, 0.12)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    color: 'var(--accent-amber)',
    padding: '0 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  updateFreq: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  deviceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  deviceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    background: 'rgba(0,0,0,0.15)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
  },
  deviceLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  rankBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--accent-cyan)',
    background: 'rgba(6, 182, 212, 0.1)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    padding: '2px 6px',
    borderRadius: '6px',
    minWidth: '24px',
    textAlign: 'center',
  },
  dotIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  deviceName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
  },
  editNameBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    ':hover': {
      color: 'var(--accent-cyan)',
      background: 'rgba(255,255,255,0.05)'
    }
  },
  deviceId: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  restrictedLabel: {
    fontSize: '12px',
    color: 'var(--accent-rose)',
    fontWeight: 600,
    background: 'rgba(244, 63, 94, 0.08)',
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(244, 63, 94, 0.15)',
    display: 'flex',
    alignItems: 'center',
  },
  deviceRight: {
    textAlign: 'right',
  },
  loadVal: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--accent-cyan)',
  },
  unit: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  voltageVal: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  fallback: {
    padding: '40px 20px',
    textAlign: 'center',
    background: 'rgba(0,0,0,0.1)',
    border: '1px dashed var(--border-color)',
    borderRadius: '12px',
  },
  consoleContainer: {
    background: 'rgba(5, 5, 8, 0.75)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '16px',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    maxHeight: '220px',
    overflowY: 'auto',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  consoleLogLine: {
    display: 'flex',
    gap: '8px',
  },
  logTimestamp: {
    color: 'var(--text-muted)',
  },
  logDevice: {
    color: 'var(--accent-blue)',
    fontWeight: 500,
  },
  logValue: {
    color: '#e5e7eb',
  },
  recommendationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  tipCard: {
    background: 'rgba(0, 0, 0, 0.15)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '16px',
  },
  tipHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  tipTargetBadge: {
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--accent-blue)',
    textTransform: 'uppercase',
    background: 'rgba(59, 130, 246, 0.08)',
    border: '1px solid rgba(59, 130, 246, 0.15)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  tipSavingsVal: {
    fontSize: '11px',
    color: 'var(--accent-emerald)',
    fontWeight: 700,
  },
  tipText: {
    fontSize: '12px',
    lineHeight: '1.5',
    color: 'var(--text-secondary)',
    margin: 0,
  },
};
