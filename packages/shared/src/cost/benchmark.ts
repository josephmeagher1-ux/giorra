import type { FuelType } from '../types/enums';

/**
 * Irish Civil Service motor travel rates per km (DPER Circular 16/2022,
 * effective 1 Sep 2022). Used as the Public Benchmark Ceiling (PBC).
 *
 * These rates are the highest publicly-defensible per-km figures that
 * Irish drivers are routinely reimbursed at without it being treated as
 * commercial income. EVs follow the 1201–1500cc band per the circular.
 *
 * Source: https://www.revenue.ie/en/employing-people/documents/dper-circular-16-2022-motor-travel-rates.pdf
 */
export const CIVIL_SERVICE_RATES = {
  effective_from: '2022-09-01',
  source: 'DPER Circular 16/2022',
  bands_km: [
    { id: 'band1', max_km: 1500 },
    { id: 'band2', max_km: 5500 },
    { id: 'band3', max_km: 25000 },
    { id: 'band4', max_km: Infinity },
  ],
  rates_per_km_eur: {
    up_to_1200cc: { band1: 0.4180, band2: 0.7264, band3: 0.3178, band4: 0.2056 },
    cc_1201_to_1500: { band1: 0.4340, band2: 0.7918, band3: 0.3179, band4: 0.2385 },
    cc_1501_and_over: { band1: 0.5182, band2: 0.9063, band3: 0.3922, band4: 0.2587 },
  },
  reduced_rates_per_km_eur: {
    up_to_1200cc: 0.2123,
    cc_1201_to_1500: 0.2380,
    cc_1501_and_over: 0.2596,
  },
} as const;

export type EngineClass = keyof typeof CIVIL_SERVICE_RATES.rates_per_km_eur;
export type BandId = 'band1' | 'band2' | 'band3' | 'band4';

export function classifyEngine(args: {
  fuel: FuelType;
  engine_cc?: number;
}): EngineClass {
  if (args.fuel === 'electric') return 'cc_1201_to_1500';
  if (!args.engine_cc) return 'cc_1201_to_1500';
  if (args.engine_cc <= 1200) return 'up_to_1200cc';
  if (args.engine_cc <= 1500) return 'cc_1201_to_1500';
  return 'cc_1501_and_over';
}

export function classifyBand(annual_business_km: number): BandId {
  if (annual_business_km <= 1500) return 'band1';
  if (annual_business_km <= 5500) return 'band2';
  if (annual_business_km <= 25000) return 'band3';
  return 'band4';
}

export function getBenchmarkPerKm(args: {
  fuel: FuelType;
  engine_cc?: number;
  annual_business_band_km?: number;
}): { per_km: number; engine_class: EngineClass; band: BandId; source: string } {
  const engine_class = classifyEngine(args);
  // Conservative default: assume Band 3 (most realistic for active carpoolers).
  // Drivers can supply annual_business_band_km to refine.
  const band = classifyBand(args.annual_business_band_km ?? 10000);
  const per_km = CIVIL_SERVICE_RATES.rates_per_km_eur[engine_class][band];
  return {
    per_km,
    engine_class,
    band,
    source: `${CIVIL_SERVICE_RATES.source} (${engine_class}, ${band})`,
  };
}
