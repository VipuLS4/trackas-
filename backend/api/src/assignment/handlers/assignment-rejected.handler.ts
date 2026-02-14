import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ShipmentStatus } from '../../common/enums';
import { AssignmentRepository } from '../assignment.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { MetricsService } from '../../observability/metrics.service';
import {
  AssignmentRejectedEvent,
  ASSIGNMENT_REJECTED_EVENT,
} from '../events/assignment-rejected.event';

const RE_ASSIGNMENT_EXPIRY_MINUTES = 2;

/**
 * On assignment rejected or expired: if shipment is still ASSIGNMENT_PENDING,
 * select next eligible vehicle (deterministic: by id, excluding rejected vehicle
 * and vehicles with an open assignment for this shipment) and create a new
 * assignment with expiresAt = now + 2 minutes.
 */
@Injectable()
export class AssignmentRejectedHandler {
  constructor(
    private readonly assignmentRepository: AssignmentRepository,
    private readonly prisma: PrismaService,
    private readonly metricsService: MetricsService,
  ) {}

  @OnEvent(ASSIGNMENT_REJECTED_EVENT)
  async handle(event: AssignmentRejectedEvent): Promise<void> {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: event.shipmentId },
    });
    if (!shipment || shipment.status !== ShipmentStatus.ASSIGNMENT_PENDING) {
      return;
    }

    const openAssignments = await this.assignmentRepository.findOpenByShipmentId(
      event.shipmentId,
    );
    const excludedVehicleIds = new Set([
      event.rejectedVehicleId,
      ...openAssignments.map((a) => a.vehicleId),
    ]);

    const nextVehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: { notIn: [...excludedVehicleIds] },
      },
      orderBy: { id: 'asc' },
    });

    if (!nextVehicle) {
      return;
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + RE_ASSIGNMENT_EXPIRY_MINUTES * 60 * 1000,
    );
    await this.assignmentRepository.create(
      event.shipmentId,
      nextVehicle.id,
      expiresAt,
    );
    this.metricsService.assignmentsCreated();
  }
}
