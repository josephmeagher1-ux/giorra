import { z } from 'zod';

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  name: z.string().min(1).max(200),
});

export const createBookingSchema = z.object({
  trip_id: z.string().uuid(),
  seats: z.number().int().min(1).max(7),
  pickup: locationSchema,
  dropoff: locationSchema,
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
