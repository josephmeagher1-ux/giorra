import React, { useState } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { flags } from '@/lib/featureFlags';
import { theme } from '@/lib/theme';

/**
 * Landing / sign-in screen. Mock-mode signs anyone in instantly — Supabase
 * Auth email magic-link wiring goes in here when keys are configured.
 */
export default function AuthIndex() {
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('you@example.ie');
  const [loading, setLoading] = useState(false);

  const onContinue = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 250));
    signIn(email);
    setLoading(false);
    // Explicit nav so the URL updates immediately on the web build.
    router.replace('/');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.hero}>
          <View style={styles.heroBlob1} />
          <View style={styles.heroBlob2} />
          <View style={styles.heroContent}>
            <View style={styles.logoRow}>
              <View style={styles.logoMark}>
                <Feather name="navigation-2" size={22} color="#fff" />
              </View>
              <Text style={styles.wordmark}>Drivey</Text>
            </View>
            <Text style={styles.tagline}>
              Carpooling for{'\n'}the trips you’re already taking.
            </Text>
            <Text style={styles.subTagline}>
              Cost-shared, never commercial. Drivers cover their fuel, riders pay a fair seat — and
              everyone gets where they’re going for less.
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.statsRow}>
            <Stat value="€0.21" label="avg / km shared" />
            <Stat value="3.2×" label="cheaper than taxi" />
            <Stat value="68%" label="CO₂ avoided" />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign in</Text>
            <Text style={styles.cardSub}>
              {flags.supabaseConfigured
                ? 'We’ll email you a one-time magic link. No password.'
                : 'Demo mode — any email signs you in instantly.'}
            </Text>
            <Input
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Button title="Continue with email" full loading={loading} onPress={onContinue} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Drivey is not a taxi or hackney service. Drivers never earn above calculated cost; the
              driver pays their own share too.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = {
  hero: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing(6),
    paddingTop: theme.spacing(8),
    paddingBottom: theme.spacing(10),
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  heroBlob1: {
    position: 'absolute' as const,
    top: -60,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 240,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroBlob2: {
    position: 'absolute' as const,
    bottom: -80,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroContent: { gap: 12, position: 'relative' as const },
  logoRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  wordmark: { fontSize: 26, fontWeight: '800' as const, color: '#fff', letterSpacing: -0.5 },
  tagline: {
    fontSize: 30,
    fontWeight: '800' as const,
    color: '#fff',
    lineHeight: 36,
    letterSpacing: -0.5,
    marginTop: theme.spacing(2),
  },
  subTagline: { color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 22, marginTop: 4 },
  body: { padding: theme.spacing(5), gap: theme.spacing(4), marginTop: -theme.spacing(6) },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(3),
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 20px rgba(15,110,78,0.08)' }
      : { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 }),
  },
  stat: { flex: 1, alignItems: 'center' as const, paddingVertical: 6 },
  statValue: { fontSize: 18, fontWeight: '700' as const, color: theme.colors.text },
  statLabel: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(5),
    gap: 8,
  },
  cardTitle: { fontSize: 20, fontWeight: '700' as const, color: theme.colors.text },
  cardSub: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 },
  footer: { paddingHorizontal: theme.spacing(2), alignItems: 'center' as const },
  footerText: {
    fontSize: 11,
    color: theme.colors.textSubtle,
    textAlign: 'center' as const,
    lineHeight: 16,
  },
};
