/**
 * Prepaid Drivey Wallet.
 *
 * Driver tops up a balance once (via Stripe Checkout one-off charge, Apple
 * Pay, Google Pay, or any other Stripe-supported payment method). Each
 * confirmed-paid trip debits the platform fee from the wallet. When the
 * balance gets low, the driver tops up again — optionally auto-charging a
 * stored card.
 *
 * Why this shape:
 *   - Single Stripe transaction per top-up amortises card processing fees
 *     across many trips.
 *   - No SEPA Direct Debit mandate (drivers don't have to surrender bank
 *     details).
 *   - No recurring authorization in the legal sense — every charge is a
 *     discrete one-off payment.
 *   - Wallet balance is held in Drivey's Stripe customer balance, not in a
 *     Drivey-controlled bank account, so no e-money licensing exposure.
 *   - Receivables risk is zero — drivers prepay.
 */

/**
 * New drivers get their first N confirmed-paid trips for free. They never
 * have to top up their wallet until they've actually proven the platform is
 * worth paying for. Keep this generous-but-finite — it's the lever for
 * onboarding new drivers.
 */
export const FREE_DRIVER_TRIPS = 10;

/** Top-up pack sizes offered to the driver. The minimum is €5. */
export const TOPUP_PACKS_EUR = [5, 10, 25] as const;
export type TopUpAmount = (typeof TOPUP_PACKS_EUR)[number];
export const MIN_TOPUP_EUR = TOPUP_PACKS_EUR[0];

/**
 * Default trigger for auto top-up when enabled. Picked so that a driver
 * always has at least a few trips of headroom before the next charge fires,
 * even if Stripe takes a day or two to settle the top-up.
 */
export const AUTO_TOPUP_THRESHOLD_EUR = 0.2;

/**
 * Inactivity period after which wallet credit expires and the residual
 * balance reverts to Drivey. EU prepaid-services rules allow this as long
 * as the term is reasonable (24 months is standard for SaaS credit) and
 * disclosed up-front at top-up time. Drivers can request a refund of
 * unused cash before expiry — see `quoteWalletRefund` below.
 */
export const WALLET_INACTIVITY_EXPIRY_MONTHS = 24;

/** Admin fee deducted from a wallet refund request. */
export const REFUND_ADMIN_FEE_EUR = 0.5;

export interface Wallet {
  driver_id: string;
  balance_eur: number;
  auto_topup_enabled: boolean;
  auto_topup_pack: TopUpAmount;
  /** Stripe PaymentMethod id stored for auto top-ups */
  stripe_payment_method_id?: string;
  updated_at: string;
}

export interface TopUpEvent {
  id: string;
  driver_id: string;
  gross_eur: number;
  stripe_fee_eur: number;
  net_credited_eur: number;
  source: 'manual' | 'auto';
  stripe_payment_intent_id?: string;
  created_at: string;
}

export function newWallet(driver_id: string): Wallet {
  return {
    driver_id,
    balance_eur: 0,
    auto_topup_enabled: false,
    auto_topup_pack: 10,
    updated_at: new Date().toISOString(),
  };
}

/**
 * How many free trips this driver has left. Pure helper so the same logic
 * runs on the server (Postgres count) and in the mobile mock.
 */
export function freeTripsRemaining(args: {
  confirmed_paid_trips_to_date: number;
}): number {
  return Math.max(0, FREE_DRIVER_TRIPS - args.confirmed_paid_trips_to_date);
}

export interface RefundQuote {
  cash_topped_up_eur: number;
  fees_paid_eur: number;
  refundable_eur: number;
  admin_fee_eur: number;
  net_refund_eur: number;
  bonus_forfeit_eur: number;
}

/**
 * Compute the legally-required refund for a driver who wants out.
 *
 * Refundable = total cash they actually paid minus what's already been
 * consumed by trips. The loyalty bonus credit is forfeit (never paid for in
 * cash, so it has no refundable value). A flat admin fee is deducted to
 * cover Stripe's unrecoverable processing fee on the original top-up plus
 * administrative overhead. Both are disclosed at top-up time.
 *
 * If the admin fee would push the refund below zero, the net refund is
 * floored at zero and the residual stays in Drivey's account.
 */
