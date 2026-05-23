import Dexie, { type Table } from 'dexie';

export interface TelemetryRecord {
  id?: number;
  deviceId: string;
  deviceName: string;
  status: string;
  timestamp: string;
  loadKw: number;
  voltage: number;
}

export interface ConsentRecord {
  consentType: string; // e.g. 'appliance_breakdown'
  status: 'Granted' | 'Revoked';
  timestamp: string;
}

export interface ApplianceOverrideRecord {
  deviceId: string;
  correctedLabel: string;
  timestamp: string;
}

export interface AlertHistoryRecord {
  id?: number;
  timestamp: string;
  type: string;
  title: string;
  message: string;
}

class SreOfflineDatabase extends Dexie {
  telemetryCache!: Table<TelemetryRecord>;
  consentSettings!: Table<ConsentRecord>;
  applianceOverrides!: Table<ApplianceOverrideRecord>;
  alertHistory!: Table<AlertHistoryRecord>;

  constructor() {
    super('SreOfflineDatabase');
    this.version(3).stores({
      telemetryCache: '++id, deviceId, timestamp',
      consentSettings: 'consentType',
      applianceOverrides: 'deviceId',
      alertHistory: '++id, timestamp, type'
    });
  }
}

export const db = new SreOfflineDatabase();
