import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, Platform } from 'react-native';
import { Link } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Caption } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { TripCard } from '@/components/TripCard';
import { LocationInput } from '@/components/LocationInput';
import { searchTrips, listPublicRecurringPatterns } from '@/lib/api';
import { type GeocodingResult } from '@/lib/geocoding';
import { theme } from '@/lib/theme';

type SearchHit = Awaited<ReturnType<typeof searchTrips>>[number];
type Recurring = Awaited<ReturnType<typeof listPublicRecurringPatterns>>[number];

type DateFilter = 'any' | 'today' | 'tomorrow' | 'this_week';

export default function SearchScreen() {
  const [originLoc, setOriginLoc] = useState<GeocodingResult | null>(null);
  const [destLoc, setDestLoc] = useState<GeocodingResult | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('any');
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState<SearchHit[]>([]);
  const [recurring, setRecurring] = useState<Recurring[]>([]);

  const run = async () => {
    setLoading(true);
    const [t, r] = await Promise.all([
      searchTrips({
        origin_text: originLoc?.name ?? '',
        destination_text: destLoc?.name ?? '',
        date_filter: dateFilter,
      }),
      listPublicRecurringPatterns(),
    ]);
    setTrips(t);
    setRecurring(r);
    setLoading(false);
  };

  useEffect(() => {
    run();
  }, []);

  const swap = () => {
    const tmp = originLoc;
    setOriginLoc(destLoc);
    setDestLoc(tmp);
  };

  return (
    <Screen scroll onRefresh={run} refreshing={loading}>
      <View style={{ gap: 4 }}>
        <Text style={s.h1}>Where are you going?</Text>
        <Text style={s.h1Sub}>Find a ride from a driver heading the same way.</Text>
      </View>

      <View style={s.searchCard}>
        <LocationInput
          label="Pick up from"
          value={originLoc}
          onSelect={setOriginLoc}
          placeholder="e.g. Naas"
          icon="circle"
          iconColor={theme.colors.accent}
        />
        <View style={s.searchDivider}>
          <View style={s.searchDividerLine} />
          <Pressable onPress={swap} style={s.swapButton} hitSlop={10}>
            <Feather name="repeat" size={14} color={theme.colors.text} />
          </Pressable>
        </View>
        <LocationInput
          label="Drop off at"
          value={destLoc}
          onSelect={setDestLoc}
          placeholder="e.g. Dublin city"
          icon="map-pin"
          iconColor={theme.colors.warn}
        />
        <View style={s.searchRow}>
          <Feather name="calendar" size={14} color={theme.colors.textMuted} />
          <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <Pill label="Any time" selected={dateFilter === 'any'} onPress={() => setDateFilter('any')} />
            <Pill label="Today" selected={dateFilter === 'today'} onPress={() => setDateFilter('today')} />
            <Pill label="Tomorrow" selected={dateFilter === 'tomorrow'} onPress={() => setDateFilter('tomorrow')} />
            <Pill label="This week" selected={dateFilter === 'this_week'} onPress={() => setDateFilter('this_week')} />
          </View>
        </View>
        <Button title={loading ? 'Searching…' : 'Search rides'} loading={loading} onPress={run} full />
      </View>

      <View style={{ gap: theme.spacing(3) }}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>{trips.length} ride{trips.length === 1 ? '' : 's'} available</Text>
          <Text style={s.sectionSub}>Sorted by departure time</Text>
        </View>
        <FlatList
          data={trips}
          keyExtractor={(t) => t.id}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing(3) }} />}
          renderItem={({ item }) => (
            <Link href={{ pathname: '/trip/[id]', params: { id: item.id } }} asChild>
              <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
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
                  durationMinutes={item.duration_minutes}
                  distanceKm={item.distance_km}
                />
              </Pressable>
            </Link>
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={s.emptyCard}>
                <Feather name="navigation" size={24} color={theme.colors.textMuted} />
                <Text style={s.emptyTitle}>No rides match</Text>
                <Text style={s.emptyText}>Try a wider search or post a route you’re already taking.</Text>
              </View>
            ) : null
          }
          scrollEnabled={false}
        />
      </View>

      {recurring.length > 0 ? (
        <View style={{ gap: theme.spacing(3) }}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Popular regular routes</Text>
            <Text style={s.sectionSub}>Commutes and school runs you can join</Text>
          </View>
          {recurring.slice(0, 4).map((r) => (
            <Link key={r.id} href={{ pathname: '/recurring/[id]', params: { id: r.id } }} asChild>
              <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                <View style={s.recurringCard}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.recurringLabel}>{r.label}</Text>
                    <Caption>
                      {r.pattern.days.join(', ')} · Departs {r.pattern.depart_local_time}
                      {r.pattern.term_time_only ? ' · Term only' : ''}
                    </Caption>
                  </View>
                  <Text style={s.recurringPrice}>€{r.actual_price_per_seat.toFixed(2)}</Text>
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}


const s = {
  h1: { fontSize: 26, fontWeight: '800' as const, color: theme.colors.text, letterSpacing: -0.5 },
  h1Sub: { fontSize: 14, color: theme.colors.textMuted },
  searchCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(4),
    gap: theme.spacing(2),
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 6px 24px rgba(15,110,78,0.08)' }
      : { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }),
  },
  searchRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, paddingVertical: 6 },
  searchDivider: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginLeft: 22 },
  searchDividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  swapButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sectionHeader: { gap: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, color: theme.colors.text, letterSpacing: -0.2 },
  sectionSub: { fontSize: 12, color: theme.colors.textMuted },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(6),
    alignItems: 'center' as const,
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700' as const, color: theme.colors.text },
  emptyText: { fontSize: 12, color: theme.colors.textMuted, textAlign: 'center' as const },
  recurringCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(4),
  },
  recurringLabel: { fontSize: 14, fontWeight: '700' as const, color: theme.colors.text },
  recurringPrice: { fontSize: 18, fontWeight: '800' as const, color: theme.colors.accent },
};
