/**
 * In-memory escrow data layer that mirrors the production state-machine flow.
 * Backed by `@giorra/shared` pure transitions. Swap with Supabase + edge
 * functions later.
 */
import {
  aggregateRatings,
  DEFAULT_CHARITIES,
  describePhase,
  transition,
  type AggregateRating,
  type Charity,
  type EscrowEvent,
  type EscrowPhase,
  type EscrowState,
  type RatingDirection,
} from '@giorra/shared';
import { SELF } from './mock/data';
import type { MockRating } from './mock/data';
import { notify } from './notifications';

export interface EscrowBooking {
  id: string;
  trip_id: string;
  rider_id: string;
  driver_id: string;
  seats: number;
  total_eur: number;
  charity_id?: string;
  state: EscrowState;
  history: Array<{ at_iso: string; type: EscrowEvent['type']; resulting_phase: EscrowPhase }>;
  created_at: string;
}

let BOOKINGS: EscrowBooking[] = [];
let RATINGS: MockRating[] = [];

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function recordEvent(b: EscrowBooking, event: EscrowEvent, next: EscrowState) {
  b.history.push({
    at_iso: new Date().toISOString(),
    type: event.type,
    resulting_phase: next.phase,
  });
  b.state = next;
}

export function listCharities(): Charity[] {
  return DEFAULT_CHARITIES;
}

export function listEscrowBookings(): EscrowBooking[] {
  return BOOKINGS.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function getEscrowBooking(id: string): EscrowBooking | undefined {
  return BOOKINGS.find((b) => b.id === id);
}

export function getBookingsForTrip(trip_id: string): EscrowBooking[] {
  return BOOKINGS.filter((b) => b.trip_id === trip_id);
}

export function createRequest(args: {
  trip_id: string;
  driver_id: string;
  seats: number;
  total_eur: number;
}): EscrowBooking {
  const booking: EscrowBooking = {
    id: uid('eb'),
    trip_id: args.trip_id,
    rider_id: SELF.id,
    driver_id: args.driver_id,
    seats: args.seats,
    total_eur: args.total_eur,
    state: { phase: 'requested' },
    history: [],
    created_at: new Date().toISOString(),
  };
  BOOKINGS = [booking, ...BOOKINGS];
  return booking;
}

export function driverAccept(id: string): EscrowBooking {
  const result = apply(id, { type: 'driver_accepts' });
  notify({
    type: 'booking_accepted',
    title: 'Booking accepted',
    body: 'The driver has accepted your booking request.',
    data: { booking_id: id, trip_id: result.trip_id },
  });
  return result;
}

export function riderDeposit(id: string, charity_id: string): EscrowBooking {
  const booking = getEscrowBooking(id);
  if (!booking) throw new Error('Booking not found');
  booking.charity_id = charity_id;
  return apply(id, { type: 'rider_deposits', payment_intent_id: `pi_mock_${id}` });
}

/**
 * Notice-board equivalent of `riderDeposit`. No money is held — this just
 * records that the rider has committed to showing up. The escrow state
 * machine still moves to `funds_held` so the rest of the flow (pickup
 * confirmation, ratings) works identically.
 */
export function riderCommitNoFunds(id: string): EscrowBooking {
  return apply(id, {
    type: 'rider_deposits',
    payment_intent_id: `noticeboard_${id}`,
  });
}

export function driverConfirmAtPickup(id: string): EscrowBooking {
  return apply(id, {
    type: 'driver_confirms_at_pickup',
    at_iso: new Date().toISOString(),
  });
}

export function riderConfirmAtPickup(id: string): EscrowBooking {
  return apply(id, {
    type: 'rider_confirms_at_pickup',
    at_iso: new Date().toISOString(),
  });
}

export function riderConfirmDropoff(id: string): EscrowBooking {
  const result = apply(id, {
    type: 'rider_confirms_dropoff',
    at_iso: new Date().toISOString(),
  });
  notify({
    type: 'trip_completed',
    title: 'Trip completed',
    body: 'The rider has confirmed drop-off. Trip complete!',
    data: { booking_id: id, trip_id: result.trip_id },
  });
  return result;
}

export function cancelByRider(id: string): EscrowBooking {
  return apply(id, { type: 'rider_cancels', at_iso: new Date().toISOString() });
}

export function cancelByDriver(id: string): EscrowBooking {
  return apply(id, { type: 'driver_cancels', at_iso: new Date().toISOString() });
}

export function timeoutResolve(id: string, args: { driver_present: boolean; rider_present: boolean }): EscrowBooking {
  return apply(id, {
    type: 'departure_window_passed',
    at_iso: new Date().toISOString(),
    driver_was_present: args.driver_present,
    rider_was_present: args.rider_present,
  });
}

function apply(id: string, event: EscrowEvent): EscrowBooking {
  const b = BOOKINGS.find((x) => x.id === id);
  if (!b) throw new Error('Booking not found');
  const next = transition(b.state, event);
  recordEvent(b, event, next);
  return b;
}

export function phaseDescription(phase: EscrowPhase) {
  return describePhase(phase);
}

// --- ratings ---------------------------------------------------------------

export function submitRating(input: {
  booking_id: string;
  rater_id: string;
  ratee_id: string;
  direction: RatingDirection;
  stars: MockRating['stars'];
  comment?: string;
}): MockRating {
  const r: MockRating = {
    id: uid('rt'),
    ...input,
    created_at: new Date().toISOString(),
  };
  RATINGS = [r, ...RATINGS];
  return r;
}

export function listRatingsFor(userId: string, asRole: 'driver' | 'rider'): MockRating[] {
  const direction: RatingDirection =
    asRole === 'driver' ? 'rider_rates_driver' : 'driver_rates_rider';
  return RATINGS.filter((r) => r.ratee_id === userId && r.direction === direction);
}

export function aggregateForUser(userId: string, asRole: 'driver' | 'rider'): AggregateRating {
  return aggregateRatings(listRatingsFor(userId, asRole));
}
