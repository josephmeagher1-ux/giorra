export type FuelType = 'petrol' | 'diesel' | 'hybrid_petrol' | 'hybrid_diesel' | 'electric';

export type TripStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'paid'
  | 'completed'
  | 'cancelled_rider'
  | 'cancelled_driver'
  | 'refunded'
  | 'disputed';
