import { Module } from '@nestjs/common';
import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';
import { AssignmentRepository } from './assignment.repository';
import { AssignmentRejectedHandler } from './handlers/assignment-rejected.handler';
import { WebhookModule } from '../webhook/webhook.module';

@Module({
  imports: [WebhookModule],
  controllers: [AssignmentController],
  providers: [AssignmentService, AssignmentRepository, AssignmentRejectedHandler],
  exports: [AssignmentService],
})
export class AssignmentModule {}
