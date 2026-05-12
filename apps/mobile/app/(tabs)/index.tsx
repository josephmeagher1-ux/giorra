import React, { useEffect, useState } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Heading, Caption, Body } from '@/components/ui/Heading';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { TripCard } from '@/components/TripCard';
import { searchTrips, listPublicRecurringPatterns } from '@/lib/api';
import { theme } from '@/lib/theme';

type SearchHit = Awaited<ReturnType<typeof searchTrips>>[number];
type Recurring = Awaited<ReturnType<typeof listPublicRecurringPatterns>>[number];

export default function SearchScreen() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState<SearchHit[]>([]);
  const [recurring, setRecurring] = useState<Recurring[]>([]);

  const run = async () => {
    setLoading(true);
    const [t, r] = await Promise.all([
      searchTrips({ origin_text: origin, destination_text: destination }),
      listPublicRecurringPatterns(),
    ]);
    setTrips(t);
    setRecurring(r);
    setLoading(false);
  };

  useEffect(() => {
    run();
  }, []);

  return (
    <Screen>
      <View>
        <Heading level="xl">Find a trip</Heading>
        <Caption>Pre-arranged carpooling. Driver shares the trip cost with passengers.</Caption>
      </View>

      <Card style={{ gap: 4 }}>
        <Input label="Pick up near" placeholder="e.g. Naas" value={origin} onChangeText={setOrigin} />
        <Input label="Drop off near" placeholder="e.g. Dublin city" value={destination} onChangeText={setDestination} />
        <Button title="Search" loading={loading} onPress={run} full />
      </Card>

      <View style={{ gap: 6 }}>
        <Heading level="md">{trips.length} trips matched</Heading>
        <FlatList
          data={trips}
          keyExtractor={(t) => t.id}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing(2) }} />}
          renderItem={({ item }) => (
            <Link href={{ pathname: '/trip/[id]', params: { id: item.id } }} asChild>
              <Pressable>
                <TripCard
                  origin={item.origin.name}
                  destination={item.destination.name}
                  departure={item.departure_time}
                  pricePerSeat={item.actual_price_per_seat}
                  maxPerSeat={item.max_price_per_seat}
                  driverName={item.driver.full_name}
                  driverRating={item.driver.rating}
                  seatsLeft={item.available_seats - item.booked_seats}
                  vehicleLabel={`${item.vehicle.make} ${item.vehicle.model}`}
                />
              </Pressable>
            </Link>
          )}
          ListEmptyComponent={
            !loading ? (
              <Body muted>No trips match. Try posting a route you’re already taking.</Body>
            ) : null
          }
          scrollEnabled={false}
        />
      </View>

      {recurring.length > 0 ? (
        <View style={{ gap: 6 }}>
          <Heading level="md">Regular routes near you</Heading>
          {recurring.slice(0, 4).map((r) => (
            <Link key={r.id} href={{ pathname: '/recurring/[id]', params: { id: r.id } }} asChild>
              <Pressable>
                <Card style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Heading level="sm">{r.label}</Heading>
                    <Body style={{ fontWeight: '700', color: theme.colors.accent }}>
                      €{r.actual_price_per_seat.toFixed(2)}
                    </Body>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    <Pill label={r.category} variant="info" />
                    <Pill label={`${r.pattern.days.join(', ')}`} />
                    <Pill label={`Departs ${r.pattern.depart_local_time}`} />
                    {r.pattern.term_time_only ? <Pill label="Term-time only" variant="warn" /> : null}
                  </View>
                </Card>
              </Pressable>
            </Link>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
