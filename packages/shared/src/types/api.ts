import type { CostBreakdown, TollItem, VehicleProfile } from '../cost/types';
import type { FuelType, TripStatus, BookingStatus } from './enums';

export interface CreateTripRequest {
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  vehicle_id: string;
  departure_time: string;
  available_seats: number;
  actual_price_per_seat?: number;
  notes?: string;
}

export interface CreateTripResponse {
  trip_id: string;
  cost_breakdown: CostBreakdown;
  detected_tolls: TollItem[];
  route_polyline: string;
  distance_km: number;
  duration_minutes: number;
}

export interface SearchTripsRequest {
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
  depart_after: string;
  depart_before: string;
  detour_km?: number;
}

export interface TripSearchResult {
  trip_id: string;
  driver_id: string;
  driver_name: string;
  driver_rating: number;
  origin_name: string;
  dest_name: string;
  departure_time: string;
  available_seats: number;
  booked_seats: number;
  actual_price_per_seat: number;
  distance_km: number;
  pickup_distance_m: number;
  dropoff_distance_m: number;
  vehicle: {
    make: string;
    model: string;
    colour?: string;
  };
}

export interface CreateBookingRequest {
  trip_id: string;
  seats: number;
  pickup: { lat: number; lng: number; name: string };
  dropoff: { lat: number; lng: number; name: string };
}

export interface CreateBookingResponse {
  booking_id: string;
  client_secret: string;
  total_price: number;
}
