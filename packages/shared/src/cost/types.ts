import type { FuelType } from '../types/enums';

export interface VehicleProfile {
  fuel: FuelType;
  year: number;
  consumption_l_100km?: number;
  kwh_per_100km?: number;
  engine_cc?: number;
  annual_insurance_eur?: number;
  annual_motor_tax_eur?: number;
  annual_nct_maintenance_eur?: number;
  expected_annual_km?: number;
}

export interface TollItem {
  name: string;
  price: number;
}

export interface CostInput {
  distance_km: number;
  vehicle: VehicleProfile;
  num_passengers: number;
  tolls: TollItem[];
  fuel_price_override?: number;
  detour_factor?: number;
  annual_business_band_km?: number;
  parking_eur?: number;
}

export interface PerKmComponents {
  fuel_cost_per_km: number;
  depreciation_per_km: number;
  maintenance_per_km: number;
  tyre_per_km: number;
  insurance_per_km: number;
  tax_nct_per_km: number;
  total_per_km: number;
}

export interface CeilingBreakdown {
  per_km: number;
  base_cost: number;
  toll_cost: number;
  parking_cost: number;
  total_trip_cost: number;
  per_seat: number;
  source: string;
}

export interface CostBreakdown {
  // legacy / per-km components (kept for backwards compat)
  fuel_cost_per_km: number;
  depreciation_per_km: number;
  maintenance_per_km: number;
  tyre_per_km: number;
  insurance_per_km: number;
  tax_nct_per_km: number;
  total_per_km: number;

  // trip totals
  distance_km: number;
  distance_km_adjusted: number;
  detour_factor: number;
  base_cost: number;
  toll_cost: number;
  parking_cost: number;
  total_trip_cost: number;
  num_occupants: number;
  cost_per_occupant: number;

  // ceilings
  ecc: CeilingBreakdown;
  pbc: CeilingBreakdown;

  // final
  max_price_per_seat: number;
  ceiling_source: 'ECC' | 'PBC';

  // audit
  fuel_price_used: number;
  consumption_used: number;
  formula_version: string;
  benchmark_source: string;
  computed_at: string;
}
