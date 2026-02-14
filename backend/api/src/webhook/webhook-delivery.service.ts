import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import { WebhookRepository } from './webhook.repository';
import { PrismaService } from '../prisma/prisma.service';
import type { WebhookPayload } from './events/webhook.events';

const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 1000;

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

@Injectable()
export class WebhookDeliveryService {
  constructor(
    private readonly webhookRepository: WebhookRepository,
    private readonly prisma: PrismaService,
  ) {}

  async emit(shipperId: string, eventType: string, data: Record<string, unknown>) {
    const subscriptions = await this.webhookRepository.findEnabledByShipperId(
      shipperId,
    );
    if (subscriptions.length === 0) return;

    const payload: WebhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
    };
    const payloadStr = JSON.stringify(payload);

    for (const sub of subscriptions) {
      const delivery = await this.webhookRepository.createDelivery(
        sub.id,
        eventType,
        payloadStr,
      );
      setImmediate(() => this.deliver(delivery.id, sub.url, sub.secret, payloadStr, 0));
    }
  }

  private async deliver(
    deliveryId: string,
    url: string,
    secret: string,
    payloadStr: string,
    attempt: number,
  ): Promise<void> {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
    });
    if (!delivery || delivery.status !== 'pending') return;

    const timestamp = new Date().toISOString();
    const signature = signPayload(`${timestamp}.${payloadStr}`, secret);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TrackAS-Signature': `sha256=${signature}`,
          'X-TrackAS-Timestamp': timestamp,
        },
        body: payloadStr,
      });

      if (res.ok) {
        await this.webhookRepository.updateDelivery(deliveryId, {
          status: 'success',
          attempts: attempt + 1,
        });
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      const lastError = err instanceof Error ? err.message : String(err);
      const nextAttempt = attempt + 1;
      if (nextAttempt >= MAX_ATTEMPTS) {
        await this.webhookRepository.updateDelivery(deliveryId, {
          status: 'failed',
          attempts: nextAttempt,
          lastError,
        });
        return;
      }
      await this.webhookRepository.updateDelivery(deliveryId, {
        status: 'pending',
        attempts: nextAttempt,
        lastError,
      });
      const delay = BACKOFF_BASE_MS * Math.pow(2, nextAttempt - 1);
      setTimeout(
        () => this.deliver(deliveryId, url, secret, payloadStr, nextAttempt),
        delay,
      );
    }
  }
}
