# Giorra – Irish Carpooling App

## What is this?
Cost-sharing carpooling app for Ireland. The name comes from the Irish proverb _Giorraíonn beirt bóthar_ — "two people shorten a road."

The app auto-calculates max price per seat from real driving costs (fuel, depreciation, maintenance, tyres, tolls) and divides among all occupants including the driver. Drivers can accept or lower the price, never increase it. This keeps trips within Irish personal motor insurance (no SPSV taxi licence needed).

## Tech Stack
- **Monorepo**: Turborepo + npm workspaces
- **Backend**: Supabase (PostgreSQL + PostGIS + Auth + Realtime + Edge Functions)
- **Frontend**: Expo 54 (React Native + react-native-web) with expo-router
- **Maps**: OpenStreetMap (web preview, free) + OpenRouteService (routing) + Apple/Google Maps/Waze (native deep links)
- **Payments**: Stripe (driver-side prepaid wallet; riders never pay Giorra)
- **Push**: OneSignal

## Project Structure
```
apps/mobile/          — Expo app (expo-router, file-based routing)
packages/shared/      — Cost engine, Zod validation, types (runs in RN + Deno)
services/ops-worker/  — Node background jobs (settlement, sweeps)
supabase/             — Migrations, seed data, edge functions
```

## Key Commands
```bash
npm install                                # Install all workspace deps
npm run dev                                # Start all dev servers
npm run test --workspace @giorra/shared    # Run shared (cost/wallet/escrow) tests
cd supabase && supabase start              # Start local Supabase
cd supabase && supabase functions serve    # Start edge functions locally
cd apps/mobile && npx expo start           # Start Expo dev server
npm run export:web --workspace mobile      # Build web bundle (deployed to GH Pages)
```

## Critical Domain Logic
The cost calculator at `packages/shared/src/cost/calculator.ts` is the most important file. It calculates `max_price_per_seat = min(ECC, PBC) / (passengers + 1)` where ECC is the per-vehicle engineering cost and PBC is the Irish Civil Service mileage rate. The DB enforces `actual_price ≤ max_price` via a CHECK constraint.

## Database
Twenty SQL migrations in `supabase/migrations/`. Key tables: `profiles`, `vehicles`, `toll_roads`, `trips` (with PostGIS geometry), `bookings`, `messages`, `reviews`, `fuel_prices`, `charities`, `driver_wallets`, `wallet_topups`, `fee_accruals`. Route matching uses the `search_trips_by_route` PostGIS function with `ST_DWithin`.
