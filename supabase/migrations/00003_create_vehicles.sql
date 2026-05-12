CREATE TYPE fuel_type AS ENUM ('petrol', 'diesel', 'hybrid_petrol', 'hybrid_diesel', 'electric');

CREATE TABLE public.vehicles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  make                TEXT NOT NULL,
  model               TEXT NOT NULL,
  year                INTEGER NOT NULL CHECK (year >= 1990 AND year <= EXTRACT(YEAR FROM NOW()) + 1),
  fuel                fuel_type NOT NULL,
  consumption_l_100km NUMERIC(4,1),
  kwh_per_100km       NUMERIC(5,1),
  total_seats         INTEGER NOT NULL CHECK (total_seats >= 1 AND total_seats <= 8),
  colour              TEXT,
  registration        TEXT,
  is_default          BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_vehicles_default ON public.vehicles (owner_id) WHERE is_default = TRUE;
