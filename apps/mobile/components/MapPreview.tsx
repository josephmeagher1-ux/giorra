import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/lib/theme';
import { fetchDrivingRoute, type RouteResult } from '@/lib/routing';

interface Point {
  lat: number;
  lng: number;
  name: string;
}

interface Props {
  origin: Point;
  destination: Point;
  routeGeometry?: [number, number][];
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
    script.onload = () => (window.L ? resolve(window.L) : reject('Leaflet failed'));
    script.onerror = () => reject('Leaflet script failed');
    document.head.appendChild(script);
  });
  return leafletPromise;
}

export function MapPreview({ origin, destination, routeGeometry, height = 220, interactive = true }: Props) {
  const ref = useRef<View | null>(null);
  const [ready, setReady] = useState(false);
  const [route, setRoute] = useState<[number, number][] | null>(routeGeometry ?? null);

  useEffect(() => {
    if (routeGeometry) {
      setRoute(routeGeometry);
      return;
    }
    let cancelled = false;
    fetchDrivingRoute(origin, destination)
      .then((r) => { if (!cancelled) setRoute(r.geometry); })
      .catch(() => {
        if (!cancelled) {
          setRoute([[origin.lat, origin.lng], [destination.lat, destination.lng]]);
        }
      });
    return () => { cancelled = true; };
  }, [origin.lat, origin.lng, destination.lat, destination.lng, routeGeometry]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !route) return;
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

        const routeLine = L.polyline(route, {
          color: '#0f6e4e',
          weight: 4,
          opacity: 0.85,
          smoothFactor: 1,
        }).addTo(map);

        map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
        setReady(true);
      })
      .catch(() => setReady(false));

    return () => {
      cancelled = true;
      if (map) map.remove();
      if (ref.current) (ref.current as unknown as HTMLDivElement).dataset.giorraMap = '';
    };
  }, [route, origin.lat, origin.lng, destination.lat, destination.lng, interactive]);

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
          <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
            {route ? 'Rendering map...' : 'Loading route...'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
