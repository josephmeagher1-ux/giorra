/**
 * Drivey app data layer.
 *
 * Today this is backed by an in-memory mock dataset so the UI is fully
 * functional without paid services or running a Supabase project. When real
 * credentials are configured we swap the implementations transparently.
 */
import {
  calculateTripCost,
  type CostBreakdown,
  type RecurrencePattern,
  generateRecurrenceInstances,
  haversineDistance,
  IRISH_TOLLS,
  type VehicleProfile,
} from '@drivey/shared';
import {
  DRIVERS,
  RECURRING,
  SELF,
  TRIPS,
  VEHICLES,
  type MockProfile,
  type MockRecurringPattern,
  type MockTrip,
  type MockVehicle,
} from './mock/data';
import { shouldUseMocks } from './featureFlags';
import {
  createRequest as escrowCreateRequest,
  driverAccept as escrowDriverAccept,
  listEscrowBookings,
  aggregateForUser as escrowAggregateForUser,
} from './escrow';

let trips = [...TRIPS];
let vehicles = [...VEHICLES];
let recurring = [...RECURRING];
let bookings: BookingRecord[] = [];
let declarationAcceptedAt: string | null = null;

export interface BookingRecord {
  id: string;
  trip_id: string;
  rider_id: string;
  seats: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled';
  created_at: string;
}

function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function findDriver(id: string): MockProfile {
  if (id === SELF.id) return SELF;
  return DRIVERS.find((d) => d.id === id) ?? DRIVERS[0];
}

function vehicleProfileFor(v: MockVehicle): VehicleProfile {
  return {
    fuel: v.fuel,
    year: v.year,
    consumption_l_100km: v.consumption_l_100km,
    kwh_per_100km: v.kwh_per_100km,
    engine_cc: v.engine_cc,
    annual_insurance_eur: v.annual_insurance_eur,
    annual_motor_tax_eur: v.annual_motor_tax_eur,
    annual_nct_maintenance_eur: v.annual_nct_maintenance_eur,
    expected_annual_km: v.expected_annual_km,
  };
}

function autoDetectTolls(distance_km: number) {
  // Mock toll detection: long Dublin↔Cork trips get M50 + M7/M8.
  if (distance_km > 230) {
    return [
      IRISH_TOLLS.find((t) => t.road_code === 'M50')!,
      IRISH_TOLLS.find((t) => t.road_code === 'M7')!,
    ].map((t) => ({ name: t.name, price: t.price_tagged }));
  }
  if (distance_km > 90) {
    return [
      { name: IRISH_TOLLS.find((t) => t.road_code === 'M50')!.name, price: 2.6 },
    ];
  }
  return [];
}

export interface PreviewArgs {
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  vehicle: MockVehicle;
  num_passengers: number;
  fuel_price_override?: number;
  annual_business_band_km?: number;
}

export interface PreviewResult {
  distance_km: number;
  duration_minutes: number;
  tolls: { name: string; price: number }[];
  cost_breakdown: CostBreakdown;
}

export async function previewTripCost(args: PreviewArgs): Promise<PreviewResult> {
  await sleep(150);
  // Mock routing: haversine * 1.25 to approximate real road distance.
  const straight = haversineDistance(
    args.origin.lat,
    args.origin.lng,
    args.destination.lat,
    args.destination.lng,
  );
  const distance_km = Math.max(1, Math.round(straight * 1.25 * 10) / 10);
  const duration_minutes = Math.round(distance_km / 90 * 60);
  const tolls = autoDetectTolls(distance_km);

  const cost_breakdown = calculateTripCost({
    distance_km,
    vehicle: vehicleProfileFor(args.vehicle),
    num_passengers: args.num_passengers,
    tolls,
    fuel_price_override: args.fuel_price_override,
    annual_business_band_km: args.annual_business_band_km,
  });

  return { distance_km, duration_minutes, tolls, cost_breakdown };
}

export async function listVehicles(ownerId: string = SELF.id): Promise<MockVehicle[]> {
  await sleep(60);
  return vehicles.filter((v) => v.owner_id === ownerId);
}

