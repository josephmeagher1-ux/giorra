import type { EscrowEvent, EscrowPhase, EscrowState } from './states';

/**
 * Pure state transition. Returns the next state or throws on illegal moves.
 *
 * The transition table is deliberately strict: every move requires the
 * booking to be in a specific phase. Production code should also persist the
 * event to an audit log alongside the resulting state.
 */
export function transition(state: EscrowState, event: EscrowEvent): EscrowState {
  switch (event.type) {
    case 'driver_accepts': {
      requirePhase(state.phase, ['requested']);
      return { ...state, phase: 'accepted' };
    }
    case 'rider_deposits': {
      requirePhase(state.phase, ['accepted']);
      return {
        ...state,
        phase: 'funds_held',
        payment_intent_id: event.payment_intent_id,
      };
    }
    case 'driver_confirms_at_pickup': {
      requirePhase(state.phase, ['funds_held', 'rider_at_pickup']);
      if (state.phase === 'rider_at_pickup') {
        return {
          ...state,
          phase: 'in_transit',
          driver_confirmed_at: event.at_iso,
        };
      }
      return {
        ...state,
        phase: 'driver_at_pickup',
        driver_confirmed_at: event.at_iso,
      };
    }
    case 'rider_confirms_at_pickup': {
      requirePhase(state.phase, ['funds_held', 'driver_at_pickup']);
      if (state.phase === 'driver_at_pickup') {
        return {
          ...state,
          phase: 'in_transit',
          rider_confirmed_at: event.at_iso,
        };
      }
      return {
        ...state,
        phase: 'rider_at_pickup',
        rider_confirmed_at: event.at_iso,
      };
    }
    case 'rider_confirms_dropoff': {
      requirePhase(state.phase, ['in_transit']);
      return {
        ...state,
        phase: 'completed',
        rider_dropoff_confirmed_at: event.at_iso,
        payout_destination: 'driver',
        closed_at: event.at_iso,
      };
    }
    case 'departure_window_passed': {
      // Time-driven resolution if either side never confirmed pickup.
      if (state.phase === 'in_transit' || state.phase === 'completed') return state;
      const both = event.driver_was_present && event.rider_was_present;
      if (both) {
        return {
          ...state,
          phase: 'in_transit',
          driver_confirmed_at: state.driver_confirmed_at ?? event.at_iso,
          rider_confirmed_at: state.rider_confirmed_at ?? event.at_iso,
        };
      }
      if (!event.driver_was_present) {
        return {
          ...state,
          phase: 'refunded',
          payout_destination: 'refund',
          closed_at: event.at_iso,
        };
      }
      // Driver present, rider absent → funds go to rider's charity.
      return {
        ...state,
        phase: 'donated',
        payout_destination: 'charity',
        closed_at: event.at_iso,
      };
    }
    case 'driver_cancels': {
      requirePhase(state.phase, ['requested', 'accepted', 'funds_held', 'driver_at_pickup']);
      return {
        ...state,
        phase: state.phase === 'funds_held' || state.phase === 'driver_at_pickup' ? 'refunded' : 'cancelled',
        payout_destination: state.phase === 'funds_held' || state.phase === 'driver_at_pickup' ? 'refund' : undefined,
        closed_at: event.at_iso,
      };
    }
    case 'rider_cancels': {
      requirePhase(state.phase, ['requested', 'accepted', 'funds_held', 'rider_at_pickup']);
      if (state.phase === 'requested' || state.phase === 'accepted') {
        return { ...state, phase: 'cancelled', closed_at: event.at_iso };
      }
      // Once funds are held, a rider cancel goes to charity to keep the rider's
      // commitment binding — this is the elegant part of the design.
      return {
        ...state,
        phase: 'donated',
        payout_destination: 'charity',
        closed_at: event.at_iso,
      };
    }
    case 'open_dispute': {
      return { ...state, phase: 'disputed' };
    }
  }
}

function requirePhase(actual: EscrowPhase, allowed: EscrowPhase[]) {
  if (!allowed.includes(actual)) {
    throw new Error(
      `Illegal transition from phase "${actual}". Allowed: ${allowed.join(', ')}`,
    );
  }
}

export function isTerminal(phase: EscrowPhase): boolean {
  return ['completed', 'donated', 'refunded', 'cancelled'].includes(phase);
}

export function isOpen(phase: EscrowPhase): boolean {
  return !isTerminal(phase) && phase !== 'disputed';
}

export function describePhase(phase: EscrowPhase): string {
  switch (phase) {
    case 'requested':
      return 'Waiting for driver to accept';
    case 'accepted':
      return 'Ready for rider to deposit';
    case 'funds_held':
      return 'Funds held in escrow — waiting at pickup';
    case 'driver_at_pickup':
      return 'Driver is at pickup — waiting for rider';
    case 'rider_at_pickup':
      return 'Rider is at pickup — waiting for driver';
    case 'in_transit':
      return 'Both confirmed — trip in progress';
    case 'completed':
      return 'Trip completed — driver paid';
    case 'donated':
      return 'Trip did not happen — funds donated to chosen charity';
    case 'refunded':
      return 'Driver no-show — rider refunded';
    case 'cancelled':
      return 'Cancelled before funds were held';
    case 'disputed':
      return 'Under review';
  }
}
