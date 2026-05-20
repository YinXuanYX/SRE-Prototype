import { Module } from '@nestjs/common';
import { TelemetryGateway } from './telemetry.gateway';
import { TelemetryController } from './telemetry.controller';
import { ZonesController } from './zones.controller';
import { AnomalyDetectorService } from './anomaly.service';

@Module({
  controllers: [TelemetryController, ZonesController],
  providers: [TelemetryGateway, AnomalyDetectorService],
  exports: [TelemetryGateway, AnomalyDetectorService],
})
export class GatewayModule {}
