import { describe, it, expect } from 'vitest';
import { transition, isTerminal } from './escrow';
import type { EscrowState } from './states';

const start: EscrowState = { phase: 'requested' };

describe('escrow state machine', () => {
  it('happy path: request → accept → deposit → both confirm → drop-off', () => {
    let s = start;
    s = transition(s, { type: 'driver_accepts' });
    expect(s.phase).toBe('accepted');
    s = transition(s, { type: 'rider_deposits', payment_intent_id: 'pi_1' });
    expect(s.phase).toBe('funds_held');
    s = transition(s, { type: 'driver_confirms_at_pickup', at_iso: 't1' });
    expect(s.phase).toBe('driver_at_pickup');
    s = transition(s, { type: 'rider_confirms_at_pickup', at_iso: 't2' });
    expect(s.phase).toBe('in_transit');
    s = transition(s, { type: 'rider_confirms_dropoff', at_iso: 't3' });
    expect(s.phase).toBe('completed');
    expect(s.payout_destination).toBe('driver');
    expect(isTerminal(s.phase)).toBe(true);
  });

  it('rider confirms first, then driver — same destination', () => {
    let s = transition(start, { type: 'driver_accepts' });
    s = transition(s, { type: 'rider_deposits', payment_intent_id: 'pi' });
    s = transition(s, { type: 'rider_confirms_at_pickup', at_iso: 't1' });
    expect(s.phase).toBe('rider_at_pickup');
    s = transition(s, { type: 'driver_confirms_at_pickup', at_iso: 't2' });
    expect(s.phase).toBe('in_transit');
  });

  it('rider no-show after funds held → charity', () => {
    let s = transition(start, { type: 'driver_accepts' });
    s = transition(s, { type: 'rider_deposits', payment_intent_id: 'pi' });
    s = transition(s, {
      type: 'departure_window_passed',
      at_iso: 't',
      driver_was_present: true,
      rider_was_present: false,
    });
    expect(s.phase).toBe('donated');
    expect(s.payout_destination).toBe('charity');
  });

  it('driver no-show after funds held → refund', () => {
    let s = transition(start, { type: 'driver_accepts' });
    s = transition(s, { type: 'rider_deposits', payment_intent_id: 'pi' });
    s = transition(s, {
      type: 'departure_window_passed',
      at_iso: 't',
      driver_was_present: false,
      rider_was_present: true,
    });
    expect(s.phase).toBe('refunded');
    expect(s.payout_destination).toBe('refund');
  });

  it('rider cancels after deposit → charity', () => {
    let s = transition(start, { type: 'driver_accepts' });
    s = transition(s, { type: 'rider_deposits', payment_intent_id: 'pi' });
    s = transition(s, { type: 'rider_cancels', at_iso: 't' });
    expect(s.phase).toBe('donated');
    expect(s.payout_destination).toBe('charity');
  });

  it('rider cancels before deposit → cancelled', () => {
    let s = transition(start, { type: 'driver_accepts' });
    s = transition(s, { type: 'rider_cancels', at_iso: 't' });
    expect(s.phase).toBe('cancelled');
    expect(s.payout_destination).toBeUndefined();
  });

  it('driver cancels after deposit → refund', () => {
    let s = transition(start, { type: 'driver_accepts' });
    s = transition(s, { type: 'rider_deposits', payment_intent_id: 'pi' });
    s = transition(s, { type: 'driver_cancels', at_iso: 't' });
    expect(s.phase).toBe('refunded');
    expect(s.payout_destination).toBe('refund');
  });

  it('rejects illegal transitions', () => {
    expect(() => transition(start, { type: 'rider_deposits', payment_intent_id: 'pi' })).toThrow();
    expect(() => transition(start, { type: 'driver_confirms_at_pickup', at_iso: 't' })).toThrow();
  });
});
