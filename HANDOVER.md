# Drivey Handover — Status

## What runs today

End-to-end the project is functional in mock mode. With no paid services and
no API keys you can:

- Sign in (mock auth)
- Browse seeded trips and recurring routes
- Post a new trip with full cost preview (dual-ceiling breakdown)
- Create a recurring pattern (commute / school run / sports / etc.)
- See next 12 departures for any pattern
- Book a seat (mock Stripe authorisation)
- Open the route in Google Maps / Waze / Apple Maps via deep link
- Review and sign driver declarations
- Run the ops-worker once to see compliance reporting and recurring
  trip materialisation output

```bash
# install everything
npm install --legacy-peer-deps

# run the shared-package tests (34 tests)
npm test --workspace @drivey/shared

# typecheck mobile + ops
npm run typecheck --workspace mobile
npm run typecheck --workspace @drivey/ops-worker

# smoke-run the ops worker
OPS_RUN_ONCE=true npm run start --workspace @drivey/ops-worker

# start the mobile app
npm run start --workspace mobile
```

## What is in the repo now

### Shared package (`packages/shared`)
- `cost/calculator.ts` — dual-ceiling pricing engine (ECC ∧ PBC)
- `cost/benchmark.ts` — Irish Civil Service mileage table (DPER Circular 16/2022)
- `cost/types.ts` — extended `VehicleProfile`, `CeilingBreakdown`, `CostBreakdown`
- `cost/constants.ts` — AA Ireland 2026 averages + per-km caps for insurance/tax
- `cost/tolls.ts` — 10 Irish toll roads
- `recurrence/*` — Irish-DST-aware schedule generator + school-term table
- `compliance/*` — `DRIVER_DECLARATIONS`, `ACTIVITY_LIMITS`, publish/booking guards
- `maps/deeplinks.ts` — Google / Waze / Apple navigation handoff helpers
- `validation/*` — Zod schemas (vehicle, trip, recurrence, booking, user)
- 34 unit tests covering pricing, benchmark, recurrence, deeplinks, guards

### Supabase (`supabase`)
- Migrations 00001–00012 (existing schema)
- `00013_extend_vehicles_with_ownership_costs.sql`
- `00014_create_recurring_patterns.sql`
- `00015_create_compliance_log.sql`
- `functions/calculate-trip-cost/index.ts` — edge function using shared engine

### Mobile app (`apps/mobile`)
- Expo Router structure:
  - `app/(auth)/index.tsx` — sign in
  - `app/(tabs)/index.tsx` — search
  - `app/(tabs)/post.tsx` — post a one-off trip
  - `app/(tabs)/recurring.tsx` — list regular routes
  - `app/(tabs)/my-trips.tsx` — driver/rider trips
  - `app/(tabs)/profile.tsx` — profile + declarations + vehicles
  - `app/trip/[id].tsx` — trip detail with cost breakdown + map handoff
  - `app/vehicle/add.tsx` — vehicle form with ownership cost inputs
  - `app/recurring/new.tsx` — create commute/school recurring pattern
  - `app/recurring/[id].tsx` — view next 12 departures
  - `app/declarations.tsx` — driver declarations sign-off
- `lib/api.ts` — single data-layer abstraction; ships in mock mode by default
- `lib/payments.ts` — Stripe wrapper (mock until configured)
- `lib/navHandoff.ts` — wraps `Linking.openURL` over the shared deeplinks
- `components/CostBreakdown.tsx` — renders the full dual-ceiling breakdown
- `components/TripCard.tsx`, `components/ui/*` — small design system

### Ops worker (`services/ops-worker`)
- `src/index.ts` — refreshFuelPrices, compileComplianceReport,
  materializeRecurringTrips. Either runs on a loop or once via `OPS_RUN_ONCE`.

### GitHub Student infra wiring
- `.devcontainer/devcontainer.json` — Codespaces boot config
- `.github/workflows/ci.yml` — typecheck + test on every push/PR
- `.github/workflows/ops-worker-cron.yml` — daily ops tick via Actions

## Flipping from mock mode to real services

1. Set `EXPO_PUBLIC_USE_MOCKS=false` in `.env`.
2. Provision a Supabase project; copy URL + anon key.
3. Push migrations: `npm run db:migrate`.
4. Deploy edge function: `npm run functions:deploy`.
5. Add Mapbox + ORS + Stripe + OneSignal keys when ready.
6. Each `lib/` wrapper is the single swap point per service.

## Known limitations / next up

- `lib/api.ts` still in-memory; replace with `supabase-js` calls.
- Mapbox map view not yet rendered — current trip-detail page links out
  to external nav apps; add `@rnmapbox/maps` for inline route polylines.
- Stripe PaymentSheet uses a mock authorise; replace with the real SDK.
- OneSignal push notifications not wired.
- Compliance dashboards for admins still TODO (a small web app — could be
  another `apps/admin` workspace or a Codespaces-hosted notebook).
