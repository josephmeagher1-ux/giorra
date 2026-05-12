CREATE TABLE public.fuel_prices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fuel            fuel_type NOT NULL,
  price_per_litre NUMERIC(4,2) NOT NULL,
  kwh_price       NUMERIC(4,2),
  source          TEXT DEFAULT 'manual',
  effective_date  DATE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fuel_prices_latest ON public.fuel_prices (fuel, effective_date DESC);
