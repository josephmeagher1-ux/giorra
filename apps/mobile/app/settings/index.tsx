import React from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Caption } from '@/components/ui/Heading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

/**
 * Account settings. Light by design — most account state lives on the
 * profile tab. This screen exists primarily to hide the wallet refund flow
 * behind another layer of navigation while still being technically
 * discoverable for users who really want it.
 */
export default function SettingsScreen() {
  return (
    <Screen scroll>
      <Heading level="xl">Settings</Heading>
      <Body muted>Manage your account, billing, and data preferences.</Body>

      <Card style={{ gap: 6 }}>
        <Heading level="md">Help & support</Heading>
        <Caption>
          For most questions please check the in-app help. For account issues that need a human,
          email support@giorra.ie — we aim to reply within 5 business days.
        </Caption>
        <Button
          title="Wallet refund request"
          variant="ghost"
          onPress={() => router.push('/settings/refund')}
        />
      </Card>

      <Card style={{ gap: 6 }}>
        <Heading level="md">Data & privacy</Heading>
        <Caption>
          Giorra’s privacy policy explains what we collect and how to request a data export or
          deletion under GDPR.
        </Caption>
      </Card>
    </Screen>
  );
}
