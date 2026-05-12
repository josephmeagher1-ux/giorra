import { z } from 'zod';

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  name: z.string().min(1).max(200),
});

export const createTripSchema = z.object({
  origin: locationSchema,
  destination: locationSchema,
  vehicle_id: z.string().uuid(),
  departure_time: z.string().datetime(),
  available_seats: z.number().int().min(1).max(7),
  actual_price_per_seat: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
