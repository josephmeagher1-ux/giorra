export interface Message {
  id: string;
  trip_id: string;
  sender_id: string;
  content: string;
  is_system: boolean;
  created_at: string;
}

export interface MessageInput {
  trip_id: string;
  content: string;
}
