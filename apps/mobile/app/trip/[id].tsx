import React, { useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Caption } from '@/components/ui/Heading';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { CostBreakdown } from '@/components/CostBreakdown';
import {
  bookSeat,
  getTrip,
  previewTripCost,
} from '@/lib/api';
import { openInExternalMap } from '@/lib/navHandoff';
import { checkBookingArrangement, type CostBreakdown as Breakdown } from '@drivey/shared';
import { theme } from '@/lib/theme';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Awaited<ReturnType<typeof getTrip>> | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = await getTrip(id!);
      if (cancelled) return;
      setTrip(t);
      if (t.cost_breakdown) {
        setBreakdown(t.cost_breakdown);
      } else {
        const preview = await previewTripCost({
          origin: t.origin,
          destination: t.destination,
          vehicle: t.vehicle,
          num_passengers: t.available_seats,
        });
        if (!cancelled) setBreakdown(preview.cost_breakdown);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!trip) {
    return (
      <Screen>
        <Caption>Loading trip…</Caption>
      </Screen>
    );
  }

  const seatsLeft = trip.available_seats - trip.booked_seats;
  const isOwnTrip = trip.driver_id === 'me';

  const onBook = async () => {
    const arrangement = checkBookingArrangement({
      now_iso: new Date().toISOString(),
      departure_iso: trip.departure_time,
    });
    if (!arrangement.ok) {
      Alert.alert('Not allowed', arrangement.message);
      return;
    }
    setBooking(true);
    try {
      const b = await bookSeat({ trip_id: trip.id, seats: 1 });
      router.replace({ pathname: '/booking/[id]', params: { id: b.escrow_id } });
    } catch (e: any) {
      Alert.alert('Booking failed', e?.message ?? 'Unknown error');
    } finally {
      setBooking(false);
    }
  };

  return (
    <Screen scroll>
      <Card style={{ gap: 6 }}>
        <Heading level="xl">
          {trip.origin.name} → {trip.destination.name}
        </Heading>
        <Caption>{new Date(trip.departure_time).toLocaleString('en-IE')}</Caption>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <Pill label={`Driver · ${trip.driver.full_name} ★ ${trip.driver.rating.toFixed(2)}`} variant="info" />
          <Pill label={`${trip.vehicle.make} ${trip.vehicle.model} (${trip.vehicle.fuel})`} />
          <Pill
            label={`${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left`}
            variant={seatsLeft === 0 ? 'danger' : 'accent'}
          />
        </View>
        <Heading level="xl" style={{ color: theme.colors.accent, marginTop: theme.spacing(2) }}>
          €{trip.actual_price_per_seat.toFixed(2)} <Caption>/ seat · max €{trip.max_price_per_seat.toFixed(2)}</Caption>
        </Heading>
      </Card>

      {breakdown ? <CostBreakdown breakdown={breakdown} /> : null}

      <Card style={{ gap: theme.spacing(2) }}>
        <Heading level="md">Open in navigation app</Heading>
        <Caption>
          We keep pricing tied to the agreed route. External apps may reroute slightly.
        </Caption>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <Button
            title="Google Maps"
            variant="secondary"
            onPress={() => openInExternalMap('google', {
              origin: trip.origin,
              destination: trip.destination,
            })}
          />
          <Button
            title="Waze"
            variant="secondary"
            onPress={() => openInExternalMap('waze', {
              origin: trip.origin,
              destination: trip.destination,
            })}
          />
          <Button
            title="Apple Maps"
            variant="secondary"
            onPress={() => openInExternalMap('apple', {
              origin: trip.origin,
              destination: trip.destination,
            })}
          />
        </View>
      </Card>

      {!isOwnTrip ? (
        <Button
          title={seatsLeft === 0 ? 'Sold out' : `Book a seat · €${trip.actual_price_per_seat.toFixed(2)}`}
          full
          disabled={seatsLeft === 0}
          loading={booking}
          onPress={onBook}
        />
      ) : (
        <Caption>You’re the driver on this trip.</Caption>
      )}
    </Screen>
  );
}
