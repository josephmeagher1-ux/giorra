# Giorra Pricing, Compliance, and Build Strategy (Ireland-first)

## Important note

This is a product/compliance design memo, not legal advice. Before launch, get an Irish transport solicitor to review the final flow, Terms, and app copy.

## 1) Regulatory posture: what you are trying to prove

Your strongest position is to show Giorra is **cost-sharing, pre-arranged private travel**, not an SPSV/taxi service.

Anchor points from available guidance:

- NTA/RSA SPSV material defines SPSV as vehicle use for **hire or reward** and confirms SPSV licensing rules apply to taxi/hackney/limousine operations.
- Transport for Ireland carpooling guidance (Smarter Travel guide) frames carpooling as:
  - shared journeys to same/near destination
  - driver is not paid as a transport business
  - sharing petrol/parking is acceptable
  - insurance caveat language repeatedly references:
    - not over 8 passengers (excluding driver)
    - not carrying as a passenger business
    - agreement before journey starts
- Revenue reimbursement guidance and DPER Civil Service mileage circulars provide official, auditable per-km cost benchmarks.
- UK HMRC mileage framework (45p/25p per mile + passenger concept for business contexts) is useful only as a secondary benchmark precedent for "cost reimbursement != taxi fare".

## 2) "As high as defensible" pricing principle

Use a dual-threshold ceiling:

1) **Engineering Cost Ceiling (ECC)** — your real trip cost model  
2) **Public Benchmark Ceiling (PBC)** — a conservative official benchmark cap  

Then enforce:

`max_price_per_seat = min(ECC_per_seat, PBC_per_seat)`

This gives you two protections:

- You can justify price from real costs (not arbitrary fare setting)
- You avoid outlier prices that could look like commercial hire/reward

## 3) Inputs that are strongest to defend

### Core variable costs (very defensible)

- Fuel/electricity from current source table (`fuel_prices`)
- Vehicle-specific consumption (`l/100km` or `kWh/100km`)
- Tyres (per km)
- Maintenance/service wear (per km)
- Tolls detected from route geometry

### Pro-rated fixed ownership costs (defensible if transparently capped)

- Depreciation (already present)
- Insurance (annual premium / expected annual km)
- Motor tax (annual tax / expected annual km)
- NCT/inspection and mandatory vehicle compliance costs (annualized)

Important: keep these **explicit, formula-based, and capped** so they cannot be manipulated upward.

### Costs to exclude from ceiling (high legal risk)

- Driver time/wage value
- Convenience, surge, demand multipliers
- Any discretionary "market price" markup
- "Booking fees" paid to driver

Platform fee (if needed) should be charged as a **separate platform service fee** and not paid to the driver.

## 4) Proposed ceiling algorithm

### 4.1 Engineering Cost Ceiling (ECC)

Per-km trip cost:

`ecc_per_km = fuel_per_km + maintenance_per_km + tyre_per_km + depreciation_per_km + insurance_per_km + tax_nct_per_km`

Trip cost:

`ecc_trip_cost = (ecc_per_km * route_km_adjusted) + tolls + route_specific_fees`

Where:

- `route_km_adjusted = routed_km * detour_factor`
- `detour_factor` default 1.05 (captures realistic route variance, parking loops, pickup slippage)
- `route_specific_fees` can include parking directly tied to pickup/dropoff only when present

Seat split:

`ecc_per_seat = ecc_trip_cost / occupants`

with `occupants = passengers + 1` (driver always included).

### 4.2 Public Benchmark Ceiling (PBC)

Compute per-km benchmark from Irish Civil Service / Revenue-compatible mileage reference:

- map engine/fuel class into benchmark class
- map driver declared annual business-distance band
- derive `benchmark_per_km`

Then:

`pbc_trip_cost = benchmark_per_km * route_km_adjusted + tolls`
`pbc_per_seat = pbc_trip_cost / occupants`

Final cap:

`max_price_per_seat = min(ecc_per_seat, pbc_per_seat)`

Guardrails:

- hard minimum occupants >= 2 total people
- max seats sold <= vehicle seats - 1
- no manual override above computed cap
- all adjustments are one-way downward only

## 5) Compliance controls that matter if challenged

Implement these as product constraints and audit artifacts:

- **Pre-arranged only**: lock bookings before departure window; no street-hail behavior
- **No plying for hire UX**: no immediate "book nearest car now" taxi-like mode
- **Price cap immutable**: DB check already good; extend with signed cost snapshot
- **Driver cannot increase**: keep current rule
- **Trip purpose declaration**: "I am travelling anyway" checkbox + declaration text
- **No commercial operator patterning**:
  - daily trip count limits
  - repeated route frequency thresholds
  - annual reimbursement cap alerts
- **No SPSV affordances** in copy/features:
  - never call users "drivers for hire"
  - never advertise earnings
  - always use "cost contribution"
- **Insurance acknowledgment** before first listing:
  - user confirms private policy terms
  - user confirms not operating as passenger transport business
- **Evidence retention**:
  - store route, km, tolls, fuel table version, vehicle profile version, final formula result
  - immutable event log for disputes/regulator queries

## 6) Data model additions (minimal)

Add to `vehicles`:

- `annual_insurance_eur numeric`
- `annual_motor_tax_eur numeric`
- `annual_nct_maintenance_fixed_eur numeric`
- `expected_annual_km integer`
- `cost_profile_version text`

Add to `trips.cost_breakdown` JSON:

- `insurance_per_km`
- `tax_nct_per_km`
- `detour_factor`
- `benchmark_per_km_used`
- `benchmark_source`
- `formula_version`

## 7) UI copy strategy (important legally)

Use consistent language:

