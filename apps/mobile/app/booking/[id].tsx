import React, { useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Caption } from '@/components/ui/Heading';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { EscrowStatus } from '@/components/EscrowStatus';
import {
  cancelByDriver,
  cancelByRider,
  driverAccept,
  driverConfirmAtPickup,
  getEscrowBooking,
  listCharities,
  riderCommitNoFunds,
  riderConfirmAtPickup,
  riderConfirmDropoff,
  riderDeposit,
  timeoutResolve,
  type EscrowBooking,
} from '@/lib/escrow';
import { getProfile } from '@/lib/api';
import { createAndPresentPaymentSheet } from '@/lib/payments';
import { flags, moneyTouchesGiorra } from '@/lib/featureFlags';
import { theme } from '@/lib/theme';
import { SELF } from '@/lib/mock/data';

const charities = listCharities();
const NOTICE_BOARD = !moneyTouchesGiorra();

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [b, setB] = useState<EscrowBooking | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    const x = getEscrowBooking(id!);
    setB(x ? { ...x } : null);
  };

  useEffect(() => {
    refresh();
  }, [id]);

  if (!b) {
    return (
      <Screen>
        <Caption>Loading…</Caption>
      </Screen>
    );
  }

  const isRider = b.rider_id === SELF.id;
  const isDriver = b.driver_id === SELF.id;
  // Escrow fallback charity is the *driver's* preferred charity, picked once
  // in their profile — riders don't choose it at booking time.
  const driverCharityId = getProfile().preferred_charity_id;
  const driverCharity = charities.find((c) => c.id === driverCharityId);
  const charityName = charities.find((c) => c.id === b.charity_id)?.name ?? driverCharity?.name;

  const doDeposit = async () => {
    if (!driverCharityId) {
      Alert.alert(
        'Driver has no charity set',
        'This driver has not picked a fallback charity yet. Try a different driver or ask them to set one in their profile.',
      );
      return;
    }
    setBusy(true);
    try {
      const pay = await createAndPresentPaymentSheet({
        bookingId: b.id,
        amountEur: b.total_eur,
      });
      if (pay.status !== 'authorized') {
        Alert.alert('Payment not held', pay.status);
        return;
      }
      riderDeposit(b.id, driverCharityId);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const doNoticeBoardCommit = () => {
    riderCommitNoFunds(b.id);
    refresh();
  };

  return (
    <Screen scroll>
      <Heading level="xl">Booking</Heading>
      <Card style={{ gap: 4 }}>
        <Body style={{ fontWeight: '600' }}>
          Trip {b.trip_id} · {b.seats} seat · €{b.total_eur.toFixed(2)}
        </Body>
        <Caption>You are the {isRider ? 'rider' : isDriver ? 'driver' : 'observer'}.</Caption>
        <Button
          title="Messages"
          variant="secondary"
          onPress={() => router.push({ pathname: '/chat/[tripId]', params: { tripId: b.trip_id } })}
        />
      </Card>

      {NOTICE_BOARD ? (
        <Card style={{ gap: 4 }}>
          <Heading level="md">Payment</Heading>
          <Body muted>
            Giorra does not handle money. Pay your driver directly in cash or by Revolut after the
            trip. Suggested total: €{b.total_eur.toFixed(2)}.
          </Body>
          <Pill label="Notice-board mode" variant="info" />
        </Card>
      ) : (
        <EscrowStatus state={b.state} totalEur={b.total_eur} charityName={charityName} />
      )}

      {b.state.phase === 'requested' && isDriver ? (
        <Button
          title="Accept request"
          onPress={() => {
            driverAccept(b.id);
            refresh();
          }}
        />
      ) : null}

      {b.state.phase === 'accepted' && isRider ? (
        NOTICE_BOARD ? (
          <Card style={{ gap: theme.spacing(2) }}>
            <Heading level="md">Confirm you’ll be there</Heading>
            <Body muted>
              The driver has accepted you. Bring cash or have Revolut ready for €{b.total_eur.toFixed(2)}.
              Rate each other after the trip so future drivers and riders can trust you.
            </Body>
            <Button title="I’ll be there" full onPress={doNoticeBoardCommit} />
          </Card>
        ) : (
          <>
            <Card style={{ gap: 4 }}>
              <Heading level="md">Escrow</Heading>
              <Body muted>
                If you no-show, the held funds go to the driver’s chosen charity
                {driverCharity ? `: ${driverCharity.name}.` : '.'}
              </Body>
            </Card>
            <Button
              title={`Deposit €${b.total_eur.toFixed(2)} into escrow`}
              full
              loading={busy}
              onPress={doDeposit}
            />
          </>
        )
      ) : null}

      {(b.state.phase === 'funds_held' || b.state.phase === 'driver_at_pickup' || b.state.phase === 'rider_at_pickup') ? (
        <Card style={{ gap: theme.spacing(2) }}>
          <Heading level="md">Pickup confirmation</Heading>
          <Body muted>
            Both parties must tap "I'm here" once you've actually met. If only one taps, the
            departure-window timer will resolve the escrow at the scheduled time.
          </Body>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {isDriver && !b.state.driver_confirmed_at ? (
              <Button
                title="Driver: I'm at pickup"
                onPress={() => {
                  driverConfirmAtPickup(b.id);
                  refresh();
                }}
              />
            ) : null}
            {isRider && !b.state.rider_confirmed_at ? (
              <Button
                title="Rider: I'm at pickup"
                onPress={() => {
                  riderConfirmAtPickup(b.id);
                  refresh();
                }}
              />
            ) : null}
          </View>
        </Card>
      ) : null}

      {b.state.phase === 'in_transit' && isRider ? (
        <Button
          title={
            NOTICE_BOARD
              ? 'Confirm drop-off & continue to rating'
              : 'Confirm drop-off — release funds to driver'
          }
          full
          onPress={() => {
            riderConfirmDropoff(b.id);
            refresh();
            router.push({ pathname: '/rate/[id]', params: { id: b.id } });
          }}
        />
      ) : null}

      {b.state.phase === 'completed' ? (
        <Button
          title={isRider ? 'Rate the driver' : 'Rate the rider'}
          full
          onPress={() => router.push({ pathname: '/rate/[id]', params: { id: b.id } })}
        />
      ) : null}

      {(b.state.phase === 'requested' || b.state.phase === 'accepted' || b.state.phase === 'funds_held') ? (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {isRider ? (
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => {
                cancelByRider(b.id);
                refresh();
              }}
            />
          ) : null}
          {isDriver ? (
            <Button
              title="Cancel as driver"
              variant="ghost"
              onPress={() => {
                cancelByDriver(b.id);
                refresh();
              }}
            />
          ) : null}
        </View>
      ) : null}

      <Card style={{ gap: 4 }}>
        <Heading level="md">Event log</Heading>
        {b.history.length === 0 ? (
          <Caption>No events yet.</Caption>
        ) : (
          b.history.map((h, i) => (
            <Caption key={i}>
              {h.at_iso} · {h.type} → {h.resulting_phase}
            </Caption>
          ))
        )}
        <Button
          title="(Dev) Force-resolve: driver present, rider absent"
          variant="ghost"
          onPress={() => {
            timeoutResolve(b.id, { driver_present: true, rider_present: false });
            refresh();
          }}
        />
      </Card>
    </Screen>
  );
}
