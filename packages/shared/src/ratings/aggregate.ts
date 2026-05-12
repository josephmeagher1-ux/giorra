import type { AggregateRating, Rating } from './types';

export function aggregateRatings(ratings: Pick<Rating, 'stars'>[]): AggregateRating {
  const empty: AggregateRating = {
    avg_stars: 0,
    count: 0,
    histogram: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };
  if (ratings.length === 0) return empty;
  const hist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as AggregateRating['histogram'];
  let total = 0;
  for (const r of ratings) {
    hist[r.stars] += 1;
    total += r.stars;
  }
  return {
    avg_stars: Math.round((total / ratings.length) * 100) / 100,
    count: ratings.length,
    histogram: hist,
  };
}

/**
 * "Wilson score lower bound" style trust score — protects users who only
 * have a handful of ratings from being treated as if their average is the
 * truth. Returns a number 0..1 you can compare across people fairly.
 */
export function trustScore(rating: AggregateRating): number {
  if (rating.count === 0) return 0;
  const positive = rating.histogram[4] + rating.histogram[5];
  const p = positive / rating.count;
  const z = 1.96;
  const n = rating.count;
  const denom = 1 + (z * z) / n;
  const center = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  return Math.max(0, (center - margin) / denom);
}

/**
 * Threshold helpers used by trust & safety to limit posting/booking
 * privileges. Tunable from a single place.
 */
export const RATING_THRESHOLDS = {
  /** Minimum trust score to remain a driver after at least 10 ratings */
  driver_trust_floor: 0.6,
  /** Minimum trust score to remain a rider after at least 10 ratings */
  rider_trust_floor: 0.5,
  /** Minimum ratings before we apply the floors */
  min_ratings_before_enforcement: 10,
} as const;

export function isRoleSuspended(args: {
  role: 'driver' | 'rider';
  rating: AggregateRating;
}): boolean {
  if (args.rating.count < RATING_THRESHOLDS.min_ratings_before_enforcement) return false;
  const floor =
    args.role === 'driver'
      ? RATING_THRESHOLDS.driver_trust_floor
      : RATING_THRESHOLDS.rider_trust_floor;
  return trustScore(args.rating) < floor;
}
