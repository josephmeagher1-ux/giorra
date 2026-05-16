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
