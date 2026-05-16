import type { Message, MessageInput } from '@giorra/shared';
import { SELF } from './mock/data';

let MESSAGES: Message[] = [
  {
    id: 'msg_seed1',
    trip_id: 't1',
    sender_id: 'd1',
    content: 'Hi! I usually leave from near St Stephen\'s Green. Works for you?',
    is_system: false,
    created_at: '2026-05-12T19:10:00Z',
  },
  {
    id: 'msg_seed2',
    trip_id: 't1',
    sender_id: 'me',
    content: 'Perfect, I can be there by 7:20.',
    is_system: false,
    created_at: '2026-05-12T19:12:00Z',
  },
  {
    id: 'msg_seed3',
    trip_id: 't1',
    sender_id: 'd1',
    content: 'Great, see you then!',
    is_system: false,
    created_at: '2026-05-12T19:13:00Z',
  },
];

type Subscriber = (msg: Message) => void;
const subscribers = new Map<string, Set<Subscriber>>();

function uid() {
  return `msg_${Math.random().toString(36).slice(2, 10)}`;
}

export function sendMessage(input: MessageInput): Message {
  const msg: Message = {
    id: uid(),
    trip_id: input.trip_id,
    sender_id: SELF.id,
    content: input.content,
    is_system: false,
    created_at: new Date().toISOString(),
  };
  MESSAGES.push(msg);
  const subs = subscribers.get(input.trip_id);
  if (subs) subs.forEach((cb) => cb(msg));
  return msg;
}

export function sendSystemMessage(trip_id: string, content: string): Message {
  const msg: Message = {
    id: uid(),
    trip_id,
    sender_id: 'system',
    content,
    is_system: true,
    created_at: new Date().toISOString(),
  };
  MESSAGES.push(msg);
  const subs = subscribers.get(trip_id);
  if (subs) subs.forEach((cb) => cb(msg));
  return msg;
}

export function getMessagesForTrip(trip_id: string): Message[] {
  return MESSAGES.filter((m) => m.trip_id === trip_id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function subscribeToTrip(trip_id: string, callback: Subscriber): () => void {
  if (!subscribers.has(trip_id)) subscribers.set(trip_id, new Set());
  subscribers.get(trip_id)!.add(callback);
  return () => {
    subscribers.get(trip_id)?.delete(callback);
  };
}
