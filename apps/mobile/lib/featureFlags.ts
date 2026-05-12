/**
 * Feature flags that decide whether to use real services or local mocks.
 * Set EXPO_PUBLIC_USE_MOCKS=true to force mocks even if keys exist.
 */
import Constants from 'expo-constants';

function envBool(name: string, fallback = false): boolean {
  const value =
    (process.env[name] as string | undefined) ??
    (Constants?.expoConfig?.extra as Record<string, unknown> | undefined)?.[name];
  if (value === undefined || value === null) return fallback;
  return String(value).toLowerCase() === 'true' || String(value) === '1';
}

function envStr(name: string): string | undefined {
  return (
    (process.env[name] as string | undefined) ??
    ((Constants?.expoConfig?.extra as Record<string, unknown> | undefined)?.[name] as
      | string
      | undefined)
  );
}

/**
 * Money-flow mode. Default is the lowest-liability mode (notice board): Drivey
 * never touches money, riders pay drivers directly out-of-band. Override with
 * EXPO_PUBLIC_MONEY_FLOW=stripe_escrow_no_fee or stripe_escrow_with_fee once
 * the platform is established and a Stripe Connect platform is registered.
 *
 * See LIABILITY_AND_INCOME.md for the staged rollout reasoning.
 */
export type MoneyFlowMode =
  | 'notice_board'
  | 'stripe_escrow_no_fee'
  | 'stripe_escrow_with_fee';

function readMoneyFlow(): MoneyFlowMode {
  const raw = envStr('EXPO_PUBLIC_MONEY_FLOW')?.toLowerCase();
  if (raw === 'stripe_escrow_no_fee') return 'stripe_escrow_no_fee';
  if (raw === 'stripe_escrow_with_fee') return 'stripe_escrow_with_fee';
  return 'notice_board';
}

export const flags = {
  useMocks: envBool('EXPO_PUBLIC_USE_MOCKS', true),
  supabaseConfigured:
    !!envStr('EXPO_PUBLIC_SUPABASE_URL') && !!envStr('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  mapboxConfigured: !!envStr('EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN'),
  stripeConfigured: !!envStr('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
  oneSignalConfigured: !!envStr('EXPO_PUBLIC_ONESIGNAL_APP_ID'),
  orsConfigured: !!envStr('EXPO_PUBLIC_ORS_API_KEY'),
  moneyFlow: readMoneyFlow() as MoneyFlowMode,
  driverSubscriptionEnabled: envBool('EXPO_PUBLIC_DRIVER_SUBSCRIPTION', false),
};

export function shouldUseMocks(): boolean {
  return flags.useMocks || !flags.supabaseConfigured;
}

export function moneyTouchesDrivey(): boolean {
  return flags.moneyFlow !== 'notice_board';
}
