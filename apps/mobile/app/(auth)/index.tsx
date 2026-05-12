import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Caption } from '@/components/ui/Heading';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { useAuthStore } from '@/stores/authStore';
import { flags } from '@/lib/featureFlags';
import { theme } from '@/lib/theme';

export default function AuthIndex() {
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('you@example.ie');
  const [loading, setLoading] = useState(false);

  const onContinue = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    signIn(email);
    setLoading(false);
  };

  return (
    <Screen scroll>
      <View style={{ gap: 8 }}>
        <Pill label="Cost-sharing carpool · Ireland" variant="accent" />
        <Heading level="xxl">Drivey</Heading>
        <Body muted>
          Share the real cost of trips you’re already taking. The app caps each contribution so
          it never crosses the line into commercial hire.
        </Body>
      </View>

      <Card style={{ gap: theme.spacing(2) }}>
        <Heading level="md">Sign in</Heading>
        <Caption>
          {flags.supabaseConfigured
            ? 'Email + magic link via Supabase Auth.'
            : 'No Supabase keys configured — running in mock mode. Any email gets you in.'}
        </Caption>
        <Input
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Button title="Continue" full loading={loading} onPress={onContinue} />
      </Card>

      <Card style={{ gap: 6 }}>
        <Heading level="sm">What Drivey is not</Heading>
        <Body muted>
          Drivey is not a taxi or hackney service. Drivers can never be paid above calculated cost
          and the driver always pays their own share too.
        </Body>
      </Card>
    </Screen>
  );
}
