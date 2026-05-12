import { describe, it, expect } from 'vitest';
import {
  DRIVER_TRIP_FEE_EUR,
  estimateStripeFee,
  MIN_INVOICE_TOTAL_EUR,
  shouldInvoiceNow,
  summarise,
  type FeeAccrual,
} from './accrual';

function make(overrides: Partial<FeeAccrual>): FeeAccrual {
  return {
    id: 'a' + Math.random(),
    driver_id: 'd1',
    booking_id: 'b' + Math.random(),
    amount_eur: DRIVER_TRIP_FEE_EUR,
    accrued_at: '2026-05-01T10:00:00Z',
    ...overrides,
  };
}

describe('fee accrual summarise', () => {
  it('totals only unsettled, non-voided accruals for that driver', () => {
    const accruals = [
      make({}),
      make({}),
      make({ settled_at: '2026-05-15T00:00:00Z' }),
      make({ voided_at: '2026-05-02T00:00:00Z', voided_reason: 'rider did not pay' }),
      make({ driver_id: 'd2' }),
    ];
    const s = summarise('d1', accruals);
    expect(s.trips_this_period).toBe(2);
    expect(s.outstanding_eur).toBeCloseTo(DRIVER_TRIP_FEE_EUR * 2, 2);
  });

  it('returns zero balance when no outstanding rows', () => {
    const s = summarise('d1', []);
    expect(s.outstanding_eur).toBe(0);
    expect(s.trips_this_period).toBe(0);
    expect(s.oldest_outstanding_iso).toBeUndefined();
  });

  it('flags invoice-now once balance hits the minimum invoice total', () => {
    const aboveThreshold = {
      driver_id: 'd',
      outstanding_eur: MIN_INVOICE_TOTAL_EUR,
      trips_this_period: 20,
    };
    expect(shouldInvoiceNow(aboveThreshold)).toBe(true);
    expect(shouldInvoiceNow({ ...aboveThreshold, outstanding_eur: 0.1 })).toBe(false);
  });
});

describe('estimateStripeFee', () => {
  it('SEPA DD is cheaper than card for typical monthly amounts', () => {
    const small = 2;
    const card = estimateStripeFee({ gross_eur: small, mechanism: 'card' });
    const sepa = estimateStripeFee({ gross_eur: small, mechanism: 'sepa_debit' });
    expect(sepa.stripe_fee_eur).toBeLessThan(card.stripe_fee_eur);
  });

  it('caps SEPA DD fee at €5 on large invoices', () => {
    const huge = estimateStripeFee({ gross_eur: 1000, mechanism: 'sepa_debit' });
    expect(huge.stripe_fee_eur).toBeLessThanOrEqual(5);
  });

  it('returns zeros for empty invoice', () => {
    const empty = estimateStripeFee({ gross_eur: 0, mechanism: 'sepa_debit' });
    expect(empty.stripe_fee_eur).toBe(0);
    expect(empty.net_to_drivey_eur).toBe(0);
    expect(empty.margin_pct).toBe(0);
  });

  it('reports the right margin at scale', () => {
    const ten = estimateStripeFee({ gross_eur: 10, mechanism: 'sepa_debit' });
    expect(ten.margin_pct).toBeGreaterThan(90);
    expect(ten.net_to_drivey_eur).toBeGreaterThan(9.5);
  });
});
