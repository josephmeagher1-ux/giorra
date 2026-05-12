import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Caption } from '@/components/ui/Heading';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  approveLatest,
  listVerifications,
  startStripeIdentity,
  submitDriverStatementUpload,
  submitInsuranceCertificate,
  verifyVehicleRegistration,
} from '@/lib/identity';
import {
  bestRecord,
  canPerformAction,
  VERIFICATION_PROVIDERS,
  type VerificationRecord,
  type VerificationSubject,
} from '@drivey/shared';
import { theme } from '@/lib/theme';

function statusVariant(s: VerificationRecord['status']) {
  switch (s) {
    case 'verified':
      return 'accent' as const;
    case 'manual_review':
      return 'warn' as const;
    case 'failed':
    case 'expired':
      return 'danger' as const;
    default:
      return 'info' as const;
  }
}

function SectionHeader({ subject, records }: { subject: VerificationSubject; records: VerificationRecord[] }) {
  const r = bestRecord(records, subject);
  const label = subject === 'driver_identity' ? 'Driver identity' : subject === 'vehicle_registration' ? 'Vehicle registration' : 'Motor insurance';
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Heading level="md">{label}</Heading>
      {r ? <Pill label={r.status} variant={statusVariant(r.status)} /> : <Pill label="Not started" />}
    </View>
  );
}

