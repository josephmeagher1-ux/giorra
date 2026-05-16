import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Platform } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import type { NotificationPayload } from '@giorra/shared';
import { useNotificationStore } from '@/stores/notificationStore';
import { theme } from '@/lib/theme';

const TOAST_DURATION = 4000;

export function Toast() {
  const [current, setCurrent] = useState<NotificationPayload | null>(null);
  const translateY = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCount = useRef(0);

  const notifications = useNotificationStore((s) => s.notifications);

  useEffect(() => {
    if (notifications.length > lastCount.current && notifications.length > 0) {
      showToast(notifications[0]);
    }
    lastCount.current = notifications.length;
  }, [notifications.length]);

  const showToast = (payload: NotificationPayload) => {
    setCurrent(payload);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(dismiss, TOAST_DURATION);
  };

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setCurrent(null));
  };

  const onPress = () => {
    dismiss();
    if (!current?.data) return;
    if (current.data.booking_id) {
      router.push({ pathname: '/booking/[id]', params: { id: current.data.booking_id } });
    } else if (current.data.trip_id) {
      router.push({ pathname: '/trip/[id]', params: { id: current.data.trip_id } });
    }
  };

  if (!current) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }] },
        Platform.OS === 'web' ? { position: 'fixed' as any } : {},
      ]}
    >
      <Pressable style={styles.inner} onPress={onPress}>
        <View style={styles.iconWrap}>
          <Feather name="bell" size={16} color={theme.colors.accent} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.title} numberOfLines={1}>{current.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{current.body}</Text>
        </View>
        <Pressable onPress={dismiss} hitSlop={8}>
          <Feather name="x" size={16} color={theme.colors.textMuted} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = {
  container: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    paddingHorizontal: 12,
  },
  inner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }
      : { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 }),
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  title: { fontSize: 13, fontWeight: '700' as const, color: theme.colors.text },
  body: { fontSize: 12, color: theme.colors.textMuted },
};
