import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssignmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.assignment.findUnique({
      where: { id },
      include: {
        shipment: true,
        vehicle: {
          include: {
            owner: { select: { id: true, role: true } },
            driver: { select: { id: true } },
          },
        },
      },
    });
  }

  async setAcceptedAt(id: string, acceptedAt: Date) {
    return this.prisma.assignment.update({
      where: { id },
      data: { acceptedAt },
      include: {
        shipment: true,
        vehicle: { include: { owner: true, driver: true } },
      },
    });
  }

  async setRejectedAt(id: string, rejectedAt: Date) {
    return this.prisma.assignment.update({
      where: { id },
      data: { rejectedAt },
      include: {
        shipment: true,
        vehicle: true,
      },
    });
  }

  async create(shipmentId: string, vehicleId: string, expiresAt: Date) {
    return this.prisma.assignment.create({
      data: { shipmentId, vehicleId, expiresAt },
      include: {
        shipment: true,
        vehicle: { include: { owner: true, driver: true } },
      },
    });
  }

  /** Open assignments for driver (vehicle.driverId = driverId, no acceptedAt, no rejectedAt). */
  async findMyOpenAssignments(driverId: string) {
    return this.prisma.assignment.findMany({
      where: {
        vehicle: { driverId },
        acceptedAt: null,
        rejectedAt: null,
      },
      include: {
        shipment: true,
        vehicle: { include: { owner: true, driver: true } },
      },
    });
  }

  /** Assignments for this shipment that are still open (no acceptedAt, no rejectedAt). */
  async findOpenByShipmentId(shipmentId: string) {
    return this.prisma.assignment.findMany({
      where: {
        shipmentId,
        acceptedAt: null,
        rejectedAt: null,
      },
      select: { vehicleId: true },
    });
  }
}
