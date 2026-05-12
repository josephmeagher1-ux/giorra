/**
 * Types for Giorra's identity / vehicle / insurance verification flows.
 *
 * Important context (Ireland, as of 2026):
 *
 *  - There is no public NDLS / RSA API for third-party driver licence
 *    verification. NDLS explicitly states driver data is not sent to third
 *    parties. The only first-party document a driver can lawfully share is
 *    their RSA "Driver Statement", which they request themselves and forward.
 *  - There is no public MIBI / Motor Insurance Database (MTPL/NFD) API. Only
 *    An Garda Síochána receives daily feeds. Insurance verification must rely
 *    on document upload + (optionally) bilateral underwriter API arrangements.
 *  - Vehicle registration (VRM) lookups ARE available commercially via
 *    Cartell.ie and MotorCheck.ie XML APIs (Make/Model/Engine size/NCT/tax).
 *  - Stripe Identity, Onfido, Veriff, Yoti, and Persona all support Irish
 *    driving licences as KYC documents (OCR + face match + liveness).
 *  - The EU Digital Identity Wallet (eIDAS 2) is mandatory for public bodies
 *    by end of 2026 and for private services by end of 2027. Once Ireland's
 *    Government Digital Wallet ships an mDL (mobile driving licence), we'll
 *    be able to receive a cryptographically signed credential.
 */

export type VerificationSubject = 'driver_identity' | 'vehicle_registration' | 'motor_insurance';

export type VerificationProviderId =
  | 'stripe_identity'
  | 'onfido'
  | 'veriff'
  | 'yoti'
  | 'persona'
  | 'cartell'
  | 'motorcheck'
  | 'rsa_driver_statement_upload'
  | 'insurer_document_upload'
  | 'eudi_wallet_mdl'
  | 'manual_review';

export type VerificationStatus =
  | 'not_started'
  | 'in_progress'
  | 'verified'
  | 'failed'
  | 'expired'
  | 'manual_review';

export interface VerificationProvider {
  id: VerificationProviderId;
  display_name: string;
  subjects: VerificationSubject[];
  /** Whether this is wired up today in Giorra's mobile app */
  implemented: boolean;
  /** Whether this requires a paid account / API key */
  paid: boolean;
  /** Short description shown in admin/about-the-provider screens */
  description: string;
  /** Where in the codebase the integration lives or will live */
  integration_path?: string;
  /** Notes specific to Ireland */
  ireland_notes?: string;
}

export interface VerificationRecord {
  id: string;
  user_id: string;
  subject: VerificationSubject;
  provider: VerificationProviderId;
  status: VerificationStatus;
  external_ref?: string;
  evidence_uri?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}
