import React from 'react';
import { Tabs } from 'expo-router';
import { theme } from '@/lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Search' }} />
      <Tabs.Screen name="post" options={{ title: 'Post trip' }} />
      <Tabs.Screen name="recurring" options={{ title: 'Regular routes' }} />
      <Tabs.Screen name="my-trips" options={{ title: 'My trips' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
