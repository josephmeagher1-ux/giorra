import { describe, it, expect } from 'vitest';
import { generateRecurrenceInstances } from './generator';

describe('generateRecurrenceInstances', () => {
  it('emits weekday morning commute instances', () => {
    const instances = generateRecurrenceInstances(
      {
        label: 'Weekday commute',
        category: 'commute',
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        depart_local_time: '07:30',
      },
      {
        pattern_id: 'p1',
        from: '2026-05-04T00:00:00Z', // Monday
        to: '2026-05-10T23:59:59Z',
      },
    );
    expect(instances).toHaveLength(5);
    expect(instances.every((i) => ['mon', 'tue', 'wed', 'thu', 'fri'].includes(i.weekday))).toBe(
      true,
    );
  });

  it('respects exceptions', () => {
    const instances = generateRecurrenceInstances(
      {
        label: 'Commute',
        category: 'commute',
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        depart_local_time: '08:00',
        exceptions: ['2026-05-06'],
      },
      {
        pattern_id: 'p1',
        from: '2026-05-04T00:00:00Z',
        to: '2026-05-08T23:59:59Z',
      },
    );
    expect(instances).toHaveLength(4);
    expect(instances.map((i) => i.departure_at)).not.toContain(
      expect.stringContaining('2026-05-06'),
    );
  });

  it('filters out non-term days when term_time_only is set', () => {
    const summerHoliday = generateRecurrenceInstances(
      {
        label: 'School run',
        category: 'school',
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        depart_local_time: '08:15',
        term_time_only: true,
      },
      {
        pattern_id: 'school1',
        from: '2026-07-06T00:00:00Z',
        to: '2026-07-10T23:59:59Z',
      },
    );
    expect(summerHoliday).toHaveLength(0);

    const inTerm = generateRecurrenceInstances(
      {
        label: 'School run',
        category: 'school',
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        depart_local_time: '08:15',
        term_time_only: true,
      },
      {
        pattern_id: 'school1',
        from: '2025-09-08T00:00:00Z',
        to: '2025-09-12T23:59:59Z',
      },
    );
    expect(inTerm.length).toBeGreaterThan(0);
  });

  it('respects limit', () => {
    const instances = generateRecurrenceInstances(
      {
        label: 'Daily',
        category: 'other',
        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        depart_local_time: '09:00',
      },
      {
        pattern_id: 'd1',
        from: '2026-01-01T00:00:00Z',
        to: '2026-12-31T23:59:59Z',
        limit: 10,
      },
    );
    expect(instances).toHaveLength(10);
  });
});
