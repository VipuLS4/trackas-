import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Role, TrackingEventType, ShipmentStatus } from '../common/enums';
import { MetricsService } from '../observability/metrics.service';
import { TrackingRepository } from './tracking.repository';
import { CreateTrackingEventDto } from './dto/create-tracking-event.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { PaymentService } from '../payment/payment.service';
import { WebhookDeliveryService } from '../webhook/webhook-delivery.service';

@Injectable()
export class TrackingService {
  constructor(
    private readonly trackingRepository: TrackingRepository,
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly metricsService: MetricsService,
    private readonly webhookDelivery: WebhookDeliveryService,
  ) {}

  async recordEvent(dto: CreateTrackingEventDto, user: CurrentUserPayload) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: dto.shipmentId },
    });
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    let newStatus: ShipmentStatus | null = null;
    if (dto.eventType === TrackingEventType.PICKUP) {
      newStatus = ShipmentStatus.PICKUP_CONFIRMED;
    } else if (dto.eventType === TrackingEventType.DELIVERY) {
      newStatus = ShipmentStatus.DELIVERED;
    }

    if (newStatus) {
      await this.prisma.shipment.update({
        where: { id: dto.shipmentId },
        data: { status: newStatus },
      });
      if (dto.eventType === TrackingEventType.PICKUP) {
        this.webhookDelivery.emit(shipment.shipperId, 'shipment.pickup_confirmed', {
          shipmentId: dto.shipmentId,
        });
      } else if (dto.eventType === TrackingEventType.DELIVERY) {
        await this.paymentService.releaseForShipment(dto.shipmentId);
        this.webhookDelivery.emit(shipment.shipperId, 'shipment.delivered', {
          shipmentId: dto.shipmentId,
        });
      }
    }

    const result = await this.trackingRepository.create({
      shipmentId: dto.shipmentId,
      eventType: dto.eventType,
      latitude: dto.latitude,
      longitude: dto.longitude,
      createdById: user.id,
    });
    this.metricsService.trackingEvent(dto.eventType);
    return result;
  }

  async getEventsByShipmentId(
    shipmentId: string,
    user: CurrentUserPayload,
  ) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
    });
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    const canAccess =
      user.role === Role.ADMIN ||
      (user.role === Role.SHIPPER && shipment.shipperId === user.id) ||
      (user.role === Role.DRIVER && shipment.driverId === user.id);

    if (!canAccess) {
      throw new ForbiddenException(
        'You do not have permission to view this shipment’s tracking',
      );
    }

    return this.trackingRepository.findByShipmentId(shipmentId);
  }
}
