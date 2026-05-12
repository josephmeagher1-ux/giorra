export type RatingDirection = 'rider_rates_driver' | 'driver_rates_rider';

/** 1-5 stars with optional one-line comment. */
export interface RatingInput {
  booking_id: string;
  direction: RatingDirection;
  stars: 1 | 2 | 3 | 4 | 5;
  comment?: string;
}

export interface Rating extends RatingInput {
  id: string;
  rater_id: string;
  ratee_id: string;
  created_at: string;
}

export interface AggregateRating {
  /** Average to two decimal places, e.g. 4.83 */
  avg_stars: number;
  count: number;
  /** Histogram from 1 → 5 */
  histogram: Record<1 | 2 | 3 | 4 | 5, number>;
}
