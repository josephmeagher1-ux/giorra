-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toll_roads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_prices ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, owners can update their own
CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (true);
CREATE POLICY profiles_update ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Vehicles: owners can CRUD, others can read vehicles on trips they're involved with
CREATE POLICY vehicles_owner ON public.vehicles
  FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY vehicles_select ON public.vehicles
  FOR SELECT USING (true);

-- Trips: anyone can read published trips, drivers manage their own
CREATE POLICY trips_select ON public.trips
  FOR SELECT USING (status = 'published' OR driver_id = auth.uid());
CREATE POLICY trips_insert ON public.trips
  FOR INSERT WITH CHECK (driver_id = auth.uid());
CREATE POLICY trips_update ON public.trips
  FOR UPDATE USING (driver_id = auth.uid());
CREATE POLICY trips_delete ON public.trips
  FOR DELETE USING (driver_id = auth.uid() AND booked_seats = 0);

-- Bookings: riders manage their own, drivers can read/update on their trips
CREATE POLICY bookings_rider ON public.bookings
  FOR ALL USING (rider_id = auth.uid());
CREATE POLICY bookings_driver_select ON public.bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trips WHERE id = trip_id AND driver_id = auth.uid())
  );
CREATE POLICY bookings_driver_update ON public.bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.trips WHERE id = trip_id AND driver_id = auth.uid())
  );

-- Messages: trip participants can read and insert
CREATE POLICY messages_participant ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips WHERE id = trip_id AND driver_id = auth.uid()
      UNION
      SELECT 1 FROM public.bookings WHERE trip_id = messages.trip_id AND rider_id = auth.uid()
        AND status IN ('confirmed', 'paid', 'completed')
    )
  );
CREATE POLICY messages_insert ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.trips WHERE id = trip_id AND driver_id = auth.uid()
      UNION
      SELECT 1 FROM public.bookings WHERE trip_id = messages.trip_id AND rider_id = auth.uid()
        AND status IN ('confirmed', 'paid', 'completed')
    )
  );

-- Reviews: participants can insert for their bookings, anyone can read
CREATE POLICY reviews_select ON public.reviews FOR SELECT USING (true);
CREATE POLICY reviews_insert ON public.reviews
  FOR INSERT WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.bookings WHERE id = booking_id
        AND (rider_id = auth.uid() OR
             EXISTS (SELECT 1 FROM public.trips WHERE id = bookings.trip_id AND driver_id = auth.uid()))
        AND status = 'completed'
    )
  );

-- Toll roads and fuel prices: public read
CREATE POLICY toll_roads_select ON public.toll_roads FOR SELECT USING (true);
CREATE POLICY fuel_prices_select ON public.fuel_prices FOR SELECT USING (true);
