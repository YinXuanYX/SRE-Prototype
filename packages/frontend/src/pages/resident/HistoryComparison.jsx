import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { db } from '../../db/indexedDB';

export const HistoryComparison = () => {
  const [compareDate, setCompareDate] = useState('');
  const [compareResult, setCompareResult] = useState(null);
  const [compareError, setCompareError] = useState('');

  const calculateTnbCost = (kwh) => {
    let remaining = kwh;
    let cost = 0;
    if (remaining > 600) { cost += (remaining - 600) * 0.546; remaining = 600; }
    if (remaining > 300) { cost += (remaining - 300) * 0.516; remaining = 300; }
    if (remaining > 200) { cost += (remaining - 200) * 0.334; remaining = 200; }
    cost += remaining * 0.218;
    return Number(cost.toFixed(2));
  };

  const handleCompare = async () => {
    if (!compareDate) {
      setCompareError('Please select a valid date.');
      setCompareResult(null);
      return;
    }
    
    setCompareError('');
    try {
      const cachedRecords = await db.telemetryCache.toArray();
      const matching = cachedRecords.filter(r => r.timestamp && r.timestamp.startsWith(compareDate));
      
      if (matching.length === 0) {
        setCompareError('No data available for selected period.');
        setCompareResult(null);
        return;
      }
      
      const avgKw = matching.reduce((sum, r) => sum + r.loadKw, 0) / matching.length;
      const calculatedKwh = Number((avgKw * 24).toFixed(2));
      
      setCompareResult({
        date: compareDate,
        kwh: calculatedKwh,
        cost: calculateTnbCost(calculatedKwh),
        avgKw: Number(avgKw.toFixed(2)),
        recordCount: matching.length
      });
    } catch (err) {
      console.error(err);
      setCompareError('Failed to retrieve historical telemetry records.');
    }
  };

  const handleSeedHistory = async () => {
    const now = new Date();
    const records = [];
    const devices = ['device-ac-01', 'device-fridge-01', 'device-light-01', 'device-pump-01'];
    
    for (let dayOffset = 0; dayOffset <= 3; dayOffset++) {
      const d = new Date();
      d.setDate(now.getDate() - dayOffset);
      const dateStr = d.toISOString().split('T')[0];
      
      for (let hour = 8; hour < 18; hour++) {
        devices.forEach(devId => {
          const timestamp = `${dateStr}T${hour.toString().padStart(2, '0')}:00:00.000Z`;
          records.push({
            deviceId: devId,
            deviceName: devId === 'device-ac-01' ? 'Air Conditioner' : devId === 'device-fridge-01' ? 'Smart Refrigerator' : devId === 'device-pump-01' ? 'Water Pump' : 'Study Light',
            status: 'Active',
            timestamp,
            loadKw: devId === 'device-ac-01' ? 1.5 + Math.random() : devId === 'device-fridge-01' ? 0.2 + Math.random()*0.1 : devId === 'device-pump-01' ? 0.8 + Math.random()*0.4 : 0.05,
            voltage: 230 + Math.round(Math.random() * 6 - 3)
          });
        });
      }
    }
    
    await db.telemetryCache.bulkAdd(records);
    alert('Successfully seeded mock historical records for the last 3 days! Try selecting yesterday\'s date in the picker.');
  };

  // Simple current billing estimate for comparison
  const currentForecast = { kwh: 375, cost: calculateTnbCost(375) };

  return (
    <div style={s.container}>
      <PageHeader 
        title="Usage History Comparison" 
        subtitle="Compare your current energy forecast against historical cached telemetry records."
        breadcrumb={['Resident Hub', 'Usage History']}
      />

      <div style={s.selectorPanel} className="surface-card">
        <h4 style={s.panelTitle}>Choose Historical Period</h4>
        <p style={s.panelDesc}>
          Select a calendar date to load the cached sub-meter telemetry load charts and compare total draw.
        </p>
        <div style={s.dateForm}>
          <input 
            type="date" 
            value={compareDate} 
            onChange={(e) => setCompareDate(e.target.value)} 
            style={s.datePicker}
          />
          <button onClick={handleCompare} className="btn-primary" style={s.compareBtn}>
            Compare Usage
          </button>
        </div>
        
        <button onClick={handleSeedHistory} style={s.seedBtn}>
          ⚡ Seed Mock Historical Data (For Testing)
        </button>
      </div>

      {compareError && (
        <div style={s.errorBanner} className="animate-in">
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>{compareError}</span>
        </div>
      )}

      {compareResult && (
        <div style={s.grid} className="animate-in">
          <div className="surface-card" style={{ ...s.card, borderLeft: '3px solid var(--accent-blue)' }}>
            <span style={s.cardLabel}>CURRENT FORECAST</span>
            <h3 style={s.cardVal}>RM {currentForecast.cost}</h3>
            <span style={s.cardSub}>{currentForecast.kwh} kWh (Monthly Projected)</span>
          </div>
          
          <div className="surface-card" style={{ ...s.card, borderLeft: '3px solid var(--accent-emerald)' }}>
            <span style={s.cardLabel}>HISTORICAL DRAW ({compareResult.date})</span>
            <h3 style={s.cardVal}>RM {compareResult.cost}</h3>
            <span style={s.cardSub}>{compareResult.kwh} kWh (Total Daily Raw)</span>
          </div>

          <div className="surface-card" style={{ ...s.card, gridColumn: 'span 2', borderLeft: '3px solid var(--accent-cyan)' }}>
            <h4 style={s.panelTitle}>Variance Insights</h4>
            <p style={{ margin: 'var(--space-xs) 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Your projected monthly energy cost is {currentForecast.cost > (compareResult.cost * 30) ? 'higher' : 'lower'} than the historical draw scaled to a 30-day billing cycle (RM {(compareResult.cost * 30).toFixed(2)}).
            </p>
            <div style={s.pills}>
              <div style={s.pill}>
                <span style={s.pillLabel}>Daily Avg Draw</span>
                <span style={s.pillVal}>{compareResult.avgKw} kW</span>
              </div>
              <div style={s.pill}>
                <span style={s.pillLabel}>Sample Packets</span>
                <span style={s.pillVal}>{compareResult.recordCount} records</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' },
  selectorPanel: { padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' },
  panelTitle: { margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' },
  panelDesc: { margin: 0, fontSize: '12px', color: 'var(--text-secondary)' },
  dateForm: { display: 'flex', gap: 'var(--space-sm)' },
  datePicker: {
    background: 'var(--bg-input)', border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    padding: '8px 12px', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none',
  },
  compareBtn: { padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
  seedBtn: {
    background: 'transparent', border: '1px dashed var(--border-primary)',
    color: 'var(--text-muted)', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', fontSize: '11px', alignSelf: 'flex-start', fontFamily: 'var(--font-sans)',
  },
  errorBanner: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)',
    borderRadius: 'var(--radius-md)', padding: '12px var(--space-md)',
    color: 'var(--accent-rose)', fontSize: '12px', fontWeight: 600,
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' },
  card: { padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: '4px' },
  cardLabel: { fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em' },
  cardVal: { margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' },
  cardSub: { fontSize: '11px', color: 'var(--text-secondary)' },
  pills: { display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' },
  pill: {
    background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)', padding: '6px 12px',
    display: 'flex', flexDirection: 'column', gap: '2px',
  },
  pillLabel: { fontSize: '9px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase' },
  pillVal: { fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' },
};
