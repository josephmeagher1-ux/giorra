import type {
  VerificationRecord,
  VerificationStatus,
  VerificationSubject,
} from './types';

/**
 * Configurable Drivey trust policy. The defaults below assume a launch posture
 * where drivers must be document-verified and have a current insurance proof,
 * but the platform doesn't try to claim more than it can actually prove.
 */
export const VERIFICATION_POLICY = {
  driver_identity: {
    required_to_post: true,
    required_to_book: false,
    expires_after_days: 365 * 5,
  },
  vehicle_registration: {
    required_to_post: true,
    required_to_book: false,
    expires_after_days: 365,
  },
  motor_insurance: {
    required_to_post: true,
    required_to_book: false,
    expires_after_days: 365,
  },
} as const;

export type Action = 'post_trip' | 'book_seat';

function statusActive(status: VerificationStatus, expiresAt?: string): boolean {
  if (status !== 'verified') return false;
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() > Date.now();
}

export function bestRecord(
  records: VerificationRecord[],
  subject: VerificationSubject,
): VerificationRecord | undefined {
  return records
    .filter((r) => r.subject === subject)
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))[0];
}

export interface VerificationGap {
  subject: VerificationSubject;
  reason: 'missing' | 'failed' | 'expired';
  current_status: VerificationStatus | 'none';
}

export function findGapsForAction(args: {
  action: Action;
  records: VerificationRecord[];
}): VerificationGap[] {
  const subjects: VerificationSubject[] = [
    'driver_identity',
    'vehicle_registration',
    'motor_insurance',
  ];
  const gaps: VerificationGap[] = [];
  for (const subject of subjects) {
    const cfg = VERIFICATION_POLICY[subject];
    const required = args.action === 'post_trip' ? cfg.required_to_post : cfg.required_to_book;
    if (!required) continue;
    const r = bestRecord(args.records, subject);
    if (!r) {
      gaps.push({ subject, reason: 'missing', current_status: 'none' });
      continue;
    }
    if (!statusActive(r.status, r.expires_at)) {
      const reason: VerificationGap['reason'] =
        r.status === 'failed' ? 'failed' : !r.expires_at || new Date(r.expires_at).getTime() > Date.now() ? 'missing' : 'expired';
      gaps.push({ subject, reason, current_status: r.status });
    }
  }
  return gaps;
}

export function canPerformAction(args: {
  action: Action;
  records: VerificationRecord[];
}): { ok: true } | { ok: false; gaps: VerificationGap[] } {
  const gaps = findGapsForAction(args);
  if (gaps.length === 0) return { ok: true };
  return { ok: false, gaps };
}
