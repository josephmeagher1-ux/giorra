# Drivey - Irish Ridesharing App

## What is this?
Cost-sharing ridesharing app for Ireland. The app auto-calculates max price per seat from real driving costs (fuel, depreciation, maintenance, tyres, tolls) and divides among all occupants including the driver. Drivers can accept or lower the price, never increase it. This keeps trips within Irish personal motor insurance (no SPSV licence needed).

## Tech Stack
- **Monorepo**: Turborepo + npm workspaces
- **Backend**: Supabase (PostgreSQL + PostGIS + Auth + Realtime + Edge Functions)
- **Frontend**: Expo 55 (React Native) with expo-router
- **Maps**: OpenRouteService (routing) + Mapbox (display)
- **Payments**: Stripe Connect Ireland (Express, destination charges)
- **Push**: OneSignal

## Project Structure
```
apps/mobile/          — Expo app (expo-router, file-based routing)
packages/shared/      — Cost engine, Zod validation, types (runs in RN + Deno)
supabase/             — Migrations, seed data, edge functions
```

## Key Commands
```bash
npm install                              # Install all workspace deps
npm run dev                              # Start all dev servers
cd packages/shared && npx vitest run     # Run cost calculator tests
cd supabase && supabase start            # Start local Supabase
cd supabase && supabase functions serve   # Start edge functions locally
cd apps/mobile && npx expo start          # Start Expo dev server
```

## Critical Domain Logic
The cost calculator at `packages/shared/src/cost/calculator.ts` is the most important file. It calculates `max_price_per_seat = (distance * per_km_rate + tolls) / (passengers + 1)`. The DB enforces `actual_price <= max_price` via a CHECK constraint.

## Database
12 SQL migrations in `supabase/migrations/`. Key tables: profiles, vehicles, toll_roads, trips (with PostGIS geometry), bookings, messages, reviews, fuel_prices. Route matching uses `search_trips_by_route` PostGIS function with `ST_DWithin`.
