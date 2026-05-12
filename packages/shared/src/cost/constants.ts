import type { FuelType } from '../types/enums';

/**
 * Cost defaults sourced from AA Ireland 2026 averages.
 * Insurance/tax/NCT defaults are conservative averages used when a driver
 * has not provided vehicle-specific values. Drivers can override per-vehicle.
 */
export const COST_DEFAULTS = {
  maintenance_per_km: 0.04,
  tyre_per_km: 0.025,

  fuel_prices: {
    petrol: 1.81,
    diesel: 1.97,
    hybrid_petrol: 1.81,
    hybrid_diesel: 1.97,
    electric: 0.30,
  } satisfies Record<FuelType, number>,

  default_consumption: {
    petrol: 7.5,
    diesel: 6.5,
    hybrid_petrol: 4.5,
    hybrid_diesel: 4.0,
    electric: 18,
  } satisfies Record<FuelType, number>,

  depreciation_by_age: [
    { maxAge: 2, per_km: 0.08 },
    { maxAge: 5, per_km: 0.05 },
    { maxAge: 10, per_km: 0.03 },
    { maxAge: 15, per_km: 0.02 },
    { maxAge: Infinity, per_km: 0.01 },
  ],

  // Ownership cost defaults (very conservative; real drivers should provide own values)
  default_annual_insurance_eur: 700,
  default_annual_motor_tax_eur: 280,
  default_annual_nct_maintenance_eur: 200,
  default_expected_annual_km: 15000,

  // Ceiling guardrails
  default_detour_factor: 1.05,
  max_insurance_per_km: 0.10,
  max_tax_nct_per_km: 0.05,

  formula_version: '2026-05-dual-ceiling-v1',
} as const;
