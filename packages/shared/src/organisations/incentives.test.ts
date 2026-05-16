import { describe, it, expect } from 'vitest';
import { calculateIncentive, bestIncentiveForTrip, type TripContext } from './incentives';
import type { OrgIncentive, IncentiveClaim } from './types';

const commute: TripContext = {
  distance_km: 40,
  price_per_seat_eur: 5.50,
  category: 'commute',
  trip_id: 't1',
};

const perKmSub: OrgIncentive = {
  id: 'inc1',
  org_id: 'org1',
  type: 'per_km_subsidy',
  label: 'Per km',
  description: '',
  value_per_km_eur: 0.05,
  max_per_month_eur: 50,
  max_trips_per_month: 44,
  eligible_categories: ['commute'],
  active: true,
};

const flatBonus: OrgIncentive = {
  id: 'inc2',
  org_id: 'org1',
  type: 'flat_subsidy',
  label: 'Flat',
  description: '',
  value_eur: 25,
  max_per_month_eur: 25,
  eligible_categories: ['commute'],
  active: true,
};

const schoolFree: OrgIncentive = {
  id: 'inc3',
  org_id: 'org2',
  type: 'free_seats',
  label: 'School free',
  description: '',
  max_per_month_eur: 60,
  max_trips_per_month: 40,
  eligible_categories: ['school'],
  active: true,
};

describe('calculateIncentive', () => {
  it('calculates per-km subsidy', () => {
    const r = calculateIncentive(perKmSub, commute, []);
    expect(r.eligible).toBe(true);
    expect(r.amount_eur).toBe(2.00); // 40km * 0.05
  });

  it('rejects inactive incentive', () => {
    const inactive = { ...perKmSub, active: false };
    expect(calculateIncentive(inactive, commute, []).eligible).toBe(false);
  });

  it('rejects wrong category', () => {
    const r = calculateIncentive(schoolFree, commute, []);
    expect(r.eligible).toBe(false);
  });

  it('caps at monthly budget', () => {
    const claims: IncentiveClaim[] = Array.from({ length: 24 }, (_, i) => ({
      id: `c${i}`,
      membership_id: 'm1',
      incentive_id: 'inc1',
      trip_id: `t${i}`,
      amount_eur: 2.0,
      status: 'approved',
      created_at: new Date().toISOString(),
    }));
    const r = calculateIncentive(perKmSub, commute, claims);
    expect(r.eligible).toBe(true);
    expect(r.amount_eur).toBe(2.0); // 50 - 48 = 2 remaining
  });

  it('rejects when trip limit reached', () => {
    const claims: IncentiveClaim[] = Array.from({ length: 44 }, (_, i) => ({
      id: `c${i}`,
      membership_id: 'm1',
      incentive_id: 'inc1',
      trip_id: `t${i}`,
      amount_eur: 1.0,
      status: 'approved',
      created_at: new Date().toISOString(),
    }));
    const r = calculateIncentive(perKmSub, commute, claims);
    expect(r.eligible).toBe(false);
  });

  it('free seat covers full seat price', () => {
    const school: TripContext = { ...commute, category: 'school', price_per_seat_eur: 3.0 };
    const r = calculateIncentive(schoolFree, school, []);
    expect(r.eligible).toBe(true);
    expect(r.amount_eur).toBe(3.0);
  });
});

describe('bestIncentiveForTrip', () => {
  it('picks the highest-value incentive', () => {
    const best = bestIncentiveForTrip([perKmSub, flatBonus], commute, []);
    expect(best).not.toBeNull();
    expect(best!.incentive_id).toBe('inc2'); // flat 25 > per_km 2.0
  });

  it('returns null when nothing is eligible', () => {
    const school: TripContext = { ...commute, category: 'school' };
    const best = bestIncentiveForTrip([perKmSub, flatBonus], school, []);
    expect(best).toBeNull();
  });
});
