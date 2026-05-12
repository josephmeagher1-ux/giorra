import { z } from 'zod';

const fuelTypes = ['petrol', 'diesel', 'hybrid_petrol', 'hybrid_diesel', 'electric'] as const;

export const vehicleSchema = z.object({
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear() + 1),
  fuel: z.enum(fuelTypes),
  consumption_l_100km: z.number().positive().max(30).optional(),
  kwh_per_100km: z.number().positive().max(50).optional(),
  engine_cc: z.number().int().positive().max(8000).optional(),
  total_seats: z.number().int().min(1).max(8),
  colour: z.string().max(50).optional(),
  registration: z.string().max(20).optional(),

  // Ownership cost inputs (used by the dual-ceiling pricing engine)
  annual_insurance_eur: z.number().nonnegative().max(10_000).optional(),
  annual_motor_tax_eur: z.number().nonnegative().max(5_000).optional(),
  annual_nct_maintenance_eur: z.number().nonnegative().max(5_000).optional(),
  expected_annual_km: z.number().int().positive().max(200_000).optional(),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
