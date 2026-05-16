import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotificationStore } from '@/stores/notificationStore';
import { theme } from '@/lib/theme';

/**
 * Top brand header rendered above every tab. Keeps the Giorra wordmark
 * consistently visible while leaving room for a settings affordance.
 */
export function BrandHeader() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Pressable
            onPress={() => router.push('/notifications')}
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Feather name="bell" size={20} color={theme.colors.textMuted} />
            {unreadCount > 0 && (
              <View style={{
                position: 'absolute',
                top: -4,
                right: -6,
                backgroundColor: theme.colors.warn,
                borderRadius: 7,
                minWidth: 14,
                height: 14,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 2,
              }}>
                <Text style={{ color: '#fff', fontSize: 8, fontWeight: '700' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Feather name="settings" size={20} color={theme.colors.textMuted} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
