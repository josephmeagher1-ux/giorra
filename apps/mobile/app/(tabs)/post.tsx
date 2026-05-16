import React, { useEffect, useMemo, useState } from 'react';
import { View, Alert, Text } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Heading, Caption, Body } from '@/components/ui/Heading';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { CostBreakdown } from '@/components/CostBreakdown';
import { LocationInput } from '@/components/LocationInput';
import { Feather } from '@expo/vector-icons';
import { createTrip, getDeclarationsAcceptance, getOrgIncentivesForTrip, listVehicles, previewTripCost } from '@/lib/api';
import { listVerifications } from '@/lib/identity';
import { canPerformAction, type CostBreakdown as Breakdown } from '@giorra/shared';
import { type GeocodingResult } from '@/lib/geocoding';
import { theme } from '@/lib/theme';

type TripCategory = 'commute' | 'school' | 'any';

export default function PostTripScreen() {
  const [originLoc, setOriginLoc] = useState<GeocodingResult | null>(null);
  const [destLoc, setDestLoc] = useState<GeocodingResult | null>(null);
  const [category, setCategory] = useState<TripCategory>('commute');
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
  const [postIncentives, setPostIncentives] = useState<Awaited<ReturnType<typeof getOrgIncentivesForTrip>>>([]);

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
    if (!selectedVehicle || !originLoc || !destLoc) return;
    setLoadingPreview(true);
    const r = await previewTripCost({
      origin: { lat: originLoc.lat, lng: originLoc.lng, name: originLoc.name },
      destination: { lat: destLoc.lat, lng: destLoc.lng, name: destLoc.name },
      vehicle: selectedVehicle,
      num_passengers: Math.max(1, parseInt(seats, 10) || 1),
    });
    setPreview({ distance_km: r.distance_km, duration_minutes: r.duration_minutes, cost: r.cost_breakdown });
    setLoadingPreview(false);
    getOrgIncentivesForTrip(category, r.distance_km, r.cost_breakdown.max_price_per_seat).then(setPostIncentives);
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
    if (!selectedVehicle || !preview || !originLoc || !destLoc) return;
    setSaving(true);
    try {
      const maxPrice = preview.cost.max_price_per_seat;
      const requested = parseFloat(actualPriceText.replace(',', '.'));
      const finalActual = isFinite(requested) ? Math.min(requested, maxPrice) : maxPrice;
      const t = await createTrip({
        origin: { lat: originLoc.lat, lng: originLoc.lng, name: originLoc.name },
        destination: { lat: destLoc.lat, lng: destLoc.lng, name: destLoc.name },
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
        <LocationInput
          label="From"
          value={originLoc}
          onSelect={setOriginLoc}
          placeholder="e.g. Naas, Maynooth"
          icon="circle"
          iconColor={theme.colors.accent}
        />
        <LocationInput
          label="To"
          value={destLoc}
          onSelect={setDestLoc}
          placeholder="e.g. Dublin city centre"
          icon="map-pin"
          iconColor={theme.colors.warn}
        />
        <Caption>Start typing to search Irish locations.</Caption>
      </Card>

      <Card style={{ gap: theme.spacing(2) }}>
        <Heading level="md">Details</Heading>
        <Heading level="sm">Trip category</Heading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <Pill label="Commute" selected={category === 'commute'} onPress={() => setCategory('commute')} />
          <Pill label="School run" selected={category === 'school'} onPress={() => setCategory('school')} />
          <Pill label="Other" selected={category === 'any'} onPress={() => setCategory('any')} />
        </View>
        <Caption>Category determines which org incentives riders can claim.</Caption>
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
          {postIncentives.length > 0 && (
            <Card style={{ backgroundColor: theme.colors.accentSoft, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="info" size={16} color={theme.colors.accentDark} />
                <Text style={{ fontWeight: '700', color: theme.colors.accentDark, fontSize: 13 }}>
                  Riders from {postIncentives[0].org_name} could save up to EUR{Math.max(...postIncentives.map((i) => i.estimated_amount)).toFixed(2)} on this trip
                </Text>
              </View>
            </Card>
          )}
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
