import React, { useEffect, useMemo, useState } from 'react';
import { View, Alert } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Heading, Caption, Body } from '@/components/ui/Heading';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { CostBreakdown } from '@/components/CostBreakdown';
import { createTrip, getDeclarationsAcceptance, listVehicles, previewTripCost } from '@/lib/api';
import { listVerifications } from '@/lib/identity';
import { canPerformAction, type CostBreakdown as Breakdown } from '@giorra/shared';
import { theme } from '@/lib/theme';

const DEFAULT_LOCATIONS = {
  Dublin: { lat: 53.349805, lng: -6.26031, name: 'Dublin city centre' },
  Cork: { lat: 51.898514, lng: -8.475603, name: 'Cork city centre' },
  Galway: { lat: 53.270668, lng: -9.056791, name: 'Galway city' },
  Limerick: { lat: 52.668189, lng: -8.630498, name: 'Limerick city' },
  Belfast: { lat: 54.597, lng: -5.93, name: 'Belfast city' },
};

type LocKey = keyof typeof DEFAULT_LOCATIONS;

export default function PostTripScreen() {
  const [origin, setOrigin] = useState<LocKey>('Dublin');
  const [destination, setDestination] = useState<LocKey>('Cork');
  const [seats, setSeats] = useState('3');
  const [departure, setDeparture] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(8, 30, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [vehicles, setVehicles] = useState<Awaited<ReturnType<typeof listVehicles>>>([]);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [actualPriceText, setActualPriceText] = useState('');
  const [preview, setPreview] = useState<{ distance_km: number; duration_minutes: number; cost: Breakdown } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listVehicles().then((v) => {
      setVehicles(v);
      setVehicleId(v.find((x) => x.is_default)?.id ?? v[0]?.id ?? null);
    });
  }, []);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId) ?? null,
    [vehicles, vehicleId],
  );

  const runPreview = async () => {
    if (!selectedVehicle) return;
    setLoadingPreview(true);
    const r = await previewTripCost({
      origin: DEFAULT_LOCATIONS[origin],
      destination: DEFAULT_LOCATIONS[destination],
      vehicle: selectedVehicle,
      num_passengers: Math.max(1, parseInt(seats, 10) || 1),
    });
    setPreview({ distance_km: r.distance_km, duration_minutes: r.duration_minutes, cost: r.cost_breakdown });
    setLoadingPreview(false);
  };

  const onPublish = async () => {
    const decl = getDeclarationsAcceptance();
    if (!decl.acceptedAt) {
      Alert.alert(
        'Driver declarations needed',
        'Before publishing your first trip you must accept the driver declarations.',
        [
          { text: 'Open', onPress: () => router.push('/declarations') },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }
    const verif = canPerformAction({ action: 'post_trip', records: listVerifications() });
    if (!verif.ok) {
      Alert.alert(
        'Verification needed',
        `Before publishing, complete: ${verif.gaps.map((g) => g.subject.replace('_', ' ')).join(', ')}.`,
        [
          { text: 'Open', onPress: () => router.push('/verify') },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }
    if (!selectedVehicle || !preview) return;
    setSaving(true);
    try {
      const maxPrice = preview.cost.max_price_per_seat;
      const requested = parseFloat(actualPriceText.replace(',', '.'));
      const finalActual = isFinite(requested) ? Math.min(requested, maxPrice) : maxPrice;
      const t = await createTrip({
        origin: DEFAULT_LOCATIONS[origin],
        destination: DEFAULT_LOCATIONS[destination],
        vehicle_id: selectedVehicle.id,
        departure_time: new Date(departure).toISOString(),
        available_seats: Math.max(1, parseInt(seats, 10) || 1),
        actual_price_per_seat: finalActual,
      });
      router.replace({ pathname: '/trip/[id]', params: { id: t.id } });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <Heading level="xl">Post a trip</Heading>
      <Body muted>You declare a journey you’re already taking. Giorra caps the contribution at calculated cost.</Body>

      <Card style={{ gap: theme.spacing(2) }}>
        <Heading level="md">Route</Heading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {(Object.keys(DEFAULT_LOCATIONS) as LocKey[]).map((k) => (
            <Pill key={`o-${k}`} label={`From: ${k}`} selected={origin === k} onPress={() => setOrigin(k)} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {(Object.keys(DEFAULT_LOCATIONS) as LocKey[]).map((k) => (
            <Pill key={`d-${k}`} label={`To: ${k}`} selected={destination === k} onPress={() => setDestination(k)} />
          ))}
        </View>
        <Caption>(Mock geocoding. Wire Mapbox later to type real addresses.)</Caption>
      </Card>

      <Card style={{ gap: theme.spacing(2) }}>
        <Heading level="md">Details</Heading>
        <Input
          label="Departure (local)"
          value={departure}
          onChangeText={setDeparture}
          hint="yyyy-mm-ddThh:mm — wire native date picker later"
        />
        <Input
          label="Seats offered (excluding you)"
          keyboardType="number-pad"
          value={seats}
          onChangeText={setSeats}
        />
        <Heading level="sm">Vehicle</Heading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {vehicles.map((v) => (
            <Pill
              key={v.id}
              label={`${v.make} ${v.model}`}
              selected={vehicleId === v.id}
              onPress={() => setVehicleId(v.id)}
            />
          ))}
          {vehicles.length === 0 ? <Caption>Add a vehicle first.</Caption> : null}
        </View>
        <Button title="Preview cost" variant="secondary" onPress={runPreview} loading={loadingPreview} />
      </Card>

      {preview ? (
        <>
          <CostBreakdown breakdown={preview.cost} />
          <Card style={{ gap: theme.spacing(2) }}>
            <Heading level="md">Your contribution request</Heading>
            <Caption>You can only set this at or below the calculated max (€{preview.cost.max_price_per_seat.toFixed(2)}).</Caption>
            <Input
              label="Contribution per seat (EUR)"
              keyboardType="decimal-pad"
              value={actualPriceText}
              onChangeText={setActualPriceText}
              placeholder={preview.cost.max_price_per_seat.toFixed(2)}
            />
            <Button title="Publish trip" full loading={saving} onPress={onPublish} />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
