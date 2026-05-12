import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Caption } from '@/components/ui/Heading';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { StarPicker } from '@/components/StarPicker';
import { getEscrowBooking, submitRating } from '@/lib/escrow';
import { accrueDriverFee, freeTripsRemaining } from '@/lib/billing';
import { SELF } from '@/lib/mock/data';
import { DRIVER_TRIP_FEE_EUR, FREE_DRIVER_TRIPS } from '@giorra/shared';

export default function RateBookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const b = getEscrowBooking(id!);
  const [stars, setStars] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [comment, setComment] = useState('');
  const [paymentReceived, setPaymentReceived] = useState<boolean | null>(null);

  if (!b) {
    return (
      <Screen>
        <Caption>Booking not found.</Caption>
      </Screen>
    );
  }

  const isRider = b.rider_id === SELF.id;
  const direction = isRider ? 'rider_rates_driver' : 'driver_rates_rider';
  const rateeLabel = isRider ? 'driver' : 'rider';
  const rateeId = isRider ? b.driver_id : b.rider_id;
  const freeLeft = !isRider ? freeTripsRemaining(SELF.id) : 0;
  const onFreeTier = !isRider && freeLeft > 0;

  const onSubmit = () => {
    if (!isRider && paymentReceived === null) {
      Alert.alert(
        'One more question',
        'Please tell us whether the rider paid you so we know whether to charge the platform fee.',
      );
      return;
    }
    submitRating({
      booking_id: b.id,
      rater_id: SELF.id,
      ratee_id: rateeId,
      direction,
      stars,
      comment: comment || undefined,
    });
    let walletMessage = '';
    if (!isRider && paymentReceived) {
      const result = accrueDriverFee({ driver_id: SELF.id, booking_id: b.id });
      switch (result.outcome) {
        case 'free_trip':
          walletMessage = `Free trip used — ${result.free_trips_remaining} of ${FREE_DRIVER_TRIPS} free trips remaining.`;
          break;
        case 'paid_from_wallet':
          walletMessage = `€${DRIVER_TRIP_FEE_EUR.toFixed(2)} debited from your Giorra wallet. Remaining balance €${result.wallet.balance_eur.toFixed(2)}.`;
          break;
        case 'outstanding':
          walletMessage = `€${DRIVER_TRIP_FEE_EUR.toFixed(2)} owed. Top up your wallet on the billing screen.`;
          break;
      }
    }
    Alert.alert(
      'Thanks',
      !isRider && paymentReceived
        ? `Rated. ${walletMessage}`
        : !isRider && paymentReceived === false
          ? 'Rated. No platform fee charged — the rider has been flagged.'
          : `You rated the ${rateeLabel}.`,
    );
    router.back();
  };

  return (
    <Screen scroll>
      <Heading level="xl">Rate the {rateeLabel}</Heading>
      <Body muted>
        Both sides get rated — keeps drivers and riders accountable for showing up, being on time,
        and being polite.
      </Body>

      <Card style={{ gap: 12 }}>
        <Heading level="md">How was it?</Heading>
        <StarPicker value={stars} onChange={setStars} />
        <Input
          label="Comment (optional)"
          value={comment}
          onChangeText={setComment}
          placeholder={`Anything the next person should know about this ${rateeLabel}?`}
          multiline
        />
      </Card>

      {!isRider ? (
        <Card style={{ gap: 8 }}>
          <Heading level="md">Did the rider pay you?</Heading>
          <Caption>
            Giorra only charges its platform fee when you confirm you actually received payment.
            If the rider didn’t pay, you owe Giorra nothing and the rider gets flagged on their
            profile.
          </Caption>
          {onFreeTier ? (
            <Pill
              label={`Free trial — ${freeLeft} of ${FREE_DRIVER_TRIPS} free trips left`}
              variant="accent"
            />
          ) : (
            <Pill label={`Platform fee €${DRIVER_TRIP_FEE_EUR.toFixed(2)} per paid trip`} variant="info" />
          )}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pill
              label={
                onFreeTier
                  ? 'Yes — use a free trip'
                  : `Yes — debit €${DRIVER_TRIP_FEE_EUR.toFixed(2)} from my wallet`
              }
              selected={paymentReceived === true}
              onPress={() => setPaymentReceived(true)}
            />
            <Pill
              label="No — rider didn’t pay"
              selected={paymentReceived === false}
              onPress={() => setPaymentReceived(false)}
            />
          </View>
        </Card>
      ) : null}

      <Button title="Submit" full onPress={onSubmit} />
    </Screen>
  );
}
