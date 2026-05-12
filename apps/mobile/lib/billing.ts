/**
 * Driver-billing data layer.
 *
 * Combines:
 *   1. A prepaid wallet (driver tops up via Stripe Checkout one-off; trip
 *      fees debit the balance).
 *   2. An append-only accrual log for audit + reporting.
 *
 * The same shapes are used by the Supabase tables in production; this file
 * is the in-memory mock.
 */
import {
  AUTO_TOPUP_THRESHOLD_EUR,
  DRIVER_TRIP_FEE_EUR,
  FREE_DRIVER_TRIPS,
  freeTripsRemaining as sharedFreeTripsRemaining,
  newWallet,
  quoteWalletRefund as sharedQuoteWalletRefund,
  shouldAutoTopUp,
  summariseFeeAccruals,
  topUpBonusFor,
  topUpCreditFor,
  type DriverFeeSummary,
  type FeeAccrual,
  type RefundQuote,
  type TopUpAmount,
  type TopUpEvent,
  type Wallet,
} from '@drivey/shared';

let ACCRUALS: FeeAccrual[] = [];
let WALLETS = new Map<string, Wallet>();
let TOPUPS: TopUpEvent[] = [];
let REFUND_REQUESTS: Array<{
  id: string;
  driver_id: string;
  quote: RefundQuote;
  requested_at: string;
  status: 'pending_email_confirmation';
}> = [];

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function ensureWallet(driver_id: string): Wallet {
  let w = WALLETS.get(driver_id);
  if (!w) {
    w = newWallet(driver_id);
    WALLETS.set(driver_id, w);
  }
  return w;
}

export function getWallet(driver_id: string): Wallet {
  return ensureWallet(driver_id);
}

export function listTopUps(driver_id: string): TopUpEvent[] {
  return TOPUPS.filter((t) => t.driver_id === driver_id);
}

/**
 * Credit the wallet by `amount_eur`. In production this is called from a
 * Stripe webhook after `payment_intent.succeeded`. The Stripe fee is
 * recorded for transparency in the UI.
 */
export function creditWallet(args: {
  driver_id: string;
  amount_eur: TopUpAmount;
  source: 'manual' | 'auto';
  stripe_payment_intent_id?: string;
}): { wallet: Wallet; topup: TopUpEvent; bonus_eur: number } {
  const w = ensureWallet(args.driver_id);
  const fee = round2(args.amount_eur * 0.014 + 0.25);
  const bonus = topUpBonusFor(args.amount_eur);
  const credit = topUpCreditFor(args.amount_eur);
  const event: TopUpEvent = {
    id: uid('tup'),
    driver_id: args.driver_id,
    gross_eur: args.amount_eur,
    stripe_fee_eur: fee,
    net_credited_eur: credit,
    source: args.source,
    stripe_payment_intent_id: args.stripe_payment_intent_id,
    created_at: new Date().toISOString(),
  };
  const next: Wallet = {
    ...w,
    balance_eur: round2(w.balance_eur + credit),
    updated_at: event.created_at,
  };
  WALLETS.set(args.driver_id, next);
  TOPUPS = [event, ...TOPUPS];
  return { wallet: next, topup: event, bonus_eur: bonus };
}

/**
 * Driver confirmed they received payment from the rider. Records the accrual
 * and (depending on the driver's state) either burns a free-trip credit,
 * debits the wallet by DRIVER_TRIP_FEE_EUR, or leaves it outstanding when
 * the wallet is empty.
 *
 * Outcome flags returned to the caller so the UI can show the right message.
 */
export type AccrualOutcome = 'free_trip' | 'paid_from_wallet' | 'outstanding';

