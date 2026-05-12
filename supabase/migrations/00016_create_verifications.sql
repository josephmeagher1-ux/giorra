-- Verification records for driver identity, vehicle registration, and motor
-- insurance. Each subject has exactly one "current best" row per user (the
-- most recently updated), but every transition is also recorded as a
-- compliance_event for audit.

CREATE TYPE verification_subject AS ENUM (
  'driver_identity',
  'vehicle_registration',
  'motor_insurance'
);

CREATE TYPE verification_status AS ENUM (
  'not_started',
  'in_progress',
  'verified',
  'failed',
  'expired',
  'manual_review'
);

CREATE TABLE public.verifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject       verification_subject NOT NULL,
  provider      TEXT NOT NULL,
  status        verification_status NOT NULL DEFAULT 'not_started',
  external_ref  TEXT,
  evidence_uri  TEXT,
  notes         TEXT,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verifications_user ON public.verifications (user_id);
CREATE UNIQUE INDEX idx_verifications_active ON public.verifications (user_id, subject)
  WHERE status IN ('verified', 'manual_review', 'in_progress');

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY verifications_self_read ON public.verifications
  FOR SELECT USING (user_id = auth.uid());

-- Inserts/updates go through service role (edge functions) so a user
-- cannot self-declare verification.
