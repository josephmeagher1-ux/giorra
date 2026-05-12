CREATE TABLE public.reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID NOT NULL REFERENCES public.bookings(id),
  reviewer_id   UUID NOT NULL REFERENCES public.profiles(id),
  reviewee_id   UUID NOT NULL REFERENCES public.profiles(id),
  rating        INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment       TEXT CHECK (LENGTH(comment) <= 500),
  created_at    TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(booking_id, reviewer_id)
);
