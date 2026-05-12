import React from 'react';
import { View } from 'react-native';
import type { CostBreakdown as Breakdown } from '@giorra/shared';
import { Card } from './ui/Card';
import { Body, Caption, Heading } from './ui/Heading';
import { Pill } from './ui/Pill';
import { theme } from '@/lib/theme';

interface Props {
  breakdown: Breakdown;
}

function eur(n: number) {
  return `€${n.toFixed(2)}`;
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 }}>
      <Body muted={!accent}>{label}</Body>
      <Body style={{ fontWeight: accent ? '700' : '500' }}>{value}</Body>
    </View>
  );
}

export function CostBreakdown({ breakdown }: Props) {
  const b = breakdown;
  const binding = b.ceiling_source === 'ECC' ? b.ecc : b.pbc;
  const other = b.ceiling_source === 'ECC' ? b.pbc : b.ecc;
  const bindingLabel = b.ceiling_source === 'ECC' ? 'Real cost cap' : 'Civil Service benchmark cap';
  const otherLabel = b.ceiling_source === 'ECC' ? 'Civil Service benchmark' : 'Real cost ceiling';

  return (
    <Card style={{ gap: theme.spacing(3) }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Heading level="lg">Cost breakdown</Heading>
        <Pill label={bindingLabel} variant="accent" />
      </View>

      <View>
        <Caption>Per kilometre (real cost)</Caption>
        <Row label="Fuel / energy" value={eur(b.fuel_cost_per_km)} />
        <Row label="Depreciation" value={eur(b.depreciation_per_km)} />
        <Row label="Maintenance" value={eur(b.maintenance_per_km)} />
        <Row label="Tyres" value={eur(b.tyre_per_km)} />
        <Row label="Insurance (pro-rated)" value={eur(b.insurance_per_km)} />
        <Row label="Motor tax + NCT" value={eur(b.tax_nct_per_km)} />
        <Row label="Total per km" value={eur(b.total_per_km)} accent />
      </View>

      <View>
        <Caption>Trip</Caption>
        <Row label={`Distance (incl. ${Math.round((b.detour_factor - 1) * 100)}% detour)`} value={`${b.distance_km_adjusted.toFixed(1)} km`} />
        <Row label="Tolls" value={eur(b.toll_cost)} />
        {b.parking_cost > 0 ? <Row label="Parking" value={eur(b.parking_cost)} /> : null}
        <Row label="Total trip cost" value={eur(b.total_trip_cost)} accent />
      </View>

      <View>
        <Caption>Ceilings (we use the lower)</Caption>
        <Row label={`Real cost / seat (ECC)`} value={eur(b.ecc.per_seat)} />
        <Row label={`Benchmark / seat (PBC)`} value={eur(b.pbc.per_seat)} />
        <Row label="Max contribution per seat" value={eur(b.max_price_per_seat)} accent />
      </View>

      <View style={{ gap: 4 }}>
        <Caption>Audit</Caption>
        <Caption>Binding cap: {bindingLabel} ({eur(binding.per_seat)})</Caption>
        <Caption>Other ceiling: {otherLabel} ({eur(other.per_seat)})</Caption>
        <Caption>Benchmark source: {b.benchmark_source}</Caption>
        <Caption>Formula: {b.formula_version}</Caption>
      </View>
    </Card>
  );
}
