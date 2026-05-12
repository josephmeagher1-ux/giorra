import React from 'react';
import { Text, type TextProps } from 'react-native';
import { theme } from '@/lib/theme';

type Level = 'xxl' | 'xl' | 'lg' | 'md' | 'sm';

interface HeadingProps extends TextProps {
  level?: Level;
  muted?: boolean;
}

const sizeFor: Record<Level, number> = {
  xxl: theme.font.sizeXxl,
  xl: theme.font.sizeXl,
  lg: theme.font.sizeLg,
  md: theme.font.sizeMd,
  sm: theme.font.sizeSm,
};

const weightFor: Record<Level, '700' | '600' | '500'> = {
  xxl: '700',
  xl: '700',
  lg: '600',
  md: '600',
  sm: '500',
};

export function Heading({ level = 'lg', muted, style, ...rest }: HeadingProps) {
  return (
    <Text
      {...rest}
      style={[
        {
          fontSize: sizeFor[level],
          fontWeight: weightFor[level],
          color: muted ? theme.colors.textMuted : theme.colors.text,
        },
        style,
      ]}
    />
  );
}

export function Body({ style, muted, ...rest }: TextProps & { muted?: boolean }) {
  return (
    <Text
      {...rest}
      style={[
        {
          fontSize: theme.font.sizeMd,
          color: muted ? theme.colors.textMuted : theme.colors.text,
          lineHeight: 22,
        },
        style,
      ]}
    />
  );
}

export function Caption({ style, muted, ...rest }: TextProps & { muted?: boolean }) {
  return (
    <Text
      {...rest}
      style={[
        {
          fontSize: theme.font.sizeXs,
          color: muted ? theme.colors.textMuted : theme.colors.textSubtle,
        },
        style,
      ]}
    />
  );
}
