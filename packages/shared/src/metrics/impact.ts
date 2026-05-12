/**
 * Driver-impact metrics — the numbers we surface on the in-app dashboard so
 * drivers see the *positive* impact of using Drivey:
 *   - how much money they've shared (passengers contributing toward fuel
 *     and depreciation) — frames the platform as savings, not commerce.
 *   - how much carbon they've helped avoid by carrying passengers who would
 *     otherwise have driven separately.
 *
 * These reinforce Drivey's cost-sharing / sustainability narrative and give
 * drivers a reason to stay engaged beyond the ride itself.
 */

/**
 * Average CO₂ emissions for a private car in Ireland.
 * EPA / SEAI publish ~130 g/km for the current fleet average; we use the
 * SEAI 2025 figure rounded down for conservatism.
 */
export const CO2_G_PER_KM_PRIVATE_CAR = 130;

export interface ImpactSummary {
  trips_completed: number;
  total_km: number;
  total_passengers: number;
  cost_shared_eur: number;
  carbon_avoided_kg: number;
  equivalent_trees_planted: number;
}

/**
 * How much CO₂ a single trip with N passengers prevented from being emitted
 * — i.e., if those N passengers had each driven their own car, that's
 * `distance_km × passengers × g/km` of emissions Drivey saved.
 */
export function carbonAvoidedKg(args: {
  distance_km: number;
  passengers: number;
}): number {
  const grams = args.distance_km * args.passengers * CO2_G_PER_KM_PRIVATE_CAR;
  return Math.round(grams) / 1000; // kg, 1 g precision
}

/**
 * Roughly how many trees-of-a-year of CO₂ absorption the saved emissions
 * are equivalent to. Used purely for the in-app metaphor; one mature tree
 * absorbs ~22 kg CO₂/year (US DoE / EPA range).
 */
export function equivalentTreesPlanted(carbon_kg: number): number {
  return Math.round((carbon_kg / 22) * 10) / 10;
}

/**
 * Aggregate impact for a driver. Pass it the rows you'd otherwise load
 * from Postgres; the function is pure so the same logic runs on the
 * mobile mock data and on the server.
 */
export function summariseDriverImpact(
  trips: Array<{
    distance_km: number;
    passengers: number;
    per_seat_eur: number;
  }>,
): ImpactSummary {
  let km = 0;
  let pax = 0;
  let cash = 0;
  let co2kg = 0;
  for (const t of trips) {
    km += t.distance_km;
    pax += t.passengers;
    cash += t.passengers * t.per_seat_eur;
    co2kg += carbonAvoidedKg({ distance_km: t.distance_km, passengers: t.passengers });
  }
  return {
    trips_completed: trips.length,
    total_km: Math.round(km * 10) / 10,
    total_passengers: pax,
    cost_shared_eur: Math.round(cash * 100) / 100,
    carbon_avoided_kg: Math.round(co2kg * 10) / 10,
    equivalent_trees_planted: equivalentTreesPlanted(co2kg),
  };
}
