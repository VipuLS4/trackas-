import { Injectable } from '@nestjs/common';

/**
 * ETA Estimation Engine (v1)
 * Computes ETA from distance + constant average speed. No external APIs, no ML.
 */

const EARTH_RADIUS_KM = 6371;
const DEFAULT_AVERAGE_SPEED_KMH = 50;

export interface Location {
  latitude: number;
  longitude: number;
}

export interface ETAInput {
  pickupLocation: Location | null;
  lastTrackingEvent: { location: Location; createdAt: Date } | null;
  deliveryLocation: Location | null;
  status: string;
}

@Injectable()
export class ETAService {
  /**
   * Average speed in km/h (configurable via ETA_AVERAGE_SPEED_KMH env).
   */
  private readonly averageSpeedKmh: number;

  constructor() {
    const envSpeed = process.env.ETA_AVERAGE_SPEED_KMH;
    this.averageSpeedKmh = envSpeed ? Number(envSpeed) : DEFAULT_AVERAGE_SPEED_KMH;
  }

  /**
   * Compute ETA from pickup location, last tracking event, and delivery location.
   * Rules:
   * - No pickup yet → null
   * - Already delivered → null
   * - No delivery destination → null
   * - Otherwise: distance(lastKnown, delivery) / speed → ETA = lastEventTime + travelTime
   */
  computeETA(input: ETAInput): string | null {
    if (input.status === 'DELIVERED') {
      return null;
    }
    if (!input.pickupLocation || !input.lastTrackingEvent || !input.deliveryLocation) {
      return null;
    }

    const { location, createdAt } = input.lastTrackingEvent;
    const distanceKm = this.haversineKm(location, input.deliveryLocation);
    if (distanceKm <= 0) {
      return createdAt.toISOString();
    }

    const hoursToArrival = distanceKm / this.averageSpeedKmh;
    const etaDate = new Date(createdAt.getTime() + hoursToArrival * 60 * 60 * 1000);
    return etaDate.toISOString();
  }

  /**
   * Haversine distance in km (no external APIs).
   */
  haversineKm(a: Location, b: Location): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const s =
      Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
    return EARTH_RADIUS_KM * c;
  }
}
