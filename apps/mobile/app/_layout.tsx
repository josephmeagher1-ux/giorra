import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: theme.colors.bg },
          headerTitleStyle: { fontWeight: '700' },
          headerTintColor: theme.colors.text,
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="trip/[id]" options={{ headerShown: true, title: 'Trip' }} />
        <Stack.Screen name="booking/[id]" options={{ headerShown: true, title: 'Booking' }} />
        <Stack.Screen name="rate/[id]" options={{ headerShown: true, title: 'Rate' }} />
        <Stack.Screen name="vehicle/add" options={{ headerShown: true, title: 'Add vehicle' }} />
        <Stack.Screen name="recurring/new" options={{ headerShown: true, title: 'New regular route' }} />
        <Stack.Screen name="recurring/[id]" options={{ headerShown: true, title: 'Regular route' }} />
        <Stack.Screen name="declarations" options={{ headerShown: true, title: 'Driver declarations' }} />
        <Stack.Screen name="verify" options={{ headerShown: true, title: 'Verification' }} />
        <Stack.Screen name="subscription" options={{ headerShown: true, title: 'Driver wallet' }} />
        <Stack.Screen name="settings/index" options={{ headerShown: true, title: 'Settings' }} />
        <Stack.Screen name="settings/refund" options={{ headerShown: true, title: 'Wallet refund' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
