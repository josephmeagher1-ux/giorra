-- Find trips whose route passes within detour_m meters of both pickup and dropoff
CREATE OR REPLACE FUNCTION search_trips_by_route(
  p_pickup       GEOGRAPHY,
  p_dropoff      GEOGRAPHY,
  p_depart_after TIMESTAMPTZ,
  p_depart_before TIMESTAMPTZ,
  p_detour_m     INTEGER DEFAULT 5000
)
RETURNS TABLE (
  trip_id              UUID,
  driver_id            UUID,
  origin_name          TEXT,
  dest_name            TEXT,
  departure_time       TIMESTAMPTZ,
  available_seats      INTEGER,
  booked_seats         INTEGER,
  actual_price_per_seat NUMERIC,
  distance_km          NUMERIC,
  pickup_distance_m    DOUBLE PRECISION,
  dropoff_distance_m   DOUBLE PRECISION
)
LANGUAGE sql STABLE
AS $$
  SELECT
    t.id,
    t.driver_id,
    t.origin_name,
    t.dest_name,
    t.departure_time,
    t.available_seats,
    t.booked_seats,
    t.actual_price_per_seat,
    t.distance_km,
    ST_Distance(t.route_geometry, p_pickup) AS pickup_distance_m,
    ST_Distance(t.route_geometry, p_dropoff) AS dropoff_distance_m
  FROM public.trips t
  WHERE t.status = 'published'
    AND t.departure_time >= p_depart_after
    AND t.departure_time <= p_depart_before
    AND (t.available_seats - t.booked_seats) >= 1
    AND ST_DWithin(t.route_geometry, p_pickup, p_detour_m)
    AND ST_DWithin(t.route_geometry, p_dropoff, p_detour_m)
  ORDER BY t.departure_time ASC, pickup_distance_m ASC;
$$;

-- Detect tolls along a route
CREATE OR REPLACE FUNCTION detect_tolls_on_route(p_route GEOGRAPHY)
RETURNS TABLE (
  toll_id       UUID,
  name          TEXT,
  road_code     TEXT,
  price_tagged  NUMERIC,
  price_untagged NUMERIC
)
LANGUAGE sql STABLE
AS $$
  SELECT id, name, road_code, price_tagged, price_untagged
  FROM public.toll_roads
  WHERE is_active = TRUE
    AND ST_DWithin(corridor_line, p_route, 200);
$$;
