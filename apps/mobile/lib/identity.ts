/**
 * Giorra verification service.
 *
 * This file is the only swap point when paid KYC / VRM providers come online.
 * Today it stores verification records in memory and simulates each provider
 * so end-to-end flows are testable. Each provider function takes user input
 * and returns a fully-formed `VerificationRecord`.
 *
 * Notable Irish reality: there is no third-party NDLS / MIBI API. The mock
 * "verified" outcomes here represent the most likely real outcomes when each
 * paid provider is wired up.
 */
import {
  VERIFICATION_PROVIDERS,
  type VerificationProviderId,
  type VerificationRecord,
  type VerificationStatus,
  type VerificationSubject,
} from '@giorra/shared';
import { flags } from './featureFlags';

let RECORDS: VerificationRecord[] = [];

export function listVerifications(userId = 'me'): VerificationRecord[] {
  return RECORDS.filter((r) => r.user_id === userId).slice().sort((a, b) =>
    a.updated_at < b.updated_at ? 1 : -1,
  );
}

function upsert(record: VerificationRecord) {
  RECORDS = [record, ...RECORDS.filter((r) => !(r.user_id === record.user_id && r.subject === record.subject))];
  return record;
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function inDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

async function delay<T>(value: T, ms = 600): Promise<T> {
  return new Promise((res) => setTimeout(() => res(value), ms));
}

// --- DRIVER IDENTITY -------------------------------------------------------

export async function startStripeIdentity(): Promise<VerificationRecord> {
  if (flags.stripeConfigured) {
    throw new Error(
      'Stripe Identity is not wired yet. To enable: POST /v1/identity/verification_sessions, ' +
        'open the Stripe-hosted flow via Linking, then update the record on webhook.',
    );
  }
  return delay(
    upsert({
      id: uid('vr'),
      user_id: 'me',
      subject: 'driver_identity',
      provider: 'stripe_identity',
      status: 'verified',
      external_ref: 'vs_mock_abc',
      expires_at: inDays(365 * 5),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: 'MOCK · Stripe Identity passed (document + selfie + liveness).',
    }),
  );
}

export async function submitDriverStatementUpload(args: {
  documentUri: string;
  driverNumber: string;
}): Promise<VerificationRecord> {
  return delay(
    upsert({
      id: uid('vr'),
      user_id: 'me',
      subject: 'driver_identity',
      provider: 'rsa_driver_statement_upload',
      status: 'manual_review',
      evidence_uri: args.documentUri,
      external_ref: args.driverNumber,
      expires_at: inDays(365),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: 'RSA Driver Statement received. Awaiting manual review.',
    }),
  );
}

// --- VEHICLE REGISTRATION (VRM lookup) -------------------------------------

export interface VrmLookupResult {
  reg: string;
  make: string;
  model: string;
  year: number;
  engine_cc: number;
  fuel: string;
  nct_expiry?: string;
  tax_expiry?: string;
  source: 'cartell' | 'motorcheck' | 'mock';
  raw?: unknown;
}

export async function lookupRegistration(reg: string): Promise<VrmLookupResult> {
  const normalized = reg.replace(/\s+/g, '').toUpperCase();
  // Real implementation will switch on the configured provider:
  //   if (process.env.CARTELL_API_KEY) return cartellLookup(normalized)
  //   if (process.env.MOTORCHECK_API_KEY) return motorcheckLookup(normalized)
  return delay({
    reg: normalized,
    make: normalized.startsWith('231') ? 'Nissan' : 'Volkswagen',
    model: normalized.startsWith('231') ? 'Leaf' : 'Golf',
    year: 2000 + Number(normalized.slice(0, 3)) || 2020,
    engine_cc: 1400,
    fuel: 'petrol',
    nct_expiry: inDays(220),
    tax_expiry: inDays(90),
    source: 'mock',
  });
}

export async function verifyVehicleRegistration(args: {
  reg: string;
  claimed_make: string;
  claimed_model: string;
  claimed_engine_cc?: number;
}): Promise<{ record: VerificationRecord; lookup: VrmLookupResult }> {
  const lookup = await lookupRegistration(args.reg);
  const matches =
    lookup.make.toLowerCase() === args.claimed_make.toLowerCase() &&
    lookup.model.toLowerCase() === args.claimed_model.toLowerCase();
  const status: VerificationStatus = matches ? 'verified' : 'failed';
  const record = upsert({
    id: uid('vr'),
    user_id: 'me',
    subject: 'vehicle_registration',
    provider: 'cartell',
    status,
    external_ref: lookup.reg,
    expires_at: inDays(365),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notes: matches
      ? `Registration matches claimed make/model (${lookup.make} ${lookup.model}, ${lookup.year}). MOCK source.`
      : `Registration does not match claimed make/model. NDLS-style reg-data mismatch.`,
  });
  return { record, lookup };
}

// --- MOTOR INSURANCE (document only — no public API) -----------------------

export async function submitInsuranceCertificate(args: {
  documentUri: string;
  insurer: string;
  policyNumber: string;
  expiry: string;
}): Promise<VerificationRecord> {
  return delay(
    upsert({
      id: uid('vr'),
      user_id: 'me',
      subject: 'motor_insurance',
      provider: 'insurer_document_upload',
      status: 'manual_review',
      external_ref: args.policyNumber,
      evidence_uri: args.documentUri,
      expires_at: args.expiry,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: `${args.insurer} certificate received. MIBI has no third-party API; manual review.`,
    }),
  );
}

// --- ADMIN helpers ---------------------------------------------------------

export function describeProviders() {
  return VERIFICATION_PROVIDERS;
}

export function approveLatest(subject: VerificationSubject) {
  const r = RECORDS.find((x) => x.user_id === 'me' && x.subject === subject);
  if (!r) return null;
  const next: VerificationRecord = {
    ...r,
    status: 'verified',
    updated_at: new Date().toISOString(),
    notes: (r.notes ? r.notes + ' ' : '') + 'Admin approved.',
  };
  return upsert(next);
}

export function resetVerifications() {
  RECORDS = [];
}

export type { VerificationProviderId };
