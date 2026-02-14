import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WebhookRepository } from './webhook.repository';
import { WebhookDeliveryService } from './webhook-delivery.service';

@Module({
  controllers: [WebhookController],
  providers: [WebhookService, WebhookRepository, WebhookDeliveryService],
  exports: [WebhookDeliveryService],
})
export class WebhookModule {}
