import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

@Controller('assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Get('my')
  @UseGuards(RolesGuard)
  @Roles(Role.DRIVER)
  getMy(
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assignmentService.getMyAssignments(user);
  }

  @Post(':id/accept')
  accept(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assignmentService.accept(id, user);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assignmentService.reject(id, user);
  }
}
