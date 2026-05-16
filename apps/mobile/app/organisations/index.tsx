import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Heading, Body, Caption } from '@/components/ui/Heading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { listOrganisations, listMyOrganisations, joinOrganisation } from '@/lib/api';
import { theme } from '@/lib/theme';

type Org = Awaited<ReturnType<typeof listOrganisations>>[number];
type MyOrg = Awaited<ReturnType<typeof listMyOrganisations>>[number];

const TYPE_ICONS: Record<string, string> = {
  employer: 'briefcase',
  school: 'book',
  university: 'award',
  community: 'users',
};

export default function OrganisationsScreen() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [myOrgs, setMyOrgs] = useState<MyOrg[]>([]);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    listOrganisations().then(setOrgs);
    listMyOrganisations().then(setMyOrgs);
  }, []);

  const myOrgIds = new Set(myOrgs.map((o) => o.id));

  const onJoin = async (org: Org) => {
    const method = org.domain ? 'email_domain' : 'invite_code';
    if (method === 'invite_code') {
      Alert.alert(
        'Join ' + org.name,
        'In production, you\'d enter an invite code here. For now, joining instantly.',
      );
    }
    setJoining(org.id);
    await joinOrganisation(org.id, method);
    const updated = await listMyOrganisations();
    setMyOrgs(updated);
    setJoining(null);
  };

  return (
    <Screen scroll>
      <Heading>Your organisations</Heading>
      <Caption>
        Organisations can offer carpooling incentives through NTA Smarter Travel or their own programmes.
      </Caption>

      {myOrgs.length > 0 ? (
        <View style={{ gap: 10 }}>
          {myOrgs.map((org) => (
            <Pressable
              key={org.id}
              onPress={() => router.push({ pathname: '/organisations/[id]', params: { id: org.id } })}
            >
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.orgIcon}>
                  <Feather name={TYPE_ICONS[org.type] as any} size={18} color={theme.colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orgName}>{org.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    <Pill label={org.type} />
                    {org.smarter_travel_enrolled && <Pill label="Smarter Travel" variant="accent" />}
                    {org.verified && <Pill label="Verified" />}
                  </View>
                </View>
                <Feather name="chevron-right" size={18} color={theme.colors.textMuted} />
              </Card>
            </Pressable>
          ))}
        </View>
      ) : (
        <Card>
          <Caption>You haven't joined any organisations yet. Browse below to get started.</Caption>
        </Card>
      )}

      <View style={styles.divider} />
      <Heading level="md">Browse organisations</Heading>

      <View style={{ gap: 10 }}>
        {orgs
          .filter((o) => !myOrgIds.has(o.id))
          .map((org) => (
            <Card key={org.id} style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.orgIcon}>
                  <Feather name={TYPE_ICONS[org.type] as any} size={18} color={theme.colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orgName}>{org.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    <Pill label={org.type} />
                    {org.smarter_travel_enrolled && <Pill label="Smarter Travel" variant="accent" />}
                  </View>
                </View>
              </View>
              {org.domain && (
                <Caption>Verify with your @{org.domain} email to unlock incentives.</Caption>
              )}
              <Button
                title={joining === org.id ? 'Joining...' : 'Join'}
                loading={joining === org.id}
                onPress={() => onJoin(org)}
              />
            </Card>
          ))}
      </View>
    </Screen>
  );
}

const styles = {
  orgIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  orgName: { fontSize: 16, fontWeight: '700' as const, color: theme.colors.text },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 8 },
};
