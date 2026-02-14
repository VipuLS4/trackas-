import { Injectable, ForbiddenException } from '@nestjs/common';
import { Role } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ETAService } from '../eta/eta.service';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class ShipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly etaService: ETAService,
  ) {}

  async listForShipper(user: CurrentUserPayload) {
    if (user.role !== Role.SHIPPER) {
      throw new ForbiddenException('Only SHIPPER can list their shipments');
    }
    const shipments = await this.prisma.shipment.findMany({
      where: { shipperId: user.id },
      include: {
        shipper: { select: { id: true, email: true } },
        driver: { select: { id: true, email: true } },
        trackingEvents: { orderBy: { createdAt: 'asc' } },
      },
    });

    return shipments.map((s) => {
      const { trackingEvents, ...rest } = s;
      return {
        ...rest,
        eta: this.etaService.computeETA({
          pickupLocation: this.getPickupLocation(trackingEvents),
          lastTrackingEvent: this.getLastTrackingEventWithLocation(trackingEvents),
          deliveryLocation: this.getDeliveryLocation(s),
          status: s.status,
        }),
      };
    });
  }

  private getPickupLocation(
    events: { eventType: string; latitude: number; longitude: number }[],
  ): { latitude: number; longitude: number } | null {
    const pickup = events.find((e) => e.eventType === 'PICKUP');
    return pickup ? { latitude: pickup.latitude, longitude: pickup.longitude } : null;
  }

  private getLastTrackingEventWithLocation(
    events: { eventType: string; latitude: number; longitude: number; createdAt: Date }[],
  ): { location: { latitude: number; longitude: number }; createdAt: Date } | null {
    if (events.length === 0) return null;
    const last = events[events.length - 1];
    return {
      location: { latitude: last.latitude, longitude: last.longitude },
      createdAt: last.createdAt,
    };
  }

  private getDeliveryLocation(shipment: {
    deliveryLatitude: number | null;
    deliveryLongitude: number | null;
  }): { latitude: number; longitude: number } | null {
    if (
      shipment.deliveryLatitude != null &&
      shipment.deliveryLongitude != null
    ) {
      return {
        latitude: shipment.deliveryLatitude,
        longitude: shipment.deliveryLongitude,
      };
    }
    return null;
  }
}
