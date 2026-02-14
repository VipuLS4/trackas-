import { Controller, Get, Param } from '@nestjs/common';
import { PublicTrackingService } from './public-tracking.service';
import { Public } from '../common/decorators/public.decorator';

/**
 * Public customer tracking. No authentication required.
 * Read-only access. Does not expose user IDs, driver phone, or payment data.
 */
@Controller('public')
@Public()
export class PublicTrackingController {
  constructor(private readonly publicTrackingService: PublicTrackingService) {}

  @Get('track/:shipmentId')
  track(@Param('shipmentId') shipmentId: string) {
    return this.publicTrackingService.getPublicTracking(shipmentId);
  }
}
