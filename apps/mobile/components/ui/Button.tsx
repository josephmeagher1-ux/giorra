import React from 'react';
import { Pressable, Text, ActivityIndicator, View, type PressableProps } from 'react-native';
import { theme } from '@/lib/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
  full?: boolean;
}

const styles: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: theme.colors.accent, fg: '#fff', border: theme.colors.accent },
  secondary: { bg: theme.colors.surface, fg: theme.colors.accent, border: theme.colors.accent },
  ghost: { bg: 'transparent', fg: theme.colors.text, border: 'transparent' },
  danger: { bg: theme.colors.danger, fg: '#fff', border: theme.colors.danger },
};

export function Button({ title, variant = 'primary', loading, full, disabled, style, ...rest }: ButtonProps) {
  const s = styles[variant];
  return (
    <Pressable
      {...rest}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: s.bg,
          borderColor: s.border,
          borderWidth: 1,
          borderRadius: theme.radius.md,
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: full ? 'stretch' : 'flex-start',
        },
        style as object,
      ]}
    >
      {loading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ActivityIndicator size="small" color={s.fg} />
          <Text style={{ color: s.fg, fontWeight: '600' }}>{title}</Text>
        </View>
      ) : (
        <Text style={{ color: s.fg, fontWeight: '600', fontSize: theme.font.sizeMd }}>{title}</Text>
      )}
    </Pressable>
  );
}
