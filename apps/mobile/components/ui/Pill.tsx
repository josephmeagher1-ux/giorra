import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { theme } from '@/lib/theme';

interface PillProps {
  label: string;
  variant?: 'default' | 'accent' | 'warn' | 'info' | 'danger';
  onPress?: () => void;
  selected?: boolean;
}

export function Pill({ label, variant = 'default', onPress, selected }: PillProps) {
  const colors = (() => {
    if (selected) return { bg: theme.colors.accent, fg: '#fff' };
    switch (variant) {
      case 'accent':
        return { bg: theme.colors.accentSoft, fg: theme.colors.accentDark };
      case 'warn':
        return { bg: theme.colors.warnSoft, fg: theme.colors.warn };
      case 'info':
        return { bg: '#e7edf5', fg: theme.colors.info };
      case 'danger':
        return { bg: '#fbe3e3', fg: theme.colors.danger };
      default:
        return { bg: theme.colors.chip, fg: theme.colors.text };
    }
  })();

  const inner = (
    <View
      style={{
        backgroundColor: colors.bg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.radius.pill,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color: colors.fg, fontWeight: '600', fontSize: theme.font.sizeXs }}>{label}</Text>
    </View>
  );

  return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner;
}
