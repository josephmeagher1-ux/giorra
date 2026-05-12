import React, { useEffect, useState } from 'react';
import { View, Alert, Switch } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Caption } from '@/components/ui/Heading';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import {
  AUTO_TOPUP_THRESHOLD_EUR,
  DRIVER_TRIP_FEE_EUR,
  FREE_DRIVER_TRIPS,
  effectivePerTripCost,
  TOPUP_PACKS_EUR,
  topUpBonusFor,
  topUpCreditFor,
  type TopUpAmount,
} from '@drivey/shared';
import {
  creditWallet,
  freeTripsRemaining,
  getWallet,
  listTopUps,
  setAutoTopUp,
  summaryFor,
} from '@/lib/billing';
import { flags } from '@/lib/featureFlags';
import { theme } from '@/lib/theme';
import { SELF } from '@/lib/mock/data';

export default function SubscriptionScreen() {
  const [wallet, setWallet] = useState(getWallet(SELF.id));
  const [tab, setTab] = useState(summaryFor(SELF.id));
  const [topups, setTopups] = useState(listTopUps(SELF.id));
  const [freeLeft, setFreeLeft] = useState(freeTripsRemaining(SELF.id));
  const [busyPack, setBusyPack] = useState<TopUpAmount | null>(null);

  const refresh = () => {
    setWallet(getWallet(SELF.id));
    setTab(summaryFor(SELF.id));
    setTopups(listTopUps(SELF.id));
    setFreeLeft(freeTripsRemaining(SELF.id));
  };

  useEffect(() => {
    refresh();
  }, []);

  const topUp = async (amount: TopUpAmount) => {
    setBusyPack(amount);
    try {
      // Live mode: open Stripe Checkout one-off charge for `amount` EUR,
      // listen for the payment_intent.succeeded webhook on the server, and
      // credit the wallet from there.
      const { bonus_eur } = creditWallet({
        driver_id: SELF.id,
        amount_eur: amount,
        source: 'manual',
      });
      refresh();
      const credit = topUpCreditFor(amount);
      Alert.alert(
        'Topped up',
        bonus_eur > 0
          ? `€${amount.toFixed(2)} paid · +€${bonus_eur.toFixed(2)} loyalty bonus · €${credit.toFixed(2)} added to your wallet.`
          : `€${amount.toFixed(2)} added to your Drivey wallet.`,
      );
    } finally {
      setBusyPack(null);
    }
  };

  const toggleAuto = (enabled: boolean) => {
    const w = setAutoTopUp({
      driver_id: SELF.id,
      enabled,
      stripe_payment_method_id: enabled ? 'pm_mock_card' : undefined,
    });
    setWallet(w);
  };

  return (
    <Screen scroll>
      <Heading level="xl">Driver billing</Heading>
      <Body muted>
        Drivey charges drivers a small per-trip fee, only when the driver confirms they were paid
        by the rider. Riders never pay Drivey. Your first {FREE_DRIVER_TRIPS} confirmed-paid trips
        are free. After that each trip debits €{DRIVER_TRIP_FEE_EUR.toFixed(2)} from your prepaid
        Drivey wallet.
      </Body>

      <Card style={{ gap: 8 }}>
        <Heading level="md">Free trial</Heading>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Caption>Free trips remaining</Caption>
          <Body style={{ fontWeight: '700' }}>
            {freeLeft} / {FREE_DRIVER_TRIPS}
          </Body>
        </View>
        {freeLeft === 0 ? (
          <Pill label="Trial used up — wallet covers further trips" variant="warn" />
        ) : (
          <Pill
            label={`${freeLeft} free trip${freeLeft === 1 ? '' : 's'} on the house`}
            variant="accent"
          />
        )}
      </Card>

      <Card style={{ gap: 8 }}>
        <Heading level="md">Your Drivey wallet</Heading>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Caption>Current balance</Caption>
          <Body style={{ fontWeight: '700' }}>€{wallet.balance_eur.toFixed(2)}</Body>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Caption>Outstanding (unpaid because wallet was empty)</Caption>
          <Body>€{tab.outstanding_eur.toFixed(2)}</Body>
        </View>
        {tab.outstanding_eur > 0 ? (
          <Pill label="Top up to clear outstanding balance" variant="warn" />
        ) : null}
      </Card>

      <Card style={{ gap: theme.spacing(2) }}>
        <Heading level="md">Top up</Heading>
        <Caption>
          Minimum top-up is €{TOPUP_PACKS_EUR[0]}. One-off charge via Stripe Checkout — card,
          Apple Pay, or Google Pay. No recurring authorization, no IBAN.
        </Caption>
        {TOPUP_PACKS_EUR.map((pack) => {
          const cost = effectivePerTripCost({
            pack_eur: pack,
            per_trip_fee_eur: DRIVER_TRIP_FEE_EUR,
          });
          const bonus = topUpBonusFor(pack);
          const credit = topUpCreditFor(pack);
          const title =
            bonus > 0
              ? `Top up €${pack.toFixed(2)} — get €${credit.toFixed(2)} (${cost.trips_in_pack} trips)`
              : `Top up €${pack.toFixed(2)} — ${cost.trips_in_pack} trips`;
          return (
            <View key={pack} style={{ gap: 4 }}>
              <Button
                title={title}
                variant={pack === 10 ? 'primary' : 'secondary'}
                full
                loading={busyPack === pack}
                onPress={() => topUp(pack)}
              />
              {bonus > 0 ? (
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  <Pill label={`+€${bonus.toFixed(2)} loyalty bonus`} variant="accent" />
                  <Pill
                    label={`+${Math.round(bonus / DRIVER_TRIP_FEE_EUR)} free trips on top`}
                    variant="accent"
                  />
                </View>
              ) : null}
              <Caption>
                Stripe fee €{cost.stripe_fee_eur.toFixed(2)} · effective €
                {cost.effective_per_trip_eur.toFixed(3)} per trip
              </Caption>
            </View>
          );
        })}
      </Card>

      <Card style={{ gap: theme.spacing(2) }}>
        <Heading level="md">Auto top-up</Heading>
        <Caption>
          When your balance drops to €{AUTO_TOPUP_THRESHOLD_EUR.toFixed(2)}, Drivey automatically
          charges your saved card for €{wallet.auto_topup_pack.toFixed(2)}. Off by default — turn
          on only if you want it.
        </Caption>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Body>Auto top-up</Body>
          <Switch
            value={wallet.auto_topup_enabled}
            onValueChange={toggleAuto}
            disabled={!flags.driverSubscriptionEnabled}
          />
        </View>
        {!flags.driverSubscriptionEnabled ? (
          <Caption muted>
            Wire up Stripe Checkout SetupIntent to store the driver's card before enabling auto
            top-up in production.
          </Caption>
        ) : null}
        {wallet.stripe_payment_method_id ? (
          <Pill label={`Card saved · ${wallet.stripe_payment_method_id}`} variant="info" />
        ) : null}
      </Card>

      <Card style={{ gap: 6 }}>
        <Heading level="md">Recent top-ups</Heading>
        {topups.length === 0 ? (
          <Caption>No top-ups yet.</Caption>
        ) : (
          topups.slice(0, 10).map((t) => (
            <View key={t.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Caption>
                {new Date(t.created_at).toLocaleDateString('en-IE')} · {t.source}
              </Caption>
              <Body>
                €{t.gross_eur.toFixed(2)} (fee €{t.stripe_fee_eur.toFixed(2)})
              </Body>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}
