import React from 'react';
import { ScrollView, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';

interface Props extends ViewProps {
  scroll?: boolean;
}

export function Screen({ children, scroll, style, ...rest }: Props) {
  const Inner = (
    <View
      {...rest}
      style={[
        {
          flex: 1,
          padding: theme.spacing(5),
          gap: theme.spacing(4),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing(8) }}>{Inner}</ScrollView>
      ) : (
        Inner
      )}
    </SafeAreaView>
  );
}
