import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminDemoService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [totalShipments, deliveredShipments, releasedCount] =
      await Promise.all([
        this.prisma.shipment.count(),
        this.prisma.shipment.count({ where: { status: 'DELIVERED' } }),
        this.prisma.payment.count({ where: { status: 'RELEASED' } }),
      ]);

    const activeShipments = totalShipments - deliveredShipments;

    return {
      totalShipments,
      activeShipments,
      deliveredShipments,
      totalRevenue: releasedCount,
    };
  }
}
