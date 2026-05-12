CREATE TABLE public.messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES public.profiles(id),
  content     TEXT NOT NULL CHECK (LENGTH(content) <= 2000),
  is_system   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_trip ON public.messages (trip_id, created_at DESC);
