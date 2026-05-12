import { describe, it, expect } from 'vitest';
import {
  googleMapsDirections,
  wazeNavigate,
  appleMapsDirections,
  buildDirectionsForProvider,
} from './deeplinks';

const A = { lat: 53.349805, lng: -6.26031, label: 'Dublin' };
const B = { lat: 51.898514, lng: -8.475603, label: 'Cork' };

describe('maps deep links', () => {
  it('builds google maps directions with waypoints', () => {
    const link = googleMapsDirections({ origin: A, destination: B, waypoints: [{ lat: 52.665, lng: -8.623 }] });
    expect(link.https).toContain('https://www.google.com/maps/dir/');
    expect(link.https).toContain('origin=53.349805%2C-6.26031');
    expect(link.https).toContain('destination=51.898514%2C-8.475603');
    expect(link.https).toContain('waypoints=52.665%2C-8.623');
    expect(link.native).toContain('comgooglemaps://');
  });

  it('builds waze deep link', () => {
    const link = wazeNavigate({ destination: B });
    expect(link.https).toContain('https://waze.com/ul?ll=51.898514,-8.475603&navigate=yes');
    expect(link.native).toContain('waze://?ll=51.898514,-8.475603&navigate=yes');
  });

  it('builds apple maps link', () => {
    const link = appleMapsDirections({ origin: A, destination: B });
    expect(link.https).toContain('http://maps.apple.com/?saddr=53.349805%2C-6.26031&daddr=51.898514%2C-8.475603');
  });

  it('dispatches by provider', () => {
    expect(buildDirectionsForProvider('google', { destination: B }).https).toContain('google.com/maps/dir');
    expect(buildDirectionsForProvider('waze', { destination: B }).https).toContain('waze.com/ul');
    expect(buildDirectionsForProvider('apple', { destination: B }).https).toContain('maps.apple.com');
  });
});
