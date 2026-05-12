-- Strengthen the existing reviews table with a direction enum so we can
-- compute driver-rated-by-rider vs rider-rated-by-driver separately.

DO $$ BEGIN
  CREATE TYPE review_direction AS ENUM ('rider_rates_driver', 'driver_rates_rider');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS direction review_direction NOT NULL DEFAULT 'rider_rates_driver';

CREATE INDEX IF NOT EXISTS idx_reviews_direction ON public.reviews (direction);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews (reviewee_id);
