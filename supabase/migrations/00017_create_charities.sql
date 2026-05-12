-- Charities riders pick as the fallback recipient when escrow can't be
-- released to the driver (rider no-show, rider unilateral cancellation
-- after funds were held). RCN = Irish Charity Regulator number.

CREATE TABLE public.charities (
  id                   TEXT PRIMARY KEY,
  name                 TEXT NOT NULL,
  slug                 TEXT NOT NULL UNIQUE,
  tagline              TEXT NOT NULL DEFAULT '',
  rcn                  TEXT,
  stripe_account_id    TEXT,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_charities_active ON public.charities (is_active);

ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;

CREATE POLICY charities_public_read ON public.charities
  FOR SELECT USING (is_active = TRUE);

INSERT INTO public.charities (id, name, slug, tagline, rcn) VALUES
  ('simon', 'Simon Communities of Ireland', 'simon-communities', 'Homelessness and housing support across Ireland.', 'RCN-20009766'),
  ('isvp',  'St Vincent de Paul (SVP)', 'svp', 'Practical help for families experiencing poverty.', 'RCN-20009065'),
  ('foodcloud', 'FoodCloud', 'foodcloud', 'Connecting surplus food with people who need it.', 'RCN-20126908'),
  ('irish_cancer_society', 'Irish Cancer Society', 'irish-cancer-society', 'Cancer support, research, and prevention.', 'RCN-20009264'),
  ('jigsaw', 'Jigsaw — Youth Mental Health', 'jigsaw', 'Mental health support for young people in Ireland.', 'RCN-20051042'),
  ('pieta', 'Pieta', 'pieta', 'Free therapy for suicide, self-harm, and bereavement.', 'RCN-20064494')
ON CONFLICT (id) DO NOTHING;
