/** Webhook event types */
export const WEBHOOK_EVENTS = {
  SHIPMENT_CREATED: 'webhook.shipment.created',
  ASSIGNMENT_ACCEPTED: 'webhook.assignment.accepted',
  ASSIGNMENT_REJECTED: 'webhook.assignment.rejected',
  SHIPMENT_PICKUP_CONFIRMED: 'webhook.shipment.pickup_confirmed',
  SHIPMENT_DELIVERED: 'webhook.shipment.delivered',
} as const;

export interface WebhookPayload {
  event: string;
  timestamp: string; // ISO
  data: Record<string, unknown>;
}
