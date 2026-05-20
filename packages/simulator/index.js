const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const CONFIG_PATH = path.join(__dirname, 'devices.json');
const BACKEND_WS_URL = process.env.BACKEND_WS_URL || 'ws://localhost:3000/telemetry';
const SEND_INTERVAL_MS = 2000; // 2 seconds telemetry frequency

let devices = [];
let ws = null;
let reconnectTimer = null;

// Load and watch the configuration file
function loadConfig() {
  try {
    const data = fs.readFileSync(CONFIG_PATH, 'utf8');
    devices = JSON.parse(data);
    console.log(`[Simulator] Loaded ${devices.length} devices from configuration.`);
  } catch (error) {
    console.error(`[Simulator] Error loading devices.json:`, error.message);
  }
}

// Watch configuration file for manual user triggers
fs.watch(CONFIG_PATH, (eventType) => {
  if (eventType === 'change') {
    console.log('[Simulator] Configuration file change detected. Reloading...');
    loadConfig();
  }
});

// Load config initially
loadConfig();

// Establish WebSocket Connection with automatic reconnection
function connect() {
  console.log(`[Simulator] Connecting to backend at ${BACKEND_WS_URL}...`);
  ws = new WebSocket(BACKEND_WS_URL);

  ws.on('open', () => {
    console.log('[Simulator] Connected to WebSocket gateway.');
    if (reconnectTimer) {
      clearInterval(reconnectTimer);
      reconnectTimer = null;
    }
  });

  ws.on('close', () => {
    console.log('[Simulator] Connection closed. Retrying connection in 5 seconds...');
    scheduleReconnect();
  });

  ws.on('error', (err) => {
    console.error('[Simulator] WebSocket error:', err.message);
    ws.close();
  });
}

function scheduleReconnect() {
  if (!reconnectTimer) {
    reconnectTimer = setInterval(connect, 5000);
  }
}

// Start connection process
connect();

// Telemetry loop
setInterval(() => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  const now = new Date();
  const timestamp = now.toISOString();

  devices.forEach((device) => {
    let loadKw = 0;

    if (device.status === 'Active') {
      // Calculate a time-based cyclic sine wave for dynamic load simulation
      const timeSec = now.getTime() / 1000;
      const cyclePeriodSec = device.cycleMinutes * 60;
      const cyclePhase = (2 * Math.PI * timeSec) / cyclePeriodSec;
      
      // Calculate base load + sine wave variance + small random noise
      const base = device.baseLoadKw;
      const variance = device.varianceKw * Math.sin(cyclePhase);
      const noise = (Math.random() - 0.5) * 0.05 * device.baseLoadKw;
      
      loadKw = Math.max(0, base + variance + noise);
    } else if (device.status === 'Error') {
      // Simulate erratic behavior or zero load depending on error definition
      loadKw = Math.random() > 0.5 ? device.baseLoadKw * 2 : 0;
    } else {
      // Offline status - send no telemetry or status update depending on requirements
      // The PRD states: "If a mock configuration file triggers a simulated device failure, the system must send an explicit offline notification."
      // Let's send a status packet mapping this.
    }

    const payload = {
      deviceId: device.id,
      deviceName: device.name,
      status: device.status,
      timestamp,
      loadKw: Number(loadKw.toFixed(4)),
      voltage: device.status === 'Active' ? Number((230 + (Math.random() - 0.5) * 5).toFixed(1)) : 0
    };

    ws.send(JSON.stringify({ event: 'telemetry', data: payload }));
  });

  console.log(`[Simulator] Dispatched telemetry packets at ${now.toLocaleTimeString()}`);
}, SEND_INTERVAL_MS);
