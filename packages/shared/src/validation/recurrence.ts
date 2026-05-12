import { z } from 'zod';

const dayOfWeek = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);

export const recurrencePatternSchema = z
  .object({
    label: z.string().min(1).max(120),
    category: z.enum(['commute', 'school', 'sports', 'event', 'other']),
    days: z.array(dayOfWeek).min(1).max(7),
    depart_local_time: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:mm'),
    timezone: z.string().optional(),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use yyyy-mm-dd')
      .optional(),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use yyyy-mm-dd')
      .optional(),
    exceptions: z
      .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
      .max(200)
      .optional(),
    term_time_only: z.boolean().optional(),
  })
  .refine(
    (p) => !p.start_date || !p.end_date || p.start_date <= p.end_date,
    { message: 'start_date must be on or before end_date' },
  );

export type RecurrencePatternInput = z.infer<typeof recurrencePatternSchema>;

export const createRecurringTripSchema = z.object({
  vehicle_id: z.string().uuid(),
  origin: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    name: z.string().min(1).max(200),
  }),
  destination: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    name: z.string().min(1).max(200),
  }),
  available_seats: z.number().int().min(1).max(7),
  actual_price_per_seat: z.number().positive().optional(),
  pattern: recurrencePatternSchema,
});

export type CreateRecurringTripInput = z.infer<typeof createRecurringTripSchema>;
