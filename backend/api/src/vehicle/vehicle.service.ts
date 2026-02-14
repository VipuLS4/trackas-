import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '../common/enums';
import { VehicleRepository } from './vehicle.repository';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class VehicleService {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async create(dto: CreateVehicleDto, user: CurrentUserPayload) {
    return this.vehicleRepository.create({
      ownerId: user.id,
      plateNumber: dto.plateNumber,
      make: dto.make,
      model: dto.model,
    });
  }

  async findAll(user: CurrentUserPayload) {
    const isOwner =
      user.role === Role.FLEET_OWNER || user.role === Role.INDIVIDUAL_OWNER;
    if (user.role === Role.ADMIN) {
      return this.vehicleRepository.findMany({});
    }
    if (isOwner) {
      return this.vehicleRepository.findMany({ ownerId: user.id });
    }
    throw new ForbiddenException(
      'Only ADMIN or vehicle owners can list vehicles',
    );
  }

  async assignDriver(
    vehicleId: string,
    driverId: string,
    user: CurrentUserPayload,
  ) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only ADMIN can assign a driver to a vehicle');
    }
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return this.vehicleRepository.updateDriverId(vehicleId, driverId);
  }
}
