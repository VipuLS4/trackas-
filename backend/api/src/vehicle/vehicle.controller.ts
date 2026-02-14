import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.FLEET_OWNER, Role.INDIVIDUAL_OWNER)
  create(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: CreateVehicleDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.vehicleService.create(dto, user);
  }

  @Get()
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.vehicleService.findAll(user);
  }

  @Post(':id/assign-driver')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  assignDriver(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: AssignDriverDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.vehicleService.assignDriver(id, dto.driverId, user);
  }
}
