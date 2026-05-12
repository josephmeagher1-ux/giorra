import React from 'react';
import { TextInput, View, Text, type TextInputProps } from 'react-native';
import { theme } from '@/lib/theme';

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, style, ...rest }: Props) {
  return (
    <View style={{ marginBottom: theme.spacing(3) }}>
      {label ? (
        <Text style={{ marginBottom: 6, fontWeight: '600', color: theme.colors.text }}>{label}</Text>
      ) : null}
      <TextInput
        {...rest}
        placeholderTextColor={theme.colors.textSubtle}
        style={[
          {
            borderWidth: 1,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            borderRadius: theme.radius.md,
            paddingVertical: 12,
            paddingHorizontal: 14,
            fontSize: theme.font.sizeMd,
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
          },
          style as object,
        ]}
      />
      {hint && !error ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.sizeXs, marginTop: 4 }}>{hint}</Text>
      ) : null}
      {error ? (
        <Text style={{ color: theme.colors.danger, fontSize: theme.font.sizeXs, marginTop: 4 }}>{error}</Text>
      ) : null}
    </View>
  );
}
