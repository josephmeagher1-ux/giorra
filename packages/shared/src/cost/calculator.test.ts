import { describe, it, expect } from 'vitest';
import { calculateTripCost } from './calculator';
import type { CostInput } from './types';

const baseInput: CostInput = {
  distance_km: 200,
  vehicle: {
    fuel: 'petrol',
    year: 2020,
    consumption_l_100km: 7.5,
    engine_cc: 1400,
    expected_annual_km: 15000,
  },
  num_passengers: 3,
  tolls: [],
};

describe('calculateTripCost', () => {
  it('splits cost equally among driver + passengers', () => {
    const result = calculateTripCost(baseInput);
    expect(result.num_occupants).toBe(4);
    expect(result.cost_per_occupant).toBeCloseTo(result.total_trip_cost / 4, 1);
    expect(result.max_price_per_seat).toBe(result.cost_per_occupant);
  });

  it('produces both ECC and PBC breakdowns', () => {
    const result = calculateTripCost(baseInput);
    expect(result.ecc.per_seat).toBeGreaterThan(0);
    expect(result.pbc.per_seat).toBeGreaterThan(0);
    expect(result.ecc.source).toContain('Engineering');
    expect(result.pbc.source).toContain('DPER');
    expect(['ECC', 'PBC']).toContain(result.ceiling_source);
  });

  it('final ceiling is the minimum of ECC and PBC', () => {
    const result = calculateTripCost(baseInput);
    expect(result.max_price_per_seat).toBe(
      Math.min(result.ecc.per_seat, result.pbc.per_seat),
    );
  });

  it('calculates fuel cost correctly for petrol', () => {
    const result = calculateTripCost(baseInput);
    expect(result.fuel_cost_per_km).toBeCloseTo(0.14, 1);
    expect(result.fuel_price_used).toBe(1.81);
    expect(result.consumption_used).toBe(7.5);
  });

  it('calculates fuel cost correctly for diesel', () => {
    const result = calculateTripCost({
      ...baseInput,
      vehicle: {
        fuel: 'diesel',
        year: 2020,
        consumption_l_100km: 6.5,
        engine_cc: 1600,
      },
    });
    expect(result.fuel_cost_per_km).toBeCloseTo(0.13, 1);
    expect(result.fuel_price_used).toBe(1.97);
  });

  it('calculates fuel cost correctly for electric', () => {
    const result = calculateTripCost({
      ...baseInput,
      vehicle: { fuel: 'electric', year: 2023, kwh_per_100km: 18 },
    });
    expect(result.fuel_cost_per_km).toBeCloseTo(0.05, 1);
    expect(result.fuel_price_used).toBe(0.3);
  });

  it('adds tolls to both ECC and PBC totals', () => {
    const tolls = [
      { name: 'M50', price: 2.60 },
      { name: 'M7', price: 1.90 },
    ];
    const result = calculateTripCost({ ...baseInput, tolls });
    expect(result.toll_cost).toBe(4.50);
    expect(result.ecc.toll_cost).toBe(4.50);
    expect(result.pbc.toll_cost).toBe(4.50);
  });

  it('applies detour factor to adjusted distance', () => {
    const r = calculateTripCost({ ...baseInput, detour_factor: 1.2 });
    expect(r.distance_km_adjusted).toBeCloseTo(240, 1);
    expect(r.detour_factor).toBe(1.2);
  });

  it('adds parking cost when provided', () => {
    const r = calculateTripCost({ ...baseInput, parking_eur: 6 });
    expect(r.parking_cost).toBe(6);
    expect(r.ecc.parking_cost).toBe(6);
  });

  it('uses higher depreciation for newer vehicles', () => {
    const newCar = calculateTripCost({
      ...baseInput,
      vehicle: { ...baseInput.vehicle, year: new Date().getFullYear() - 1 },
    });
    const oldCar = calculateTripCost({
      ...baseInput,
      vehicle: { ...baseInput.vehicle, year: 2005 },
    });
    expect(newCar.depreciation_per_km).toBeGreaterThan(oldCar.depreciation_per_km);
  });

  it('costs more per seat with fewer passengers', () => {
    const onePassenger = calculateTripCost({ ...baseInput, num_passengers: 1 });
    const threePassengers = calculateTripCost({ ...baseInput, num_passengers: 3 });
    expect(onePassenger.max_price_per_seat).toBeGreaterThan(threePassengers.max_price_per_seat);
  });

  it('allows fuel price override', () => {
    const result = calculateTripCost({ ...baseInput, fuel_price_override: 2.10 });
    expect(result.fuel_price_used).toBe(2.10);
    expect(result.fuel_cost_per_km).toBeCloseTo(0.16, 1);
  });

  it('throws on zero distance', () => {
    expect(() => calculateTripCost({ ...baseInput, distance_km: 0 })).toThrow();
  });

  it('throws on zero passengers', () => {
    expect(() => calculateTripCost({ ...baseInput, num_passengers: 0 })).toThrow();
  });

  it('caps insurance/tax per-km even with absurd inputs', () => {
    const r = calculateTripCost({
      ...baseInput,
      vehicle: {
        ...baseInput.vehicle,
        annual_insurance_eur: 100_000,
        annual_motor_tax_eur: 100_000,
        annual_nct_maintenance_eur: 100_000,
        expected_annual_km: 100,
      },
    });
    expect(r.insurance_per_km).toBeLessThanOrEqual(0.10);
    expect(r.tax_nct_per_km).toBeLessThanOrEqual(0.05);
  });

  it('produces realistic Dublin to Cork pricing', () => {
    const result = calculateTripCost({
      distance_km: 260,
      vehicle: { fuel: 'petrol', year: 2020, consumption_l_100km: 7.5, engine_cc: 1400 },
      num_passengers: 3,
      tolls: [{ name: 'M7/M8 Portlaoise', price: 1.90 }],
    });
    expect(result.max_price_per_seat).toBeGreaterThan(8);
    expect(result.max_price_per_seat).toBeLessThan(25);
  });

  it('records formula version and benchmark source for audit', () => {
    const r = calculateTripCost(baseInput);
    expect(r.formula_version).toMatch(/dual-ceiling/);
    expect(r.benchmark_source).toContain('Circular 16/2022');
    expect(r.computed_at).toMatch(/T.*Z$/);
  });
});
