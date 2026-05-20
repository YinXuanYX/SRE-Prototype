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

@WebSocketGateway({
  path: '/telemetry',
})
export class TelemetryGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TelemetryGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly db: DatabaseService) {}

  afterInit(server: Server) {
    this.logger.log('Telemetry WebSocket Gateway initialized.');
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
      // Note: TimescaleDB handles hypertable insertion using normal INSERT statement.
      await this.db.query(
        `INSERT INTO energy_telemetry (timestamp, device_id, device_name, status, load_kw, voltage)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [timestamp, deviceId, deviceName, status, loadKw, voltage]
      );

      // Broadcast to other clients (e.g. frontend client dashboards)
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
    } catch (error: any) {
      this.logger.error(`Failed to ingest telemetry for device ${deviceId}: ${error.message}`);
    }
  }
}
