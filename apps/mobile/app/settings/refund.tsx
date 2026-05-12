import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Caption } from '@/components/ui/Heading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { quoteRefundFor, requestRefund } from '@/lib/billing';
import { REFUND_ADMIN_FEE_EUR, WALLET_INACTIVITY_EXPIRY_MONTHS } from '@drivey/shared';
import { SELF } from '@/lib/mock/data';

/**
 * Wallet refund flow. Deliberately tucked into account settings, not on the
 * main wallet screen, so it complies with the EU refund right (everyone who
 * looks for it can find it) without putting it under every driver's nose.
 * The driver has to navigate Settings → Help → Wallet refund, read the
 * deduction breakdown, and tap a final confirmation before anything happens.
 */
export default function WalletRefundScreen() {
  const [confirmed, setConfirmed] = useState(false);
  const quote = quoteRefundFor(SELF.id);

  const submit = () => {
    if (quote.net_refund_eur === 0) {
      Alert.alert(
        'Nothing to refund',
        'Your wallet has no refundable balance once the admin fee is taken into account.',
      );
      return;
    }
    requestRefund(SELF.id);
    Alert.alert(
      'Refund submitted',
      `We will refund €${quote.net_refund_eur.toFixed(2)} to your original payment method in 5–10 business days. A confirmation email is on its way.`,
    );
    router.back();
  };

  return (
    <Screen scroll>
      <Heading level="xl">Request a wallet refund</Heading>
      <Body muted>
        Refunds are available on request as required by EU consumer law. Most drivers find it
        easier to let the balance roll forward — your Drivey credit doesn’t expire for{' '}
        {WALLET_INACTIVITY_EXPIRY_MONTHS} months of inactivity.
      </Body>

      <Card style={{ gap: 6 }}>
        <Heading level="md">Refund quote</Heading>
        <Row label="Cash you’ve topped up" value={`€${quote.cash_topped_up_eur.toFixed(2)}`} />
        <Row label="Fees already paid by your wallet" value={`-€${quote.fees_paid_eur.toFixed(2)}`} />
        <Row label="Refundable cash" value={`€${quote.refundable_eur.toFixed(2)}`} bold />
        <Row label={`Admin fee (deducted)`} value={`-€${quote.admin_fee_eur.toFixed(2)}`} />
        <Row label="Bonus credit forfeit" value={`-€${quote.bonus_forfeit_eur.toFixed(2)}`} muted />
        <View style={{ height: 1, backgroundColor: '#ddd', marginVertical: 4 }} />
        <Row label="Net refund" value={`€${quote.net_refund_eur.toFixed(2)}`} bold />
      </Card>

      <Card style={{ gap: 8 }}>
        <Heading level="md">Before you confirm</Heading>
        <Caption>
          · Loyalty bonus credit (from larger top-ups) is non-refundable because Drivey never
          received it in cash.
        </Caption>
        <Caption>
          · A €{REFUND_ADMIN_FEE_EUR.toFixed(2)} admin fee covers Stripe’s non-recoverable
          processing fee on the original top-up plus admin overhead.
        </Caption>
        <Caption>
          · Refunds typically arrive within 5–10 business days on your original payment method.
        </Caption>
        <Pill
          label={confirmed ? 'Confirmed — ready to submit' : 'Tap to confirm you understand'}
          selected={confirmed}
          onPress={() => setConfirmed((v) => !v)}
        />
      </Card>

      <Button
        title="Submit refund request"
        full
        variant={confirmed ? 'primary' : 'ghost'}
        disabled={!confirmed}
        onPress={submit}
      />
      <Button title="Keep my balance" variant="ghost" full onPress={() => router.back()} />
    </Screen>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Caption muted={muted}>{label}</Caption>
      <Body style={bold ? { fontWeight: '700' } : undefined} muted={muted}>
        {value}
      </Body>
    </View>
  );
}
