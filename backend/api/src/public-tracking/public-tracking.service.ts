import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ETAService } from '../eta/eta.service';
import type {
  PublicTrackingResponseDto,
  PublicTrackingEventDto,
  PublicVehicleInfoDto,
} from './dto/public-tracking-response.dto';

function maskPlateNumber(plateNumber: string): string {
  if (!plateNumber) return '****';
  const s = plateNumber.replace(/\s/g, '');
  if (s.length <= 4) return '*'.repeat(Math.min(s.length, 4));
  return s.slice(0, 2) + '*'.repeat(Math.min(s.length - 4, 4)) + s.slice(-2);
}

@Injectable()
export class PublicTrackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly etaService: ETAService,
  ) {}

  async getPublicTracking(shipmentId: string): Promise<PublicTrackingResponseDto> {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        trackingEvents: { orderBy: { createdAt: 'asc' } },
        assignments: {
          where: { acceptedAt: { not: null } },
          take: 1,
          orderBy: { acceptedAt: 'desc' },
          include: {
            vehicle: { select: { plateNumber: true } },
          },
        },
        driver: {
          include: {
            assignedVehicle: { select: { plateNumber: true } },
          },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    const trackingEvents: PublicTrackingEventDto[] = shipment.trackingEvents.map(
      (e) => ({
        eventType: e.eventType,
        latitude: e.latitude,
        longitude: e.longitude,
        createdAt: e.createdAt.toISOString(),
      }),
    );

    let vehicle: PublicVehicleInfoDto | null = null;
    const plate =
      shipment.assignments[0]?.vehicle?.plateNumber ??
      shipment.driver?.assignedVehicle?.plateNumber;
    if (plate) {
      vehicle = { plateNumberMasked: maskPlateNumber(plate) };
    }

    const eta = this.etaService.computeETA({
      pickupLocation: this.getPickupLocation(shipment.trackingEvents),
      lastTrackingEvent: this.getLastTrackingEventWithLocation(shipment.trackingEvents),
      deliveryLocation: this.getDeliveryLocation(shipment),
      status: shipment.status,
    });

    return {
      shipmentId: shipment.id,
      status: shipment.status,
      trackingEvents,
      vehicle,
      eta,
    };
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
