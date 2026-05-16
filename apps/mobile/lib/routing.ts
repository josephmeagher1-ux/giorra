import { flags } from './featureFlags';

export interface RouteResult {
  distance_km: number;
  duration_minutes: number;
  geometry: [number, number][];
}

const ORS_BASE = 'https://api.openrouteservice.org/v2/directions/driving-car';

export async function fetchDrivingRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<RouteResult> {
  if (flags.orsConfigured) {
    return fetchFromORS(origin, destination);
  }
  return generateMockRoute(origin, destination);
}

async function fetchFromORS(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<RouteResult> {
  const apiKey = process.env.EXPO_PUBLIC_ORS_API_KEY ?? '';
  const body = {
    coordinates: [
      [origin.lng, origin.lat],
      [destination.lng, destination.lat],
    ],
    geometry: true,
    format: 'geojson',
  };

  const res = await fetch(ORS_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ORS error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const route = data.features?.[0];
  if (!route) throw new Error('No route returned');

  const coords: [number, number][] = route.geometry.coordinates.map(
    (c: number[]) => [c[1], c[0]],
  );
  const summary = route.properties?.summary ?? {};

  return {
    distance_km: Math.round((summary.distance ?? 0) / 100) / 10,
    duration_minutes: Math.round((summary.duration ?? 0) / 60),
    geometry: coords,
  };
}

function generateMockRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): RouteResult {
  const points: [number, number][] = [];
  const steps = 20;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = origin.lat + (destination.lat - origin.lat) * t;
    const lng = origin.lng + (destination.lng - origin.lng) * t;

    const wobble = Math.sin(t * Math.PI * 3) * 0.08 * (1 - Math.abs(t - 0.5) * 2);
    const perpLat = -(destination.lng - origin.lng);
    const perpLng = destination.lat - origin.lat;
    const perpLen = Math.sqrt(perpLat ** 2 + perpLng ** 2) || 1;

    points.push([
      lat + (perpLat / perpLen) * wobble,
      lng + (perpLng / perpLen) * wobble,
    ]);
  }

  const dLat = destination.lat - origin.lat;
  const dLng = destination.lng - origin.lng;
  const straight = Math.sqrt(dLat ** 2 + dLng ** 2) * 111;
  const distance_km = Math.round(straight * 1.25 * 10) / 10;
  const duration_minutes = Math.round((distance_km / 90) * 60);

  return { distance_km, duration_minutes, geometry: points };
}