- "Share trip costs" (not "earn money")
- "Maximum allowed contribution"
- "Driver pays their own share"
- "Contributions are capped at calculated cost and may be lowered"

Avoid:

- "fare", "rate card", "surge", "profit", "income per hour"

## 8) GitHub Student Developer Pack aware build design

You cannot reliably know every currently-available offer without checking your verified account live, but generally high-value offers include:

- GitHub Copilot Student
- GitHub Codespaces
- Microsoft Azure credit
- DigitalOcean credit
- Heroku student credit
- Stripe startup/student-style incentives (offer details vary)
- domain/SSL partner offers (Namecheap/Name.com variants)

### Recommended hosting with pack-first economics

- Keep core backend on Supabase (best fit for PostGIS + auth + realtime)
- Keep mobile app in Expo + EAS
- Use student credits for non-core workloads:
  - DigitalOcean/Azure: worker for fuel price updater and compliance analytics
  - Heroku: low-priority admin panel prototype (optional)
  - Codespaces: reproducible dev environments for contributors

### Concrete environment split

- **Prod**: Supabase + Edge Functions + Stripe + Mapbox/ORS
- **Ops sidecar (student credits)**:
  - nightly jobs (fuel table refresh, risk scoring, anomaly detection)
  - compliance report generation
  - long-running cron not ideal for edge runtime
- **Preview/dev**:
  - Codespaces + seeded Supabase branch DB

## 9) Navigation app interoperability (Google/Waze/Apple)

Yes, route handoff is feasible and low-friction.

### Practical implementation

- Keep ORS as authoritative route for pricing and toll logic
- At trip start, provide "Open in navigation app":
  - Google Maps URL (`https://www.google.com/maps/dir/?api=1...`)
  - Waze deep link (`https://waze.com/ul?...` with `navigate=yes`)
  - Apple Maps URL (`http://maps.apple.com/?...`)

### Important caveat

- Different apps may reroute slightly and toll behavior can differ.
- Keep billing/compliance tied to your stored ORS route snapshot, not external app reroute outcomes.
- Present user notice: "Navigation app may optimize route; contribution cap is based on agreed route at booking."

## 10) What is now implemented in this repo

The pricing/compliance/recurring-routes design above is now wired end-to-end:

- `packages/shared/src/cost/benchmark.ts` — Civil Service mileage table from
  DPER Circular 16/2022, with engine-class and mileage-band classifiers.
- `packages/shared/src/cost/types.ts` — extended `VehicleProfile` + new
  `CeilingBreakdown` and a richer `CostBreakdown` (ECC, PBC, audit fields).
- `packages/shared/src/cost/calculator.ts` — dual-ceiling formula:
  `max_price_per_seat = min(ECC, PBC)` with per-km caps for insurance and
  tax/NCT so unrealistic inputs are softened automatically.
- `packages/shared/src/recurrence/*` — Irish-DST-aware recurrence generator,
  IRISH_SCHOOL_TERMS table for term-time-only school carpools.
- `packages/shared/src/compliance/*` — driver declarations text, activity
  guards (daily/weekly trip caps, annual contribution ceiling, pre-arranged
  booking minimum) for the "not a taxi" defence.
- `packages/shared/src/maps/deeplinks.ts` — Google Maps / Waze / Apple Maps
  builders, used from the trip-detail screen.
- `supabase/migrations/00013…00015` — vehicle ownership fields,
  `recurring_patterns` table + RLS, `compliance_events` append-only log.
- `supabase/functions/calculate-trip-cost/index.ts` — authoritative edge
  function (uses ORS when configured, falls back to mock route).
- `apps/mobile` — full Expo Router app: auth, search, post-trip,
  regular-routes, my-trips, profile, vehicle add, declarations,
  trip detail with map-app handoff. Backed by an in-memory mock data layer
  in `lib/api.ts` so the app runs without Supabase/Stripe/Mapbox.
- `services/ops-worker` — Node service that materializes recurring trips,
  compiles compliance reports, and refreshes fuel prices. Runs on the
  GitHub Student Pack hosting of your choice or as a daily GitHub Action
  via `.github/workflows/ops-worker-cron.yml`.

## 11) What to get reviewed by counsel before launch

- Terms and rider/driver declarations (`packages/shared/src/compliance/declarations.ts`)
- Driver frequency and annual contribution thresholds in `ACTIVITY_LIMITS`
- Tax wording in user FAQs (placeholder copy only at the moment)
- Exact phrasing of "not for hire or reward" positioning in app copy
- Handling of cancellations/no-shows relative to the "cost sharing" framing

## 12) GitHub Student Developer Pack — wired in

| Pack offer | Where it's used |
| --- | --- |
| GitHub Copilot Student | Authoring across the monorepo (free with Student Pack) |
| GitHub Codespaces | `.devcontainer/devcontainer.json` boots a ready-to-run env |
| GitHub Actions | `.github/workflows/ci.yml` runs tests; `ops-worker-cron.yml` materializes recurring trips daily |
| DigitalOcean ($200 credit / yr) | Recommended host for `services/ops-worker` |
| Azure ($100 credit) | Alternate host for `services/ops-worker` |
| Heroku ($13/mo × 24mo) | Hobby host for the worker or a future admin panel |
| Namecheap (.me free / SSL) | For first production domain |
| Stripe (waived fees first $1k) | Enable when launching real bookings |
| MongoDB Atlas ($50 credit) | Not in use — Supabase Postgres is the primary store |
| JetBrains free | Optional IDE alongside Cursor |
| 1Password free / year | Recommended for secret storage in dev |

When real keys are added to `.env`, set `EXPO_PUBLIC_USE_MOCKS=false` and the
app starts hitting Supabase, ORS, and Stripe through the same interfaces.
