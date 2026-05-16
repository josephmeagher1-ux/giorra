export type OrgType = 'employer' | 'school' | 'university' | 'community';

export type IncentiveType =
  | 'flat_subsidy'
  | 'per_km_subsidy'
  | 'free_seats'
  | 'priority_matching'
  | 'tax_saver';

export interface Organisation {
  id: string;
  name: string;
  type: OrgType;
  domain?: string;
  logo_url?: string;
  smarter_travel_enrolled: boolean;
  created_at: string;
}

export interface OrgIncentive {
  id: string;
  org_id: string;
  type: IncentiveType;
  label: string;
  description: string;
  value_eur?: number;
  value_per_km_eur?: number;
  max_per_month_eur?: number;
  max_trips_per_month?: number;
  eligible_categories: ('commute' | 'school' | 'any')[];
  active: boolean;
}

export interface OrgMembership {
  user_id: string;
  org_id: string;
  role: 'member' | 'admin' | 'champion';
  verified: boolean;
  verified_via?: 'email_domain' | 'invite_code' | 'admin_approval';
  joined_at: string;
}

export interface IncentiveClaim {
  id: string;
  membership_id: string;
  incentive_id: string;
  trip_id: string;
  amount_eur: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  created_at: string;
}

export interface OrgDashboardStats {
  total_members: number;
  active_members_this_month: number;
  total_trips_this_month: number;
  total_km_shared: number;
  total_co2_avoided_kg: number;
  total_incentive_spent_eur: number;
  budget_remaining_eur: number;
}
