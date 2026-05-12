import { describe, it, expect } from 'vitest';
import { canPerformAction, findGapsForAction, bestRecord } from './policy';
import type { VerificationRecord } from './types';

function rec(over: Partial<VerificationRecord>): VerificationRecord {
  return {
    id: over.id ?? 'r',
    user_id: 'me',
    subject: over.subject ?? 'driver_identity',
    provider: over.provider ?? 'manual_review',
    status: over.status ?? 'verified',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: over.updated_at ?? '2026-05-01T00:00:00Z',
    expires_at: over.expires_at,
  };
}

describe('identity policy', () => {
  it('returns all three gaps for a fresh driver', () => {
    const r = canPerformAction({ action: 'post_trip', records: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.gaps).toHaveLength(3);
  });

  it('clears gaps when all three subjects are verified and unexpired', () => {
    const records = [
      rec({ id: 'a', subject: 'driver_identity', expires_at: '2099-01-01T00:00:00Z' }),
      rec({ id: 'b', subject: 'vehicle_registration', expires_at: '2099-01-01T00:00:00Z' }),
      rec({ id: 'c', subject: 'motor_insurance', expires_at: '2099-01-01T00:00:00Z' }),
    ];
    expect(canPerformAction({ action: 'post_trip', records })).toEqual({ ok: true });
  });

  it('marks expired records as expired', () => {
    const records = [
      rec({ id: 'a', subject: 'driver_identity', expires_at: '2099-01-01T00:00:00Z' }),
      rec({ id: 'b', subject: 'vehicle_registration', expires_at: '2099-01-01T00:00:00Z' }),
      rec({ id: 'c', subject: 'motor_insurance', expires_at: '2020-01-01T00:00:00Z' }),
    ];
    const gaps = findGapsForAction({ action: 'post_trip', records });
    expect(gaps).toEqual([{ subject: 'motor_insurance', reason: 'expired', current_status: 'verified' }]);
  });

  it('book_seat allows un-verified rider today', () => {
    const r = canPerformAction({ action: 'book_seat', records: [] });
    expect(r.ok).toBe(true);
  });

  it('bestRecord picks the most recently updated', () => {
    const r = bestRecord(
      [
        rec({ id: 'old', updated_at: '2026-01-01T00:00:00Z' }),
        rec({ id: 'new', updated_at: '2026-05-01T00:00:00Z' }),
      ],
      'driver_identity',
    );
    expect(r?.id).toBe('new');
  });
});