export function accrueDriverFee(args: { driver_id: string; booking_id: string }): {
  accrual: FeeAccrual;
  wallet: Wallet;
  outcome: AccrualOutcome;
  free_trips_remaining: number;
} {
  const w = ensureWallet(args.driver_id);
  const existing = ACCRUALS.find(
    (a) => a.driver_id === args.driver_id && a.booking_id === args.booking_id,
  );
  if (existing) {
    const outcome: AccrualOutcome =
      existing.amount_eur === 0
        ? 'free_trip'
        : existing.settled_at
          ? 'paid_from_wallet'
          : 'outstanding';
    return {
      accrual: existing,
      wallet: w,
      outcome,
      free_trips_remaining: freeTripsRemaining(args.driver_id),
    };
  }

  const usedFree = ACCRUALS.filter(
    (a) => a.driver_id === args.driver_id && !a.voided_at && a.amount_eur === 0,
  ).length;
  const onFreeTier = usedFree < FREE_DRIVER_TRIPS;
  const now = new Date().toISOString();

  let accrual: FeeAccrual;
  let outcome: AccrualOutcome;
  let nextWallet = w;

  if (onFreeTier) {
    accrual = {
      id: uid('fee'),
      driver_id: args.driver_id,
      booking_id: args.booking_id,
      amount_eur: 0,
      accrued_at: now,
      settled_at: now,
    };
    outcome = 'free_trip';
  } else if (w.balance_eur >= DRIVER_TRIP_FEE_EUR) {
    accrual = {
      id: uid('fee'),
      driver_id: args.driver_id,
      booking_id: args.booking_id,
      amount_eur: DRIVER_TRIP_FEE_EUR,
      accrued_at: now,
      settled_at: now,
    };
    nextWallet = {
      ...w,
      balance_eur: round2(w.balance_eur - DRIVER_TRIP_FEE_EUR),
      updated_at: now,
    };
    WALLETS.set(args.driver_id, nextWallet);
    outcome = 'paid_from_wallet';
  } else {
    accrual = {
      id: uid('fee'),
      driver_id: args.driver_id,
      booking_id: args.booking_id,
      amount_eur: DRIVER_TRIP_FEE_EUR,
      accrued_at: now,
    };
    outcome = 'outstanding';
  }

  ACCRUALS = [accrual, ...ACCRUALS];

  return {
    accrual,
    wallet: nextWallet,
    outcome,
    free_trips_remaining: freeTripsRemaining(args.driver_id),
  };
}

/**
 * How many free trips the driver has left. Counts every non-voided free-tier
 * accrual against the global `FREE_DRIVER_TRIPS` quota.
 */
export function freeTripsRemaining(driver_id: string): number {
  const usedFree = ACCRUALS.filter(
    (a) => a.driver_id === driver_id && !a.voided_at && a.amount_eur === 0,
  ).length;
  return sharedFreeTripsRemaining({ confirmed_paid_trips_to_date: usedFree });
}

export function setAutoTopUp(args: {
  driver_id: string;
  enabled: boolean;
  pack?: TopUpAmount;
  stripe_payment_method_id?: string;
}): Wallet {
  const w = ensureWallet(args.driver_id);
  const next: Wallet = {
    ...w,
    auto_topup_enabled: args.enabled,
    auto_topup_pack: args.pack ?? w.auto_topup_pack,
    stripe_payment_method_id:
      args.stripe_payment_method_id ?? w.stripe_payment_method_id,
    updated_at: new Date().toISOString(),
  };
  WALLETS.set(args.driver_id, next);
  return next;
}

/**
 * Check whether the driver's wallet should auto top up right now. In
 * production this runs as a background job after each accrual.
 */
export function maybeAutoTopUp(driver_id: string): TopUpEvent | undefined {
  const w = ensureWallet(driver_id);
  if (!shouldAutoTopUp(w)) return undefined;
  const { topup } = creditWallet({
    driver_id,
    amount_eur: w.auto_topup_pack,
    source: 'auto',
  });
  return topup;
}

export function listAccrualsForDriver(driver_id: string): FeeAccrual[] {
  return ACCRUALS.filter((a) => a.driver_id === driver_id);
}

export function summaryFor(driver_id: string): DriverFeeSummary {
  return summariseFeeAccruals(driver_id, ACCRUALS);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Refund quote for a driver who's leaving the platform. Uses the shared
 * legal model: cash topped up minus fees paid, less a flat admin fee, with
 * the bonus credit forfeit. Hidden in account settings — drivers must
 * actively navigate there to find it.
 */
export function quoteRefundFor(driver_id: string): RefundQuote {
  const w = ensureWallet(driver_id);
  const cashIn = TOPUPS.filter((t) => t.driver_id === driver_id).reduce(
    (s, t) => s + t.gross_eur,
    0,
  );
  const feesPaid = ACCRUALS.filter(
    (a) => a.driver_id === driver_id && a.settled_at,
  ).reduce((s, a) => s + a.amount_eur, 0);
  return sharedQuoteWalletRefund({
    cash_topped_up_eur: cashIn,
    fees_paid_from_wallet_eur: feesPaid,
    current_balance_eur: w.balance_eur,
  });
}

/**
 * Submit a refund request. In production this triggers a Stripe Refund on
 * the most recent top-ups (FIFO) and an email confirmation to the driver.
 * Mock-mode: records the request and immediately marks the wallet emptied.
 */
export function requestRefund(driver_id: string): {
  quote: RefundQuote;
  request_id: string;
} {
  const w = ensureWallet(driver_id);
  const quote = quoteRefundFor(driver_id);
  const id = uid('ref');
  REFUND_REQUESTS.push({
    id,
    driver_id,
    quote,
    requested_at: new Date().toISOString(),
    status: 'pending_email_confirmation',
  });
  WALLETS.set(driver_id, {
    ...w,
    balance_eur: 0,
    updated_at: new Date().toISOString(),
  });
  return { quote, request_id: id };
}

export { AUTO_TOPUP_THRESHOLD_EUR, FREE_DRIVER_TRIPS };
