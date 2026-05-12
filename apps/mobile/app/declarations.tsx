import React, { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Caption } from '@/components/ui/Heading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { DRIVER_DECLARATIONS } from '@drivey/shared';
import { acceptDeclarations, getDeclarationsAcceptance } from '@/lib/api';

export default function DeclarationsScreen() {
  const [accepted, setAccepted] = useState<string[]>([]);
  const existing = getDeclarationsAcceptance().acceptedAt;
  const all = DRIVER_DECLARATIONS.required_at_first_post;
  const ready = accepted.length === all.length;

  const toggle = (id: string) =>
    setAccepted((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const onConfirm = () => {
    acceptDeclarations();
    router.back();
  };

  return (
    <Screen scroll>
      <Heading level="xl">Driver declarations</Heading>
      <Body muted>
        Drivey is a cost-sharing platform. To post trips you need to confirm the following so we
        have an audit trail if regulators or insurers ever ask.
      </Body>
      {existing ? (
        <Pill label={`Last signed ${new Date(existing).toLocaleString('en-IE')}`} variant="accent" />
      ) : null}

      {all.map((d) => {
        const isOn = accepted.includes(d.id);
        return (
          <Card key={d.id} style={{ gap: 6, borderColor: isOn ? '#0f6e4e' : undefined }}>
            <Body>{d.text}</Body>
            <View style={{ alignSelf: 'flex-start' }}>
              <Pill
                label={isOn ? 'I agree' : 'Tap to agree'}
                selected={isOn}
                onPress={() => toggle(d.id)}
              />
            </View>
          </Card>
        );
      })}

      <Caption>Declarations version: {DRIVER_DECLARATIONS.version}</Caption>
      <Button title="Sign and continue" full disabled={!ready} onPress={onConfirm} />
    </Screen>
  );
}
