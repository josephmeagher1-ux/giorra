import React, { useState } from 'react';
import { View, Text, ScrollView, Platform, Pressable } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore, type AuthProvider } from '@/stores/authStore';
import { flags } from '@/lib/featureFlags';
import { theme } from '@/lib/theme';

const MOCK_OAUTH: Record<string, { email: string; displayName: string }> = {
  google: { email: 'you@gmail.com', displayName: 'Joseph Meagher' },
  apple: { email: 'you@icloud.com', displayName: 'Joseph M.' },
  facebook: { email: 'you@facebook.com', displayName: 'Joseph Meagher' },
};

export default function SignInScreen() {
  const signedIn = useAuthStore((s) => s.signedIn);
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<AuthProvider | null>(null);

  if (signedIn) return <Redirect href="/" />;

  const onEmailContinue = async () => {
    if (!email.trim()) return;
    setLoading(true);
    await pause(200);
    signIn({ email: email.trim(), provider: 'email' });
    setLoading(false);
    router.replace('/');
  };

  const onOAuth = async (provider: AuthProvider) => {
    setLoadingProvider(provider);
    if (flags.supabaseConfigured) {
      // TODO: call supabase.auth.signInWithOAuth({ provider })
      // For now fall through to mock
    }
    await pause(400);
    const mock = MOCK_OAUTH[provider] ?? MOCK_OAUTH.google;
    signIn({ email: mock.email, displayName: mock.displayName, provider });
    setLoadingProvider(null);
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
              <Text style={styles.wordmark}>Giorra</Text>
            </View>
            <Text style={styles.tagline}>
              Carpooling for{'\n'}the trips you're already taking.
            </Text>
            <Text style={styles.subTagline}>
              Cost-shared, never commercial. Drivers cover their fuel, riders pay a fair seat — and
              everyone gets where they're going for less.
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
                ? 'Choose how you\'d like to sign in.'
                : 'Demo mode — sign in instantly with any method.'}
            </Text>

            <OAuthButton
              provider="google"
              label="Continue with Google"
              icon="G"
              iconColor="#4285F4"
              loading={loadingProvider === 'google'}
              onPress={() => onOAuth('google')}
            />
            <OAuthButton
              provider="apple"
              label="Continue with Apple"
              icon=""
              iconColor="#000"
              loading={loadingProvider === 'apple'}
              onPress={() => onOAuth('apple')}
            />
            <OAuthButton
              provider="facebook"
              label="Continue with Facebook"
              icon="f"
              iconColor="#1877F2"
              loading={loadingProvider === 'facebook'}
              onPress={() => onOAuth('facebook')}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Input
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.ie"
              value={email}
              onChangeText={setEmail}
            />
            <Button title="Continue with email" full loading={loading} onPress={onEmailContinue} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Giorra is not a taxi or hackney service. Drivers never earn above calculated cost; the
              driver pays their own share too.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function OAuthButton({
  label,
  icon,
  iconColor,
  loading,
  onPress,
}: {
  provider: string;
  label: string;
  icon: string;
  iconColor: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.oauthBtn,
        pressed && { backgroundColor: theme.colors.chip },
        loading && { opacity: 0.6 },
      ]}
    >
      <View style={[styles.oauthIcon, { backgroundColor: iconColor + '14' }]}>
        <Text style={[styles.oauthIconText, { color: iconColor }]}>{icon}</Text>
      </View>
      <Text style={styles.oauthLabel}>{loading ? 'Signing in...' : label}</Text>
    </Pressable>
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

function pause(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
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
    gap: 10,
  },
  cardTitle: { fontSize: 20, fontWeight: '700' as const, color: theme.colors.text },
  cardSub: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 },
  oauthBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  oauthIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  oauthIconText: { fontSize: 16, fontWeight: '700' as const },
  oauthLabel: { fontSize: 15, fontWeight: '600' as const, color: theme.colors.text },
  divider: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { fontSize: 12, color: theme.colors.textSubtle },
  footer: { paddingHorizontal: theme.spacing(2), alignItems: 'center' as const },
  footerText: {
    fontSize: 11,
    color: theme.colors.textSubtle,
    textAlign: 'center' as const,
    lineHeight: 16,
  },
};
