import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';

/**
 * Top brand header rendered above every tab. Keeps the Giorra wordmark
 * consistently visible while leaving room for a settings affordance.
 */
export function BrandHeader() {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.bg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing(5),
          paddingVertical: theme.spacing(3),
          backgroundColor: theme.colors.bg,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: theme.colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="navigation-2" size={18} color="#fff" />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.5 }}>
            Giorra
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Feather name="settings" size={20} color={theme.colors.textMuted} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
