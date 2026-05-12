-- Add escrow lifecycle and charity-fallback columns to bookings, plus a
-- per-booking event log for auditability.

CREATE TYPE escrow_phase AS ENUM (
  'requested',
  'accepted',
  'funds_held',
  'driver_at_pickup',
  'rider_at_pickup',
  'in_transit',
  'completed',
  'donated',
  'refunded',
  'cancelled',
  'disputed'
);

CREATE TYPE escrow_payout_destination AS ENUM ('driver', 'charity', 'refund');

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS escrow_phase escrow_phase NOT NULL DEFAULT 'requested',
  ADD COLUMN IF NOT EXISTS charity_id TEXT REFERENCES public.charities(id),
  ADD COLUMN IF NOT EXISTS driver_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rider_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rider_dropoff_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_destination escrow_payout_destination,
  ADD COLUMN IF NOT EXISTS payout_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escrow_closed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bookings_escrow_phase ON public.bookings (escrow_phase);
CREATE INDEX IF NOT EXISTS idx_bookings_charity ON public.bookings (charity_id);

CREATE TABLE public.booking_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id      UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  actor           TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}'::JSONB,
  resulting_phase escrow_phase NOT NULL,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_events_booking ON public.booking_events (booking_id, occurred_at);

ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY booking_events_participants_read ON public.booking_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND (b.rider_id = auth.uid()
             OR EXISTS (SELECT 1 FROM public.trips t WHERE t.id = b.trip_id AND t.driver_id = auth.uid()))
    )
  );
