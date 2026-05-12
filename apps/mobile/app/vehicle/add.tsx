import React, { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Heading, Caption, Body } from '@/components/ui/Heading';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { addVehicle } from '@/lib/api';
import { vehicleSchema, type VehicleInput } from '@giorra/shared';
import { theme } from '@/lib/theme';

const FUELS: Array<VehicleInput['fuel']> = [
  'petrol',
  'diesel',
  'hybrid_petrol',
  'hybrid_diesel',
  'electric',
];

export default function AddVehicleScreen() {
  const [form, setForm] = useState({
    make: 'Volkswagen',
    model: 'Golf',
    year: '2020',
    fuel: 'petrol' as VehicleInput['fuel'],
    consumption_l_100km: '6.8',
    kwh_per_100km: '',
    engine_cc: '1400',
    total_seats: '5',
    colour: 'Silver',
    registration: '',
    annual_insurance_eur: '720',
    annual_motor_tax_eur: '280',
    annual_nct_maintenance_eur: '220',
    expected_annual_km: '16000',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async () => {
    setError(null);
    const num = (s: string) => (s.trim() === '' ? undefined : Number(s));
    const candidate: VehicleInput = {
      make: form.make,
      model: form.model,
      year: Number(form.year),
      fuel: form.fuel,
      consumption_l_100km: num(form.consumption_l_100km),
      kwh_per_100km: num(form.kwh_per_100km),
      engine_cc: num(form.engine_cc),
      total_seats: Number(form.total_seats),
      colour: form.colour || undefined,
      registration: form.registration || undefined,
      annual_insurance_eur: num(form.annual_insurance_eur),
      annual_motor_tax_eur: num(form.annual_motor_tax_eur),
      annual_nct_maintenance_eur: num(form.annual_nct_maintenance_eur),
      expected_annual_km: num(form.expected_annual_km),
    };
    const parsed = vehicleSchema.safeParse(candidate);
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join(', '));
      return;
    }
    setSaving(true);
    await addVehicle(parsed.data as any);
    setSaving(false);
    router.back();
  };

  return (
    <Screen scroll>
      <Heading level="xl">Add a vehicle</Heading>
      <Body muted>
        These values are used in your cost calculations. The more accurate they are, the more
        defensible your pricing.
      </Body>

      <Card style={{ gap: theme.spacing(1) }}>
        <Heading level="md">Vehicle</Heading>
        <Input label="Make" value={form.make} onChangeText={(v) => update('make', v)} />
        <Input label="Model" value={form.model} onChangeText={(v) => update('model', v)} />
        <Input label="Year" keyboardType="number-pad" value={form.year} onChangeText={(v) => update('year', v)} />
        <Input label="Engine cc" keyboardType="number-pad" value={form.engine_cc} onChangeText={(v) => update('engine_cc', v)} hint="Used to pick the Civil Service mileage band" />
        <Input label="Total seats" keyboardType="number-pad" value={form.total_seats} onChangeText={(v) => update('total_seats', v)} hint="Excluding the driver, must be ≤ 8" />
        <Input label="Colour" value={form.colour} onChangeText={(v) => update('colour', v)} />
        <Input label="Registration" value={form.registration} onChangeText={(v) => update('registration', v)} />

        <Heading level="sm">Fuel</Heading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {FUELS.map((f) => (
            <Pill key={f} label={f.replace('_', ' ')} selected={form.fuel === f} onPress={() => update('fuel', f as any)} />
          ))}
        </View>

        <Input label="Consumption (L/100km)" keyboardType="decimal-pad" value={form.consumption_l_100km} onChangeText={(v) => update('consumption_l_100km', v)} hint="Petrol/diesel/hybrid only" />
        <Input label="Consumption (kWh/100km)" keyboardType="decimal-pad" value={form.kwh_per_100km} onChangeText={(v) => update('kwh_per_100km', v)} hint="Electric only" />
      </Card>

      <Card style={{ gap: theme.spacing(1) }}>
        <Heading level="md">Ownership costs</Heading>
        <Caption>
          These pro-rate over your expected yearly km. Caps are applied per-km so unrealistic
          values are softened automatically.
        </Caption>
        <Input label="Annual insurance (EUR)" keyboardType="decimal-pad" value={form.annual_insurance_eur} onChangeText={(v) => update('annual_insurance_eur', v)} />
        <Input label="Annual motor tax (EUR)" keyboardType="decimal-pad" value={form.annual_motor_tax_eur} onChangeText={(v) => update('annual_motor_tax_eur', v)} />
        <Input label="Annual NCT + maintenance (EUR)" keyboardType="decimal-pad" value={form.annual_nct_maintenance_eur} onChangeText={(v) => update('annual_nct_maintenance_eur', v)} />
        <Input label="Expected annual km" keyboardType="number-pad" value={form.expected_annual_km} onChangeText={(v) => update('expected_annual_km', v)} />
      </Card>

      {error ? <Body style={{ color: theme.colors.danger }}>{error}</Body> : null}
      <Button title="Save vehicle" full loading={saving} onPress={onSubmit} />
    </Screen>
  );
}
