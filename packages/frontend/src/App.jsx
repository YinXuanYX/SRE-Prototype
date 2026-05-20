import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import { Login } from './components/Login';
import { DashboardShell } from './components/DashboardShell';
import { db } from './db/indexedDB';

function App() {
  const [token, setToken] = useState(localStorage.getItem('sre_token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('sre_user') || 'null'));
  const [socketStatus, setSocketStatus] = useState('Disconnected');
  const [recentTelemetry, setRecentTelemetry] = useState({});
  const [liveLogs, setLiveLogs] = useState([]);
  
  const wsRef = useRef(null);

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

  return (
    <ThemeProvider>
      {(!token || !user) ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <DashboardShell
          user={user}
          onLogout={handleLogout}
          recentTelemetry={recentTelemetry}
          liveLogs={liveLogs}
          socketStatus={socketStatus}
        />
      )}
    </ThemeProvider>
  );
}

export default App;
