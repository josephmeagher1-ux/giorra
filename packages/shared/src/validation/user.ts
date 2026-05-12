import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(100),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number')
    .optional(),
  bio: z.string().max(500).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  full_name: z.string().min(1).max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;
