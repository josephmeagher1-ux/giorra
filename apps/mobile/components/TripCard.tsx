import React from 'react';
import { View, Text, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
  durationMinutes?: number;
  distanceKm?: number;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Trip result card. Uses the rail/dot visual that BlaBlaCar made the
 * convention for "leg" displays — origin top, destination bottom, with a
 * connector showing the relationship between the two and the duration on
 * the side. Price is the right-aligned anchor.
 */
export function TripCard(props: TripCardProps) {
  const departureDate = new Date(props.departure);
  const timeText = departureDate.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });
  const dateText = departureDate.toLocaleDateString('en-IE', { weekday: 'short', day: '2-digit', month: 'short' });

  return (
    <View style={cardStyles.card}>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={cardStyles.dateLabel}>{dateText}</Text>
          <View style={cardStyles.legRow}>
            <View style={cardStyles.rail}>
              <View style={cardStyles.dotStart} />
              <View style={cardStyles.line} />
              <View style={cardStyles.dotEnd} />
            </View>
            <View style={{ gap: 14, flex: 1 }}>
              <View>
                <Text style={cardStyles.time}>{timeText}</Text>
                <Text style={cardStyles.place} numberOfLines={1}>
                  {props.origin}
                </Text>
              </View>
              <View>
                <Text style={cardStyles.timeMuted}>
                  {props.durationMinutes ? `${formatDuration(props.durationMinutes)}` : '—'}
                </Text>
                <Text style={cardStyles.place} numberOfLines={1}>
                  {props.destination}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={cardStyles.price}>€{props.pricePerSeat.toFixed(2)}</Text>
          <Text style={cardStyles.priceLabel}>per seat</Text>
          <View style={{ marginTop: 6 }}>
            <SeatsBadge seatsLeft={props.seatsLeft} />
          </View>
        </View>
      </View>

      <View style={cardStyles.divider} />

      <View style={cardStyles.footer}>
        <View style={cardStyles.driverRow}>
          <View style={cardStyles.avatar}>
            <Text style={cardStyles.avatarText}>{initialsOf(props.driverName)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={cardStyles.driverName} numberOfLines={1}>
              {props.driverName}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="star" size={11} color={theme.colors.accent} />
              <Text style={cardStyles.metaText}>{props.driverRating.toFixed(2)}</Text>
              {props.vehicleLabel ? (
                <>
                  <Text style={cardStyles.metaDot}>·</Text>
                  <Text style={cardStyles.metaText} numberOfLines={1}>
                    {props.vehicleLabel}
                  </Text>
                </>
              ) : null}
            </View>
          </View>
        </View>
        <Text style={cardStyles.maxText}>Max €{props.maxPerSeat.toFixed(2)}</Text>
      </View>

      {(props.recurringLabel || props.badge) ? (
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          {props.recurringLabel ? (
            <View style={cardStyles.tag}>
              <Feather name="repeat" size={11} color={theme.colors.info} />
              <Text style={[cardStyles.tagText, { color: theme.colors.info }]}>
                {props.recurringLabel}
              </Text>
            </View>
          ) : null}
          {props.badge ? (
            <View style={cardStyles.tag}>
              <Text style={cardStyles.tagText}>{props.badge}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function SeatsBadge({ seatsLeft }: { seatsLeft: number }) {
  if (seatsLeft === 0) {
    return (
      <View style={[cardStyles.seatsPill, { backgroundColor: '#fbe3e3' }]}>
        <Text style={[cardStyles.seatsText, { color: theme.colors.danger }]}>Sold out</Text>
      </View>
    );
  }
  return (
    <View style={[cardStyles.seatsPill, { backgroundColor: theme.colors.accentSoft }]}>
      <Feather name="users" size={10} color={theme.colors.accentDark} />
      <Text style={[cardStyles.seatsText, { color: theme.colors.accentDark }]}>
        {seatsLeft} left
      </Text>
    </View>
  );
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const cardStyles = {
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(4),
    gap: theme.spacing(3),
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }
      : { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }),
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: theme.colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  legRow: { flexDirection: 'row' as const, alignItems: 'stretch' as const, gap: 12 },
  rail: { width: 14, alignItems: 'center' as const, paddingVertical: 8 },
  dotStart: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.accent,
  },
  line: { flex: 1, width: 2, backgroundColor: theme.colors.border, marginVertical: 2 },
  dotEnd: {
    width: 10,
    height: 10,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  time: { fontSize: 15, fontWeight: '700' as const, color: theme.colors.text },
  timeMuted: { fontSize: 12, color: theme.colors.textMuted },
  place: { fontSize: 14, color: theme.colors.text, marginTop: 1 },
  price: { fontSize: 24, fontWeight: '800' as const, color: theme.colors.accent, letterSpacing: -0.5 },
  priceLabel: { fontSize: 10, color: theme.colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.6 },
  divider: { height: 1, backgroundColor: theme.colors.border },
  footer: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  driverRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, flex: 1 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarText: { color: theme.colors.accentDark, fontWeight: '700' as const, fontSize: 12 },
  driverName: { fontSize: 13, fontWeight: '600' as const, color: theme.colors.text },
  metaText: { fontSize: 11, color: theme.colors.textMuted },
  metaDot: { color: theme.colors.textMuted, fontSize: 10, marginHorizontal: 1 },
  maxText: { fontSize: 11, color: theme.colors.textSubtle },
  seatsPill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
  },
  seatsText: { fontSize: 10, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.4 },
  tag: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.chip,
  },
  tagText: { fontSize: 10, fontWeight: '600' as const, color: theme.colors.textMuted },
};
