-- Extend vehicles with ownership cost inputs used by the dual-ceiling pricing engine.
-- Older rows can leave these NULL and the calculator will use safe defaults.

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS engine_cc INTEGER CHECK (engine_cc IS NULL OR (engine_cc > 0 AND engine_cc <= 8000)),
  ADD COLUMN IF NOT EXISTS annual_insurance_eur NUMERIC(8,2) CHECK (annual_insurance_eur IS NULL OR annual_insurance_eur >= 0),
  ADD COLUMN IF NOT EXISTS annual_motor_tax_eur NUMERIC(8,2) CHECK (annual_motor_tax_eur IS NULL OR annual_motor_tax_eur >= 0),
  ADD COLUMN IF NOT EXISTS annual_nct_maintenance_eur NUMERIC(8,2) CHECK (annual_nct_maintenance_eur IS NULL OR annual_nct_maintenance_eur >= 0),
  ADD COLUMN IF NOT EXISTS expected_annual_km INTEGER CHECK (expected_annual_km IS NULL OR (expected_annual_km > 0 AND expected_annual_km <= 200000));

COMMENT ON COLUMN public.vehicles.engine_cc IS 'Engine displacement in cc, used to map to Civil Service mileage band';
COMMENT ON COLUMN public.vehicles.annual_insurance_eur IS 'Driver-declared yearly insurance cost (EUR)';
COMMENT ON COLUMN public.vehicles.annual_motor_tax_eur IS 'Driver-declared yearly motor tax (EUR)';
COMMENT ON COLUMN public.vehicles.annual_nct_maintenance_eur IS 'Driver-declared yearly NCT + mandatory maintenance (EUR)';
COMMENT ON COLUMN public.vehicles.expected_annual_km IS 'Driver-declared expected yearly km, used to pro-rate fixed costs';
