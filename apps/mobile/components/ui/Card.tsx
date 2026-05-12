import React from 'react';
import { View, type ViewProps } from 'react-native';
import { theme } from '@/lib/theme';

export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.spacing(4),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
