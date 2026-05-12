import { describe, it, expect } from 'vitest';
import { checkPublishGuards, checkBookingArrangement } from './guards';

describe('compliance guards', () => {
  it('blocks too many trips per day', () => {
    const r = checkPublishGuards({
      trips_today: 6,
      trips_this_week: 10,
      contribution_received_ytd_eur: 0,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('too_many_trips_today');
  });

  it('blocks past annual contribution', () => {
    const r = checkPublishGuards({
      trips_today: 0,
      trips_this_week: 0,
      contribution_received_ytd_eur: 9000,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('annual_contribution_block');
  });

  it('permits typical usage', () => {
    const r = checkPublishGuards({
      trips_today: 1,
      trips_this_week: 3,
      contribution_received_ytd_eur: 100,
    });
    expect(r.ok).toBe(true);
  });

  it('requires pre-arrangement before departure', () => {
    const now = '2026-05-11T20:00:00Z';
    const tooSoon = checkBookingArrangement({
      now_iso: now,
      departure_iso: '2026-05-11T20:10:00Z',
    });
    expect(tooSoon.ok).toBe(false);
    const fine = checkBookingArrangement({
      now_iso: now,
      departure_iso: '2026-05-11T22:00:00Z',
    });
    expect(fine.ok).toBe(true);
  });
});
