import { describe, it, expect } from 'vitest';
import { aggregateRatings, isRoleSuspended, trustScore } from './aggregate';

describe('aggregateRatings', () => {
  it('returns zeros for empty', () => {
    const a = aggregateRatings([]);
    expect(a.count).toBe(0);
    expect(a.avg_stars).toBe(0);
  });

  it('averages stars and builds histogram', () => {
    const a = aggregateRatings([{ stars: 5 }, { stars: 5 }, { stars: 4 }, { stars: 3 }]);
    expect(a.count).toBe(4);
    expect(a.avg_stars).toBeCloseTo(4.25, 2);
    expect(a.histogram[5]).toBe(2);
    expect(a.histogram[3]).toBe(1);
  });

  it('trustScore is conservative when sample is small', () => {
    const small = aggregateRatings(Array.from({ length: 3 }, () => ({ stars: 5 as const })));
    const big = aggregateRatings(Array.from({ length: 200 }, () => ({ stars: 5 as const })));
    expect(trustScore(small)).toBeLessThan(trustScore(big));
  });

  it('suspends drivers only after enough ratings and below floor', () => {
    const fewBad = aggregateRatings(Array.from({ length: 5 }, () => ({ stars: 1 as const })));
    expect(isRoleSuspended({ role: 'driver', rating: fewBad })).toBe(false);
    const manyBad = aggregateRatings(Array.from({ length: 20 }, () => ({ stars: 1 as const })));
    expect(isRoleSuspended({ role: 'driver', rating: manyBad })).toBe(true);
  });
});
