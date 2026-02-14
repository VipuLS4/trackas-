import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** In-process metrics. Gauges are computed on read; counters/histogram are in-memory. */
@Injectable()
export class MetricsService {
  private readonly counters: Map<string, number> = new Map();
  private readonly histogramBuckets: number[] = [
    0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
  ];
  private readonly histogramSamples: number[] = [];

  constructor(private readonly prisma: PrismaService) {}

  incCounter(name: string, labels?: Record<string, string>) {
    const key = labels
      ? `${name}{${Object.entries(labels)
          .map(([k, v]) => `${k}="${v}"`)
          .sort()
          .join(',')}}`
      : name;
    this.counters.set(key, (this.counters.get(key) ?? 0) + 1);
  }

  shipmentsCreated() {
    this.incCounter('shipments_created_total');
  }

  assignmentsCreated() {
    this.incCounter('assignments_created_total');
  }

  assignmentsAccepted() {
    this.incCounter('assignments_accepted_total');
  }

  assignmentsRejected() {
    this.incCounter('assignments_rejected_total');
  }

  trackingEvent(eventType: string) {
    this.incCounter('tracking_events_total', { type: eventType });
  }

  observeAssignmentAcceptDuration(seconds: number) {
    this.histogramSamples.push(seconds);
    if (this.histogramSamples.length > 10000) {
      this.histogramSamples.shift();
    }
  }

  async getActiveShipmentsCount(): Promise<number> {
    return this.prisma.shipment.count({
      where: {
        status: {
          not: 'DELIVERED',
        },
      },
    });
  }

  async getPendingAssignmentsCount(): Promise<number> {
    return this.prisma.assignment.count({
      where: {
        acceptedAt: null,
        rejectedAt: null,
      },
    });
  }

  private histogramFromSamples(samples: number[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const b of this.histogramBuckets) {
      result[`${b}`] = samples.filter((s) => s <= b).length;
    }
    result['+Inf'] = samples.length;
    return result;
  }

  async getTechnicalMetrics(): Promise<Record<string, unknown>> {
    const [activeShipments, pendingAssignments] = await Promise.all([
      this.getActiveShipmentsCount(),
      this.getPendingAssignmentsCount(),
    ]);

    const counters: Record<string, number> = {};
    for (const [key, value] of this.counters) {
      counters[key] = value;
    }

    const histogram =
      this.histogramSamples.length > 0
        ? this.histogramFromSamples(this.histogramSamples)
        : null;

    return {
      counters,
      gauges: {
        active_shipments: activeShipments,
        pending_assignments: pendingAssignments,
      },
      histogram:
        histogram !== null
          ? { assignment_accept_time_seconds: histogram }
          : { assignment_accept_time_seconds: {} },
    };
  }
}
