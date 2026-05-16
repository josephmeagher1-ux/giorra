import React, { useEffect, useState } from 'react';
import { View, Text, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Caption } from '@/components/ui/Heading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CostBreakdown } from '@/components/CostBreakdown';
import { MapPreview } from '@/components/MapPreview';
import { bookSeat, getTrip, getOrgIncentivesForTrip, previewTripCost } from '@/lib/api';
import { openInExternalMap } from '@/lib/navHandoff';
import { checkBookingArrangement, type CostBreakdown as Breakdown } from '@giorra/shared';
import { theme } from '@/lib/theme';

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Awaited<ReturnType<typeof getTrip>> | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [incentives, setIncentives] = useState<Awaited<ReturnType<typeof getOrgIncentivesForTrip>>>([]);
  const [booking, setBooking] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

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
      getOrgIncentivesForTrip('commute', t.distance_km, t.actual_price_per_seat)
        .then((inc) => { if (!cancelled) setIncentives(inc); });
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
  const departure = new Date(trip.departure_time);

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
      <MapPreview origin={trip.origin} destination={trip.destination} routeGeometry={trip.routeGeometry} height={220} />

      <View style={{ gap: 4 }}>
        <Text style={styles.h1}>
          {trip.origin.name} → {trip.destination.name}
        </Text>
        <Caption>
          {departure.toLocaleDateString('en-IE', { weekday: 'long', day: '2-digit', month: 'long' })} ·{' '}
          {departure.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
        </Caption>
      </View>

      <View style={styles.summaryRow}>
        <SummaryTile icon="clock" label="Duration" value={formatDuration(trip.duration_minutes)} />
        <SummaryTile icon="map" label="Distance" value={`${Math.round(trip.distance_km)} km`} />
        <SummaryTile icon="users" label="Seats left" value={`${seatsLeft}`} />
      </View>

      <Card style={{ gap: theme.spacing(3) }}>
        <View style={styles.driverRow}>
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}
            onPress={() => router.push({ pathname: '/driver/[id]', params: { id: trip.driver_id } })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(trip.driver.full_name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{trip.driver.full_name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="star" size={12} color={theme.colors.accent} />
                <Caption>
                  {trip.driver.rating.toFixed(2)} · {trip.driver.trips_completed} trips
                </Caption>
              </View>
            </View>
          </Pressable>
          <Pressable
            onPress={() => router.push({ pathname: '/chat/[tripId]', params: { tripId: trip.id } })}
            style={styles.iconButton}
            hitSlop={10}
          >
            <Feather name="message-circle" size={18} color={theme.colors.text} />
          </Pressable>
        </View>
        <View style={styles.divider} />
        <View style={styles.vehicleRow}>
          <Feather name="truck" size={16} color={theme.colors.textMuted} />
          <Caption>
            {trip.vehicle.year} {trip.vehicle.make} {trip.vehicle.model} · {trip.vehicle.fuel.replace('_', ' ')}
          </Caption>
        </View>
      </Card>

      <View style={styles.priceCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.priceLabel}>Your seat</Text>
          <Text style={styles.priceValue}>€{trip.actual_price_per_seat.toFixed(2)}</Text>
          <Text style={styles.priceMax}>
            Cost-share ceiling €{trip.max_price_per_seat.toFixed(2)}
          </Text>
        </View>
        <Pressable
          onPress={() => setShowBreakdown((v) => !v)}
          style={styles.breakdownLink}
        >
          <Caption style={{ color: theme.colors.accent, fontWeight: '600' }}>
            {showBreakdown ? 'Hide' : 'How is this calculated?'}
          </Caption>
          <Feather
            name={showBreakdown ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={theme.colors.accent}
          />
        </Pressable>
      </View>

      {showBreakdown && breakdown ? <CostBreakdown breakdown={breakdown} /> : null}

      {incentives.length > 0 && (
        <View style={styles.incentiveCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="gift" size={16} color={theme.colors.accentDark} />
            <Text style={{ fontWeight: '700', color: theme.colors.accentDark, fontSize: 14 }}>
              Organisation savings
            </Text>
          </View>
          {incentives.map((inc) => (
            <View key={inc.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.accentDark }}>{inc.label}</Text>
                <Caption style={{ color: theme.colors.accentDark }}>{inc.org_name}</Caption>
              </View>
              {inc.estimated_amount > 0 && (
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.accentDark }}>
                  -EUR{inc.estimated_amount.toFixed(2)}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={styles.actionsCard}>
        <Caption muted>Open this route in a navigation app</Caption>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <NavButton
            icon="map"
            label="Google Maps"
            onPress={() => openInExternalMap('google', { origin: trip.origin, destination: trip.destination })}
          />
          <NavButton
            icon="navigation"
            label="Waze"
            onPress={() => openInExternalMap('waze', { origin: trip.origin, destination: trip.destination })}
          />
          <NavButton
            icon="compass"
            label="Apple Maps"
            onPress={() => openInExternalMap('apple', { origin: trip.origin, destination: trip.destination })}
          />
        </View>
      </View>

      {!isOwnTrip ? (
        <Button
          title={seatsLeft === 0 ? 'Sold out' : `Book seat · €${trip.actual_price_per_seat.toFixed(2)}`}
          full
          disabled={seatsLeft === 0}
          loading={booking}
          onPress={onBook}
        />
      ) : (
        <Card>
          <Caption>You’re the driver on this trip.</Caption>
        </Card>
      )}
    </Screen>
  );
}

function SummaryTile({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.summaryTile}>
      <Feather name={icon} size={14} color={theme.colors.accent} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function NavButton({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.navButton} onPress={onPress}>
      <Feather name={icon} size={14} color={theme.colors.text} />
      <Text style={styles.navButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = {
  h1: { fontSize: 24, fontWeight: '800' as const, color: theme.colors.text, letterSpacing: -0.5 },
  summaryRow: { flexDirection: 'row' as const, gap: 8 },
  summaryTile: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(3),
    alignItems: 'center' as const,
    gap: 2,
  },
  summaryValue: { fontSize: 16, fontWeight: '700' as const, color: theme.colors.text, marginTop: 4 },
  summaryLabel: { fontSize: 11, color: theme.colors.textMuted },
  driverRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarText: { color: theme.colors.accentDark, fontWeight: '700' as const, fontSize: 14 },
  driverName: { fontSize: 16, fontWeight: '700' as const, color: theme.colors.text },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.chip,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  divider: { height: 1, backgroundColor: theme.colors.border },
  vehicleRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  priceCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing(4),
    gap: 8,
  },
  priceLabel: { fontSize: 11, color: theme.colors.accentDark, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.6 },
  priceValue: { fontSize: 32, fontWeight: '800' as const, color: theme.colors.accentDark, letterSpacing: -0.8, marginTop: 2 },
  priceMax: { fontSize: 11, color: theme.colors.accentDark, opacity: 0.7, marginTop: 2 },
  breakdownLink: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
  incentiveCard: {
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing(4),
    gap: 10,
  },
  actionsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(4),
    gap: 10,
  },
  navButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  navButtonText: { fontSize: 12, fontWeight: '600' as const, color: theme.colors.text },
};
