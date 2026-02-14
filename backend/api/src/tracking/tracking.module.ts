import { Module } from '@nestjs/common';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { TrackingRepository } from './tracking.repository';
import { PaymentModule } from '../payment/payment.module';
import { WebhookModule } from '../webhook/webhook.module';

@Module({
  imports: [PaymentModule, WebhookModule],
  controllers: [TrackingController],
  providers: [TrackingService, TrackingRepository],
  exports: [TrackingService],
})
export class TrackingModule {}
