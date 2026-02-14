/**
 * Emitted when an assignment is rejected or expires during accept().
 * Triggers auto re-assignment when shipment is still ASSIGNMENT_PENDING.
 */
export class AssignmentRejectedEvent {
  constructor(
    public readonly shipmentId: string,
    /** Id of the assignment that was rejected/expired */
    public readonly rejectedAssignmentId: string,
    /** Vehicle id to exclude from next pick (the one that was rejected/expired) */
    public readonly rejectedVehicleId: string,
  ) {}
}

export const ASSIGNMENT_REJECTED_EVENT = 'assignment.rejected';
