/**
 * Build deep links for popular navigation apps so a driver can hand off to
 * Google Maps, Waze, or Apple Maps from inside Giorra.
 *
 * All builders return both an https universal URL and the native app URL
 * scheme when meaningfully different. Callers should try the native scheme
 * first on iOS/Android and fall back to the universal URL.
 */
export interface LatLng {
  lat: number;
  lng: number;
  label?: string;
}

export interface DeepLink {
  https: string;
  native?: string;
}

function fmt(p: LatLng): string {
  return `${p.lat},${p.lng}`;
}

export function googleMapsDirections(opts: {
  origin?: LatLng;
  destination: LatLng;
  waypoints?: LatLng[];
  travelmode?: 'driving' | 'walking' | 'bicycling' | 'transit';
}): DeepLink {
  const params = new URLSearchParams();
  params.set('api', '1');
  if (opts.origin) params.set('origin', fmt(opts.origin));
  params.set('destination', fmt(opts.destination));
  params.set('travelmode', opts.travelmode ?? 'driving');
  if (opts.waypoints?.length) {
    params.set('waypoints', opts.waypoints.map(fmt).join('|'));
  }
  const qs = params.toString();
  return {
    https: `https://www.google.com/maps/dir/?${qs}`,
    native: `comgooglemaps://?${qs}`,
  };
}

export function wazeNavigate(opts: { destination: LatLng }): DeepLink {
  const qs = `ll=${fmt(opts.destination)}&navigate=yes`;
  return {
    https: `https://waze.com/ul?${qs}`,
    native: `waze://?${qs}`,
  };
}

export function appleMapsDirections(opts: {
  origin?: LatLng;
  destination: LatLng;
  dirflg?: 'd' | 'w' | 'r';
}): DeepLink {
  const params = new URLSearchParams();
  if (opts.origin) params.set('saddr', fmt(opts.origin));
  params.set('daddr', fmt(opts.destination));
  params.set('dirflg', opts.dirflg ?? 'd');
  const qs = params.toString();
  return {
    https: `http://maps.apple.com/?${qs}`,
  };
}

export type MapsProvider = 'google' | 'waze' | 'apple';

export function buildDirectionsForProvider(
  provider: MapsProvider,
  args: { origin?: LatLng; destination: LatLng; waypoints?: LatLng[] },
): DeepLink {
  switch (provider) {
    case 'google':
      return googleMapsDirections(args);
    case 'waze':
      return wazeNavigate({ destination: args.destination });
    case 'apple':
      return appleMapsDirections({
        origin: args.origin,
        destination: args.destination,
      });
  }
}
