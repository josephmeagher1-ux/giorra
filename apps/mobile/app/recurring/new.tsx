import React, { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Caption } from '@/components/ui/Heading';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { CostBreakdown } from '@/components/CostBreakdown';
import { LocationInput } from '@/components/LocationInput';
import {
  createRecurringPattern,
  listVehicles,
  previewTripCost,
} from '@/lib/api';
import { recurrencePatternSchema, type CostBreakdown as Breakdown, type DayOfWeek, type RecurrenceCategory } from '@giorra/shared';
import { type GeocodingResult } from '@/lib/geocoding';
import { theme } from '@/lib/theme';

const CATEGORIES: RecurrenceCategory[] = ['commute', 'school', 'sports', 'event', 'other'];
const DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function NewRecurringScreen() {
  const [label, setLabel] = useState('Weekday commute');
  const [category, setCategory] = useState<RecurrenceCategory>('commute');
  const [originLoc, setOriginLoc] = useState<GeocodingResult | null>(null);
  const [destLoc, setDestLoc] = useState<GeocodingResult | null>(null);
  const [days, setDays] = useState<DayOfWeek[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [time, setTime] = useState('07:15');
  const [termOnly, setTermOnly] = useState(false);
  const [seats, setSeats] = useState('3');
  const [vehicles, setVehicles] = useState<Awaited<ReturnType<typeof listVehicles>>>([]);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Breakdown | null>(null);
  const [actualPriceText, setActualPriceText] = useState('');
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

  const toggleDay = (d: DayOfWeek) =>
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  const runPreview = async () => {
    if (!selectedVehicle || !originLoc || !destLoc) return;
    const r = await previewTripCost({
      origin: { lat: originLoc.lat, lng: originLoc.lng, name: originLoc.name },
      destination: { lat: destLoc.lat, lng: destLoc.lng, name: destLoc.name },
      vehicle: selectedVehicle,
      num_passengers: Math.max(1, parseInt(seats, 10) || 1),
    });
    setPreview(r.cost_breakdown);
  };

  const onSave = async () => {
    if (!selectedVehicle || !originLoc || !destLoc) return;
    const pattern = {
      label,
      category,
      days,
      depart_local_time: time,
      term_time_only: termOnly,
    };
    const parsed = recurrencePatternSchema.safeParse(pattern);
    if (!parsed.success) {
      alert(parsed.error.issues.map((i) => i.message).join(', '));
      return;
    }
    setSaving(true);
    const requested = parseFloat(actualPriceText.replace(',', '.'));
    await createRecurringPattern({
      label,
      category,
      origin: { lat: originLoc.lat, lng: originLoc.lng, name: originLoc.name },
      destination: { lat: destLoc.lat, lng: destLoc.lng, name: destLoc.name },
      vehicle_id: selectedVehicle.id,
      pattern: parsed.data,
      available_seats: Math.max(1, parseInt(seats, 10) || 1),
      actual_price_per_seat: isFinite(requested) ? requested : undefined,
    });
    setSaving(false);
    router.back();
  };

  return (
    <Screen scroll>
      <Heading level="xl">New regular route</Heading>
      <Body muted>
        Set up a commute or a school run once. We auto-publish trips for every matching day.
      </Body>

      <Card style={{ gap: theme.spacing(1) }}>
        <Heading level="md">Basics</Heading>
        <Input label="Label" value={label} onChangeText={setLabel} />
        <Heading level="sm">Category</Heading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {CATEGORIES.map((c) => (
            <Pill key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
      </Card>

      <Card style={{ gap: theme.spacing(1) }}>
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
      </Card>

      <Card style={{ gap: theme.spacing(1) }}>
        <Heading level="md">When</Heading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {DAYS.map((d) => (
            <Pill key={d} label={d.toUpperCase()} selected={days.includes(d)} onPress={() => toggleDay(d)} />
          ))}
        </View>
        <Input label="Depart at (HH:mm local)" value={time} onChangeText={setTime} />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pill label="Term-time only" selected={termOnly} onPress={() => setTermOnly((v) => !v)} variant="warn" />
          <Caption style={{ alignSelf: 'center' }}>(Skips Irish school holidays automatically)</Caption>
        </View>
      </Card>

      <Card style={{ gap: theme.spacing(1) }}>
        <Heading level="md">Vehicle and seats</Heading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {vehicles.map((v) => (
            <Pill key={v.id} label={`${v.make} ${v.model}`} selected={vehicleId === v.id} onPress={() => setVehicleId(v.id)} />
          ))}
        </View>
        <Input label="Seats offered" keyboardType="number-pad" value={seats} onChangeText={setSeats} />
        <Button title="Preview cost" variant="secondary" onPress={runPreview} />
      </Card>

      {preview ? (
        <>
          <CostBreakdown breakdown={preview} />
          <Card style={{ gap: theme.spacing(1) }}>
            <Heading level="md">Your contribution request</Heading>
            <Input
              label="Per seat (EUR)"
              keyboardType="decimal-pad"
              value={actualPriceText}
              onChangeText={setActualPriceText}
              placeholder={preview.max_price_per_seat.toFixed(2)}
              hint={`Capped at €${preview.max_price_per_seat.toFixed(2)}`}
            />
            <Button title="Create regular route" full loading={saving} onPress={onSave} />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
