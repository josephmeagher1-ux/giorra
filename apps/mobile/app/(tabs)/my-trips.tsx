import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Caption } from '@/components/ui/Heading';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { listMyBookings, listMyTripsAsDriver, listMyDriverBookings } from '@/lib/api';

export default function MyTripsScreen() {
  const [asDriver, setAsDriver] = useState<Awaited<ReturnType<typeof listMyTripsAsDriver>>>([]);
  const [asRider, setAsRider] = useState<Awaited<ReturnType<typeof listMyBookings>>>([]);
  const [driverRequests, setDriverRequests] = useState<Awaited<ReturnType<typeof listMyDriverBookings>>>([]);

  const refresh = async () => {
    const [d, r, dr] = await Promise.all([
      listMyTripsAsDriver(),
      listMyBookings(),
      listMyDriverBookings(),
    ]);
    setAsDriver(d);
    setAsRider(r);
    setDriverRequests(dr);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <Screen scroll>
      <Heading level="xl">My trips</Heading>

      <View style={{ gap: 6 }}>
        <Heading level="md">As driver ({asDriver.length})</Heading>
        {asDriver.length === 0 ? (
          <Body muted>You haven’t posted any trips yet.</Body>
        ) : (
          asDriver.map((t) => (
            <Link key={t.id} href={{ pathname: '/trip/[id]', params: { id: t.id } }} asChild>
              <Pressable>
                <Card style={{ gap: 4 }}>
                  <Heading level="sm">
                    {t.origin.name} → {t.destination.name}
                  </Heading>
                  <Caption>{new Date(t.departure_time).toLocaleString('en-IE')}</Caption>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Pill label={`€${t.actual_price_per_seat.toFixed(2)}/seat`} variant="accent" />
                    <Pill label={`${t.available_seats - t.booked_seats} seats left`} />
                    <Pill label={t.status} variant={t.status === 'published' ? 'info' : 'warn'} />
                  </View>
                </Card>
              </Pressable>
            </Link>
          ))
        )}
      </View>

      <View style={{ gap: 6 }}>
        <Heading level="md">As rider ({asRider.length})</Heading>
        {asRider.length === 0 ? (
          <Body muted>No bookings yet. Search for a trip on the Search tab.</Body>
        ) : (
          asRider.map((b) => (
            <Link key={b.id} href={{ pathname: '/booking/[id]', params: { id: b.id } }} asChild>
              <Pressable>
                <Card style={{ gap: 4 }}>
                  <Heading level="sm">
                    {b.trip.origin.name} → {b.trip.destination.name}
                  </Heading>
                  <Caption>
                    {new Date(b.trip.departure_time).toLocaleString('en-IE')} · with {b.driver.full_name}
                  </Caption>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Pill label={`€${b.total_price.toFixed(2)} total`} variant="accent" />
                    <Pill label={b.escrow_phase.replace(/_/g, ' ')} variant="info" />
                  </View>
                </Card>
              </Pressable>
            </Link>
          ))
        )}
      </View>

      <View style={{ gap: 6 }}>
        <Heading level="md">Requests to drive ({driverRequests.length})</Heading>
        {driverRequests.length === 0 ? (
          <Body muted>No riders have requested seats on your trips yet.</Body>
        ) : (
          driverRequests.map((d) => (
            <Link key={d.id} href={{ pathname: '/booking/[id]', params: { id: d.id } }} asChild>
              <Pressable>
                <Card style={{ gap: 4 }}>
                  <Heading level="sm">
                    {d.trip?.origin.name} → {d.trip?.destination.name}
                  </Heading>
                  <Caption>{d.rider.full_name} · €{d.total_eur.toFixed(2)}</Caption>
                  <Pill label={d.phase.replace(/_/g, ' ')} variant="info" />
                </Card>
              </Pressable>
            </Link>
          ))
        )}
      </View>
    </Screen>
  );
}
