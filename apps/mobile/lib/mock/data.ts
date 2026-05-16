import type {
  CostBreakdown,
  RecurrencePattern,
  VehicleProfile,
} from '@giorra/shared';

export interface MockProfile {
  id: string;
  full_name: string;
  rating: number;
  trips_completed: number;
  joined_at: string;
  bio?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface MockVehicle {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year: number;
  fuel: VehicleProfile['fuel'];
  engine_cc: number;
  consumption_l_100km?: number;
  kwh_per_100km?: number;
  total_seats: number;
  colour?: string;
  registration?: string;
  annual_insurance_eur?: number;
  annual_motor_tax_eur?: number;
  annual_nct_maintenance_eur?: number;
  expected_annual_km?: number;
  is_default: boolean;
}

export interface MockTrip {
  id: string;
  driver_id: string;
  vehicle_id: string;
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  departure_time: string;
  distance_km: number;
  duration_minutes: number;
  available_seats: number;
  booked_seats: number;
  max_price_per_seat: number;
  actual_price_per_seat: number;
  cost_breakdown: CostBreakdown | null;
  status: 'published' | 'in_progress' | 'completed' | 'cancelled';
  recurring_pattern_id?: string;
  routeGeometry?: [number, number][];
  org_id?: string;
}

export interface MockRating {
  id: string;
  booking_id: string;
  rater_id: string;
  ratee_id: string;
  direction: 'rider_rates_driver' | 'driver_rates_rider';
  stars: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  created_at: string;
}

export interface MockRecurringPattern {
  id: string;
  driver_id: string;
  vehicle_id: string;
  label: string;
  category: RecurrencePattern['category'];
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  pattern: RecurrencePattern;
  available_seats: number;
  max_price_per_seat: number;
  actual_price_per_seat: number;
  is_active: boolean;
}

export const SELF: MockProfile & { preferred_charity_id?: string } = {
  id: 'me',
  full_name: 'You',
  rating: 4.9,
  trips_completed: 6,
  joined_at: '2026-01-15T00:00:00Z',
  preferred_charity_id: 'simon',
  bio: 'Commuting from Naas to Dublin most weekdays.',
  phone: '+353851234567',
};

export const DRIVERS: MockProfile[] = [
  { id: 'd1', full_name: 'Aoife Ní Bhriain', rating: 4.95, trips_completed: 142, joined_at: '2025-02-10T00:00:00Z' },
  { id: 'd2', full_name: 'Cathal Murphy', rating: 4.82, trips_completed: 78, joined_at: '2025-08-04T00:00:00Z' },
  { id: 'd3', full_name: 'Niamh O\u2019Sullivan', rating: 5.0, trips_completed: 31, joined_at: '2026-02-22T00:00:00Z' },
];

export const VEHICLES: MockVehicle[] = [
  {
    id: 'v1',
    owner_id: 'me',
    make: 'Volkswagen',
    model: 'Golf',
    year: 2020,
    fuel: 'petrol',
    engine_cc: 1400,
    consumption_l_100km: 6.8,
    total_seats: 5,
    colour: 'Silver',
    registration: '202-D-12345',
    annual_insurance_eur: 720,
    annual_motor_tax_eur: 280,
    annual_nct_maintenance_eur: 220,
    expected_annual_km: 16000,
    is_default: true,
  },
  {
    id: 'v2',
    owner_id: 'd1',
    make: 'Toyota',
    model: 'Corolla Hybrid',
    year: 2022,
    fuel: 'hybrid_petrol',
    engine_cc: 1800,
    consumption_l_100km: 4.4,
    total_seats: 5,
    colour: 'White',
    registration: '222-D-44211',
    is_default: true,
  },
  {
    id: 'v3',
    owner_id: 'd2',
    make: 'Nissan',
    model: 'Leaf',
    year: 2023,
    fuel: 'electric',
    engine_cc: 1500,
    kwh_per_100km: 16,
    total_seats: 5,
    colour: 'Blue',
    registration: '231-D-67890',
    is_default: true,
  },
];

// Dynamic departure times so date filters work relative to today
function relativeDate(daysFromNow: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const TRIPS: MockTrip[] = [
  {
    id: 't1',
    driver_id: 'd1',
    vehicle_id: 'v2',
    origin: { lat: 53.349805, lng: -6.26031, name: 'Dublin city centre' },
    destination: { lat: 51.898514, lng: -8.475603, name: 'Cork city centre' },
    departure_time: relativeDate(0, 15, 30), // today
    distance_km: 260,
    duration_minutes: 175,
    available_seats: 3,
    booked_seats: 1,
    max_price_per_seat: 14.5,
    actual_price_per_seat: 13.0,
    cost_breakdown: null,
    status: 'published',
  },
  {
    id: 't2',
    driver_id: 'd2',
    vehicle_id: 'v3',
    origin: { lat: 53.349805, lng: -6.26031, name: 'Dublin Heuston' },
    destination: { lat: 52.668189, lng: -8.630498, name: 'Limerick city' },
    departure_time: relativeDate(1, 17, 0), // tomorrow
    distance_km: 198,
    duration_minutes: 135,
    available_seats: 3,
    booked_seats: 0,
    max_price_per_seat: 9.8,
    actual_price_per_seat: 9.0,
    cost_breakdown: null,
    status: 'published',
  },
  {
    id: 't3',
    driver_id: 'd3',
    vehicle_id: 'v1',
    origin: { lat: 52.665, lng: -8.623, name: 'Limerick' },
    destination: { lat: 51.898514, lng: -8.475603, name: 'Cork' },
    departure_time: relativeDate(3, 18, 15), // later this week
    distance_km: 105,
    duration_minutes: 90,
    available_seats: 2,
    booked_seats: 2,
    max_price_per_seat: 8.2,
    actual_price_per_seat: 7.5,
    cost_breakdown: null,
    status: 'published',
  },
  {
    id: 't4',
    driver_id: 'd1',
    vehicle_id: 'v2',
    origin: { lat: 53.219, lng: -6.659, name: 'Naas' },
    destination: { lat: 53.349805, lng: -6.26031, name: 'Dublin city centre' },
    departure_time: relativeDate(0, 7, 45), // today morning
    distance_km: 34,
    duration_minutes: 35,
    available_seats: 3,
    booked_seats: 0,
    max_price_per_seat: 4.2,
    actual_price_per_seat: 3.5,
    cost_breakdown: null,
    status: 'published',
  },
  {
    id: 't5',
    driver_id: 'd3',
    vehicle_id: 'v1',
    origin: { lat: 53.383, lng: -6.594, name: 'Maynooth' },
    destination: { lat: 53.349805, lng: -6.26031, name: 'Dublin city centre' },
    departure_time: relativeDate(1, 8, 0), // tomorrow morning
    distance_km: 26,
    duration_minutes: 30,
    available_seats: 2,
    booked_seats: 1,
    max_price_per_seat: 3.6,
    actual_price_per_seat: 3.0,
    cost_breakdown: null,
    status: 'published',
  },
];

export interface MockOrganisation {
  id: string;
  name: string;
  type: 'employer' | 'school' | 'university' | 'community';
  domain?: string;
  smarter_travel_enrolled: boolean;
  monthly_budget_eur?: number;
}

export interface MockOrgIncentive {
  id: string;
  org_id: string;
  type: 'flat_subsidy' | 'per_km_subsidy' | 'free_seats' | 'priority_matching' | 'tax_saver';
  label: string;
  description: string;
  value_eur?: number;
  value_per_km_eur?: number;
  max_per_month_eur?: number;
  max_trips_per_month?: number;
  eligible_categories: ('commute' | 'school' | 'any')[];
  active: boolean;
}

export const ORGANISATIONS: MockOrganisation[] = [
  {
    id: 'org1',
    name: 'TechCo Ireland',
    type: 'employer',
    domain: 'techco.ie',
    smarter_travel_enrolled: true,
    monthly_budget_eur: 2000,
  },
  {
    id: 'org2',
    name: 'Scoil Bhride',
    type: 'school',
    smarter_travel_enrolled: false,
    monthly_budget_eur: 500,
  },
  {
    id: 'org3',
    name: 'University of Limerick',
    type: 'university',
    domain: 'ul.ie',
    smarter_travel_enrolled: true,
    monthly_budget_eur: 5000,
  },
];

export const ORG_INCENTIVES: MockOrgIncentive[] = [
  {
    id: 'inc1',
    org_id: 'org1',
    type: 'per_km_subsidy',
    label: 'Smarter Travel Commute Subsidy',
    description: 'TechCo covers €0.05/km for staff who carpool to the office.',
    value_per_km_eur: 0.05,
    max_per_month_eur: 50,
    max_trips_per_month: 44,
    eligible_categories: ['commute'],
    active: true,
  },
  {
    id: 'inc2',
    org_id: 'org1',
    type: 'flat_subsidy',
    label: 'Green Commuter Bonus',
    description: 'Monthly €25 bonus for 10+ carpool days.',
    value_eur: 25,
    max_per_month_eur: 25,
    eligible_categories: ['commute'],
    active: true,
  },
  {
    id: 'inc3',
    org_id: 'org2',
    type: 'free_seats',
    label: 'School Carpool Seat',
    description: 'Scoil Bhride covers one seat per school-run trip.',
    max_per_month_eur: 60,
    max_trips_per_month: 40,
    eligible_categories: ['school'],
    active: true,
  },
  {
    id: 'inc4',
    org_id: 'org3',
    type: 'per_km_subsidy',
    label: 'UL Green Campus Subsidy',
    description: 'UL subsidises student and staff carpooling under their Green Campus initiative.',
    value_per_km_eur: 0.04,
    max_per_month_eur: 30,
    eligible_categories: ['commute', 'any'],
    active: true,
  },
];

export const RECURRING: MockRecurringPattern[] = [
  {
    id: 'r1',
    driver_id: 'd1',
    vehicle_id: 'v2',
    label: 'Naas to Dublin weekday commute',
    category: 'commute',
    origin: { lat: 53.219, lng: -6.659, name: 'Naas town centre' },
    destination: { lat: 53.349805, lng: -6.26031, name: 'Dublin city centre' },
    pattern: {
      label: 'Naas to Dublin weekday commute',
      category: 'commute',
      days: ['mon', 'tue', 'wed', 'thu', 'fri'],
      depart_local_time: '07:15',
    },
    available_seats: 3,
    max_price_per_seat: 5.4,
    actual_price_per_seat: 5.0,
    is_active: true,
  },
  {
    id: 'r2',
    driver_id: 'me',
    vehicle_id: 'v1',
    label: 'School run to Bishopstown',
    category: 'school',
    origin: { lat: 51.892, lng: -8.498, name: 'Wilton Park' },
    destination: { lat: 51.881, lng: -8.534, name: 'Bishopstown School' },
    pattern: {
      label: 'School run to Bishopstown',
      category: 'school',
      days: ['mon', 'tue', 'wed', 'thu', 'fri'],
      depart_local_time: '08:15',
      term_time_only: true,
    },
    available_seats: 3,
    max_price_per_seat: 2.3,
    actual_price_per_seat: 2.0,
    is_active: true,
  },
];
