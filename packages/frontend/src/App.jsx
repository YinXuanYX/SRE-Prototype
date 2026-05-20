import React, { useState, useEffect, useRef } from 'react';
import { Login } from './components/Login';
import { ConsentFlow } from './components/ConsentFlow';
import { db } from './db/indexedDB';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Zap, 
  Activity, 
  Database, 
  LogOut, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  Cpu, 
  Radio
} from 'lucide-react';

function App() {
  const [token, setToken] = useState(localStorage.getItem('sre_token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('sre_user') || 'null'));
  const [consentGranted, setConsentGranted] = useState(false);
  const [socketStatus, setSocketStatus] = useState('Disconnected');
  const [recentTelemetry, setRecentTelemetry] = useState({});
  const [liveLogs, setLiveLogs] = useState([]);
  
  const wsRef = useRef(null);

  // Live Query from Dexie.js for offline data cache analysis
  const telemetryCount = useLiveQuery(() => db.telemetryCache.count()) || 0;

  // Retrieve local consent configuration
  useEffect(() => {
    if (user) {
      db.consentSettings.get('appliance_breakdown').then((rec) => {
        if (rec) {
          setConsentGranted(rec.status === 'Granted');
        }
      });
    }
  }, [user]);

  // WebSocket Telemetry Connection
  useEffect(() => {
    if (!token) return;

    console.log('[App] Initializing Telemetry WebSocket connection...');
    setSocketStatus('Connecting...');
    
    // Connect to NestJS WebSocket Gateway (port 3000, path /telemetry)
    const socket = new WebSocket('ws://localhost:3000/telemetry');
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('[App] WebSocket Connection established.');
      setSocketStatus('Connected');
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'telemetry_update') {
          const record = payload.data;
          
          // Update local component state for live display
          setRecentTelemetry(prev => ({
            ...prev,
            [record.deviceId]: record
          }));

          // Append to visual terminal logs
          setLiveLogs(prev => [
            { id: Date.now() + Math.random(), ...record },
            ...prev.slice(0, 19) // Keep last 20 logs
          ]);

          // Persist to Dexie IndexedDB cache (Local offline capability)
          db.telemetryCache.add({
            deviceId: record.deviceId,
            deviceName: record.deviceName,
            status: record.status,
            timestamp: record.timestamp,
            loadKw: record.loadKw,
            voltage: record.voltage
          });
        }
      } catch (err) {
        console.error('[App] Error parsing WebSocket frame:', err);
      }
    };

    socket.onclose = () => {
      console.log('[App] WebSocket Connection closed.');
      setSocketStatus('Disconnected');
    };

    socket.onerror = (err) => {
      console.error('[App] WebSocket error occurred:', err);
      setSocketStatus('Error');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token]);

  const handleLoginSuccess = (newToken, newUser) => {
    localStorage.setItem('sre_token', newToken);
    localStorage.setItem('sre_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('sre_token');
    localStorage.removeItem('sre_user');
    setToken(null);
    setUser(null);
    setRecentTelemetry({});
    setLiveLogs([]);
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const handleConsentUpdated = async (status) => {
    setConsentGranted(status);
    await db.consentSettings.put({
      consentType: 'appliance_breakdown',
      status: status ? 'Granted' : 'Revoked',
      timestamp: new Date().toISOString()
    });
  };

  const clearLocalDB = async () => {
    await db.telemetryCache.clear();
  };

  if (!token || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={styles.appContainer}>
      {/* Navigation Header */}
      <header style={styles.navbar} className="glass-panel">
        <div style={styles.brand}>
          <Zap size={20} color="var(--accent-cyan)" />
          <span style={styles.brandText}>SRE PROTO-PLATFORM</span>
        </div>

        <div style={styles.userInfo}>
          <div style={styles.userBadge}>
            <User size={14} style={{ marginRight: '6px' }} />
            <span>{user.displayName}</span>
            <span style={styles.roleLabel}>{user.role}</span>
          </div>
          
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Grid View */}
      <main style={styles.mainGrid}>
        
        {/* Left Side: Diagnostics and Consent Controls */}
        <section style={styles.leftCol}>
          
          {/* Connection Status widget */}
          <div className="card-premium" style={styles.widget}>
            <h3 style={styles.widgetTitle}>System Synchronization</h3>
            
            <div style={styles.statusRow}>
              <div style={styles.statusLabelContainer}>
                <Radio size={16} color="var(--text-secondary)" />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Gateway Sync:</span>
              </div>
              <span className={`badge ${
                socketStatus === 'Connected' 
                  ? 'badge-active' 
                  : socketStatus === 'Connecting...' 
                    ? 'badge-error' 
                    : 'badge-offline'
              }`}>
                {socketStatus}
              </span>
            </div>

            <div style={styles.statusRow}>
              <div style={styles.statusLabelContainer}>
                <Database size={16} color="var(--text-secondary)" />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Offline IndexedDB Cache:</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>
                {telemetryCount} packets
              </span>
            </div>

            {telemetryCount > 0 && (
              <button onClick={clearLocalDB} style={styles.clearBtn}>
                Clear Cache Database
              </button>
            )}
          </div>

          {/* Privacy Consent Management component */}
          <ConsentFlow 
            userId={user.id} 
            initialConsent={consentGranted} 
            onConsentUpdated={handleConsentUpdated} 
          />
        </section>

        {/* Right Side: Telemetry Live Charts and Packets */}
        <section style={styles.rightCol}>
          
          {/* Telemetry Active Devices */}
          <div className="glass-panel" style={{ ...styles.widget, padding: '24px' }}>
            <div style={styles.widgetHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={20} color="var(--accent-blue)" />
                <h3 style={{ margin: 0, fontSize: '18px' }}>Active Local Telemetry Stream</h3>
              </div>
              <span style={styles.updateFreq}>Refreshes every 2s</span>
            </div>

            <div style={styles.deviceList}>
              {Object.keys(recentTelemetry).length === 0 ? (
                <div style={styles.fallback}>
                  <AlertTriangle size={32} color="var(--accent-amber)" style={{ marginBottom: '12px' }} />
                  <p>No active telemetry packets received yet.</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>Please ensure the mock telemetry simulator is running (`npm run dev:simulator`).</p>
                </div>
              ) : (
                Object.values(recentTelemetry).map((dev) => {
                  const isConsentRestricted = !consentGranted && dev.deviceId !== 'device-light-01' && dev.deviceId !== 'device-anomaly-timer';
                  
                  return (
                    <div key={dev.deviceId} style={styles.deviceRow}>
                      <div style={styles.deviceLeft}>
                        <div style={{
                          ...styles.dotIndicator,
                          background: dev.status === 'Active' ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                        }} />
                        <div>
                          <div style={styles.deviceName}>{dev.deviceName}</div>
                          <div style={styles.deviceId}>ID: {dev.deviceId}</div>
                        </div>
                      </div>

                      {/* Display Restricted state or Load */}
                      {isConsentRestricted ? (
                        <div style={styles.restrictedLabel}>
                          🔒 Consent Required (PDPA)
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

          {/* Telemetry Console Logs */}
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
                    <span style={styles.logDevice}>{log.deviceName}:</span>
                    <span style={styles.logValue}>
                      {log.status === 'Active' ? `${log.loadKw} kW @ ${log.voltage}V` : `STATUS: ${log.status}`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    padding: '24px',
    maxWidth: '1280px',
    width: '100%',
    margin: '0 auto',
  },
  navbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderRadius: '16px',
    marginBottom: '24px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  brandText: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '16px',
    letterSpacing: '0.05em',
    color: '#fff',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-color)',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 500,
  },
  roleLabel: {
    marginLeft: '8px',
    padding: '2px 6px',
    borderRadius: '4px',
    background: 'var(--accent-blue)',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'transparent',
    border: '1px solid rgba(244, 63, 94, 0.3)',
    color: 'var(--accent-rose)',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.2fr',
    gap: '24px',
    flexGrow: 1,
    alignItems: 'stretch',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
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
  widgetTitle: {
    fontSize: '18px',
    marginBottom: '20px',
    color: '#fff',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  statusLabelContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  clearBtn: {
    width: '100%',
    background: 'transparent',
    border: '1px dashed var(--border-color)',
    color: 'var(--text-secondary)',
    padding: '8px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    marginTop: '8px',
    transition: 'all 0.2s ease',
  },
  widgetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
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
  deviceId: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  restrictedLabel: {
    fontSize: '12px',
    color: 'var(--accent-rose)',
    fontWeight: 600,
    background: 'rgba(244, 63, 94, 0.08)',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid rgba(244, 63, 94, 0.15)',
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
    maxHeight: '260px',
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
};

export default App;
