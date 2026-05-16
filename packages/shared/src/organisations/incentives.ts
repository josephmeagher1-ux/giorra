import type { OrgIncentive, IncentiveClaim, OrgMembership } from './types';

export interface TripContext {
  distance_km: number;
  price_per_seat_eur: number;
  category: 'commute' | 'school' | 'any';
  trip_id: string;
}

export interface ClaimResult {
  eligible: boolean;
  amount_eur: number;
  incentive_id: string;
  reason?: string;
}

export function calculateIncentive(
  incentive: OrgIncentive,
  trip: TripContext,
  claimsThisMonth: IncentiveClaim[],
): ClaimResult {
  if (!incentive.active) {
    return { eligible: false, amount_eur: 0, incentive_id: incentive.id, reason: 'Incentive inactive' };
  }

  if (
    !incentive.eligible_categories.includes('any') &&
    !incentive.eligible_categories.includes(trip.category)
  ) {
    return { eligible: false, amount_eur: 0, incentive_id: incentive.id, reason: 'Trip category not eligible' };
  }

  if (incentive.max_trips_per_month) {
    const tripsUsed = claimsThisMonth.filter(
      (c) => c.incentive_id === incentive.id && c.status !== 'rejected',
    ).length;
    if (tripsUsed >= incentive.max_trips_per_month) {
      return { eligible: false, amount_eur: 0, incentive_id: incentive.id, reason: 'Monthly trip limit reached' };
    }
  }

  let amount = 0;

  switch (incentive.type) {
    case 'flat_subsidy':
      amount = incentive.value_eur ?? 0;
      break;

    case 'per_km_subsidy':
      amount = (incentive.value_per_km_eur ?? 0) * trip.distance_km;
      break;

    case 'free_seats':
      amount = trip.price_per_seat_eur;
      break;

    case 'tax_saver':
      amount = incentive.value_eur ?? 0;
      break;

    case 'priority_matching':
      return { eligible: true, amount_eur: 0, incentive_id: incentive.id };
  }

  if (incentive.max_per_month_eur) {
    const spentThisMonth = claimsThisMonth
      .filter((c) => c.incentive_id === incentive.id && c.status !== 'rejected')
      .reduce((sum, c) => sum + c.amount_eur, 0);
    const remaining = Math.max(0, incentive.max_per_month_eur - spentThisMonth);
    amount = Math.min(amount, remaining);
    if (amount <= 0) {
      return { eligible: false, amount_eur: 0, incentive_id: incentive.id, reason: 'Monthly budget exhausted' };
    }
  }

  return {
    eligible: true,
    amount_eur: Math.round(amount * 100) / 100,
    incentive_id: incentive.id,
  };
}

export function bestIncentiveForTrip(
  incentives: OrgIncentive[],
  trip: TripContext,
  claimsThisMonth: IncentiveClaim[],
): ClaimResult | null {
  const results = incentives
    .map((inc) => calculateIncentive(inc, trip, claimsThisMonth))
    .filter((r) => r.eligible)
    .sort((a, b) => b.amount_eur - a.amount_eur);
  return results[0] ?? null;
}

export const SMARTER_TRAVEL_TEMPLATES: Omit<OrgIncentive, 'id' | 'org_id'>[] = [
  {
    type: 'per_km_subsidy',
    label: 'Smarter Travel Commute Subsidy',
    description: 'NTA Smarter Travel programme: employer subsidises per-km carpooling costs for commuters.',
    value_per_km_eur: 0.05,
    max_per_month_eur: 50,
    max_trips_per_month: 44,
    eligible_categories: ['commute'],
    active: true,
  },
  {
    type: 'flat_subsidy',
    label: 'Green Commuter Bonus',
    description: 'Monthly flat bonus for employees who carpool at least 10 days.',
    value_eur: 25,
    max_per_month_eur: 25,
    max_trips_per_month: undefined,
    eligible_categories: ['commute'],
    active: true,
  },
  {
    type: 'free_seats',
    label: 'School Run Free Seat',
    description: 'School covers the cost of one seat per trip for parents in the carpool network.',
    max_per_month_eur: 60,
    max_trips_per_month: 40,
    eligible_categories: ['school'],
    active: true,
  },
  {
    type: 'tax_saver',
    label: 'TaxSaver Carpool Credit',
    description: 'Pre-tax carpool benefit under Revenue-approved employer commuting scheme.',
    value_eur: 3.0,
    max_per_month_eur: 120,
    eligible_categories: ['commute'],
    active: true,
  },
];
