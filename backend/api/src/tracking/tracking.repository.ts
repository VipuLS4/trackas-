import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackingEventType } from '../common/enums';

export interface CreateTrackingEventData {
  shipmentId: string;
  eventType: TrackingEventType;
  latitude: number;
  longitude: number;
  createdById?: string;
}

@Injectable()
export class TrackingRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Append-only: create a new tracking event. */
  async create(data: CreateTrackingEventData) {
    return this.prisma.trackingEvent.create({
      data: {
        shipmentId: data.shipmentId,
        eventType: data.eventType,
        latitude: data.latitude,
        longitude: data.longitude,
        createdById: data.createdById,
      },
      include: {
        shipment: { select: { id: true, status: true } },
      },
    });
  }

  /** Get all events for a shipment, ordered by createdAt ascending. */
  async findByShipmentId(shipmentId: string) {
    return this.prisma.trackingEvent.findMany({
      where: { shipmentId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
