import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, WebSocket } from 'ws';
import { DatabaseService } from '../database/database.service';
import { AnomalyDetectorService } from './anomaly.service';

@WebSocketGateway({
  path: '/telemetry',
})
export class TelemetryGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TelemetryGateway.name);
  private offlineCheckInterval: NodeJS.Timeout | null = null;

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly db: DatabaseService,
    private readonly anomalyDetector: AnomalyDetectorService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Telemetry WebSocket Gateway initialized.');

    // Start periodic offline heartbeat checker (every 15 seconds)
    this.offlineCheckInterval = setInterval(() => {
      const offlineAlerts = this.anomalyDetector.checkOfflineDevices();
      offlineAlerts.forEach(alert => {
        this.broadcastToAll(JSON.stringify({
          event: 'anomaly_alert',
          data: alert,
        }));
        this.logger.warn(`[Offline Alert] ${alert.title}`);
      });
    }, 15_000);
  }

  handleConnection(client: WebSocket, ...args: any[]) {
    this.logger.log('Client connected to telemetry stream.');
  }

  handleDisconnect(client: WebSocket) {
    this.logger.log('Client disconnected from telemetry stream.');
  }

  @SubscribeMessage('telemetry')
  async handleTelemetry(client: WebSocket, payload: any): Promise<void> {
    // Process telemetry packet
    const { deviceId, deviceName, status, timestamp, loadKw, voltage } = payload;
    
    if (!deviceId || !timestamp) {
      this.logger.warn('Received malformed telemetry packet:', JSON.stringify(payload));
      return;
    }

    try {
      // Insert to TimescaleDB
      await this.db.query(
        `INSERT INTO energy_telemetry (timestamp, device_id, device_name, status, load_kw, voltage)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [timestamp, deviceId, deviceName, status, loadKw, voltage]
      );

      // Broadcast telemetry update to other clients
      const broadcastMessage = JSON.stringify({
        event: 'telemetry_update',
        data: {
          deviceId,
          deviceName,
          status,
          timestamp,
          loadKw,
          voltage
        }
      });

      if (this.server && this.server.clients) {
        this.server.clients.forEach((c: any) => {
          if (c !== client && c.readyState === WebSocket.OPEN) {
            c.send(broadcastMessage);
          }
        });
      }

      // --- Run Anomaly Detection ---
      const anomalies = this.anomalyDetector.evaluate({
        deviceId,
        deviceName,
        status,
        timestamp,
        loadKw,
        voltage,
      });

      // Broadcast each anomaly alert to ALL connected clients (including Admin dashboards)
      for (const alert of anomalies) {
        // Attempt to persist anomaly to database
        try {
          await this.db.query(
            `INSERT INTO anomaly_alerts (timestamp, alert_id, device_id, device_name, zone, type, severity, title, value, threshold)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [alert.timestamp, alert.id, alert.deviceId, alert.deviceName, alert.zone, alert.type, alert.severity, alert.title, alert.value, alert.threshold]
          );
        } catch (dbErr: any) {
          this.logger.debug(`[Anomaly persist fallback] ${dbErr.message}`);
        }

        const alertMessage = JSON.stringify({
          event: 'anomaly_alert',
          data: alert,
        });

        this.broadcastToAll(alertMessage);
        this.logger.warn(`[Anomaly Alert] ${alert.severity}: ${alert.title}`);
      }

    } catch (error: any) {
      this.logger.error(`Failed to ingest telemetry for device ${deviceId}: ${error.message}`);
    }
  }

  private broadcastToAll(message: string) {
    if (this.server && this.server.clients) {
      this.server.clients.forEach((c: any) => {
        if (c.readyState === WebSocket.OPEN) {
          c.send(message);
        }
      });
    }
  }
}
