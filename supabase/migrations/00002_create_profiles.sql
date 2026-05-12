CREATE TABLE public.profiles (
  id                          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name                   TEXT NOT NULL,
  phone                       TEXT,
  phone_verified              BOOLEAN DEFAULT FALSE,
  avatar_url                  TEXT,
  bio                         TEXT,
  avg_rating                  NUMERIC(3,2) DEFAULT 0,
  total_ratings               INTEGER DEFAULT 0,
  is_driver                   BOOLEAN DEFAULT FALSE,
  stripe_customer_id          TEXT,
  stripe_account_id           TEXT,
  stripe_onboarding_complete  BOOLEAN DEFAULT FALSE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);
