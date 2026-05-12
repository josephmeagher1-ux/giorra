/**
 * Driver subscription plans. This is a B2B SaaS sale to drivers, not a
 * per-ride fee on rider→driver payments. That distinction is what keeps
 * Giorra out of the rider-facing consumer-protection regime.
 *
 * In production these plans live in Stripe Billing. The objects below are
 * the local source of truth used by the mobile app to render plan choice
 * before a driver is sent to Stripe Checkout. The Stripe plan IDs are
 * filled in once the products exist.
 */
export interface DriverPlan {
  id: 'free' | 'standard' | 'pro';
  display_name: string;
  monthly_eur: number;
  /** Stripe Price ID (price_...) once the product is created in the dashboard */
  stripe_price_id?: string;
  features: string[];
  /** Max number of trips a driver may post per month on this tier */
  monthly_trip_cap: number | null;
  /** Whether escrow + charity fallback is available */
  escrow_available: boolean;
}

export const DRIVER_PLANS: DriverPlan[] = [
  {
    id: 'free',
    display_name: 'Free',
    monthly_eur: 0,
    features: [
      'List up to 8 trips per month',
      'Search recurring routes',
      'Notice-board pickup confirmation',
    ],
    monthly_trip_cap: 8,
    escrow_available: false,
  },
  {
    id: 'standard',
    display_name: 'Standard',
    monthly_eur: 2,
    features: [
      'Unlimited trip postings',
      'Recurring routes',
      'Boost visibility in search results',
    ],
    monthly_trip_cap: null,
    escrow_available: false,
  },
  {
    id: 'pro',
    display_name: 'Pro · with escrow',
    monthly_eur: 6,
    features: [
      'Everything in Standard',
      'Stripe Connect escrow + charity fallback',
      'Priority support (5 business days)',
    ],
    monthly_trip_cap: null,
    escrow_available: true,
  },
];

export function planById(id: DriverPlan['id']): DriverPlan {
  const plan = DRIVER_PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown driver plan: ${id}`);
  return plan;
}
