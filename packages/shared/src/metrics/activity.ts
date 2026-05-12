/**
 * Activity-based "verified" status — Giorra's zero-cost soft alternative to
 * paid KYC. A user becomes activity-verified once they've completed enough
 * trips with positive ratings to demonstrate they're a real person using
 * the platform in good faith. The thresholds are intentionally low so new
 * users hit them quickly without feeling gated, but high enough to make
 * single-incident bot abuse unprofitable.
 */

export interface ActivityProfile {
  /** Confirmed-paid trips for a driver, or completed bookings for a rider */
  completed_trips: number;
  /** Average star rating from counterparties */
  avg_stars: number;
  /** Total number of distinct counterparties they've interacted with */
  distinct_counterparties: number;
}

export const ACTIVITY_THRESHOLDS = {
  /** Trips at which a driver/rider unlocks the "verified by activity" badge. */
  trips_to_verify: 5,
  /** Counterparties at which we count it as a genuinely diverse profile. */
  distinct_counterparties_to_verify: 3,
  /** Minimum average rating to remain verified. */
  min_avg_stars_to_stay_verified: 3.5,
} as const;

export function isActivityVerified(p: ActivityProfile): boolean {
  return (
    p.completed_trips >= ACTIVITY_THRESHOLDS.trips_to_verify &&
    p.distinct_counterparties >= ACTIVITY_THRESHOLDS.distinct_counterparties_to_verify &&
    p.avg_stars >= ACTIVITY_THRESHOLDS.min_avg_stars_to_stay_verified
  );
}

export function activityProgress(p: ActivityProfile): {
  trips_left: number;
  partners_left: number;
  verified: boolean;
} {
  return {
    trips_left: Math.max(0, ACTIVITY_THRESHOLDS.trips_to_verify - p.completed_trips),
    partners_left: Math.max(
      0,
      ACTIVITY_THRESHOLDS.distinct_counterparties_to_verify - p.distinct_counterparties,
    ),
    verified: isActivityVerified(p),
  };
}