export function quoteWalletRefund(args: {
  cash_topped_up_eur: number;
  fees_paid_from_wallet_eur: number;
  current_balance_eur: number;
}): RefundQuote {
  const refundable = Math.max(
    0,
    round2(args.cash_topped_up_eur - args.fees_paid_from_wallet_eur),
  );
  const adminFee = refundable > 0 ? REFUND_ADMIN_FEE_EUR : 0;
  const netRefund = Math.max(0, round2(refundable - adminFee));
  const bonusForfeit = Math.max(0, round2(args.current_balance_eur - refundable));
  return {
    cash_topped_up_eur: round2(args.cash_topped_up_eur),
    fees_paid_eur: round2(args.fees_paid_from_wallet_eur),
    refundable_eur: refundable,
    admin_fee_eur: adminFee,
    net_refund_eur: netRefund,
    bonus_forfeit_eur: bonusForfeit,
  };
}

/**
 * Decide whether a wallet should be considered expired. Pure helper so the
 * same rule runs on the server cron job and in the mobile UI.
 */
export function walletHasExpired(args: {
  last_activity_iso: string;
  now_iso: string;
}): boolean {
  const last = new Date(args.last_activity_iso).getTime();
  const now = new Date(args.now_iso).getTime();
  const months =
    (now - last) / (1000 * 60 * 60 * 24 * (365.25 / 12));
  return months >= WALLET_INACTIVITY_EXPIRY_MONTHS;
}

export function shouldAutoTopUp(wallet: Wallet): boolean {
  return (
    wallet.auto_topup_enabled &&
    !!wallet.stripe_payment_method_id &&
    wallet.balance_eur < AUTO_TOPUP_THRESHOLD_EUR
  );
}

/**
 * Stripe card fee (EU): 1.4% + €0.25 per transaction. Used by the bonus
 * calculation so it stays correct if Stripe ever changes its rates.
 */
function stripeCardFeeEur(amount_eur: number) {
  return round2(amount_eur * 0.014 + 0.25);
}

/**
 * Bonus credit added to larger top-up packs.
 *
 * Designed so a single bigger top-up costs Drivey exactly the same as the
 * equivalent number of €5 top-ups would: every cent Drivey saves on Stripe
 * fees by consolidating into one transaction is given back to the driver
 * as wallet credit. Cost-neutral for Drivey, psychologically positive for
 * the driver ("loyalty perk").
 */
export function topUpBonusFor(amount_eur: TopUpAmount): number {
  if (amount_eur === MIN_TOPUP_EUR) return 0;
  const baselineFee = stripeCardFeeEur(MIN_TOPUP_EUR);
  const equivalentBaselineCount = amount_eur / MIN_TOPUP_EUR;
  const totalBaselineFees = baselineFee * equivalentBaselineCount;
  const thisPackFee = stripeCardFeeEur(amount_eur);
  const saved = totalBaselineFees - thisPackFee;
  return Math.max(0, round2(saved));
}

/** Total wallet credit received when topping up by `amount_eur`. */
export function topUpCreditFor(amount_eur: TopUpAmount): number {
  return round2(amount_eur + topUpBonusFor(amount_eur));
}

/**
 * Effective cost per trip given a top-up pack size and the Stripe card fee.
 * Used in the driver UI to show "your real cost per trip is €X" so they
 * can pick the most efficient pack. Accounts for the loyalty bonus on the
 * larger packs.
 */
export function effectivePerTripCost(args: {
  pack_eur: TopUpAmount;
  per_trip_fee_eur: number;
}) {
  const stripeFee = stripeCardFeeEur(args.pack_eur);
  const bonus = topUpBonusFor(args.pack_eur);
  const credit = args.pack_eur + bonus;
  const tripsInPack = Math.floor(credit / args.per_trip_fee_eur);
  const cashOutOfPocket = args.pack_eur + stripeFee;
  // Three-decimal precision so the savings between small and large packs
  // remain visible (the per-trip difference is in the third decimal).
  const perTrip = round3(cashOutOfPocket / tripsInPack);
  return {
    pack_eur: args.pack_eur,
    stripe_fee_eur: stripeFee,
    bonus_credit_eur: bonus,
    total_credit_eur: round2(credit),
    trips_in_pack: tripsInPack,
    effective_per_trip_eur: perTrip,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}
