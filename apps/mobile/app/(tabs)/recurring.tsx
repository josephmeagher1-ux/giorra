import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Link, router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Caption } from '@/components/ui/Heading';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { listRecurringPatterns, nextOccurrences } from '@/lib/api';

export default function RecurringTabScreen() {
  const [patterns, setPatterns] = useState<Awaited<ReturnType<typeof listRecurringPatterns>>>([]);

  useEffect(() => {
    listRecurringPatterns().then(setPatterns);
  }, []);

  return (
    <Screen scroll>
      <View>
        <Heading level="xl">Regular routes</Heading>
        <Body muted>
          Set up commutes or school runs once and the app will offer them on every matching day.
        </Body>
      </View>

      <Button title="New regular route" full onPress={() => router.push('/recurring/new')} />

      {patterns.length === 0 ? (
        <Card>
          <Body muted>No regular routes yet. Add a school run or commute and it’ll auto-publish each day.</Body>
        </Card>
      ) : (
        patterns.map((p) => {
          const next = nextOccurrences(p, 3);
          return (
            <Link key={p.id} href={{ pathname: '/recurring/[id]', params: { id: p.id } }} asChild>
              <Pressable>
                <Card style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Heading level="md">{p.label}</Heading>
                    <Pill label={p.category} variant="info" />
                  </View>
                  <Caption>
                    {p.origin.name} → {p.destination.name}
                  </Caption>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    <Pill label={p.pattern.days.join(', ')} />
                    <Pill label={`Departs ${p.pattern.depart_local_time}`} />
                    {p.pattern.term_time_only ? <Pill label="Term-time only" variant="warn" /> : null}
                  </View>
                  <Caption>
                    Next: {next.map((n) => new Date(n.departure_at).toLocaleString('en-IE', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })).join(' · ')}
                  </Caption>
                </Card>
              </Pressable>
            </Link>
          );
        })
      )}
    </Screen>
  );
}
