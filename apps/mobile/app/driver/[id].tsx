import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Caption } from '@/components/ui/Heading';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { getDriverProfile } from '@/lib/api';
import { theme } from '@/lib/theme';

type DriverProfileData = Awaited<ReturnType<typeof getDriverProfile>>;

export default function DriverProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [driver, setDriver] = useState<DriverProfileData | null>(null);

  useEffect(() => {
    if (id) getDriverProfile(id).then(setDriver);
  }, [id]);

  if (!driver) {
    return (
      <Screen>
        <Caption>Loading...</Caption>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Card style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {driver.profile.full_name.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Heading level="xl">{driver.profile.full_name}</Heading>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="star" size={14} color={theme.colors.accent} />
              <Caption>
                {driver.rating.count > 0
                  ? `${driver.rating.avg_stars.toFixed(2)} (${driver.rating.count} ratings)`
                  : `${driver.profile.rating.toFixed(2)} (no reviews yet)`}
              </Caption>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <Pill label={`${driver.profile.trips_completed} trips`} variant="info" />
          <Pill label={`Member since ${new Date(driver.profile.joined_at).toLocaleDateString('en-IE', { month: 'short', year: 'numeric' })}`} variant="info" />
        </View>
        {driver.profile.bio && (
          <Body muted>{driver.profile.bio}</Body>
        )}
      </Card>

      <Card style={{ gap: 8 }}>
        <Heading level="md">Vehicles</Heading>
        {driver.vehicles.length === 0 ? (
          <Body muted>No vehicles listed.</Body>
        ) : (
          driver.vehicles.map((v) => (
            <View key={v.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Body>
                {v.year} {v.make} {v.model}
              </Body>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Pill label={v.fuel.replace('_', ' ')} variant="info" />
                {v.colour && <Pill label={v.colour} />}
              </View>
            </View>
          ))
        )}
      </Card>

      {driver.rating.count > 0 && (
        <Card style={{ gap: 8 }}>
          <Heading level="md">Rating breakdown</Heading>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: theme.colors.accent }}>
              {driver.rating.avg_stars.toFixed(1)}
            </Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Caption>{driver.rating.count} total ratings as driver</Caption>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {[5, 4, 3, 2, 1].map((star) => (
                  <Pill key={star} label={`${star}★`} variant={star >= 4 ? 'accent' : star >= 3 ? 'info' : 'warn'} />
                ))}
              </View>
            </View>
          </View>
        </Card>
      )}
    </Screen>
  );
}

const styles = {
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarText: { color: theme.colors.accentDark, fontWeight: '700' as const, fontSize: 20 },
};