export default function VerifyScreen() {
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const refresh = () => setRecords(listVerifications());

  useEffect(() => {
    refresh();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, []),
  );

  // driver identity inputs
  const [driverNumber, setDriverNumber] = useState('');
  const [statementUri, setStatementUri] = useState('mock://driver-statement.pdf');

  // vehicle inputs
  const [reg, setReg] = useState('202-D-12345');
  const [vehMake, setVehMake] = useState('Volkswagen');
  const [vehModel, setVehModel] = useState('Golf');

  // insurance inputs
  const [insurer, setInsurer] = useState('Aviva');
  const [policyNumber, setPolicyNumber] = useState('IE-AVIVA-12345');
  const [policyExpiry, setPolicyExpiry] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString();
  });
  const [certUri, setCertUri] = useState('mock://cert.pdf');

  const post = canPerformAction({ action: 'post_trip', records });

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Verification' }} />

      <View>
        <Heading level="xl">Verification</Heading>
        <Body muted>
          Ireland has no public NDLS or MIBI API, so verification is a mix of paid KYC, VRM
          lookups, and driver-uploaded documents. Drivey records every step in an audit log.
        </Body>
      </View>

      <Card style={{ gap: 6 }}>
        <Heading level="md">Eligibility</Heading>
        {post.ok ? (
          <Pill label="Cleared to post trips" variant="accent" />
        ) : (
          <View style={{ gap: 6 }}>
            <Pill label="Missing checks required to post" variant="warn" />
            {post.gaps.map((g) => (
              <Body key={g.subject} muted>
                • {g.subject.replace('_', ' ')} — {g.reason}
              </Body>
            ))}
          </View>
        )}
      </Card>

      <Card style={{ gap: theme.spacing(2) }}>
        <SectionHeader subject="driver_identity" records={records} />
        <Body muted>
          Recommended: Stripe Identity. Alternative: upload your RSA Driver Statement for manual
          review (free, but slower).
        </Body>
        <Button
          title="Start Stripe Identity (mock)"
          onPress={async () => {
            try {
              await startStripeIdentity();
              refresh();
              Alert.alert('Mock verified', 'Stripe Identity flow simulated as verified.');
            } catch (e: any) {
              Alert.alert('Not wired yet', e?.message ?? 'Unknown error');
            }
          }}
        />
        <Input label="Driver number (Section 4d of your licence)" value={driverNumber} onChangeText={setDriverNumber} />
        <Input label="Driver Statement file URI" value={statementUri} onChangeText={setStatementUri} hint="In production this becomes a file picker." />
        <Button
          title="Submit Driver Statement"
          variant="secondary"
          onPress={async () => {
            await submitDriverStatementUpload({ documentUri: statementUri, driverNumber });
            refresh();
          }}
        />
      </Card>

      <Card style={{ gap: theme.spacing(2) }}>
        <SectionHeader subject="vehicle_registration" records={records} />
        <Body muted>
          Cartell.ie or MotorCheck.ie return Make / Model / engine cc / NCT for a registration
          number. We compare the lookup to what you’ve claimed and pass / fail accordingly.
        </Body>
        <Input label="Registration" value={reg} onChangeText={setReg} autoCapitalize="characters" />
        <Input label="Claimed make" value={vehMake} onChangeText={setVehMake} />
        <Input label="Claimed model" value={vehModel} onChangeText={setVehModel} />
        <Button
          title="Look up and verify"
          onPress={async () => {
            const { lookup, record } = await verifyVehicleRegistration({
              reg,
              claimed_make: vehMake,
              claimed_model: vehModel,
            });
            refresh();
            Alert.alert(
              record.status === 'verified' ? 'Match' : 'Mismatch',
              `${lookup.make} ${lookup.model} (${lookup.year}) · ${lookup.engine_cc}cc · NCT to ${lookup.nct_expiry}`,
            );
          }}
        />
      </Card>

      <Card style={{ gap: theme.spacing(2) }}>
        <SectionHeader subject="motor_insurance" records={records} />
        <Body muted>
          MIBI does not expose its database to third parties — only Gardaí get bulk feeds. So we
          accept an insurance certificate upload, store the expiry, and prompt for re-upload.
        </Body>
        <Input label="Insurer" value={insurer} onChangeText={setInsurer} />
        <Input label="Policy number" value={policyNumber} onChangeText={setPolicyNumber} />
        <Input label="Expiry (ISO)" value={policyExpiry} onChangeText={setPolicyExpiry} />
        <Input label="Cert file URI" value={certUri} onChangeText={setCertUri} hint="File picker in production." />
        <Button
          title="Submit insurance cert"
          variant="secondary"
          onPress={async () => {
            await submitInsuranceCertificate({
              documentUri: certUri,
              insurer,
              policyNumber,
              expiry: policyExpiry,
            });
            refresh();
          }}
        />
      </Card>

      <Card style={{ gap: theme.spacing(1) }}>
        <Heading level="md">Verification history</Heading>
        {records.length === 0 ? (
          <Body muted>No verifications yet.</Body>
        ) : (
          records.map((r) => (
            <View key={r.id} style={{ paddingVertical: 6, borderBottomColor: theme.colors.border, borderBottomWidth: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Body style={{ fontWeight: '600' }}>{r.subject.replace('_', ' ')}</Body>
                <Pill label={r.status} variant={statusVariant(r.status)} />
              </View>
              <Caption>provider: {r.provider}</Caption>
              {r.expires_at ? <Caption>expires: {new Date(r.expires_at).toLocaleDateString('en-IE')}</Caption> : null}
              {r.notes ? <Caption>{r.notes}</Caption> : null}
              {r.status === 'manual_review' ? (
                <Button
                  title="Approve (admin mock)"
                  variant="ghost"
                  onPress={() => {
                    approveLatest(r.subject);
                    refresh();
                  }}
                />
              ) : null}
            </View>
          ))
        )}
      </Card>

      <Card style={{ gap: 6 }}>
        <Heading level="md">Provider catalog</Heading>
        <Caption>What can be wired up to make this live in Ireland.</Caption>
        {VERIFICATION_PROVIDERS.map((p) => (
          <View key={p.id} style={{ paddingVertical: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Body style={{ fontWeight: '600' }}>{p.display_name}</Body>
              <Pill label={p.implemented ? 'live' : p.paid ? 'paid stub' : 'free stub'} variant={p.implemented ? 'accent' : p.paid ? 'warn' : 'info'} />
            </View>
            <Caption>{p.description}</Caption>
            {p.ireland_notes ? <Caption muted>{p.ireland_notes}</Caption> : null}
          </View>
        ))}
      </Card>
    </Screen>
  );
}
