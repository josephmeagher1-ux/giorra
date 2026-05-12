import { describe, it, expect } from 'vitest';
import { PLATFORM_FEE_EUR, computeSettlement, feeAppliesTo } from './fees';

describe('platform fee', () => {
  it('only applies on successful driver payouts', () => {
    expect(feeAppliesTo('driver')).toBe(true);
    expect(feeAppliesTo('charity')).toBe(false);
    expect(feeAppliesTo('refund')).toBe(false);
    expect(feeAppliesTo(undefined)).toBe(false);
  });

  it('splits driver payout and fee', () => {
    const s = computeSettlement({ total_eur: 12.5, destination: 'driver' });
    expect(s.platform_fee_eur).toBe(PLATFORM_FEE_EUR);
    expect(s.driver_payout_eur).toBeCloseTo(12.45, 2);
    expect(s.charity_payout_eur).toBe(0);
    expect(s.rider_refund_eur).toBe(0);
  });

  it('waives fee when total is too small', () => {
    const s = computeSettlement({ total_eur: 0.04, destination: 'driver' });
    expect(s.platform_fee_eur).toBe(0);
    expect(s.driver_payout_eur).toBeCloseTo(0.04, 2);
  });

  it('sends whole total to charity on rider no-show', () => {
    const s = computeSettlement({ total_eur: 10, destination: 'charity' });
    expect(s.charity_payout_eur).toBe(10);
    expect(s.platform_fee_eur).toBe(0);
  });

  it('refunds whole total to rider on driver no-show', () => {
    const s = computeSettlement({ total_eur: 10, destination: 'refund' });
    expect(s.rider_refund_eur).toBe(10);
    expect(s.platform_fee_eur).toBe(0);
  });
});
