import { create } from 'zustand';
import type { NotificationPayload } from '@giorra/shared';

interface NotificationState {
  notifications: NotificationPayload[];
  unreadCount: number;
  push: (payload: NotificationPayload) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  push: (payload) =>
    set((s) => ({
      notifications: [payload, ...s.notifications].slice(0, 50),
      unreadCount: s.unreadCount + 1,
    })),
  markAllRead: () => set({ unreadCount: 0 }),
  clear: () => set({ notifications: [], unreadCount: 0 }),
}));
