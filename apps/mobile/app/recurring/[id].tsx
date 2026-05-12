import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Caption } from '@/components/ui/Heading';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { listPublicRecurringPatterns, nextOccurrences } from '@/lib/api';
import type { MockRecurringPattern } from '@/lib/mock/data';
import { theme } from '@/lib/theme';

export default function RecurringDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [p, setP] = useState<MockRecurringPattern | null>(null);

  useEffect(() => {
    listPublicRecurringPatterns().then((all) => setP(all.find((x) => x.id === id) ?? null));
  }, [id]);

  if (!p) {
    return (
      <Screen>
        <Caption>Loading…</Caption>
      </Screen>
    );
  }

  const upcoming = nextOccurrences(p, 12);

  return (
    <Screen scroll>
      <Card style={{ gap: 6 }}>
        <Heading level="xl">{p.label}</Heading>
        <Caption>
          {p.origin.name} → {p.destination.name}
        </Caption>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <Pill label={p.category} variant="info" />
          <Pill label={`€${p.actual_price_per_seat.toFixed(2)}/seat`} variant="accent" />
          <Pill label={`Max €${p.max_price_per_seat.toFixed(2)}`} />
          {p.pattern.term_time_only ? <Pill label="Term-time only" variant="warn" /> : null}
        </View>
      </Card>

      <Card style={{ gap: theme.spacing(1) }}>
        <Heading level="md">Schedule</Heading>
        <Body>
          {p.pattern.days.join(', ').toUpperCase()} · departs {p.pattern.depart_local_time}
        </Body>
        {p.pattern.term_time_only ? (
          <Caption>Holidays and school breaks are skipped automatically.</Caption>
        ) : null}
      </Card>

      <Card style={{ gap: theme.spacing(1) }}>
        <Heading level="md">Next {upcoming.length} departures</Heading>
        {upcoming.map((u) => (
          <Body key={u.departure_at}>
            • {new Date(u.departure_at).toLocaleString('en-IE', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Body>
        ))}
      </Card>
    </Screen>
  );
}
