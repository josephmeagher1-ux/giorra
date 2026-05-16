import React, { useEffect, useState, useRef } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { Message } from '@giorra/shared';
import { Screen } from '@/components/ui/Screen';
import { Caption } from '@/components/ui/Heading';
import { MessageBubble } from '@/components/MessageBubble';
import { ChatInput } from '@/components/ChatInput';
import { getMessagesForTrip, sendMessage, subscribeToTrip } from '@/lib/messaging';
import { getTrip } from '@/lib/api';
import { SELF } from '@/lib/mock/data';
import { theme } from '@/lib/theme';

export default function ChatScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [driverName, setDriverName] = useState('Driver');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!tripId) return;
    setMessages(getMessagesForTrip(tripId));
    getTrip(tripId).then((t) => setDriverName(t.driver.full_name));
    const unsub = subscribeToTrip(tripId, (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return unsub;
  }, [tripId]);

  const handleSend = (text: string) => {
    if (!tripId) return;
    sendMessage({ trip_id: tripId, content: text });
  };

  const getSenderName = (senderId: string) => {
    if (senderId === SELF.id) return 'You';
    if (senderId === 'system') return 'System';
    return driverName;
  };

  const renderItem = ({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      isOwn={item.sender_id === SELF.id}
      senderName={getSenderName(item.sender_id)}
    />
  );

  if (!tripId) {
    return (
      <Screen>
        <Caption>No trip specified.</Caption>
      </Screen>
    );
  }

  const Wrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View;
  const wrapperProps = Platform.OS === 'ios' ? { behavior: 'padding' as const, style: { flex: 1 } } : { style: { flex: 1 } };

  return (
    <Wrapper {...wrapperProps}>
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Caption>No messages yet. Say hello!</Caption>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          />
        )}
        <ChatInput onSend={handleSend} />
      </View>
    </Wrapper>
  );
}

const styles = {
  list: { padding: 16, paddingBottom: 8 },
  empty: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
};
