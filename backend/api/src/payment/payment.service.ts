import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role } from '../common/enums';
import { PaymentStatus } from '../common/enums';
import { PaymentRepository } from './payment.repository';
import { PrismaService } from '../prisma/prisma.service';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly prisma: PrismaService,
  ) {}

  /** Release escrow for a shipment (called when shipment is DELIVERED). */
  async releaseForShipment(shipmentId: string): Promise<void> {
    const payment = await this.paymentRepository.findByShipmentId(shipmentId);
    if (!payment) {
      return; // no payment for this shipment; nothing to release
    }
    if (payment.status === PaymentStatus.RELEASED) {
      return; // idempotent
    }
    await this.paymentRepository.updateStatus(shipmentId, PaymentStatus.RELEASED);
  }

  /** Get payment for a shipment; access: ADMIN, or SHIPPER (owner), or DRIVER (assigned). */
  async getByShipmentId(shipmentId: string, user: CurrentUserPayload) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { payment: true },
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
        'You do not have permission to view this shipment’s payment',
      );
    }
    if (!shipment.payment) {
      throw new NotFoundException('No payment found for this shipment');
    }
    return shipment.payment;
  }
}
