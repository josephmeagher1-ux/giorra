-- Driver fee accrual + SEPA Direct Debit mandate tables.
-- See packages/shared/src/billing/accrual.ts for matching TypeScript types.

CREATE TYPE billing_mechanism AS ENUM ('sepa_debit', 'card');
CREATE TYPE billing_mandate_status AS ENUM ('pending', 'active', 'failed', 'cancelled');

CREATE TABLE public.fee_accruals (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id                UUID NOT NULL REFERENCES public.profiles(id),
  booking_id               UUID NOT NULL REFERENCES public.bookings(id),
  amount_eur               NUMERIC(10, 2) NOT NULL,
  accrued_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stripe_invoice_id        TEXT,
  stripe_usage_record_id   TEXT,
  settled_at               TIMESTAMPTZ,
  voided_at                TIMESTAMPTZ,
  voided_reason            TEXT,
  UNIQUE (driver_id, booking_id)
);

CREATE INDEX idx_fee_accruals_driver ON public.fee_accruals (driver_id)
  WHERE settled_at IS NULL AND voided_at IS NULL;

ALTER TABLE public.fee_accruals ENABLE ROW LEVEL SECURITY;
CREATE POLICY fee_accruals_driver_read ON public.fee_accruals
  FOR SELECT USING (driver_id = auth.uid());

CREATE TABLE public.billing_mandates (
  driver_id                  UUID PRIMARY KEY REFERENCES public.profiles(id),
  mechanism                  billing_mechanism NOT NULL DEFAULT 'sepa_debit',
  status                     billing_mandate_status NOT NULL DEFAULT 'pending',
  stripe_customer_id         TEXT,
  stripe_payment_method_id   TEXT,
  stripe_subscription_id     TEXT,
  mandate_reference          TEXT,
  iban_last4                 TEXT,
  connected_at               TIMESTAMPTZ,
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.billing_mandates ENABLE ROW LEVEL SECURITY;
CREATE POLICY billing_mandates_driver_read ON public.billing_mandates
  FOR SELECT USING (driver_id = auth.uid());
CREATE POLICY billing_mandates_driver_write ON public.billing_mandates
  FOR UPDATE USING (driver_id = auth.uid());

-- Prepaid Drivey wallet. Balance is held in Stripe's customer balance, not
-- in a Drivey bank account, so e-money licensing doesn't apply.

CREATE TABLE public.driver_wallets (
  driver_id                  UUID PRIMARY KEY REFERENCES public.profiles(id),
  balance_eur                NUMERIC(10, 2) NOT NULL DEFAULT 0,
  auto_topup_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  auto_topup_pack            NUMERIC(10, 2) NOT NULL DEFAULT 10,
  auto_topup_threshold_eur   NUMERIC(10, 2) NOT NULL DEFAULT 0.20,
  free_trips_used            INTEGER NOT NULL DEFAULT 0,
  stripe_payment_method_id   TEXT,
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (balance_eur >= -5.0), -- small overdraft tolerance for race conditions
  CHECK (auto_topup_pack >= 5.0) -- minimum top-up amount
);

CREATE TABLE public.wallet_topups (
  id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id                  UUID NOT NULL REFERENCES public.profiles(id),
  gross_eur                  NUMERIC(10, 2) NOT NULL,
  stripe_fee_eur             NUMERIC(10, 2) NOT NULL DEFAULT 0,
  net_credited_eur           NUMERIC(10, 2) NOT NULL,
  source                     TEXT NOT NULL CHECK (source IN ('manual', 'auto')),
  stripe_payment_intent_id   TEXT,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_topups_driver ON public.wallet_topups (driver_id, created_at DESC);

ALTER TABLE public.driver_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_topups ENABLE ROW LEVEL SECURITY;
CREATE POLICY wallets_driver_read ON public.driver_wallets
  FOR SELECT USING (driver_id = auth.uid());
CREATE POLICY topups_driver_read ON public.wallet_topups
  FOR SELECT USING (driver_id = auth.uid());
