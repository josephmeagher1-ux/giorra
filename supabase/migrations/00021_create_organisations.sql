-- Organisations: employers, schools, universities enrolled in Smarter Travel or similar

CREATE TYPE org_type AS ENUM ('employer', 'school', 'university', 'community');
CREATE TYPE incentive_type AS ENUM ('flat_subsidy', 'per_km_subsidy', 'free_seats', 'priority_matching', 'tax_saver');
CREATE TYPE membership_role AS ENUM ('member', 'admin', 'champion');
CREATE TYPE verification_method AS ENUM ('email_domain', 'invite_code', 'admin_approval');
CREATE TYPE claim_status AS ENUM ('pending', 'approved', 'paid', 'rejected');

CREATE TABLE public.organisations (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    TEXT NOT NULL,
  type                    org_type NOT NULL,
  domain                  TEXT,
  logo_url                TEXT,
  smarter_travel_enrolled BOOLEAN DEFAULT FALSE,
  monthly_budget_eur      NUMERIC(8,2),
  contact_email           TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.org_incentives (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id                  UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  type                    incentive_type NOT NULL,
  label                   TEXT NOT NULL,
  description             TEXT,
  value_eur               NUMERIC(6,2),
  value_per_km_eur        NUMERIC(4,3),
  max_per_month_eur       NUMERIC(6,2),
  max_trips_per_month     INTEGER,
  eligible_categories     TEXT[] NOT NULL DEFAULT '{any}',
  active                  BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.org_memberships (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  role          membership_role DEFAULT 'member',
  verified      BOOLEAN DEFAULT FALSE,
  verified_via  verification_method,
  joined_at     TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, org_id)
);

CREATE TABLE public.incentive_claims (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membership_id   UUID NOT NULL REFERENCES public.org_memberships(id),
  incentive_id    UUID NOT NULL REFERENCES public.org_incentives(id),
  trip_id         UUID NOT NULL REFERENCES public.trips(id),
  amount_eur      NUMERIC(6,2) NOT NULL,
  status          claim_status DEFAULT 'pending',
  reviewed_by     UUID REFERENCES public.profiles(id),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_org_memberships_user ON public.org_memberships (user_id);
CREATE INDEX idx_org_memberships_org ON public.org_memberships (org_id);
CREATE INDEX idx_incentive_claims_membership ON public.incentive_claims (membership_id, created_at DESC);
CREATE INDEX idx_incentive_claims_trip ON public.incentive_claims (trip_id);

-- RLS
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_incentives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentive_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_select ON public.organisations FOR SELECT USING (true);
CREATE POLICY org_incentives_select ON public.org_incentives FOR SELECT USING (true);

CREATE POLICY org_memberships_own ON public.org_memberships
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY org_memberships_admin ON public.org_memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships am
      WHERE am.org_id = org_memberships.org_id
        AND am.user_id = auth.uid()
        AND am.role IN ('admin', 'champion')
    )
  );

CREATE POLICY claims_own ON public.incentive_claims
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships m
      WHERE m.id = membership_id AND m.user_id = auth.uid()
    )
  );
CREATE POLICY claims_admin ON public.incentive_claims
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships m
      JOIN public.org_memberships admin ON admin.org_id = m.org_id
      WHERE m.id = membership_id
        AND admin.user_id = auth.uid()
        AND admin.role IN ('admin', 'champion')
    )
  );
