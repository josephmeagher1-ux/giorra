import React from 'react';
import { View } from 'react-native';
import { Card } from './ui/Card';
import { Heading, Body, Caption } from './ui/Heading';
import { Pill } from './ui/Pill';
import { theme } from '@/lib/theme';
import type { EscrowPhase, EscrowState } from '@drivey/shared';
import { computeSettlement, describePhase, PLATFORM_FEE_EUR } from '@drivey/shared';

const ORDER: EscrowPhase[] = [
  'requested',
  'accepted',
  'funds_held',
  'driver_at_pickup',
  'rider_at_pickup',
  'in_transit',
  'completed',
];

function phaseVariant(phase: EscrowPhase) {
  switch (phase) {
    case 'completed':
      return 'accent' as const;
    case 'donated':
      return 'warn' as const;
    case 'refunded':
      return 'info' as const;
    case 'cancelled':
      return 'danger' as const;
    case 'disputed':
      return 'danger' as const;
    default:
      return 'info' as const;
  }
}

export function EscrowStatus({ state, totalEur, charityName }: {
  state: EscrowState;
  totalEur?: number;
  charityName?: string;
}) {
  const reachedIdx = ORDER.indexOf(state.phase);
  return (
    <Card style={{ gap: theme.spacing(2) }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Heading level="md">Escrow status</Heading>
        <Pill label={state.phase} variant={phaseVariant(state.phase)} />
      </View>
      <Body>{describePhase(state.phase)}</Body>
      {typeof totalEur === 'number' ? (
        <>
          <Caption>Total held: €{totalEur.toFixed(2)}</Caption>
          {(() => {
            const projected = computeSettlement({
              total_eur: totalEur,
              destination: state.payout_destination ?? 'driver',
            });
            const driverNet = projected.driver_payout_eur;
            const fee = projected.platform_fee_eur;
            const charityAmt = projected.charity_payout_eur;
            const refundAmt = projected.rider_refund_eur;
            if (refundAmt > 0) {
              return <Caption>→ €{refundAmt.toFixed(2)} refunded to rider</Caption>;
            }
            if (charityAmt > 0) {
              return <Caption>→ €{charityAmt.toFixed(2)} donated to charity (no platform fee taken)</Caption>;
            }
            return (
              <Caption>
                → driver receives €{driverNet.toFixed(2)} · €{fee.toFixed(2)} platform fee
              </Caption>
            );
          })()}
        </>
      ) : null}
      {charityName ? <Caption>Charity fallback: {charityName}</Caption> : null}
      <Caption muted>
        Drivey keeps €{PLATFORM_FEE_EUR.toFixed(2)} from the driver’s share on successful trips. No
        fee is taken on refunds or charity donations.
      </Caption>

      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
        {ORDER.map((p, i) => (
          <Pill
            key={p}
            label={p.replace(/_/g, ' ')}
            variant={i <= reachedIdx ? 'accent' : 'default'}
          />
        ))}
      </View>
    </Card>
  );
}
