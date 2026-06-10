import { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import { Login } from './components/Login';
import { ResidentLayout } from './layouts/ResidentLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import { SupportLayout } from './layouts/SupportLayout';
import { db } from './db/indexedDB';

function App() {
  const [token, setToken] = useState(localStorage.getItem('sre_token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('sre_user') || 'null'));
  const [socketStatus, setSocketStatus] = useState('Disconnected');
  const [recentTelemetry, setRecentTelemetry] = useState({});
  const [liveLogs, setLiveLogs] = useState([]);
  
  // Dev-mode role override (for testing via Settings)
  const [roleOverride, setRoleOverride] = useState(null);
  
  const wsRef = useRef(null);

  // WebSocket Telemetry Connection
  useEffect(() => {
    if (!token) return;

    console.log('[App] Initializing Telemetry WebSocket connection...');
    Promise.resolve().then(() => setSocketStatus('Connecting...'));
    
    const host = window.location.hostname || 'localhost';
    const socket = new WebSocket(`ws://${host}:3000/telemetry`);
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
    setRoleOverride(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('sre_token');
    localStorage.removeItem('sre_user');
    setToken(null);
    setUser(null);
    setRecentTelemetry({});
    setLiveLogs([]);
    setRoleOverride(null);
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const handleRoleSwitch = async (newRole) => {
    setRoleOverride(newRole);
    try {
      const response = await fetch('http://localhost:3000/api/auth/sso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          displayName: user.displayName,
          role: newRole,
          provider: 'Developer Switcher',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[App] Session token updated for role:', newRole);
        localStorage.setItem('sre_token', data.accessToken);
        localStorage.setItem('sre_user', JSON.stringify(data.user));
        setToken(data.accessToken);
        setUser(data.user);
        setRoleOverride(null); // Clear temporary override as user role is now synchronized
      }
    } catch (err) {
      console.error('[App] Failed to update backend token for role switch:', err);
    }
  };

  const activeRole = roleOverride || (user ? user.role : 'Resident');

  const renderLayout = () => {
    const commonProps = {
      user,
      onLogout: handleLogout,
      recentTelemetry,
      liveLogs,
      socketStatus,
      onRoleSwitch: handleRoleSwitch,
    };

    switch (activeRole) {
      case 'Resident':
        return <ResidentLayout {...commonProps} />;
      case 'Admin':
        return <AdminLayout {...commonProps} />;
      case 'Super Admin':
        return <SuperAdminLayout {...commonProps} />;
      case 'Support':
        return <SupportLayout {...commonProps} />;
      default:
        return <ResidentLayout {...commonProps} />;
    }
  };

  return (
    <ThemeProvider>
      {(!token || !user) ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        renderLayout()
      )}
    </ThemeProvider>
  );
}

export default App;
