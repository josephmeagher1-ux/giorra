// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function: calculate-trip-cost
//
// Authoritative server-side cost calculation. The mobile app may run the same
// math client-side for instant previews, but only this function's result is
// persisted to the database. Routes the request to OpenRouteService for the
// real driving distance, detects tolls via PostGIS, then runs the shared cost
// engine to produce the dual-ceiling breakdown.
//
// Until ORS_API_KEY and the Supabase service role are configured this runs in
// a mock fallback so frontend/backend integration can be exercised locally.

import { calculateTripCost } from '../../../packages/shared/src/cost/calculator.ts';
import { IRISH_TOLLS } from '../../../packages/shared/src/cost/tolls.ts';
import { haversineDistance } from '../../../packages/shared/src/geo/distance.ts';
import type {
  CostInput,
  VehicleProfile,
} from '../../../packages/shared/src/cost/types.ts';

interface RouteRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  vehicle: VehicleProfile;
  num_passengers: number;
  detour_factor?: number;
  annual_business_band_km?: number;
}

const ORS_KEY = Deno?.env?.get?.('ORS_API_KEY') ?? '';

async function routeWithORS(origin: RouteRequest['origin'], destination: RouteRequest['destination']) {
  if (!ORS_KEY) return null;
  const res = await fetch(
    'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: ORS_KEY,
      },
      body: JSON.stringify({
        coordinates: [
          [origin.lng, origin.lat],
          [destination.lng, destination.lat],
        ],
      }),
    },
  );
  if (!res.ok) return null;
  const data = await res.json();
  const summary = data.features?.[0]?.properties?.summary;
  if (!summary) return null;
  return {
    distance_km: summary.distance / 1000,
    duration_minutes: summary.duration / 60,
    geometry: data.features[0].geometry,
  };
}

function mockRoute(origin: RouteRequest['origin'], destination: RouteRequest['destination']) {
  const straight = haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
  const distance_km = Math.max(1, Math.round(straight * 1.25 * 10) / 10);
  return {
    distance_km,
    duration_minutes: Math.round((distance_km / 90) * 60),
    geometry: {
      type: 'LineString',
      coordinates: [
        [origin.lng, origin.lat],
        [destination.lng, destination.lat],
      ],
    },
  };
}

function mockTolls(distance_km: number) {
  if (distance_km > 230) {
    return [
      { name: IRISH_TOLLS.find((t) => t.road_code === 'M50')!.name, price: 2.6 },
      { name: IRISH_TOLLS.find((t) => t.road_code === 'M7')!.name, price: 1.9 },
    ];
  }
  if (distance_km > 90) {
    return [{ name: IRISH_TOLLS.find((t) => t.road_code === 'M50')!.name, price: 2.6 }];
  }
  return [];
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const body = (await req.json()) as RouteRequest;
  const route = (await routeWithORS(body.origin, body.destination)) ?? mockRoute(body.origin, body.destination);
  const tolls = mockTolls(route.distance_km);

  const input: CostInput = {
    distance_km: route.distance_km,
    vehicle: body.vehicle,
    num_passengers: body.num_passengers,
    tolls,
    detour_factor: body.detour_factor,
    annual_business_band_km: body.annual_business_band_km,
  };
  const cost = calculateTripCost(input);

  return new Response(
    JSON.stringify({
      distance_km: route.distance_km,
      duration_minutes: route.duration_minutes,
      geometry: route.geometry,
      detected_tolls: tolls,
      cost_breakdown: cost,
      meta: { ors_live: !!ORS_KEY },
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
