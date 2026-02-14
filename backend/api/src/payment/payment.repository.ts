import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '../common/enums';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByShipmentId(shipmentId: string) {
    return this.prisma.payment.findUnique({
      where: { shipmentId },
    });
  }

  async createForShipment(shipmentId: string) {
    return this.prisma.payment.create({
      data: { shipmentId, status: PaymentStatus.HELD },
    });
  }

  async updateStatus(shipmentId: string, status: PaymentStatus) {
    return this.prisma.payment.update({
      where: { shipmentId },
      data: { status },
    });
  }
}
