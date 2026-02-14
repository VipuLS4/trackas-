import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateVehicleData {
  ownerId: string;
  plateNumber: string;
  make?: string;
  model?: string;
}

@Injectable()
export class VehicleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateVehicleData) {
    return this.prisma.vehicle.create({
      data: {
        ownerId: data.ownerId,
        plateNumber: data.plateNumber,
        make: data.make,
        model: data.model,
      },
    });
  }

  async findMany(where: { ownerId?: string }) {
    return this.prisma.vehicle.findMany({
      where,
      include: {
        owner: { select: { id: true, email: true } },
        driver: { select: { id: true, email: true } },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, email: true } },
        driver: { select: { id: true, email: true } },
      },
    });
  }

  async updateDriverId(id: string, driverId: string | null) {
    return this.prisma.vehicle.update({
      where: { id },
      data: { driverId },
      include: {
        owner: { select: { id: true, email: true } },
        driver: { select: { id: true, email: true } },
      },
    });
  }
}
