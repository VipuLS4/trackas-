import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /** GET payment by shipment (ADMIN, or SHIPPER if owns, or DRIVER if assigned). No release API (Option A). */
  @Get('shipment/:shipmentId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SHIPPER, Role.DRIVER)
  getByShipmentId(
    @Param('shipmentId') shipmentId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.paymentService.getByShipmentId(shipmentId, user);
  }
}
