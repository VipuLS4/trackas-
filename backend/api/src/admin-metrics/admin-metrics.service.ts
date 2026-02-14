import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../observability/metrics.service';

@Injectable()
export class AdminMetricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metricsService: MetricsService,
  ) {}

  async getOverview() {
    const [
      totalShipments,
      totalVehicles,
      totalUsers,
      shipmentsByStatus,
      paymentsByStatus,
      totalAssignments,
    ] = await Promise.all([
      this.prisma.shipment.count(),
      this.prisma.vehicle.count(),
      this.prisma.user.count(),
      this.prisma.shipment.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.payment.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.assignment.count(),
    ]);

    return {
      totalShipments,
      totalVehicles,
      totalUsers,
      totalAssignments,
      shipmentsByStatus: Object.fromEntries(
        shipmentsByStatus.map((s) => [s.status, s._count.id]),
      ),
      paymentsByStatus: Object.fromEntries(
        paymentsByStatus.map((p) => [p.status, p._count.id]),
      ),
    };
  }

  async getFunnel() {
    const statusCounts = await this.prisma.shipment.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const funnelOrder = [
      'PENDING',
      'ASSIGNMENT_PENDING',
      'PICKUP_CONFIRMED',
      'IN_TRANSIT',
      'DELIVERED',
    ];

    const steps = funnelOrder.map((status) => {
      const found = statusCounts.find((s) => s.status === status);
      return { status, count: found?._count.id ?? 0 };
    });

    return { funnel: steps };
  }

  getTechnicalMetrics() {
    return this.metricsService.getTechnicalMetrics();
  }
}
