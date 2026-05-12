/**
 * Drivey ops worker
 * -----------------
 * A long-running Node service intended for one of the GitHub Student
 * Developer Pack hosts (DigitalOcean droplet $200/yr credit, Azure free
 * tier $100, or Heroku eco dynos $13/mo for 24 months).
 *
 * Purpose: handle scheduled jobs that don't fit comfortably in Supabase
 * Edge Functions (cron, long lived loops, expensive analytics).
 *
 * Jobs included:
 *   - refreshFuelPrices: simulated scrape of weekly Irish fuel averages
 *   - compileComplianceReport: build per-driver activity summaries
 *   - materializeRecurringTrips: turn recurring patterns into concrete trips
 *
 * Today all jobs run with mock data so they're exercisable without keys.
 */
import {
  ACTIVITY_LIMITS,
  checkPublishGuards,
  generateRecurrenceInstances,
  type RecurrencePattern,
} from '@drivey/shared';

interface FuelPrice {
  fuel: 'petrol' | 'diesel' | 'electric';
  price: number;
  source: string;
  captured_at: string;
}

async function refreshFuelPrices(): Promise<FuelPrice[]> {
  // In production this would fetch from pumps.ie / AA Ireland and post into
  // public.fuel_prices via the Supabase service role.
  const now = new Date().toISOString();
  return [
    { fuel: 'petrol', price: 1.81, source: 'mock/AA-Ireland', captured_at: now },
    { fuel: 'diesel', price: 1.97, source: 'mock/AA-Ireland', captured_at: now },
    { fuel: 'electric', price: 0.3, source: 'mock/SEAI', captured_at: now },
  ];
}

interface DriverActivity {
  driver_id: string;
  trips_today: number;
  trips_this_week: number;
  contribution_received_ytd_eur: number;
}

async function compileComplianceReport(): Promise<{
  drivers: Array<DriverActivity & { state: 'ok' | 'soft_warn' | 'blocked' }>;
  generated_at: string;
}> {
  // Production: query bookings + trips per driver and aggregate.
  const sample: DriverActivity[] = [
    { driver_id: 'me', trips_today: 1, trips_this_week: 4, contribution_received_ytd_eur: 220 },
    { driver_id: 'd1', trips_today: 3, trips_this_week: 14, contribution_received_ytd_eur: 1850 },
    { driver_id: 'd2', trips_today: 0, trips_this_week: 1, contribution_received_ytd_eur: 60 },
  ];
  return {
    generated_at: new Date().toISOString(),
    drivers: sample.map((d) => {
      const guard = checkPublishGuards({
        trips_today: d.trips_today,
        trips_this_week: d.trips_this_week,
        contribution_received_ytd_eur: d.contribution_received_ytd_eur,
      });
      let state: 'ok' | 'soft_warn' | 'blocked' = guard.ok ? 'ok' : 'blocked';
      if (
        state === 'ok' &&
        d.contribution_received_ytd_eur >= ACTIVITY_LIMITS.soft_annual_contribution_warn_eur
      ) {
        state = 'soft_warn';
      }
      return { ...d, state };
    }),
  };
}

async function materializeRecurringTrips(): Promise<{ pattern_id: string; emitted: number }[]> {
  // Production: read recurring_patterns, generate the next 7 days of
  // instances, and upsert as trip rows.
  const patterns: Array<{ id: string; pattern: RecurrencePattern }> = [
    {
      id: 'r1',
      pattern: {
        label: 'Naas commute',
        category: 'commute',
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        depart_local_time: '07:15',
      },
    },
    {
      id: 'r2',
      pattern: {
        label: 'School run',
        category: 'school',
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        depart_local_time: '08:15',
        term_time_only: true,
      },
    },
  ];
  return patterns.map((p) => ({
    pattern_id: p.id,
    emitted: generateRecurrenceInstances(p.pattern, {
      pattern_id: p.id,
      limit: 14,
    }).length,
  }));
}

async function tick() {
  const start = Date.now();
  const [fuel, compliance, recurring] = await Promise.all([
    refreshFuelPrices(),
    compileComplianceReport(),
    materializeRecurringTrips(),
  ]);
  const ms = Date.now() - start;
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      durationMs: ms,
      fuel,
      compliance,
      recurring,
    }),
  );
}

const INTERVAL_MS = Number(process.env.OPS_TICK_MS ?? 60_000);

if (process.env.OPS_RUN_ONCE === 'true') {
  tick().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  console.log(`drivey ops-worker booted (tick every ${INTERVAL_MS}ms)`);
  tick().catch(console.error);
  setInterval(() => {
    tick().catch(console.error);
  }, INTERVAL_MS);
}
