import { Controller, Get, UseGuards } from '@nestjs/common';
import { ShipmentService } from './shipment.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

@Controller('shipments')
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.SHIPPER)
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.shipmentService.listForShipper(user);
  }
}
