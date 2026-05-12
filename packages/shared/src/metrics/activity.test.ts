import { describe, it, expect } from 'vitest';
import { ACTIVITY_THRESHOLDS, activityProgress, isActivityVerified } from './activity';

describe('activity-based verification', () => {
  it('verifies a user who meets all three thresholds', () => {
    expect(
      isActivityVerified({
        completed_trips: 6,
        distinct_counterparties: 4,
        avg_stars: 4.8,
      }),
    ).toBe(true);
  });

  it('rejects a user with too few trips', () => {
    expect(
      isActivityVerified({
        completed_trips: ACTIVITY_THRESHOLDS.trips_to_verify - 1,
        distinct_counterparties: 4,
        avg_stars: 4.8,
      }),
    ).toBe(false);
  });

  it('rejects a user with too few distinct counterparties', () => {
    expect(
      isActivityVerified({
        completed_trips: 10,
        distinct_counterparties: 1,
        avg_stars: 4.8,
      }),
    ).toBe(false);
  });

  it('rejects a verified user once their rating drops below the floor', () => {
    expect(
      isActivityVerified({
        completed_trips: 10,
        distinct_counterparties: 5,
        avg_stars: 3.0,
      }),
    ).toBe(false);
  });

  it('activityProgress reports how many more steps are needed', () => {
    const p = activityProgress({
      completed_trips: 2,
      distinct_counterparties: 1,
      avg_stars: 4.5,
    });
    expect(p.trips_left).toBe(ACTIVITY_THRESHOLDS.trips_to_verify - 2);
    expect(p.partners_left).toBe(
      ACTIVITY_THRESHOLDS.distinct_counterparties_to_verify - 1,
    );
    expect(p.verified).toBe(false);
  });
});
