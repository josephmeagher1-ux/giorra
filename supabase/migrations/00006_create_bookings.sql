CREATE TYPE booking_status AS ENUM (
  'pending',
  'confirmed',
  'paid',
  'completed',
  'cancelled_rider',
  'cancelled_driver',
  'refunded',
  'disputed'
);

CREATE TABLE public.bookings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id             UUID NOT NULL REFERENCES public.trips(id),
  rider_id            UUID NOT NULL REFERENCES public.profiles(id),
  seats_booked        INTEGER NOT NULL DEFAULT 1 CHECK (seats_booked >= 1),

  pickup_point        GEOGRAPHY(POINT, 4326) NOT NULL,
  pickup_name         TEXT NOT NULL,
  dropoff_point       GEOGRAPHY(POINT, 4326) NOT NULL,
  dropoff_name        TEXT NOT NULL,

  price_per_seat      NUMERIC(6,2) NOT NULL,
  total_price         NUMERIC(6,2) NOT NULL,
  platform_fee        NUMERIC(6,2) DEFAULT 0,

  payment_intent_id   TEXT,
  payment_status      TEXT,

  status              booking_status DEFAULT 'pending',
  cancelled_at        TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(trip_id, rider_id)
);
