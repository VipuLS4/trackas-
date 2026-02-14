/**
 * Public tracking response. No user IDs, driver phone, or payment data.
 */
export interface PublicTrackingEventDto {
  eventType: string;
  latitude: number;
  longitude: number;
  createdAt: string; // ISO date string
}

export interface PublicVehicleInfoDto {
  plateNumberMasked: string;
}

export interface PublicTrackingResponseDto {
  shipmentId: string;
  status: string;
  trackingEvents: PublicTrackingEventDto[];
  vehicle: PublicVehicleInfoDto | null;
  eta: string | null; // placeholder
}
