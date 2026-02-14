import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { CreateTrackingEventDto } from './dto/create-tracking-event.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.DRIVER, Role.ADMIN)
  create(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: CreateTrackingEventDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.trackingService.recordEvent(dto, user);
  }

  @Get('shipment/:shipmentId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SHIPPER, Role.DRIVER)
  getByShipmentId(
    @Param('shipmentId') shipmentId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.trackingService.getEventsByShipmentId(shipmentId, user);
  }
}
