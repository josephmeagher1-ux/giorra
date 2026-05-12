/**
 * Giorra escrow booking lifecycle.
 *
 *  1. requested            — rider asks to join trip
 *  2. accepted             — driver accepts the request
 *  3. funds_held           — rider has deposited (Stripe authorize, capture later)
 *  4. driver_at_pickup     — driver tapped "I'm here"
 *  5. rider_at_pickup      — rider tapped "I'm here"
 *  6. in_transit           — both confirmed pickup; trip is running
 *  7. completed            — rider confirmed drop-off → driver paid out
 *  8. donated              — pickup never happened due to rider, funds go to
 *                            the rider's preselected charity
 *  9. refunded             — pickup never happened due to driver, rider made
 *                            whole
 * 10. cancelled            — early cancellation by either side before funds
 *                            were captured
 * 11. disputed             — needs manual review
 *
 * The state machine intentionally requires two-sided confirmation at pickup
 * so neither party can unilaterally claim a trip occurred. Riders pre-commit
 * to either driver-or-charity at deposit time, removing the rider's incentive
 * to ghost.
 */
export type EscrowPhase =
  | 'requested'
  | 'accepted'
  | 'funds_held'
  | 'driver_at_pickup'
  | 'rider_at_pickup'
  | 'in_transit'
  | 'completed'
  | 'donated'
  | 'refunded'
  | 'cancelled'
  | 'disputed';

export type EscrowActor = 'rider' | 'driver' | 'system';

export type EscrowEvent =
  | { type: 'driver_accepts' }
  | { type: 'rider_deposits'; payment_intent_id: string }
  | { type: 'driver_confirms_at_pickup'; at_iso: string }
  | { type: 'rider_confirms_at_pickup'; at_iso: string }
  | { type: 'rider_confirms_dropoff'; at_iso: string }
  | { type: 'departure_window_passed'; at_iso: string; driver_was_present: boolean; rider_was_present: boolean }
  | { type: 'driver_cancels'; at_iso: string }
  | { type: 'rider_cancels'; at_iso: string }
  | { type: 'open_dispute' };

export interface EscrowState {
  phase: EscrowPhase;
  driver_confirmed_at?: string;
  rider_confirmed_at?: string;
  rider_dropoff_confirmed_at?: string;
  payment_intent_id?: string;
  payout_destination?: 'driver' | 'charity' | 'refund';
  closed_at?: string;
}

export interface BookingFinancials {
  total_eur: number;
  /** Stripe paymentIntent reference for the held authorization */
  payment_intent_id?: string;
  /** Where the captured money ends up after settlement */
  payout_destination?: EscrowState['payout_destination'];
}
