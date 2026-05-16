import type { NotificationPayload } from '@giorra/shared';
import { useNotificationStore } from '@/stores/notificationStore';
import { flags } from './featureFlags';

/**
 * Emit a notification. Pushes to the in-app store (triggers Toast)
 * and stubs a OneSignal call when configured.
 */
export function notify(payload: NotificationPayload) {
  useNotificationStore.getState().push(payload);

  if (flags.oneSignalConfigured) {
    // TODO: OneSignal.postNotification(payload) when SDK wired
    console.log('[OneSignal stub]', payload.type, payload.title);
  }
}

export function useNotifications() {
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clear = useNotificationStore((s) => s.clear);
  return { notifications, unreadCount, markAllRead, clear };
}

/**
 * Schedule departure reminders for trips departing within the next hour.
 * In production this would use expo-notifications local scheduling.
 * For the mock we fire it immediately if a trip departs within 60 minutes.
 */
const remindedTrips = new Set<string>();

export function checkDepartureReminders(trips: { id: string; departure_time: string; origin: { name: string }; destination: { name: string } }[]) {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  for (const t of trips) {
    if (remindedTrips.has(t.id)) continue;
    const dep = new Date(t.departure_time).getTime();
    const diff = dep - now;
    if (diff > 0 && diff <= ONE_HOUR) {
      remindedTrips.add(t.id);
      const mins = Math.round(diff / 60000);
      notify({
        type: 'trip_departure_reminder',
        title: 'Departing soon',
        body: `Your trip from ${t.origin.name} to ${t.destination.name} departs in ${mins} minutes.`,
        data: { trip_id: t.id },
      });
    }
  }
}
