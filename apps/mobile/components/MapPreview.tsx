import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/lib/theme';

interface Point {
  lat: number;
  lng: number;
  name: string;
}

interface Props {
  origin: Point;
  destination: Point;
  height?: number;
  interactive?: boolean;
}

declare global {
  interface Window {
    L?: any;
  }
}

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

let leafletPromise: Promise<any> | null = null;

function loadLeaflet(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject('SSR');
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      link.setAttribute('data-leaflet', '');
      document.head.appendChild(link);
    }
    if (document.querySelector('script[data-leaflet]')) {
      const wait = setInterval(() => {
        if (window.L) {
          clearInterval(wait);
          resolve(window.L);
        }
      }, 50);
      return;
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.setAttribute('data-leaflet', '');
    script.onload = () => (window.L ? resolve(window.L) : reject('Leaflet failed to expose window.L'));
    script.onerror = () => reject('Leaflet script failed to load');
    document.head.appendChild(script);
  });
  return leafletPromise;
}

/**
 * Free map preview using OpenStreetMap tiles via Leaflet. No API key, no SDK
 * — Leaflet is lazy-loaded from a CDN on first mount.
 *
 * Web: renders an interactive map with origin/destination markers and a
 * straight-line route hint (proper route polylines require OpenRouteService,
 * which is plumbed but not invoked here to avoid using the free quota for a
 * static demo).
 *
 * Native: renders a styled placeholder card. Native uses the existing
 * "Open in Google Maps / Waze / Apple Maps" deep links from the trip detail
 * page for real-time directions.
 */
export function MapPreview({ origin, destination, height = 220, interactive = true }: Props) {
  const ref = useRef<View | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let map: any;
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !ref.current) return;
        const node = ref.current as unknown as HTMLDivElement;
        if (node.dataset.giorraMap === 'mounted') return;
        node.dataset.giorraMap = 'mounted';

        const midLat = (origin.lat + destination.lat) / 2;
        const midLng = (origin.lng + destination.lng) / 2;

        map = L.map(node, {
          zoomControl: interactive,
          dragging: interactive,
          touchZoom: interactive,
          scrollWheelZoom: false,
          doubleClickZoom: interactive,
          boxZoom: interactive,
          tap: interactive,
        }).setView([midLat, midLng], 7);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 18,
        }).addTo(map);

        const startIcon = L.divIcon({
          html: '<div style="width:14px;height:14px;border-radius:50%;background:#0f6e4e;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
          className: '',
        });
        const endIcon = L.divIcon({
          html: '<div style="width:18px;height:18px;border-radius:50% 50% 50% 0;background:#b4561d;border:3px solid white;transform:rotate(-45deg);box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          className: '',
        });

        L.marker([origin.lat, origin.lng], { icon: startIcon }).addTo(map).bindPopup(origin.name);
        L.marker([destination.lat, destination.lng], { icon: endIcon })
          .addTo(map)
          .bindPopup(destination.name);

        L.polyline(
          [
            [origin.lat, origin.lng],
            [destination.lat, destination.lng],
          ],
          { color: '#0f6e4e', weight: 3, opacity: 0.75, dashArray: '8 6' },
        ).addTo(map);

        map.fitBounds(
          [
            [origin.lat, origin.lng],
            [destination.lat, destination.lng],
          ],
          { padding: [40, 40] },
        );

        setReady(true);
      })
      .catch(() => setReady(false));

    return () => {
      cancelled = true;
      if (map) map.remove();
      if (ref.current) (ref.current as unknown as HTMLDivElement).dataset.giorraMap = '';
    };
  }, [origin.lat, origin.lng, destination.lat, destination.lng, interactive]);

  if (Platform.OS !== 'web') {
    return (
      <View
        style={{
          height,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.chip,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: theme.spacing(4),
        }}
      >
        <Feather name="map" size={28} color={theme.colors.textMuted} />
        <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
          {origin.name} → {destination.name}
        </Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
          Open in Google Maps / Waze for live directions
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        height,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        backgroundColor: theme.colors.chip,
        borderWidth: 1,
        borderColor: theme.colors.border,
        position: 'relative',
      }}
    >
      <View ref={ref as any} style={{ flex: 1, width: '100%', height: '100%' }} />
      {!ready ? (
        <View
          style={{
            position: 'absolute',
            inset: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>Loading map…</Text>
        </View>
      ) : null}
    </View>
  );
}
