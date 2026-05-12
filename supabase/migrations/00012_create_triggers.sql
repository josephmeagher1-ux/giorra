-- Auto-update profile avg_rating when a review is inserted
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    avg_rating = (SELECT AVG(rating) FROM public.reviews WHERE reviewee_id = NEW.reviewee_id),
    total_ratings = (SELECT COUNT(*) FROM public.reviews WHERE reviewee_id = NEW.reviewee_id)
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_rating
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_profile_rating();

-- Auto-update trip booked_seats on booking status change
CREATE OR REPLACE FUNCTION update_booked_seats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.trips
  SET booked_seats = (
    SELECT COALESCE(SUM(seats_booked), 0)
    FROM public.bookings
    WHERE trip_id = COALESCE(NEW.trip_id, OLD.trip_id)
      AND status IN ('confirmed', 'paid', 'completed')
  )
  WHERE id = COALESCE(NEW.trip_id, OLD.trip_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_seats
AFTER INSERT OR UPDATE OF status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION update_booked_seats();

-- Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_trips_updated
BEFORE UPDATE ON public.trips
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bookings_updated
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
