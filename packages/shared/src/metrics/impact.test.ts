import { describe, it, expect } from 'vitest';
import {
  CO2_G_PER_KM_PRIVATE_CAR,
  carbonAvoidedKg,
  equivalentTreesPlanted,
  summariseDriverImpact,
} from './impact';

describe('impact metrics', () => {
  it('carbonAvoidedKg uses the documented car emission factor', () => {
    const oneKm = carbonAvoidedKg({ distance_km: 1, passengers: 1 });
    expect(oneKm).toBeCloseTo(CO2_G_PER_KM_PRIVATE_CAR / 1000, 3);
  });

  it('scales linearly with passengers and distance', () => {
    const baseline = carbonAvoidedKg({ distance_km: 10, passengers: 1 });
    const threePassengers = carbonAvoidedKg({ distance_km: 10, passengers: 3 });
    const longTrip = carbonAvoidedKg({ distance_km: 30, passengers: 1 });
    expect(threePassengers).toBeCloseTo(baseline * 3, 2);
    expect(longTrip).toBeCloseTo(baseline * 3, 2);
  });

  it('summariseDriverImpact aggregates across multiple trips', () => {
    const s = summariseDriverImpact([
      { distance_km: 100, passengers: 2, per_seat_eur: 5 },
      { distance_km: 50, passengers: 1, per_seat_eur: 3 },
    ]);
    expect(s.trips_completed).toBe(2);
    expect(s.total_km).toBeCloseTo(150, 1);
    expect(s.total_passengers).toBe(3);
    expect(s.cost_shared_eur).toBeCloseTo(13, 2);
    expect(s.carbon_avoided_kg).toBeGreaterThan(0);
    expect(s.equivalent_trees_planted).toBeGreaterThan(0);
  });

  it('equivalentTreesPlanted scales sensibly with carbon mass', () => {
    expect(equivalentTreesPlanted(0)).toBe(0);
    expect(equivalentTreesPlanted(220)).toBeCloseTo(10, 1);
  });

  it('returns all-zeros for a driver with no trips', () => {
    const s = summariseDriverImpact([]);
    expect(s.trips_completed).toBe(0);
    expect(s.total_km).toBe(0);
    expect(s.cost_shared_eur).toBe(0);
    expect(s.carbon_avoided_kg).toBe(0);
  });
});