export async function addVehicle(input: Omit<MockVehicle, 'id' | 'owner_id' | 'is_default'>): Promise<MockVehicle> {
  await sleep(120);
  const v: MockVehicle = {
    id: uid('v'),
    owner_id: SELF.id,
    is_default: vehicles.filter((x) => x.owner_id === SELF.id).length === 0,
    ...input,
  };
  vehicles = [...vehicles, v];
  return v;
}

export async function searchTrips(opts: {
  origin_text?: string;
  destination_text?: string;
}): Promise<Array<MockTrip & { driver: MockProfile; vehicle: MockVehicle }>> {
  await sleep(180);
  const o = (opts.origin_text ?? '').toLowerCase().trim();
  const d = (opts.destination_text ?? '').toLowerCase().trim();
  return trips
    .filter((t) => t.status === 'published')
    .filter((t) => (!o || t.origin.name.toLowerCase().includes(o)))
    .filter((t) => (!d || t.destination.name.toLowerCase().includes(d)))
    .map((t) => ({
      ...t,
      driver: findDriver(t.driver_id),
      vehicle: vehicles.find((v) => v.id === t.vehicle_id) ?? vehicles[0],
    }));
}

export async function getTrip(id: string) {
  await sleep(120);
  const t = trips.find((x) => x.id === id);
  if (!t) throw new Error('Trip not found');
  return {
    ...t,
    driver: findDriver(t.driver_id),
    vehicle: vehicles.find((v) => v.id === t.vehicle_id)!,
  };
}

export async function createTrip(input: {
  origin: MockTrip['origin'];
  destination: MockTrip['destination'];
  vehicle_id: string;
  departure_time: string;
  available_seats: number;
  actual_price_per_seat?: number;
  fuel_price_override?: number;
}): Promise<MockTrip> {
  await sleep(220);
  const vehicle = vehicles.find((v) => v.id === input.vehicle_id);
  if (!vehicle) throw new Error('Vehicle not found');
  const preview = await previewTripCost({
    origin: input.origin,
    destination: input.destination,
    vehicle,
    num_passengers: input.available_seats,
  });
  const max = preview.cost_breakdown.max_price_per_seat;
  const actual = Math.min(input.actual_price_per_seat ?? max, max);
  const trip: MockTrip = {
    id: uid('t'),
    driver_id: SELF.id,
    vehicle_id: input.vehicle_id,
    origin: input.origin,
    destination: input.destination,
    departure_time: input.departure_time,
    distance_km: preview.distance_km,
    duration_minutes: preview.duration_minutes,
    available_seats: input.available_seats,
    booked_seats: 0,
    max_price_per_seat: max,
    actual_price_per_seat: actual,
    cost_breakdown: preview.cost_breakdown,
    status: 'published',
  };
  trips = [trip, ...trips];
  return trip;
}

/**
 * Create an escrow booking request. In mock mode the driver auto-accepts
 * so the rider can immediately choose a charity and deposit funds on the
 * booking screen. The legacy BookingRecord is still produced for screens
 * that haven't been migrated to the escrow model.
 */
export async function bookSeat(args: {
  trip_id: string;
  seats: number;
}): Promise<BookingRecord & { escrow_id: string }> {
  await sleep(200);
  const t = trips.find((x) => x.id === args.trip_id);
  if (!t) throw new Error('Trip not found');
  if (t.booked_seats + args.seats > t.available_seats) {
    throw new Error('Not enough seats available');
  }
  const total = t.actual_price_per_seat * args.seats;
  const escrow = escrowCreateRequest({
    trip_id: t.id,
    driver_id: t.driver_id,
    seats: args.seats,
    total_eur: total,
  });
  escrowDriverAccept(escrow.id);
  const booking: BookingRecord = {
    id: escrow.id,
    trip_id: t.id,
    rider_id: SELF.id,
    seats: args.seats,
    total_price: total,
    status: 'pending',
    created_at: escrow.created_at,
  };
  bookings = [booking, ...bookings];
  trips = trips.map((x) =>
    x.id === t.id ? { ...x, booked_seats: x.booked_seats + args.seats } : x,
  );
  return { ...booking, escrow_id: escrow.id };
}

