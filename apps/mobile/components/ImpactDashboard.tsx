import React from 'react';
import { View } from 'react-native';
import { Card } from './ui/Card';
import { Heading, Body, Caption } from './ui/Heading';
import { Pill } from './ui/Pill';
import { theme } from '@/lib/theme';
import { summariseDriverImpact, type ImpactSummary } from '@drivey/shared';

interface Props {
  trips: Array<{ distance_km: number; passengers: number; per_seat_eur: number }>;
}

export function ImpactDashboard({ trips }: Props) {
  const summary: ImpactSummary = summariseDriverImpact(trips);
  return (
    <Card style={{ gap: theme.spacing(2) }}>
      <Heading level="md">Your impact</Heading>
      <Body muted>
        Passengers paying you toward fuel and wear, plus the carbon those passengers would have
        otherwise emitted by driving themselves.
      </Body>

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Tile label="Cost shared" value={`€${summary.cost_shared_eur.toFixed(2)}`} />
        <Tile label="Carbon avoided" value={`${summary.carbon_avoided_kg.toFixed(1)} kg`} />
        <Tile label="Trips" value={`${summary.trips_completed}`} />
        <Tile label="Passengers carried" value={`${summary.total_passengers}`} />
      </View>

      {summary.equivalent_trees_planted > 0 ? (
        <Pill
          label={`Roughly equivalent to ${summary.equivalent_trees_planted} trees absorbing CO₂ for a year`}
          variant="accent"
        />
      ) : null}
    </Card>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexGrow: 1,
        minWidth: 130,
        backgroundColor: theme.colors.chip,
        borderRadius: theme.radius.md,
        padding: theme.spacing(2),
      }}
    >
      <Caption>{label}</Caption>
      <Heading level="lg">{value}</Heading>
    </View>
  );
}
