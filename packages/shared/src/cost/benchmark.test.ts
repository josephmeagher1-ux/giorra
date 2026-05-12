import { describe, it, expect } from 'vitest';
import { classifyEngine, classifyBand, getBenchmarkPerKm } from './benchmark';

describe('benchmark', () => {
  it('classifies engines by cc', () => {
    expect(classifyEngine({ fuel: 'petrol', engine_cc: 1100 })).toBe('up_to_1200cc');
    expect(classifyEngine({ fuel: 'petrol', engine_cc: 1400 })).toBe('cc_1201_to_1500');
    expect(classifyEngine({ fuel: 'diesel', engine_cc: 2000 })).toBe('cc_1501_and_over');
  });

  it('classifies EVs in the middle band per circular', () => {
    expect(classifyEngine({ fuel: 'electric' })).toBe('cc_1201_to_1500');
  });

  it('falls back to middle band when cc unknown', () => {
    expect(classifyEngine({ fuel: 'petrol' })).toBe('cc_1201_to_1500');
  });

  it('classifies mileage bands', () => {
    expect(classifyBand(500)).toBe('band1');
    expect(classifyBand(3000)).toBe('band2');
    expect(classifyBand(15000)).toBe('band3');
    expect(classifyBand(50000)).toBe('band4');
  });

  it('returns per-km benchmark and audit source', () => {
    const b = getBenchmarkPerKm({ fuel: 'petrol', engine_cc: 1600 });
    expect(b.per_km).toBeGreaterThan(0);
    expect(b.source).toContain('Circular 16/2022');
  });
});
