import type { DayOfWeek, RecurrenceInstance, RecurrencePattern } from './types';
import { DEFAULT_TIMEZONE } from './types';

const DAY_INDEX: Record<DayOfWeek, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const DAY_LABEL_FROM_INDEX: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * Irish school term windows for the current academic year (approximate).
 * Schools differ slightly but this captures roughly when school is in session.
 * Used as a default filter when term_time_only is true.
 */
export const IRISH_SCHOOL_TERMS = [
  { start: '2025-09-01', end: '2025-10-26' },
  { start: '2025-11-03', end: '2025-12-19' },
  { start: '2026-01-06', end: '2026-02-13' },
  { start: '2026-02-23', end: '2026-03-27' },
  { start: '2026-04-13', end: '2026-05-29' },
  { start: '2026-09-01', end: '2026-10-23' },
  { start: '2026-11-02', end: '2026-12-22' },
] as const;

function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isInSchoolTerm(dateYmd: string): boolean {
  return IRISH_SCHOOL_TERMS.some((t) => dateYmd >= t.start && dateYmd <= t.end);
}

/**
 * Build a UTC ISO timestamp from a yyyy-mm-dd Irish local date + HH:mm time,
 * accounting for Ireland's DST (IST = UTC+1 March-Oct, UTC otherwise).
 * This is intentionally simple and avoids pulling in a heavy timezone library.
 */
function irishLocalToUTC(dateYmd: string, hhmm: string): string {
  const [y, m, d] = dateYmd.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  const guessUtc = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const isDst = inIrishDST(guessUtc);
  const offsetMinutes = isDst ? 60 : 0;
  return new Date(guessUtc.getTime() - offsetMinutes * 60_000).toISOString();
}

function inIrishDST(d: Date): boolean {
  const year = d.getUTCFullYear();
  const lastSundayOfMonth = (month: number) => {
    const probe = new Date(Date.UTC(year, month + 1, 0));
    const dow = probe.getUTCDay();
    probe.setUTCDate(probe.getUTCDate() - dow);
    return probe;
  };
  const dstStart = lastSundayOfMonth(2); // March
  const dstEnd = lastSundayOfMonth(9); // October
  dstStart.setUTCHours(1, 0, 0, 0);
  dstEnd.setUTCHours(1, 0, 0, 0);
  return d >= dstStart && d < dstEnd;
}

export interface GenerateOptions {
  /** Window start (ISO datetime). Defaults to now. */
  from?: string;
  /** Window end (ISO datetime). Defaults to from + 8 weeks. */
  to?: string;
  /** Cap on number of instances returned (safety guard). Defaults to 200. */
  limit?: number;
  pattern_id: string;
}

export function generateRecurrenceInstances(
  pattern: RecurrencePattern,
  options: GenerateOptions,
): RecurrenceInstance[] {
  const tz = pattern.timezone ?? DEFAULT_TIMEZONE;
  if (tz !== DEFAULT_TIMEZONE) {
    // Keep behavior explicit: we only support Europe/Dublin here without a tz library.
    throw new Error(`Unsupported timezone: ${tz}`);
  }
  const from = options.from ? new Date(options.from) : new Date();
  const defaultTo = new Date(from.getTime() + 8 * 7 * 24 * 60 * 60_000);
  const to = options.to ? new Date(options.to) : defaultTo;
  const limit = options.limit ?? 200;
  if (to <= from) return [];

  const allowedDays = new Set(pattern.days.map((d) => DAY_INDEX[d]));
  const exceptions = new Set(pattern.exceptions ?? []);
  const startBound = pattern.start_date ?? '0000-01-01';
  const endBound = pattern.end_date ?? '9999-12-31';

  const out: RecurrenceInstance[] = [];
  const cursor = new Date(Date.UTC(
    from.getUTCFullYear(),
    from.getUTCMonth(),
    from.getUTCDate(),
  ));

  while (cursor <= to && out.length < limit) {
    const dayYmd = ymd(cursor);
    const weekdayIdx = cursor.getUTCDay();
    const weekdayLabel = DAY_LABEL_FROM_INDEX[weekdayIdx];

    const passDay = allowedDays.has(weekdayIdx);
    const passBounds = dayYmd >= startBound && dayYmd <= endBound;
    const passExceptions = !exceptions.has(dayYmd);
    const passTerm = !pattern.term_time_only || isInSchoolTerm(dayYmd);

    if (passDay && passBounds && passExceptions && passTerm) {
      const departureIso = irishLocalToUTC(dayYmd, pattern.depart_local_time);
      if (new Date(departureIso) >= from) {
        out.push({
          departure_at: departureIso,
          pattern_id: options.pattern_id,
          weekday: weekdayLabel,
        });
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}
