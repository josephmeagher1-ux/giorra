import type { Charity } from './types';

/**
 * Seed registry of Irish charities the rider can preselect as the fallback
 * recipient. RCN numbers are placeholders here — confirm each one before
 * going live. The list is deliberately short and broad so riders aren't
 * overwhelmed at booking time.
 */
export const DEFAULT_CHARITIES: Charity[] = [
  {
    id: 'simon',
    name: 'Simon Communities of Ireland',
    rcn: 'RCN-20009766',
    tagline: 'Homelessness and housing support across Ireland.',
    slug: 'simon-communities',
    is_active: true,
  },
  {
    id: 'isvp',
    name: 'St Vincent de Paul (SVP)',
    rcn: 'RCN-20009065',
    tagline: 'Practical help for families experiencing poverty.',
    slug: 'svp',
    is_active: true,
  },
  {
    id: 'foodcloud',
    name: 'FoodCloud',
    rcn: 'RCN-20126908',
    tagline: 'Connecting surplus food with people who need it.',
    slug: 'foodcloud',
    is_active: true,
  },
  {
    id: 'irish_cancer_society',
    name: 'Irish Cancer Society',
    rcn: 'RCN-20009264',
    tagline: 'Cancer support, research, and prevention.',
    slug: 'irish-cancer-society',
    is_active: true,
  },
  {
    id: 'jigsaw',
    name: 'Jigsaw — Youth Mental Health',
    rcn: 'RCN-20051042',
    tagline: 'Mental health support for young people in Ireland.',
    slug: 'jigsaw',
    is_active: true,
  },
  {
    id: 'pieta',
    name: 'Pieta',
    rcn: 'RCN-20064494',
    tagline: 'Free therapy for suicide, self-harm, and bereavement.',
    slug: 'pieta',
    is_active: true,
  },
];

export function activeCharities(charities: Charity[] = DEFAULT_CHARITIES) {
  return charities.filter((c) => c.is_active);
}
