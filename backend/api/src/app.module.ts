import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { TrackingModule } from './tracking/tracking.module';
import { PaymentModule } from './payment/payment.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { AssignmentModule } from './assignment/assignment.module';
import { ShipmentModule } from './shipment/shipment.module';
import { PublicTrackingModule } from './public-tracking/public-tracking.module';
import { AdminMetricsModule } from './admin-metrics/admin-metrics.module';
import { WebhookModule } from './webhook/webhook.module';
import { ObservabilityModule } from './observability/observability.module';
import { LoggingInterceptor } from './observability/logging.interceptor';
@Module({
  imports: [
    ObservabilityModule,
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    TrackingModule,
    PaymentModule,
    VehicleModule,
    AssignmentModule,
    ShipmentModule,
    PublicTrackingModule,
    AdminMetricsModule,
    WebhookModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
