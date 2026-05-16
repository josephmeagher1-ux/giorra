import React from 'react';
import { View, Text } from 'react-native';
import type { Message } from '@giorra/shared';
import { theme } from '@/lib/theme';

interface Props {
  message: Message;
  isOwn: boolean;
  senderName: string;
}

export function MessageBubble({ message, isOwn, senderName }: Props) {
  if (message.is_system) {
    return (
      <View style={styles.systemRow}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      {!isOwn && <Text style={styles.senderName}>{senderName}</Text>}
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.content, isOwn ? styles.contentOwn : styles.contentOther]}>
          {message.content}
        </Text>
      </View>
      <Text style={styles.timestamp}>
        {new Date(message.created_at).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
}

const styles = {
  row: { gap: 2, maxWidth: '80%' as any },
  rowOwn: { alignSelf: 'flex-end' as const, alignItems: 'flex-end' as const },
  rowOther: { alignSelf: 'flex-start' as const, alignItems: 'flex-start' as const },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.lg,
  },
  bubbleOwn: { backgroundColor: theme.colors.accentSoft },
  bubbleOther: { backgroundColor: theme.colors.chip },
  content: { fontSize: 14, lineHeight: 20 },
  contentOwn: { color: theme.colors.accentDark },
  contentOther: { color: theme.colors.text },
  senderName: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: theme.colors.textMuted,
    marginLeft: 4,
  },
  timestamp: { fontSize: 10, color: theme.colors.textSubtle, marginTop: 2, marginHorizontal: 4 },
  systemRow: { alignSelf: 'center' as const, paddingVertical: 8 },
  systemText: { fontSize: 12, fontStyle: 'italic' as const, color: theme.colors.textMuted, textAlign: 'center' as const },
};
