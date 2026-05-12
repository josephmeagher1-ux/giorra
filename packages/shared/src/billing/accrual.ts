/**
 * Driver-paid, post-trip success fee.
 *
 * Drivey charges the driver — never the rider — a small fixed amount per
 * completed trip where the driver confirms they received payment from the
 * rider. Aggregated and invoiced monthly via Stripe Billing metered usage,
 * so a per-trip Stripe processing fee is avoided.
 *
 * Why this shape:
 *   - The rider is not Drivey's customer → no B2C consumer-law exposure on
 *     the rider side.
 *   - The driver is a B2B customer of Drivey → light contract-based duties.
 *   - Drivey never touches rider→driver money → no Stripe Connect, no
 *     escrow obligations, no PCI scope for rider payments.
 *
 * Storage of FeeAccrual records lives in Supabase in production; the local
 * mobile store mirrors the shape for offline + dev.
 */

/**
 * Fee Drivey charges the driver per confirmed-paid trip, in EUR.
 *
 * Kept flat (not banded by trip price) so the cost-sharing framing stays
 * defensible: Drivey's fee never scales with rider price, so it cannot be
 * interpreted as a commission on transport. €0.20 is ~2% on a typical
 * €10 ride and ~1% on a longer route — well below any commercial taxi or
 * ride-share comparable.
 */
export const DRIVER_TRIP_FEE_EUR = 0.2;

/** Minimum total before an invoice is generated — keeps Stripe fees sane. */
export const MIN_INVOICE_TOTAL_EUR = 5.0;

/**
 * Stripe EU fee shape for the supported collection methods. Used by
 * `estimateStripeFee` to surface "Drivey nets €X" in the driver UI.
 *
 * Source: Stripe pricing for EU businesses, May 2026. Update when Stripe
 * publishes new rates.
 */
export const STRIPE_FEES = {
  card: { percentage: 0.014, fixed_eur: 0.25 },
  sepa_debit: { percentage: 0.008, fixed_eur: 0.25, cap_eur: 5 },
} as const;

export type BillingMechanism = 'sepa_debit' | 'card';

export interface FeeEstimate {
  gross_eur: number;
  stripe_fee_eur: number;
  net_to_drivey_eur: number;
  margin_pct: number;
}

export function estimateStripeFee(args: {
  gross_eur: number;
  mechanism: BillingMechanism;
}): FeeEstimate {
  if (args.gross_eur <= 0) {
    return { gross_eur: 0, stripe_fee_eur: 0, net_to_drivey_eur: 0, margin_pct: 0 };
  }
  const cfg = STRIPE_FEES[args.mechanism];
  const raw = args.gross_eur * cfg.percentage + cfg.fixed_eur;
  const capped = 'cap_eur' in cfg ? Math.min(raw, cfg.cap_eur) : raw;
  const fee = round2(capped);
  const net = round2(args.gross_eur - fee);
  return {
    gross_eur: args.gross_eur,
    stripe_fee_eur: fee,
    net_to_drivey_eur: net,
    margin_pct: Math.round((net / args.gross_eur) * 1000) / 10,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export interface FeeAccrual {
  id: string;
  driver_id: string;
  booking_id: string;
  amount_eur: number;
  accrued_at: string;
  /** Stripe usage_record id once reported to Stripe Billing */
  stripe_usage_record_id?: string;
  /** When the monthly invoice was settled */
  settled_at?: string;
  /** Set if the driver later disputes the accrual */
  voided_at?: string;
  voided_reason?: string;
}

export interface DriverFeeSummary {
  driver_id: string;
  outstanding_eur: number;
  trips_this_period: number;
  oldest_outstanding_iso?: string;
}

/** Sum the accruals that have not been settled or voided. */
export function summarise(driverId: string, accruals: FeeAccrual[]): DriverFeeSummary {
  const mine = accruals.filter(
    (a) => a.driver_id === driverId && !a.settled_at && !a.voided_at,
  );
  const total = mine.reduce((sum, a) => sum + a.amount_eur, 0);
  const oldest = mine
    .map((a) => a.accrued_at)
    .sort()
    .shift();
  return {
    driver_id: driverId,
    outstanding_eur: Math.round(total * 100) / 100,
    trips_this_period: mine.length,
    oldest_outstanding_iso: oldest,
  };
}

/**
 * Decide whether the driver has accumulated enough fees to be worth invoicing
 * now (rather than waiting for the calendar month-end). Useful when a driver
 * is highly active and has built up a real balance.
 */
export function shouldInvoiceNow(summary: DriverFeeSummary): boolean {
  return summary.outstanding_eur >= MIN_INVOICE_TOTAL_EUR;
}

export interface BillingMandate {
  driver_id: string;
  stripe_customer_id?: string;
  stripe_payment_method_id?: string;
  mandate_reference?: string;
  mechanism: BillingMechanism;
  status: 'pending' | 'active' | 'failed' | 'cancelled';
  iban_last4?: string;
  connected_at?: string;
}
