import { COST_DEFAULTS } from './constants';
import { getBenchmarkPerKm } from './benchmark';
import type {
  CostInput,
  CostBreakdown,
  CeilingBreakdown,
  PerKmComponents,
  VehicleProfile,
} from './types';

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

function getDepreciationPerKm(vehicleYear: number): number {
  const age = new Date().getFullYear() - vehicleYear;
  const bracket = COST_DEFAULTS.depreciation_by_age.find((b) => age <= b.maxAge);
  return bracket?.per_km ?? 0.01;
}

function getFuelCostPerKm(
  fuel: VehicleProfile['fuel'],
  consumption?: number,
  kwhPer100km?: number,
  fuelPriceOverride?: number,
): { costPerKm: number; fuelPrice: number; consumption: number } {
  if (fuel === 'electric') {
    const kwh = kwhPer100km ?? COST_DEFAULTS.default_consumption.electric;
    const pricePerKwh = fuelPriceOverride ?? COST_DEFAULTS.fuel_prices.electric;
    return {
      costPerKm: (kwh / 100) * pricePerKwh,
      fuelPrice: pricePerKwh,
      consumption: kwh,
    };
  }
  const litresPer100km = consumption ?? COST_DEFAULTS.default_consumption[fuel];
  const pricePerLitre = fuelPriceOverride ?? COST_DEFAULTS.fuel_prices[fuel];
  return {
    costPerKm: (litresPer100km / 100) * pricePerLitre,
    fuelPrice: pricePerLitre,
    consumption: litresPer100km,
  };
}

function getInsurancePerKm(vehicle: VehicleProfile): number {
  const annual = vehicle.annual_insurance_eur ?? COST_DEFAULTS.default_annual_insurance_eur;
  const km = vehicle.expected_annual_km ?? COST_DEFAULTS.default_expected_annual_km;
  if (km <= 0) return 0;
  return clamp(annual / km, 0, COST_DEFAULTS.max_insurance_per_km);
}

function getTaxNctPerKm(vehicle: VehicleProfile): number {
  const annual =
    (vehicle.annual_motor_tax_eur ?? COST_DEFAULTS.default_annual_motor_tax_eur) +
    (vehicle.annual_nct_maintenance_eur ?? COST_DEFAULTS.default_annual_nct_maintenance_eur);
  const km = vehicle.expected_annual_km ?? COST_DEFAULTS.default_expected_annual_km;
  if (km <= 0) return 0;
  return clamp(annual / km, 0, COST_DEFAULTS.max_tax_nct_per_km);
}

function buildPerKm(input: CostInput): PerKmComponents & { fuelPrice: number; consumption: number } {
  const { costPerKm: fuelCostPerKm, fuelPrice, consumption } = getFuelCostPerKm(
    input.vehicle.fuel,
    input.vehicle.consumption_l_100km,
    input.vehicle.kwh_per_100km,
    input.fuel_price_override,
  );
  const depreciationPerKm = getDepreciationPerKm(input.vehicle.year);
  const insurancePerKm = getInsurancePerKm(input.vehicle);
  const taxNctPerKm = getTaxNctPerKm(input.vehicle);
  const maintenancePerKm = COST_DEFAULTS.maintenance_per_km;
  const tyrePerKm = COST_DEFAULTS.tyre_per_km;
  const totalPerKm =
    fuelCostPerKm +
    depreciationPerKm +
    maintenancePerKm +
    tyrePerKm +
    insurancePerKm +
    taxNctPerKm;
  return {
    fuel_cost_per_km: fuelCostPerKm,
    depreciation_per_km: depreciationPerKm,
    maintenance_per_km: maintenancePerKm,
    tyre_per_km: tyrePerKm,
    insurance_per_km: insurancePerKm,
    tax_nct_per_km: taxNctPerKm,
    total_per_km: totalPerKm,
    fuelPrice,
    consumption,
  };
}

export function calculateTripCost(input: CostInput): CostBreakdown {
  const { distance_km, vehicle, num_passengers, tolls } = input;
  if (distance_km <= 0) throw new Error('Distance must be positive');
  if (num_passengers < 1) throw new Error('Must have at least 1 passenger');

  const detour_factor = input.detour_factor ?? COST_DEFAULTS.default_detour_factor;
  const distance_km_adjusted = distance_km * detour_factor;
  const tollCost = tolls.reduce((sum, t) => sum + t.price, 0);
  const parkingCost = input.parking_eur ?? 0;
  const numOccupants = num_passengers + 1;

  const components = buildPerKm(input);

  // Engineering Cost Ceiling (ECC) — built from real per-km cost
  const eccBase = components.total_per_km * distance_km_adjusted;
  const eccTotal = eccBase + tollCost + parkingCost;
  const ecc: CeilingBreakdown = {
    per_km: round(components.total_per_km),
    base_cost: round(eccBase),
    toll_cost: round(tollCost),
    parking_cost: round(parkingCost),
    total_trip_cost: round(eccTotal),
    per_seat: round(eccTotal / numOccupants),
    source: 'Engineering Cost Ceiling (fuel + depreciation + maintenance + tyres + insurance + tax/NCT)',
  };

  // Public Benchmark Ceiling (PBC) — official Civil Service rate
  const benchmark = getBenchmarkPerKm({
    fuel: vehicle.fuel,
    engine_cc: vehicle.engine_cc,
    annual_business_band_km: input.annual_business_band_km,
  });
  const pbcBase = benchmark.per_km * distance_km_adjusted;
  const pbcTotal = pbcBase + tollCost + parkingCost;
  const pbc: CeilingBreakdown = {
    per_km: round(benchmark.per_km),
    base_cost: round(pbcBase),
    toll_cost: round(tollCost),
    parking_cost: round(parkingCost),
    total_trip_cost: round(pbcTotal),
    per_seat: round(pbcTotal / numOccupants),
    source: benchmark.source,
  };

  // Final ceiling = min(ECC, PBC)
  const max_price_per_seat = Math.min(ecc.per_seat, pbc.per_seat);
  const ceiling_source: 'ECC' | 'PBC' = max_price_per_seat === ecc.per_seat ? 'ECC' : 'PBC';

  // For backward-compatibility, the "total_trip_cost" and "base_cost" we expose
  // at the top level reflect the binding ceiling.
  const binding = ceiling_source === 'ECC' ? ecc : pbc;

  return {
    fuel_cost_per_km: round(components.fuel_cost_per_km),
    depreciation_per_km: round(components.depreciation_per_km),
    maintenance_per_km: round(components.maintenance_per_km),
    tyre_per_km: round(components.tyre_per_km),
    insurance_per_km: round(components.insurance_per_km),
    tax_nct_per_km: round(components.tax_nct_per_km),
    total_per_km: round(components.total_per_km),

    distance_km: round(distance_km),
    distance_km_adjusted: round(distance_km_adjusted),
    detour_factor,
    base_cost: binding.base_cost,
    toll_cost: round(tollCost),
    parking_cost: round(parkingCost),
    total_trip_cost: binding.total_trip_cost,
    num_occupants: numOccupants,
    cost_per_occupant: round(max_price_per_seat),

    ecc,
    pbc,

    max_price_per_seat: round(max_price_per_seat),
    ceiling_source,

    fuel_price_used: components.fuelPrice,
    consumption_used: components.consumption,
    formula_version: COST_DEFAULTS.formula_version,
    benchmark_source: benchmark.source,
    computed_at: new Date().toISOString(),
  };
}
