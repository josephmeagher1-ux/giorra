export interface Charity {
  id: string;
  name: string;
  /** Irish Charity Regulator number (RCN) where applicable */
  rcn?: string;
  /** Short tagline shown when the user chooses a charity at booking time */
  tagline: string;
  /** Slug used in URLs and Stripe metadata */
  slug: string;
  /** Stripe Connect account ID once configured (otherwise undefined → manual disbursement) */
  stripe_account_id?: string;
  /** Toggle off without deleting historical references */
  is_active: boolean;
}
