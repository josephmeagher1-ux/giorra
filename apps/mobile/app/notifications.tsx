import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Heading, Caption } from '@/components/ui/Heading';
import { Card } from '@/components/ui/Card';
import { useNotificationStore } from '@/stores/notificationStore';
import type { NotificationPayload, NotificationType } from '@giorra/shared';
import { theme } from '@/lib/theme';

const ICON_MAP: Record<NotificationType, { name: string; color: string }> = {
  booking_requested: { name: 'user-plus', color: theme.colors.accent },
  booking_accepted: { name: 'check-circle', color: theme.colors.accent },
  message_received: { name: 'message-circle', color: theme.colors.text },
  trip_departure_reminder: { name: 'clock', color: theme.colors.warn },
  trip_completed: { name: 'flag', color: theme.colors.accent },
};

export default function NotificationsScreen() {
  const { notifications, markAllRead, clear } = useNotificationStore();

  React.useEffect(() => {
    markAllRead();
  }, []);

  const onTap = (notif: NotificationPayload) => {
    if (notif.data?.booking_id) {
      router.push({ pathname: '/booking/[id]', params: { id: notif.data.booking_id } });
    } else if (notif.data?.trip_id) {
      router.push({ pathname: '/trip/[id]', params: { id: notif.data.trip_id } });
    }
  };

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Heading>Notifications</Heading>
        {notifications.length > 0 && (
          <Pressable onPress={clear} hitSlop={10}>
            <Caption style={{ color: theme.colors.accent }}>Clear all</Caption>
          </Pressable>
        )}
      </View>

      {notifications.length === 0 ? (
        <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 32 }}>
          <Feather name="bell-off" size={28} color={theme.colors.textMuted} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text }}>
            All caught up
          </Text>
          <Caption>You have no notifications.</Caption>
        </Card>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(_, i) => `n-${i}`}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => {
            const iconCfg = ICON_MAP[item.type] ?? { name: 'bell', color: theme.colors.textMuted };
            return (
              <Pressable onPress={() => onTap(item)}>
                <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: theme.colors.accentSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Feather name={iconCfg.name as any} size={16} color={iconCfg.color} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
                      {item.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.colors.textMuted }} numberOfLines={2}>
                      {item.body}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={theme.colors.textMuted} />
                </Card>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}