export async function listMyBookings(): Promise<
  Array<BookingRecord & { trip: MockTrip; driver: MockProfile; escrow_phase: string }>
> {
  await sleep(120);
  const escrowById = new Map(listEscrowBookings().map((e) => [e.id, e]));
  return bookings.map((b) => {
    const trip = trips.find((t) => t.id === b.trip_id)!;
    const e = escrowById.get(b.id);
    return {
      ...b,
      trip,
      driver: findDriver(trip.driver_id),
      escrow_phase: e?.state.phase ?? 'requested',
    };
  });
}

export async function listMyDriverBookings(): Promise<
  Array<{ id: string; trip: MockTrip; rider: MockProfile; total_eur: number; phase: string }>
> {
  await sleep(120);
  return listEscrowBookings()
    .filter((e) => e.driver_id === SELF.id)
    .map((e) => ({
      id: e.id,
      trip: trips.find((t) => t.id === e.trip_id)!,
      rider: findDriver(e.rider_id),
      total_eur: e.total_eur,
      phase: e.state.phase,
    }));
}

export function ratingForUser(userId: string, role: 'driver' | 'rider') {
  return escrowAggregateForUser(userId, role);
}

export async function listMyTripsAsDriver(): Promise<MockTrip[]> {
  await sleep(120);
  return trips.filter((t) => t.driver_id === SELF.id);
}

export async function listRecurringPatterns(driverId: string = SELF.id): Promise<MockRecurringPattern[]> {
  await sleep(80);
  return recurring.filter((p) => p.driver_id === driverId);
}

export async function listPublicRecurringPatterns(): Promise<MockRecurringPattern[]> {
  await sleep(120);
  return recurring.filter((p) => p.is_active);
}

export async function createRecurringPattern(input: {
  label: string;
  category: RecurrencePattern['category'];
  origin: MockRecurringPattern['origin'];
  destination: MockRecurringPattern['destination'];
  vehicle_id: string;
  pattern: RecurrencePattern;
  available_seats: number;
  actual_price_per_seat?: number;
}): Promise<MockRecurringPattern> {
  await sleep(200);
  const vehicle = vehicles.find((v) => v.id === input.vehicle_id);
  if (!vehicle) throw new Error('Vehicle not found');
  const preview = await previewTripCost({
    origin: input.origin,
    destination: input.destination,
    vehicle,
    num_passengers: input.available_seats,
  });
  const max = preview.cost_breakdown.max_price_per_seat;
  const actual = Math.min(input.actual_price_per_seat ?? max, max);
  const created: MockRecurringPattern = {
    id: uid('r'),
    driver_id: SELF.id,
    vehicle_id: input.vehicle_id,
    label: input.label,
    category: input.category,
    origin: input.origin,
    destination: input.destination,
    pattern: input.pattern,
    available_seats: input.available_seats,
    max_price_per_seat: max,
    actual_price_per_seat: actual,
    is_active: true,
  };
  recurring = [created, ...recurring];
  return created;
}

export function nextOccurrences(pattern: MockRecurringPattern, limit = 5) {
  return generateRecurrenceInstances(pattern.pattern, {
    pattern_id: pattern.id,
    limit,
  });
}

export function getProfile(): MockProfile & { preferred_charity_id?: string } {
  return SELF;
}

export function setPreferredCharity(charity_id: string) {
  SELF.preferred_charity_id = charity_id;
}

export function getDeclarationsAcceptance(): { acceptedAt: string | null } {
  return { acceptedAt: declarationAcceptedAt };
}

export function acceptDeclarations() {
  declarationAcceptedAt = new Date().toISOString();
}

/**
 * Aggregate driver impact metrics across the trips this user has completed
 * as a driver. Includes both legacy trip data and escrow-completed bookings.
 */
export function driverImpactFor(driverId: string = SELF.id) {
  const driverTrips = trips.filter(
    (t) => t.driver_id === driverId && t.status !== 'cancelled',
  );
  return driverTrips.map((t) => ({
    distance_km: t.distance_km,
    passengers: t.booked_seats,
    per_seat_eur: t.actual_price_per_seat,
  }));
}

export const usingMocks = shouldUseMocks();

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
