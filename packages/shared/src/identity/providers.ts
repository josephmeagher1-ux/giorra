import type { VerificationProvider } from './types';

/**
 * Catalog of providers Giorra can use today or plug in later. Order is the
 * recommended priority for the Irish market: realistic, defensible, no NDLS
 * dependency.
 */
export const VERIFICATION_PROVIDERS: VerificationProvider[] = [
  {
    id: 'stripe_identity',
    display_name: 'Stripe Identity',
    subjects: ['driver_identity'],
    implemented: false,
    paid: true,
    description:
      'Document OCR + selfie match + liveness. Supports Irish driving licences and passports. Pricing ~$1.50–2 per check.',
    integration_path: 'apps/mobile/lib/identity.ts → stripeIdentityProvider',
    ireland_notes:
      'Confirms the document is genuine and the holder matches. Does not confirm current NDLS status.',
  },
  {
    id: 'onfido',
    display_name: 'Onfido',
    subjects: ['driver_identity'],
    implemented: false,
    paid: true,
    description:
      'Document + biometric verification across 2,500+ document types. Widely used by Irish fintechs.',
    integration_path: 'apps/mobile/lib/identity.ts → onfidoProvider',
  },
  {
    id: 'veriff',
    display_name: 'Veriff',
    subjects: ['driver_identity'],
    implemented: false,
    paid: true,
    description:
      'Driver validation product specifically tuned for mobility platforms.',
  },
  {
    id: 'yoti',
    display_name: 'Yoti',
    subjects: ['driver_identity'],
    implemented: false,
    paid: true,
    description:
      'Lower per-check pricing (£0.26 core + £0.19 face match) with Irish driving licence support.',
  },
  {
    id: 'eudi_wallet_mdl',
    display_name: 'EU Digital Identity Wallet (mDL)',
    subjects: ['driver_identity'],
    implemented: false,
    paid: false,
    description:
      'Cryptographic verification of an Irish Government Digital Wallet mobile driving licence (mDL).',
    ireland_notes:
      'Mandatory acceptance for private services from end 2027 under eIDAS 2. Plan an integration once Ireland ships the consumer wallet.',
  },
  {
    id: 'cartell',
    display_name: 'Cartell.ie',
    subjects: ['vehicle_registration'],
    implemented: false,
    paid: true,
    description:
      'Irish/UK VRM data API (XML/SOAP): make, model, engine cc, NCT, tax dates, owner history.',
    integration_path: 'services/ops-worker → cartellProvider',
  },
  {
    id: 'motorcheck',
    display_name: 'MotorCheck.ie',
    subjects: ['vehicle_registration'],
    implemented: false,
    paid: true,
    description: 'Alternative to Cartell for Irish VRM lookups + history checks.',
  },
  {
    id: 'rsa_driver_statement_upload',
    display_name: 'Driver-uploaded RSA Driver Statement',
    subjects: ['driver_identity'],
    implemented: true,
    paid: false,
    description:
      'Driver requests a free Driver Statement from NDLS and forwards it to Giorra. Manually reviewed.',
    integration_path: 'apps/mobile/lib/identity.ts → driverStatementUploadProvider',
    ireland_notes:
      'NDLS does not send statements to third parties, so the driver must request and forward it.',
  },
  {
    id: 'insurer_document_upload',
    display_name: 'Insurance certificate upload',
    subjects: ['motor_insurance'],
    implemented: true,
    paid: false,
    description:
      'Driver uploads a photo of their current Certificate of Motor Insurance for manual review.',
    integration_path: 'apps/mobile/lib/identity.ts → insuranceDocumentProvider',
    ireland_notes:
      'MIBI does not offer third-party API access. Document review + expiry checks are the practical option until eIDAS 2 attestations exist.',
  },
  {
    id: 'manual_review',
    display_name: 'Trust & safety manual review',
    subjects: ['driver_identity', 'vehicle_registration', 'motor_insurance'],
    implemented: true,
    paid: false,
    description:
      'Fallback: a human reviewer inspects uploads and external signals.',
  },
];

export function providersFor(subject: VerificationProvider['subjects'][number]) {
  return VERIFICATION_PROVIDERS.filter((p) => p.subjects.includes(subject));
}
