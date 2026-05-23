import { useState } from 'react';
import { 
  Download, 
  FileText, 
  CheckCircle, 
  Loader2 
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';

export const ReportsExporter = ({ recentTelemetry }) => {
  const [exporting, setExporting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('May');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [reportFormat, setReportFormat] = useState('PDF');

  const activeDevices = Object.values(recentTelemetry || {});
  const liveLoadKw = activeDevices.filter(d => d.status === 'Active').reduce((acc, d) => acc + d.loadKw, 0);

  const properties = [
    { id: 'PROP-01', name: 'Mont Kiara Residencies', load: '142.6 kW', activeMeters: 45, alarms: 0 },
    { id: 'PROP-02', name: 'Bangsar Heights Suites', load: `${liveLoadKw.toFixed(1)} kW`, activeMeters: activeDevices.length, alarms: 0 },
    { id: 'PROP-03', name: 'Damansara Heights Tower', load: '210.8 kW', activeMeters: 68, alarms: 0 },
    { id: 'PROP-04', name: 'Penang Gurney Marina', load: '0.0 kW', activeMeters: 0, alarms: 1 },
  ];

  const handleExport = () => {
    setExporting(true);
    setToastMsg('');
    setTimeout(() => {
      const activeProps = properties.filter(p => 
        selectedProperty === 'All' || p.id === selectedProperty
      );
      
      if (reportFormat === 'CSV') {
        let csv = 'Property ID,Property Name,Active Meters,Average Load,Alarms,Billing Period,Projected Cost (RM)\n';
        activeProps.forEach(p => {
          const rawLoad = parseFloat(p.load) || 0;
          const rawCost = (rawLoad * 30 * 8 * 0.35).toFixed(2);
          csv += `"${p.id}","${p.name}",${p.activeMeters},"${p.load}",${p.alarms},"${selectedMonth} ${selectedYear}",RM ${rawCost}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `SRE_Report_${selectedMonth}_${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setToastMsg(`✓ CSV report downloaded successfully.`);
      } else {
        setToastMsg(`✓ PDF report generation simulated (prototype mode).`);
      }
      setExporting(false);
      setTimeout(() => setToastMsg(''), 6000);
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <PageHeader 
        title="Reports & Exports" 
        subtitle="Compile and export aggregated sub-metering datasets and tenant billing summaries."
        breadcrumb={['Command Center', 'Reports']}
      />

      <section className="surface-card animate-in" style={{ padding: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
          <Download size={18} color="var(--accent-cyan)" />
          <h3 style={{ margin: 0, fontSize: '16px' }}>Accounting Export Utility</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            <label style={labelStyle}>Select Target Property</label>
            <select value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)} style={selectStyle}>
              <option value="All">All Portfolio Properties</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            <label style={labelStyle}>Billing Cycle Month</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={selectStyle}>
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            <label style={labelStyle}>Billing Cycle Year</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={selectStyle}>
              {['2026','2025','2024'].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            <label style={labelStyle}>File Format</label>
            <select value={reportFormat} onChange={(e) => setReportFormat(e.target.value)} style={selectStyle}>
              <option value="PDF">PDF Document</option>
              <option value="CSV">CSV Data Sheet</option>
            </select>
          </div>
        </div>

        <button onClick={handleExport} disabled={exporting} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
          {exporting ? (
            <><Loader2 size={16} className="spin" style={{ marginRight: 'var(--space-sm)' }} /><span>Compiling streams...</span></>
          ) : (
            <><FileText size={16} style={{ marginRight: 'var(--space-sm)' }} /><span>Generate Billing Report</span></>
          )}
        </button>

        {toastMsg && (
          <div style={{ marginTop: 'var(--space-md)', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-sm) var(--space-md)', fontSize: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <CheckCircle size={14} color="var(--accent-emerald)" />
            <span>{toastMsg}</span>
          </div>
        )}
      </section>
    </div>
  );
};

const labelStyle = { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 };
const selectStyle = {
  background: 'var(--bg-input)', border: '1px solid var(--border-primary)',
  borderRadius: 'var(--radius-md)', padding: 'var(--space-sm) var(--space-md)',
  color: 'var(--text-primary)', outline: 'none', fontSize: '13px',
  fontFamily: 'var(--font-sans)', cursor: 'pointer',
};
