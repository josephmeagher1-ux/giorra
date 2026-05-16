import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Heading, Caption } from '@/components/ui/Heading';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { getOrganisation, getOrgDashboard } from '@/lib/api';
import { theme } from '@/lib/theme';

type OrgDetail = Awaited<ReturnType<typeof getOrganisation>>;
type Dashboard = Awaited<ReturnType<typeof getOrgDashboard>>;

const INCENTIVE_ICONS: Record<string, string> = {
  flat_subsidy: 'gift',
  per_km_subsidy: 'trending-up',
  free_seats: 'user-check',
  priority_matching: 'zap',
  tax_saver: 'percent',
};

export default function OrgDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [stats, setStats] = useState<Dashboard | null>(null);

  useEffect(() => {
    getOrganisation(id!).then(setOrg);
    getOrgDashboard(id!).then(setStats);
  }, [id]);

  if (!org) {
    return (
      <Screen>
        <Caption>Loading...</Caption>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={{ gap: 4 }}>
        <Heading>{org.name}</Heading>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pill label={org.type} />
          {org.smarter_travel_enrolled && <Pill label="NTA Smarter Travel" variant="accent" />}
        </View>
      </View>

      {stats && (
        <Card style={{ gap: 12 }}>
          <Text style={styles.sectionTitle}>This month's impact</Text>
          <View style={styles.statsGrid}>
            <StatTile icon="users" value={stats.active_members_this_month} label="Active members" />
            <StatTile icon="navigation" value={stats.total_trips_this_month} label="Shared trips" />
            <StatTile icon="map" value={`${stats.total_km_shared.toLocaleString()}`} label="Km shared" />
            <StatTile icon="wind" value={`${stats.total_co2_avoided_kg}`} label="Kg CO₂ avoided" />
          </View>
          <View style={styles.budgetRow}>
            <View style={styles.budgetBar}>
              <View
                style={[
                  styles.budgetFill,
                  {
                    width: `${Math.min(100, (stats.total_incentive_spent_eur / (stats.total_incentive_spent_eur + stats.budget_remaining_eur)) * 100)}%`,
                  },
                ]}
              />
            </View>
            <Caption>
              €{stats.total_incentive_spent_eur} spent · €{stats.budget_remaining_eur.toFixed(0)} remaining
            </Caption>
          </View>
        </Card>
      )}

      <Text style={styles.sectionTitle}>Active incentives</Text>
      {org.incentives.filter((i) => i.active).length === 0 ? (
        <Card>
          <Caption>No active incentives yet.</Caption>
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {org.incentives
            .filter((i) => i.active)
            .map((inc) => (
              <Card key={inc.id} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.incIcon}>
                    <Feather name={INCENTIVE_ICONS[inc.type] as any ?? 'gift'} size={16} color={theme.colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.incLabel}>{inc.label}</Text>
                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                      {inc.eligible_categories.map((c) => (
                        <Pill key={c} label={c} />
                      ))}
                    </View>
                  </View>
                  {inc.value_eur && (
                    <Text style={styles.incAmount}>€{inc.value_eur}</Text>
                  )}
                  {inc.value_per_km_eur && (
                    <Text style={styles.incAmount}>€{inc.value_per_km_eur}/km</Text>
                  )}
                </View>
                <Caption>{inc.description}</Caption>
                {inc.max_per_month_eur && (
                  <Caption muted>Cap: €{inc.max_per_month_eur}/month</Caption>
                )}
              </Card>
            ))}
        </View>
      )}

      {org.smarter_travel_enrolled && (
        <Card style={{ backgroundColor: theme.colors.accentSoft, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="award" size={18} color={theme.colors.accentDark} />
            <Text style={{ fontWeight: '700', color: theme.colors.accentDark, fontSize: 14 }}>
              NTA Smarter Travel Partner
            </Text>
          </View>
          <Caption style={{ color: theme.colors.accentDark }}>
            This organisation participates in the National Transport Authority's Smarter Travel Workplaces
            programme. Carpooling incentives may qualify for employer tax relief under Revenue guidelines.
          </Caption>
        </Card>
      )}
    </Screen>
  );
}

function StatTile({ icon, value, label }: { icon: any; value: string | number; label: string }) {
  return (
    <View style={styles.statTile}>
      <Feather name={icon} size={14} color={theme.colors.accent} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = {
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, color: theme.colors.text },
  statsGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
  statTile: {
    flex: 1,
    minWidth: '45%' as any,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    padding: theme.spacing(3),
    alignItems: 'center' as const,
    gap: 4,
  },
  statValue: { fontSize: 20, fontWeight: '800' as const, color: theme.colors.text },
  statLabel: { fontSize: 11, color: theme.colors.textMuted, textAlign: 'center' as const },
  budgetRow: { gap: 6 },
  budgetBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.chip,
    overflow: 'hidden' as const,
  },
  budgetFill: {
    height: '100%' as const,
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
  },
  incIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  incLabel: { fontSize: 14, fontWeight: '700' as const, color: theme.colors.text },
  incAmount: { fontSize: 16, fontWeight: '800' as const, color: theme.colors.accent },
};
