import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '../common/enums';
import { MetricsService } from '../observability/metrics.service';
import { ShipmentStatus } from '../common/enums';
import { AssignmentRepository } from './assignment.repository';
import { PrismaService } from '../prisma/prisma.service';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import {
  AssignmentRejectedEvent,
  ASSIGNMENT_REJECTED_EVENT,
} from './events/assignment-rejected.event';
import { WebhookDeliveryService } from '../webhook/webhook-delivery.service';

@Injectable()
export class AssignmentService {
  constructor(
    private readonly assignmentRepository: AssignmentRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly metricsService: MetricsService,
    private readonly webhookDelivery: WebhookDeliveryService,
  ) {}

  async getMyAssignments(user: CurrentUserPayload) {
    if (user.role !== Role.DRIVER) {
      throw new ForbiddenException('Only DRIVER can list my assignments');
    }
    return this.assignmentRepository.findMyOpenAssignments(user.id);
  }

  private canActOnAssignment(assignment: Awaited<ReturnType<AssignmentRepository['findById']>>, user: CurrentUserPayload): boolean {
    if (!assignment) return false;
    const { vehicle } = assignment;
    const isDriverAssignedToVehicle = vehicle.driver?.id === user.id;
    const isFleetOwnerOfVehicle = user.role === Role.FLEET_OWNER && vehicle.owner.id === user.id;
    return isDriverAssignedToVehicle || isFleetOwnerOfVehicle;
  }

  async accept(id: string, user: CurrentUserPayload) {
    const assignment = await this.assignmentRepository.findById(id);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    if (!this.canActOnAssignment(assignment, user)) {
      throw new ForbiddenException(
        'Only the driver assigned to the vehicle or the fleet owner who owns the vehicle can accept this assignment',
      );
    }
    if (assignment.acceptedAt) {
      throw new BadRequestException('Assignment already accepted');
    }
    if (assignment.rejectedAt) {
      throw new BadRequestException('Assignment already rejected');
    }
    const now = new Date();
    if (assignment.expiresAt <= now) {
      await this.assignmentRepository.setRejectedAt(id, now);
      await this.prisma.shipment.update({
        where: { id: assignment.shipmentId },
        data: { status: ShipmentStatus.ASSIGNMENT_PENDING },
      });
      this.eventEmitter.emit(
        ASSIGNMENT_REJECTED_EVENT,
        new AssignmentRejectedEvent(
          assignment.shipmentId,
          id,
          assignment.vehicleId,
        ),
      );
      throw new BadRequestException('Assignment has expired');
    }
    const start = Date.now();
    const result = await this.assignmentRepository.setAcceptedAt(id, now);
    this.metricsService.assignmentsAccepted();
    this.metricsService.observeAssignmentAcceptDuration((Date.now() - start) / 1000);
    this.webhookDelivery.emit(assignment.shipment.shipperId, 'assignment.accepted', {
      shipmentId: assignment.shipmentId,
      assignmentId: id,
    });
    return result;
  }

  async reject(id: string, user: CurrentUserPayload) {
    const assignment = await this.assignmentRepository.findById(id);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    if (!this.canActOnAssignment(assignment, user)) {
      throw new ForbiddenException(
        'Only the driver assigned to the vehicle or the fleet owner who owns the vehicle can reject this assignment',
      );
    }
    if (assignment.acceptedAt) {
      throw new BadRequestException('Assignment already accepted');
    }
    if (assignment.rejectedAt) {
      throw new BadRequestException('Assignment already rejected');
    }
    const now = new Date();
    await this.assignmentRepository.setRejectedAt(id, now);
    await this.prisma.shipment.update({
      where: { id: assignment.shipmentId },
      data: { status: ShipmentStatus.ASSIGNMENT_PENDING },
    });
    this.eventEmitter.emit(
      ASSIGNMENT_REJECTED_EVENT,
      new AssignmentRejectedEvent(
        assignment.shipmentId,
        id,
        assignment.vehicleId,
      ),
    );
    this.metricsService.assignmentsRejected();
    this.webhookDelivery.emit(assignment.shipment.shipperId, 'assignment.rejected', {
      shipmentId: assignment.shipmentId,
      assignmentId: id,
    });
    return this.assignmentRepository.findById(id);
  }
}
