import React from 'react';
import { View } from 'react-native';
import { Card } from './ui/Card';
import { Body, Caption, Heading } from './ui/Heading';
import { Pill } from './ui/Pill';
import { theme } from '@/lib/theme';

interface TripCardProps {
  origin: string;
  destination: string;
  departure: string;
  pricePerSeat: number;
  maxPerSeat: number;
  driverName: string;
  driverRating: number;
  seatsLeft: number;
  vehicleLabel?: string;
  recurringLabel?: string;
  badge?: string;
}

export function TripCard(props: TripCardProps) {
  return (
    <Card style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Heading level="md">
          {props.origin} → {props.destination}
        </Heading>
        <Heading level="lg" style={{ color: theme.colors.accent }}>
          €{props.pricePerSeat.toFixed(2)}
        </Heading>
      </View>
      <Caption>{new Date(props.departure).toLocaleString('en-IE', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Caption>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        <Pill label={`${props.driverName} · ★ ${props.driverRating.toFixed(2)}`} />
        <Pill label={`${props.seatsLeft} seat${props.seatsLeft === 1 ? '' : 's'} left`} variant={props.seatsLeft === 0 ? 'danger' : 'accent'} />
        {props.vehicleLabel ? <Pill label={props.vehicleLabel} /> : null}
        {props.recurringLabel ? <Pill label={props.recurringLabel} variant="info" /> : null}
        {props.badge ? <Pill label={props.badge} variant="warn" /> : null}
      </View>
      <Caption>Max contribution €{props.maxPerSeat.toFixed(2)} · driver pays own share</Caption>
    </Card>
  );
}
