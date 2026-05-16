/**
 * Geocoding via Nominatim (OpenStreetMap). Free, no API key required.
 * Rate-limited to 1 req/sec by OSM policy — we debounce on the caller side.
 * Falls back to preset Irish cities in mock mode.
 */
import { flags } from './featureFlags';

export interface GeocodingResult {
  lat: number;
  lng: number;
  name: string;
  display_name: string;
}

const IRISH_PRESETS: GeocodingResult[] = [
  { lat: 53.349805, lng: -6.26031, name: 'Dublin city centre', display_name: 'Dublin, Ireland' },
  { lat: 51.898514, lng: -8.475603, name: 'Cork city centre', display_name: 'Cork, Ireland' },
  { lat: 53.270668, lng: -9.056791, name: 'Galway city', display_name: 'Galway, Ireland' },
  { lat: 52.668189, lng: -8.630498, name: 'Limerick city', display_name: 'Limerick, Ireland' },
  { lat: 54.597, lng: -5.93, name: 'Belfast city', display_name: 'Belfast, Northern Ireland' },
  { lat: 53.219, lng: -6.659, name: 'Naas', display_name: 'Naas, Co. Kildare, Ireland' },
  { lat: 53.383, lng: -6.594, name: 'Maynooth', display_name: 'Maynooth, Co. Kildare, Ireland' },
  { lat: 52.258, lng: -7.112, name: 'Waterford city', display_name: 'Waterford, Ireland' },
  { lat: 53.521, lng: -6.237, name: 'Swords', display_name: 'Swords, Co. Dublin, Ireland' },
  { lat: 53.289, lng: -6.136, name: 'Dun Laoghaire', display_name: 'Dun Laoghaire, Co. Dublin, Ireland' },
  { lat: 53.027, lng: -6.127, name: 'Wicklow town', display_name: 'Wicklow, Co. Wicklow, Ireland' },
  { lat: 52.845, lng: -6.928, name: 'Kilkenny city', display_name: 'Kilkenny, Ireland' },
  { lat: 53.717, lng: -6.347, name: 'Drogheda', display_name: 'Drogheda, Co. Louth, Ireland' },
  { lat: 54.348, lng: -7.632, name: 'Enniskillen', display_name: 'Enniskillen, Co. Fermanagh' },
  { lat: 51.892, lng: -8.498, name: 'Wilton, Cork', display_name: 'Wilton, Cork, Ireland' },
];

/**
 * Search for places by text query. Biased towards Ireland.
 * Returns up to 5 results.
 */
export async function searchPlaces(query: string): Promise<GeocodingResult[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) return [];

  // In mock mode or if query matches presets, use local data first
  const presetMatches = IRISH_PRESETS.filter(
    (p) =>
      p.name.toLowerCase().includes(trimmed) ||
      p.display_name.toLowerCase().includes(trimmed),
  ).slice(0, 5);

  if (flags.useMocks || presetMatches.length >= 3) {
    return presetMatches;
  }

  // Live Nominatim lookup (Ireland-biased)
  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '5',
      countrycodes: 'ie,gb',
      addressdetails: '0',
    });
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { headers: { 'User-Agent': 'Giorra-Carpooling-App/1.0' } },
    );
    if (!resp.ok) return presetMatches;
    const data = await resp.json();
    const results: GeocodingResult[] = data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      name: item.display_name.split(',')[0],
      display_name: item.display_name,
    }));
    return results.length > 0 ? results : presetMatches;
  } catch {
    return presetMatches;
  }
}

/**
 * Reverse geocode coordinates to a place name.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const nearest = IRISH_PRESETS.reduce((best, p) => {
    const d = Math.abs(p.lat - lat) + Math.abs(p.lng - lng);
    return d < best.dist ? { dist: d, name: p.name } : best;
  }, { dist: Infinity, name: `${lat.toFixed(3)}, ${lng.toFixed(3)}` });

  if (flags.useMocks) return nearest.name;

  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
    });
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params}`,
      { headers: { 'User-Agent': 'Giorra-Carpooling-App/1.0' } },
    );
    if (!resp.ok) return nearest.name;
    const data = await resp.json();
    return data.display_name?.split(',')[0] ?? nearest.name;
  } catch {
    return nearest.name;
  }
}
