import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Caption } from '@/components/ui/Heading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { ImpactDashboard } from '@/components/ImpactDashboard';
import {
  driverImpactFor,
  getDeclarationsAcceptance,
  getProfile,
  listVehicles,
  ratingForUser,
  setPreferredCharity,
} from '@/lib/api';
import { listVerifications } from '@/lib/identity';
import {
  activityProgress,
  canPerformAction,
  DEFAULT_CHARITIES,
} from '@drivey/shared';
import { flags } from '@/lib/featureFlags';
import { useAuthStore } from '@/stores/authStore';

export default function ProfileScreen() {
  const signOut = useAuthStore((s) => s.signOut);
  const [vehicles, setVehicles] = useState<Awaited<ReturnType<typeof listVehicles>>>([]);
  const [declAt, setDeclAt] = useState<string | null>(null);
  const [verifications, setVerifications] = useState(listVerifications());
  const [profile, setProfile] = useState(getProfile());
  const [impactTrips, setImpactTrips] = useState(driverImpactFor());

  const refresh = async () => {
    setVehicles(await listVehicles());
    setDeclAt(getDeclarationsAcceptance().acceptedAt);
    setVerifications(listVerifications());
    setProfile({ ...getProfile() });
    setImpactTrips(driverImpactFor());
  };

  useEffect(() => {
    refresh();
  }, []);

  const driverRating = ratingForUser(profile.id, 'driver');
  const riderRating = ratingForUser(profile.id, 'rider');

  const driverActivity = activityProgress({
    completed_trips: profile.trips_completed,
    distinct_counterparties: Math.min(profile.trips_completed, 5),
    avg_stars: driverRating.count > 0 ? driverRating.avg_stars : profile.rating,
  });

  const selectedCharity = DEFAULT_CHARITIES.find((c) => c.id === profile.preferred_charity_id);

  return (
    <Screen scroll>
      <Card style={{ gap: 6 }}>
        <Heading level="xl">{profile.full_name}</Heading>
        <Caption>
          ★ {profile.rating.toFixed(2)} · {profile.trips_completed} completed trips · since{' '}
          {new Date(profile.joined_at).toLocaleDateString('en-IE')}
        </Caption>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <Pill label={flags.supabaseConfigured ? 'Live data' : 'Mock mode'} variant={flags.supabaseConfigured ? 'accent' : 'warn'} />
          <Pill label={declAt ? 'Declarations signed' : 'Declarations pending'} variant={declAt ? 'accent' : 'warn'} />
          <Pill
            label={driverActivity.verified ? 'Verified by activity ✓' : `${driverActivity.trips_left} more trips to verify`}
            variant={driverActivity.verified ? 'accent' : 'info'}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          <Pill
            label={`As driver · ${driverRating.count === 0 ? 'no ratings' : `${driverRating.avg_stars.toFixed(2)}★ (${driverRating.count})`}`}
            variant="info"
          />
          <Pill
            label={`As rider · ${riderRating.count === 0 ? 'no ratings' : `${riderRating.avg_stars.toFixed(2)}★ (${riderRating.count})`}`}
            variant="info"
          />
        </View>
      </Card>

      <ImpactDashboard trips={impactTrips} />

      <Card style={{ gap: 6 }}>
        <Heading level="md">Preferred charity</Heading>
        <Body muted>
          If the optional escrow feature is ever switched on for a trip and a rider doesn’t show
          up, the held funds go to this charity rather than to you. You pick it once here.
        </Body>
        {selectedCharity ? (
          <Pill label={`Currently: ${selectedCharity.name}`} variant="accent" />
        ) : (
          <Pill label="No charity selected yet" variant="warn" />
        )}
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {DEFAULT_CHARITIES.map((c) => (
            <Pill
              key={c.id}
              label={c.name}
              selected={profile.preferred_charity_id === c.id}
              onPress={() => {
                setPreferredCharity(c.id);
                refresh();
              }}
            />
          ))}
        </View>
      </Card>

      <Card style={{ gap: 6 }}>
        <Heading level="md">Driver declarations</Heading>
        <Body muted>
          Drivers must accept the cost-sharing declarations before posting their first trip.
        </Body>
        <Button
          title={declAt ? 'Review declarations' : 'Sign declarations'}
          variant="secondary"
          onPress={() => router.push('/declarations')}
        />
      </Card>

      <Card style={{ gap: 6 }}>
        <Heading level="md">Verification</Heading>
        {(() => {
          const post = canPerformAction({ action: 'post_trip', records: verifications });
          return post.ok ? (
            <Pill label="Identity, vehicle, insurance verified" variant="accent" />
          ) : (
            <View style={{ gap: 4 }}>
              <Pill label={`Missing ${post.gaps.length} check${post.gaps.length === 1 ? '' : 's'} to post trips`} variant="warn" />
              {post.gaps.map((g) => (
                <Body key={g.subject} muted>• {g.subject.replace('_', ' ')} ({g.reason})</Body>
              ))}
            </View>
          );
        })()}
        <Button title="Manage verification" variant="secondary" onPress={() => router.push('/verify')} />
      </Card>

      <Card style={{ gap: 6 }}>
        <Heading level="md">Driver wallet</Heading>
        <Body muted>
          Pay-as-you-go billing. Your first trips are free; after that a small per-trip fee comes
          out of your Drivey wallet.
        </Body>
        <Button title="Open billing" variant="secondary" onPress={() => router.push('/subscription')} />
      </Card>

      <Card style={{ gap: 6 }}>
        <Heading level="md">Vehicles</Heading>
        {vehicles.length === 0 ? (
          <Body muted>No vehicles yet.</Body>
        ) : (
          vehicles.map((v) => (
            <View key={v.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Body>
                {v.year} {v.make} {v.model}
              </Body>
              <Pill label={v.fuel} variant="info" />
            </View>
          ))
        )}
        <Button title="Add vehicle" variant="secondary" onPress={() => router.push('/vehicle/add')} />
      </Card>

      <Card>
        <Button title="Settings" variant="ghost" onPress={() => router.push('/settings')} />
        <Button title="Sign out" variant="ghost" onPress={signOut} />
      </Card>
    </Screen>
  );
}
