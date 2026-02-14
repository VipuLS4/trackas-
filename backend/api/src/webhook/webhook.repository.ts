import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhookRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(shipperId: string, url: string, secret: string) {
    return this.prisma.webhookSubscription.create({
      data: { shipperId, url, secret, enabled: true },
    });
  }

  findByShipperId(shipperId: string) {
    return this.prisma.webhookSubscription.findMany({
      where: { shipperId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findEnabledByShipperId(shipperId: string) {
    return this.prisma.webhookSubscription.findMany({
      where: { shipperId, enabled: true },
    });
  }

  findById(id: string) {
    return this.prisma.webhookSubscription.findUnique({
      where: { id },
    });
  }

  disable(id: string) {
    return this.prisma.webhookSubscription.update({
      where: { id },
      data: { enabled: false },
    });
  }

  createDelivery(
    subscriptionId: string,
    eventType: string,
    payload: string,
  ) {
    return this.prisma.webhookDelivery.create({
      data: { subscriptionId, eventType, payload, status: 'pending' },
    });
  }

  updateDelivery(
    id: string,
    data: { status: string; attempts: number; lastError?: string },
  ) {
    return this.prisma.webhookDelivery.update({
      where: { id },
      data,
    });
  }
}
