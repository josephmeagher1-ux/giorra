/**
 * Platform fee accounting.
 *
 * Giorra takes a tiny per-successful-ride fee. It is invisible to the rider:
 * the rider always pays the agreed cost-shared price, and the fee comes out
 * of the driver's payout. That way the rider's payment never exceeds the
 * ECC/PBC ceiling and Giorra's framing as a non-commercial cost-sharing
 * platform is preserved.
 *
 * Implementation note: this is mirrored on Stripe Connect via
 * `application_fee_amount` on the PaymentIntent. The driver's Connected
 * Account receives `total - PLATFORM_FEE_EUR`, Giorra receives
 * `PLATFORM_FEE_EUR`. Stripe deducts its card processing fee from the
 * driver's side as well.
 */
import type { EscrowState } from './states';

/** Fixed platform fee per successful, settled trip, in EUR. */
export const PLATFORM_FEE_EUR = 0.05;

/**
 * Whether the platform fee is collected at all for a given final payout.
 * Charity fallback and refund paths skip the fee — Giorra only takes money
 * when there was a real, successful trip.
 */
export function feeAppliesTo(destination: EscrowState['payout_destination']) {
  return destination === 'driver';
}

export interface Settlement {
  total_eur: number;
  driver_payout_eur: number;
  charity_payout_eur: number;
  rider_refund_eur: number;
  platform_fee_eur: number;
}

/**
 * Splits a held total into final settlement amounts. The math is paranoid:
 * if a small total would make the fee exceed the driver's payout, the fee is
 * waived and Giorra takes nothing. Trips where the ECC/PBC ceiling rounds to
 * a tiny number (e.g. 0.04 EUR/seat) shouldn't end up with a negative driver
 * payout.
 */
export function computeSettlement(args: {
  total_eur: number;
  destination: EscrowState['payout_destination'];
}): Settlement {
  const base: Settlement = {
    total_eur: args.total_eur,
    driver_payout_eur: 0,
    charity_payout_eur: 0,
    rider_refund_eur: 0,
    platform_fee_eur: 0,
  };
  if (args.destination === 'driver') {
    if (args.total_eur <= PLATFORM_FEE_EUR) {
      return { ...base, driver_payout_eur: args.total_eur };
    }
    return {
      ...base,
      driver_payout_eur: round2(args.total_eur - PLATFORM_FEE_EUR),
      platform_fee_eur: PLATFORM_FEE_EUR,
    };
  }
  if (args.destination === 'charity') {
    return { ...base, charity_payout_eur: args.total_eur };
  }
  if (args.destination === 'refund') {
    return { ...base, rider_refund_eur: args.total_eur };
  }
  return base;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
