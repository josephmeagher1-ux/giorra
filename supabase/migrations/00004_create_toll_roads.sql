CREATE TABLE public.toll_roads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  road_code       TEXT NOT NULL,
  toll_point      GEOGRAPHY(POINT, 4326) NOT NULL,
  corridor_line   GEOGRAPHY(LINESTRING, 4326),
  price_tagged    NUMERIC(5,2) NOT NULL,
  price_untagged  NUMERIC(5,2) NOT NULL,
  direction       TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
