import React, { useState } from 'react';
import { View, TextInput, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/lib/theme';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Type a message..."
        placeholderTextColor={theme.colors.textSubtle}
        style={styles.input}
        editable={!disabled}
        multiline
        maxLength={2000}
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />
      <Pressable
        style={[styles.sendButton, (!text.trim() || disabled) && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={!text.trim() || disabled}
        hitSlop={8}
      >
        <Feather name="send" size={18} color={!text.trim() || disabled ? theme.colors.textSubtle : theme.colors.accent} />
      </Pressable>
    </View>
  );
}

const styles = {
  container: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
    ...((Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as object),
  } as any,
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sendButtonDisabled: { opacity: 0.5 },
};
