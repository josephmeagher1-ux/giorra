-- Recurring trip patterns: a single template that emits many trip instances.
-- Used for commute, school carpools, sports clubs, etc.

CREATE TYPE recurrence_category AS ENUM ('commute', 'school', 'sports', 'event', 'other');

CREATE TABLE public.recurring_patterns (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_id            UUID NOT NULL REFERENCES public.vehicles(id),

  label                 TEXT NOT NULL,
  category              recurrence_category NOT NULL DEFAULT 'commute',

  origin_point          GEOGRAPHY(POINT, 4326) NOT NULL,
  origin_name           TEXT NOT NULL,
  dest_point            GEOGRAPHY(POINT, 4326) NOT NULL,
  dest_name             TEXT NOT NULL,

  -- pattern definition
  days_of_week          TEXT[] NOT NULL,  -- ['mon','tue',...]
  depart_local_time     TEXT NOT NULL,    -- HH:mm
  timezone              TEXT NOT NULL DEFAULT 'Europe/Dublin',
  start_date            DATE,
  end_date              DATE,
  exceptions            DATE[] DEFAULT ARRAY[]::DATE[],
  term_time_only        BOOLEAN DEFAULT FALSE,

  -- pricing / capacity
  available_seats       INTEGER NOT NULL CHECK (available_seats >= 1 AND available_seats <= 7),
  max_price_per_seat    NUMERIC(6,2) NOT NULL,
  actual_price_per_seat NUMERIC(6,2) NOT NULL,
  cost_breakdown        JSONB NOT NULL,

  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT recurring_price_ceiling CHECK (actual_price_per_seat <= max_price_per_seat),
  CONSTRAINT recurring_dates_order CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);

CREATE INDEX idx_recurring_driver ON public.recurring_patterns (driver_id);
CREATE INDEX idx_recurring_active ON public.recurring_patterns (is_active);
CREATE INDEX idx_recurring_origin ON public.recurring_patterns USING GIST (origin_point);
CREATE INDEX idx_recurring_dest ON public.recurring_patterns USING GIST (dest_point);

-- Link generated trips back to their pattern (nullable for one-off trips).
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS recurring_pattern_id UUID REFERENCES public.recurring_patterns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurrence_instance_date DATE;

CREATE INDEX IF NOT EXISTS idx_trips_recurring_pattern ON public.trips (recurring_pattern_id)
  WHERE recurring_pattern_id IS NOT NULL;

ALTER TABLE public.recurring_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY recurring_driver_all ON public.recurring_patterns
  FOR ALL USING (driver_id = auth.uid());

CREATE POLICY recurring_select_active ON public.recurring_patterns
  FOR SELECT USING (is_active = TRUE);
