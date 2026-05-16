export type NotificationType =
  | 'booking_requested'
  | 'booking_accepted'
  | 'message_received'
  | 'trip_departure_reminder'
  | 'trip_completed';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}
