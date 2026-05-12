import { describe, it, expect } from 'vitest';
import {
  AUTO_TOPUP_THRESHOLD_EUR,
  FREE_DRIVER_TRIPS,
  MIN_TOPUP_EUR,
  REFUND_ADMIN_FEE_EUR,
  TOPUP_PACKS_EUR,
  WALLET_INACTIVITY_EXPIRY_MONTHS,
  effectivePerTripCost,
  freeTripsRemaining,
  newWallet,
  quoteWalletRefund,
  shouldAutoTopUp,
  topUpBonusFor,
  topUpCreditFor,
  walletHasExpired,
} from './wallet';

describe('wallet helpers', () => {
  it('newWallet starts at zero with auto-topup off', () => {
    const w = newWallet('d1');
    expect(w.balance_eur).toBe(0);
    expect(w.auto_topup_enabled).toBe(false);
  });

  it('shouldAutoTopUp respects enabled flag, payment method, and threshold', () => {
    const w = newWallet('d1');
    expect(shouldAutoTopUp(w)).toBe(false);
    w.auto_topup_enabled = true;
    expect(shouldAutoTopUp(w)).toBe(false);
    w.stripe_payment_method_id = 'pm_123';
    expect(shouldAutoTopUp(w)).toBe(true);
    w.balance_eur = AUTO_TOPUP_THRESHOLD_EUR + 0.01;
    expect(shouldAutoTopUp(w)).toBe(false);
  });

  it('effectivePerTripCost shrinks the per-trip cost as the pack grows', () => {
    const small = effectivePerTripCost({ pack_eur: 5, per_trip_fee_eur: 0.05 });
    const big = effectivePerTripCost({ pack_eur: 25, per_trip_fee_eur: 0.05 });
    expect(big.effective_per_trip_eur).toBeLessThan(small.effective_per_trip_eur);
    expect(big.trips_in_pack).toBeGreaterThan(small.trips_in_pack);
  });

  it('TOPUP_PACKS_EUR contains the documented denominations and a €5 minimum', () => {
    expect(TOPUP_PACKS_EUR).toEqual([5, 10, 25]);
    expect(MIN_TOPUP_EUR).toBe(5);
  });

  it('AUTO_TOPUP_THRESHOLD_EUR triggers at €0.20', () => {
    expect(AUTO_TOPUP_THRESHOLD_EUR).toBeCloseTo(0.2, 2);
  });

  it('freeTripsRemaining counts down from FREE_DRIVER_TRIPS and floors at 0', () => {
    expect(freeTripsRemaining({ confirmed_paid_trips_to_date: 0 })).toBe(FREE_DRIVER_TRIPS);
    expect(freeTripsRemaining({ confirmed_paid_trips_to_date: 3 })).toBe(FREE_DRIVER_TRIPS - 3);
    expect(freeTripsRemaining({ confirmed_paid_trips_to_date: FREE_DRIVER_TRIPS })).toBe(0);
    expect(freeTripsRemaining({ confirmed_paid_trips_to_date: 50 })).toBe(0);
  });
});

describe('top-up bonus', () => {
  it('the baseline €5 pack has no bonus', () => {
    expect(topUpBonusFor(5)).toBe(0);
    expect(topUpCreditFor(5)).toBe(5);
  });

  it('€10 pack matches the Stripe fees saved versus two €5 top-ups', () => {
    expect(topUpBonusFor(10)).toBeCloseTo(0.25, 2);
    expect(topUpCreditFor(10)).toBeCloseTo(10.25, 2);
  });

  it('€25 pack matches the Stripe fees saved versus five €5 top-ups', () => {
    expect(topUpBonusFor(25)).toBeCloseTo(1.0, 2);
    expect(topUpCreditFor(25)).toBeCloseTo(26.0, 2);
  });

  it('larger packs always beat the per-trip cost of the baseline pack', () => {
    const baseline = effectivePerTripCost({ pack_eur: 5, per_trip_fee_eur: 0.2 });
    const ten = effectivePerTripCost({ pack_eur: 10, per_trip_fee_eur: 0.2 });
    const twentyFive = effectivePerTripCost({ pack_eur: 25, per_trip_fee_eur: 0.2 });
    expect(ten.effective_per_trip_eur).toBeLessThan(baseline.effective_per_trip_eur);
    expect(twentyFive.effective_per_trip_eur).toBeLessThan(ten.effective_per_trip_eur);
  });

  it('per-pack net to Giorra matches the baseline-pack net at the same gross', () => {
    // Two €5 packs: gross €10, Stripe fees €0.64 → net €9.36
    // One €10 pack with bonus: gross €10, Stripe fee €0.39, +€0.25 bonus
    //   given back as credit → effective net €9.36
    const baselineNet = 2 * (5 - (5 * 0.014 + 0.25));
    const tenPackNet = 10 - (10 * 0.014 + 0.25) - topUpBonusFor(10);
    expect(tenPackNet).toBeCloseTo(baselineNet, 2);

    const fiveBaselinesNet = 5 * (5 - (5 * 0.014 + 0.25));
    const twentyFiveNet = 25 - (25 * 0.014 + 0.25) - topUpBonusFor(25);
    expect(twentyFiveNet).toBeCloseTo(fiveBaselinesNet, 2);
  });
});

describe('wallet refund quote', () => {
  it('refunds the unused cash minus the admin fee, forfeits the bonus', () => {
    // Driver topped up €10 (received €10.25 of credit), used €0.40 on trips.
    // Cash paid in: €10. Fees paid from wallet: €0.40. Current balance: €9.85.
    const q = quoteWalletRefund({
      cash_topped_up_eur: 10,
      fees_paid_from_wallet_eur: 0.4,
      current_balance_eur: 9.85,
    });
    expect(q.refundable_eur).toBeCloseTo(9.6, 2);
    expect(q.admin_fee_eur).toBe(REFUND_ADMIN_FEE_EUR);
    expect(q.net_refund_eur).toBeCloseTo(9.1, 2);
    expect(q.bonus_forfeit_eur).toBeCloseTo(0.25, 2);
  });

  it('returns zero refund (no admin fee) when cash is fully used up', () => {
    const q = quoteWalletRefund({
      cash_topped_up_eur: 10,
      fees_paid_from_wallet_eur: 10,
      current_balance_eur: 0.25,
    });
    expect(q.refundable_eur).toBe(0);
    expect(q.admin_fee_eur).toBe(0);
    expect(q.net_refund_eur).toBe(0);
    expect(q.bonus_forfeit_eur).toBeCloseTo(0.25, 2);
  });

  it('returns zero net refund when refundable is below the admin fee', () => {
    const q = quoteWalletRefund({
      cash_topped_up_eur: 5,
      fees_paid_from_wallet_eur: 4.8,
      current_balance_eur: 0.2,
    });
    // Refundable €0.20, admin fee €0.50 → clamp to €0
    expect(q.refundable_eur).toBeCloseTo(0.2, 2);
    expect(q.admin_fee_eur).toBe(REFUND_ADMIN_FEE_EUR);
    expect(q.net_refund_eur).toBe(0);
  });
});

describe('wallet expiry', () => {
  it('expires after the documented inactivity window', () => {
    expect(WALLET_INACTIVITY_EXPIRY_MONTHS).toBe(24);
    const now = '2028-05-11T00:00:00Z';
    expect(
      walletHasExpired({ last_activity_iso: '2026-05-11T00:00:00Z', now_iso: now }),
    ).toBe(true);
    expect(
      walletHasExpired({ last_activity_iso: '2027-12-01T00:00:00Z', now_iso: now }),
    ).toBe(false);
  });
});
