# Giorra

Cost-sharing carpooling for Ireland. The name comes from the Irish proverb **_Giorraíonn beirt bóthar_** — *"two people shorten a road"*.

Giorra auto-calculates the maximum price per seat from real driving costs (fuel, depreciation, maintenance, tyres, tolls) and divides it across the driver and every passenger. Drivers can lower the price but never raise it, so trips stay inside personal-motor-insurance rules and Giorra never crosses the line into commercial hire (no SPSV taxi licence needed).

## Live demo

The Expo app's web build runs in mock mode on GitHub Pages. Native-only features (Apple/Google Maps deep links, push, camera) won't function on the web, but every screen, the cost engine, and the booking/ratings/wallet flows do.

→ **<https://josephmeagher1-ux.github.io/giorra/>**

## Repo layout

```
apps/mobile/          Expo 54 React Native app (expo-router)
packages/shared/      Cost engine, escrow, wallet, ratings, metrics (vitest)
services/ops-worker/  Node background jobs
supabase/             Migrations + Postgres + edge functions
```

## What's in the cost engine

The most important file is `packages/shared/src/cost/calculator.ts`. It computes:

```
max_price_per_seat = min(ECC_per_seat, PBC_per_seat)
ECC = (distance × per_km_cost) + tolls         # Engineering Cost Ceiling
PBC = Irish Civil Service mileage rate         # Public Benchmark Ceiling
per_seat = ceiling / (passengers + 1)          # driver counts as a "passenger"
```

`actual_price ≤ max_price` is enforced by a Postgres CHECK constraint so a driver can never charge over the cost-sharing ceiling.

## How Giorra makes money

Pure cost-sharing for riders — riders never pay Giorra, only the driver. Giorra charges drivers a flat €0.20 per confirmed-paid trip, debited from a prepaid wallet. The first 10 trips are free. Larger top-ups get a small loyalty bonus that mirrors the Stripe fees Giorra saves by batching.

See [`LIABILITY_AND_INCOME.md`](LIABILITY_AND_INCOME.md) for the rationale and [`PRICING_COMPLIANCE_AND_BUILD_STRATEGY.md`](PRICING_COMPLIANCE_AND_BUILD_STRATEGY.md) for the pricing model.

## Local development

```bash
npm install
npm run test       # shared package vitest suite
npm run typecheck  # turbo typecheck across workspaces

# Run the mobile app
cd apps/mobile
npx expo start

# Export the web bundle locally
npm run export:web --workspace mobile
```

## Tech stack

- **Monorepo**: Turborepo + npm workspaces
- **Backend**: Supabase (Postgres + PostGIS + Auth + Realtime + Edge Functions)
- **Frontend**: Expo 54 (React Native + react-native-web)
- **Maps**: OpenStreetMap (web preview, free) + OpenRouteService (routing) + Apple/Google Maps/Waze (native deep links)
- **Payments**: Stripe (driver-side prepaid wallet)
- **Push**: OneSignal

Most external services are mocked behind the `EXPO_PUBLIC_USE_MOCKS=true` flag so the entire app boots end-to-end without keys. Copy `.env.example` to `.env` and fill in real keys when you're ready to go live.

## License

Source-available, all rights reserved (for now). If you want to fork or contribute, open an issue.
