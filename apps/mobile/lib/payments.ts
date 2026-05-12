/**
 * Payments wrapper. In mock mode it simulates Stripe PaymentSheet behavior
 * so end-to-end booking flow is testable without a Stripe account.
 *
 * When stripeConfigured is true, this is the only file that needs swapping
 * for the real @stripe/stripe-react-native PaymentSheet implementation.
 */
import { flags } from './featureFlags';

export interface PaymentSheetResult {
  status: 'authorized' | 'cancelled' | 'failed';
  paymentIntentId: string;
}

export async function createAndPresentPaymentSheet(args: {
  bookingId: string;
  amountEur: number;
}): Promise<PaymentSheetResult> {
  await new Promise((r) => setTimeout(r, 600));
  if (!flags.stripeConfigured) {
    return {
      status: 'authorized',
      paymentIntentId: `pi_mock_${args.bookingId}`,
    };
  }
  // Real implementation (to wire up):
  //   1. POST to /create-payment-intent edge function
  //   2. Initialize Stripe PaymentSheet with the client_secret
  //   3. Present the sheet and translate the result
  throw new Error('Stripe live mode not wired yet. Set EXPO_PUBLIC_USE_MOCKS=true.');
}
