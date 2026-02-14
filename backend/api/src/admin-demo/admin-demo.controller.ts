import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminDemoService } from './admin-demo.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin/demo')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class AdminDemoController {
  constructor(private readonly adminDemoService: AdminDemoService) {}

  @Get('summary')
  getSummary() {
    return this.adminDemoService.getSummary();
  }
}
