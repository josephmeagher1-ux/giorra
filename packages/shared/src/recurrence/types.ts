export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type RecurrenceCategory = 'commute' | 'school' | 'sports' | 'event' | 'other';

export interface RecurrencePattern {
  /** Human-readable label e.g. "Cork → UCC weekday morning" */
  label: string;
  category: RecurrenceCategory;
  /** Days of week the trip runs */
  days: DayOfWeek[];
  /** Local time HH:mm e.g. "07:30" */
  depart_local_time: string;
  /** IANA timezone, defaults to Europe/Dublin */
  timezone?: string;
  /** Optional first/last date bounds (ISO yyyy-mm-dd) */
  start_date?: string;
  end_date?: string;
  /** Exception dates (yyyy-mm-dd) e.g. bank holidays, school breaks */
  exceptions?: string[];
  /** If true, the pattern only emits trips during Irish school term — useful for school carpools */
  term_time_only?: boolean;
}

export interface RecurrenceInstance {
  /** UTC ISO timestamp of this specific occurrence */
  departure_at: string;
  /** Pattern identifier */
  pattern_id: string;
  /** Pre-computed weekday label */
  weekday: DayOfWeek;
}

export const DEFAULT_TIMEZONE = 'Europe/Dublin';
