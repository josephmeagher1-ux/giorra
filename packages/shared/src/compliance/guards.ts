/**
 * Soft and hard limits that keep a driver's pattern of use looking like
 * cost-sharing rather than a commercial passenger transport business.
 *
 * The thresholds below are deliberately conservative defaults. Real numbers
 * should be reviewed by an Irish transport solicitor before launch.
 */
export const ACTIVITY_LIMITS = {
  /** Max trips a driver can publish per calendar day */
  hard_trips_per_day: 6,
  /** Max trips a driver can publish per rolling 7 days */
  hard_trips_per_week: 24,
  /** Yearly contribution income above which we soft-warn the driver */
  soft_annual_contribution_warn_eur: 4_000,
  /** Yearly contribution income above which posting is paused for review */
  hard_annual_contribution_block_eur: 8_000,
  /** Minimum minutes between the booking time and departure (pre-arranged) */
  min_pre_arrangement_minutes: 30,
} as const;

export interface ActivitySnapshot {
  trips_today: number;
  trips_this_week: number;
  contribution_received_ytd_eur: number;
}

export type GuardOutcome =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'too_many_trips_today'
        | 'too_many_trips_this_week'
        | 'annual_contribution_block'
        | 'not_pre_arranged';
      message: string;
    };

export function checkPublishGuards(activity: ActivitySnapshot): GuardOutcome {
  if (activity.trips_today >= ACTIVITY_LIMITS.hard_trips_per_day) {
    return {
      ok: false,
      reason: 'too_many_trips_today',
      message:
        'You have hit the daily trip limit for cost-sharing usage. Try again tomorrow.',
    };
  }
  if (activity.trips_this_week >= ACTIVITY_LIMITS.hard_trips_per_week) {
    return {
      ok: false,
      reason: 'too_many_trips_this_week',
      message:
        'Weekly trip limit reached. Cost-sharing usage is capped to keep this within personal insurance terms.',
    };
  }
  if (
    activity.contribution_received_ytd_eur >=
    ACTIVITY_LIMITS.hard_annual_contribution_block_eur
  ) {
    return {
      ok: false,
      reason: 'annual_contribution_block',
      message:
        'Annual cost-sharing contribution limit reached. Posting paused pending review.',
    };
  }
  return { ok: true };
}

export function checkBookingArrangement(args: {
  now_iso: string;
  departure_iso: string;
}): GuardOutcome {
  const now = new Date(args.now_iso).getTime();
  const dep = new Date(args.departure_iso).getTime();
  const minutes = (dep - now) / 60_000;
  if (minutes < ACTIVITY_LIMITS.min_pre_arrangement_minutes) {
    return {
      ok: false,
      reason: 'not_pre_arranged',
      message:
        'Bookings must be pre-arranged at least 30 minutes before departure to stay within carpooling rules.',
    };
  }
  return { ok: true };
}
