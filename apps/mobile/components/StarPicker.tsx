import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { theme } from '@/lib/theme';

export function StarPicker({
  value,
  onChange,
}: {
  value: 1 | 2 | 3 | 4 | 5;
  onChange: (n: 1 | 2 | 3 | 4 | 5) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          onPress={() => onChange(n as 1 | 2 | 3 | 4 | 5)}
          style={{
            borderRadius: theme.radius.pill,
            borderWidth: 1,
            borderColor: n <= value ? theme.colors.accent : theme.colors.border,
            backgroundColor: n <= value ? theme.colors.accent : 'transparent',
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: n <= value ? '#fff' : theme.colors.text, fontWeight: '700' }}>
            {n}★
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
