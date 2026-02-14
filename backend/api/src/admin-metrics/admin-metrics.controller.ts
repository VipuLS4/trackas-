import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminMetricsService } from './admin-metrics.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin/metrics')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class AdminMetricsController {
  constructor(private readonly adminMetricsService: AdminMetricsService) {}

  @Get('overview')
  getOverview() {
    return this.adminMetricsService.getOverview();
  }

  @Get('funnel')
  getFunnel() {
    return this.adminMetricsService.getFunnel();
  }

  @Get('technical')
  getTechnical() {
    return this.adminMetricsService.getTechnicalMetrics();
  }
}
