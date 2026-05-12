-- Append-only audit log: every cost calculation, declaration acceptance,
-- and compliance-relevant event lands here. Useful if regulators or
-- insurers ever ask how a price was determined.

CREATE TYPE compliance_event_type AS ENUM (
  'cost_calculated',
  'declaration_accepted',
  'publish_blocked',
  'publish_allowed',
  'booking_blocked',
  'manual_review_flag'
);

CREATE TABLE public.compliance_events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  trip_id       UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  booking_id    UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  pattern_id    UUID REFERENCES public.recurring_patterns(id) ON DELETE SET NULL,
  event_type    compliance_event_type NOT NULL,
  payload       JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_user ON public.compliance_events (user_id);
CREATE INDEX idx_compliance_type_time ON public.compliance_events (event_type, created_at DESC);

ALTER TABLE public.compliance_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own events; nothing else exposes them.
CREATE POLICY compliance_self_read ON public.compliance_events
  FOR SELECT USING (user_id = auth.uid());

-- Inserts happen via service role only (edge functions); no anon insert policy.
