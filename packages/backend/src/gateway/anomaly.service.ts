import { Injectable, Logger } from '@nestjs/common';

export interface AnomalyAlert {
  id: string;
  deviceId: string;
  deviceName: string;
  zone: string;
  type: 'sustained_load' | 'over_current' | 'offline_timeout' | 'voltage_anomaly';
  severity: 'Critical' | 'High' | 'Medium';
  title: string;
  value: number;
  threshold: number;
  timestamp: string;
}

@Injectable()
export class AnomalyDetectorService {
  private readonly logger = new Logger(AnomalyDetectorService.name);

  // Rolling window: stores last N readings per device for sustained load analysis
  private deviceHistory: Map<string, { loadKw: number; voltage: number; timestamp: string }[]> = new Map();
  
  // Track last-seen timestamps for offline heartbeat detection
  private lastSeen: Map<string, number> = new Map();

  // Tracks the last alert trigger timestamp for throttling
  // Key: `${deviceId}:${alertType}`
  private lastAlertTrigger: Map<string, number> = new Map();
  private readonly ALERT_COOLDOWN_MS = 60_000; // 60 seconds cooldown to prevent duplication spam

  // Anomaly detection thresholds
  private readonly SUSTAINED_LOAD_THRESHOLD_KW = 3.5;     // kW: flag if sustained above this
  private readonly SUSTAINED_LOAD_WINDOW = 5;              // readings: must exceed threshold for N consecutive readings
  private readonly OVER_CURRENT_SPIKE_KW = 5.0;            // kW: instant flag if single reading exceeds
  private readonly VOLTAGE_LOW_THRESHOLD = 210;             // V: flag if voltage drops below
  private readonly VOLTAGE_HIGH_THRESHOLD = 260;            // V: flag if voltage spikes above
  private readonly OFFLINE_TIMEOUT_MS = 30_000;             // ms: flag if no reading in 30 seconds

  // Auto-incrementing alert counter
  private alertCounter = 100;

  // Zone mapping for demo devices (simulates sub-metering configuration)
  private readonly deviceZoneMap: Record<string, string> = {
    'device-aircon-01': 'Zone A - Room 201',
    'device-fridge-01': 'Zone A - Room 201',
    'device-pump-01': 'Zone B - Corridor',
    'device-light-01': 'Ground Lobby',
    'device-anomaly-timer': 'Ground Lobby',
  };

  private shouldAlert(deviceId: string, type: string): boolean {
    const key = `${deviceId}:${type}`;
    const now = Date.now();
    const lastTime = this.lastAlertTrigger.get(key) || 0;
    if (now - lastTime < this.ALERT_COOLDOWN_MS) {
      return false;
    }
    this.lastAlertTrigger.set(key, now);
    return true;
  }

  /**
   * Evaluate a single telemetry reading for anomalies.
   * Returns an array of alerts (0 or more) detected for this reading.
   */
  evaluate(payload: {
    deviceId: string;
    deviceName: string;
    status: string;
    timestamp: string;
    loadKw: number;
    voltage: number;
  }): AnomalyAlert[] {
    const alerts: AnomalyAlert[] = [];
    const { deviceId, deviceName, status, timestamp, loadKw, voltage } = payload;
    const zone = this.deviceZoneMap[deviceId] || 'Unknown Zone';

    // Update last-seen tracker
    this.lastSeen.set(deviceId, Date.now());

    // Skip analysis for offline/error devices
    if (status !== 'Active') return alerts;

    // Push reading into rolling window
    if (!this.deviceHistory.has(deviceId)) {
      this.deviceHistory.set(deviceId, []);
    }
    const history = this.deviceHistory.get(deviceId)!;
    history.push({ loadKw, voltage, timestamp });
    
    // Keep window size bounded
    if (history.length > 20) {
      history.shift();
    }

    // --- Check 1: Instant Over-Current Spike ---
    if (loadKw >= this.OVER_CURRENT_SPIKE_KW && this.shouldAlert(deviceId, 'over_current')) {
      this.alertCounter++;
      alerts.push({
        id: `AL-${this.alertCounter}`,
        deviceId,
        deviceName,
        zone,
        type: 'over_current',
        severity: 'Critical',
        title: `Peak Over-Current Detected on ${deviceName}`,
        value: loadKw,
        threshold: this.OVER_CURRENT_SPIKE_KW,
        timestamp,
      });
    }

    // --- Check 2: Sustained Heavy Load ---
    if (history.length >= this.SUSTAINED_LOAD_WINDOW) {
      const recentWindow = history.slice(-this.SUSTAINED_LOAD_WINDOW);
      const allAbove = recentWindow.every(r => r.loadKw >= this.SUSTAINED_LOAD_THRESHOLD_KW);
      if (allAbove && this.shouldAlert(deviceId, 'sustained_load')) {
        this.alertCounter++;
        const avgLoad = recentWindow.reduce((s, r) => s + r.loadKw, 0) / recentWindow.length;
        alerts.push({
          id: `AL-${this.alertCounter}`,
          deviceId,
          deviceName,
          zone,
          type: 'sustained_load',
          severity: 'High',
          title: `Sustained Heavy Draw on ${deviceName} (Avg ${avgLoad.toFixed(2)} kW)`,
          value: avgLoad,
          threshold: this.SUSTAINED_LOAD_THRESHOLD_KW,
          timestamp,
        });
      }
    }

    // --- Check 3: Voltage Anomaly ---
    if ((voltage < this.VOLTAGE_LOW_THRESHOLD || voltage > this.VOLTAGE_HIGH_THRESHOLD) && this.shouldAlert(deviceId, 'voltage_anomaly')) {
      this.alertCounter++;
      alerts.push({
        id: `AL-${this.alertCounter}`,
        deviceId,
        deviceName,
        zone,
        type: 'voltage_anomaly',
        severity: 'Medium',
        title: `Voltage Deviation on ${deviceName} (${voltage}V)`,
        value: voltage,
        threshold: voltage < this.VOLTAGE_LOW_THRESHOLD ? this.VOLTAGE_LOW_THRESHOLD : this.VOLTAGE_HIGH_THRESHOLD,
        timestamp,
      });
    }

    if (alerts.length > 0) {
      this.logger.warn(`[AnomalyDetector] ${alerts.length} anomal(y/ies) flagged for ${deviceId}`);
    }

    return alerts;
  }

  /**
   * Check all known devices for offline heartbeat timeouts.
   * Call this periodically (e.g. every 10 seconds).
   */
  checkOfflineDevices(): AnomalyAlert[] {
    const alerts: AnomalyAlert[] = [];
    const now = Date.now();

    this.lastSeen.forEach((lastTime, deviceId) => {
      if (now - lastTime > this.OFFLINE_TIMEOUT_MS) {
        this.alertCounter++;
        const zone = this.deviceZoneMap[deviceId] || 'Unknown Zone';
        alerts.push({
          id: `AL-${this.alertCounter}`,
          deviceId,
          deviceName: deviceId,
          zone,
          type: 'offline_timeout',
          severity: 'Medium',
          title: `Node Heartbeat Timeout: ${deviceId}`,
          value: Math.round((now - lastTime) / 1000),
          threshold: this.OFFLINE_TIMEOUT_MS / 1000,
          timestamp: new Date().toISOString(),
        });
        // Reset to avoid spamming
        this.lastSeen.set(deviceId, now);
      }
    });

    return alerts;
  }
}
