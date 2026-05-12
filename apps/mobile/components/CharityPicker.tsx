import React from 'react';
import { View } from 'react-native';
import { Card } from './ui/Card';
import { Heading, Body, Caption } from './ui/Heading';
import { Pill } from './ui/Pill';
import { theme } from '@/lib/theme';
import type { Charity } from '@drivey/shared';

interface Props {
  charities: Charity[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function CharityPicker({ charities, selectedId, onSelect }: Props) {
  return (
    <Card style={{ gap: theme.spacing(2) }}>
      <Heading level="md">Choose a charity</Heading>
      <Body muted>
        If pickup doesn’t happen because the rider isn’t there, your deposit goes to this charity
        instead. Drivey never keeps the money.
      </Body>
      <View style={{ gap: 8 }}>
        {charities.map((c) => (
          <View key={c.id} style={{ gap: 2 }}>
            <Pill
              label={c.name}
              selected={selectedId === c.id}
              onPress={() => onSelect(c.id)}
            />
            <Caption>{c.tagline}</Caption>
          </View>
        ))}
      </View>
    </Card>
  );
}
