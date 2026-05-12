CREATE TYPE trip_status AS ENUM ('draft', 'published', 'in_progress', 'completed', 'cancelled');

CREATE TABLE public.trips (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id               UUID NOT NULL REFERENCES public.profiles(id),
  vehicle_id              UUID NOT NULL REFERENCES public.vehicles(id),

  origin_point            GEOGRAPHY(POINT, 4326) NOT NULL,
  origin_name             TEXT NOT NULL,
  dest_point              GEOGRAPHY(POINT, 4326) NOT NULL,
  dest_name               TEXT NOT NULL,

  route_geometry          GEOGRAPHY(LINESTRING, 4326),
  route_polyline          TEXT,
  distance_km             NUMERIC(7,2) NOT NULL,
  duration_minutes        INTEGER,

  departure_time          TIMESTAMPTZ NOT NULL,
  is_recurring            BOOLEAN DEFAULT FALSE,
  recurrence_rule         TEXT,

  available_seats         INTEGER NOT NULL CHECK (available_seats >= 1),
  booked_seats            INTEGER DEFAULT 0,
  max_price_per_seat      NUMERIC(6,2) NOT NULL,
  actual_price_per_seat   NUMERIC(6,2) NOT NULL,
  toll_cost_total         NUMERIC(6,2) DEFAULT 0,

  cost_breakdown          JSONB NOT NULL,

  status                  trip_status DEFAULT 'published',
  notes                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT price_ceiling CHECK (actual_price_per_seat <= max_price_per_seat),
  CONSTRAINT seats_check CHECK (booked_seats <= available_seats)
);

CREATE INDEX idx_trips_route ON public.trips USING GIST (route_geometry);
CREATE INDEX idx_trips_origin ON public.trips USING GIST (origin_point);
CREATE INDEX idx_trips_dest ON public.trips USING GIST (dest_point);
CREATE INDEX idx_trips_departure ON public.trips (departure_time) WHERE status = 'published';
