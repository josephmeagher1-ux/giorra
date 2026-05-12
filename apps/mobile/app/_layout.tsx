import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';

export default function RootLayout() {
  const signedIn = useAuthStore((s) => s.signedIn);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        {signedIn ? (
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="trip/[id]"
              options={{ headerShown: true, title: 'Trip' }}
            />
            <Stack.Screen
              name="vehicle/add"
              options={{ headerShown: true, title: 'Add vehicle' }}
            />
            <Stack.Screen
              name="recurring/new"
              options={{ headerShown: true, title: 'New regular route' }}
            />
            <Stack.Screen
              name="recurring/[id]"
              options={{ headerShown: true, title: 'Regular route' }}
            />
            <Stack.Screen
              name="declarations"
              options={{ headerShown: true, title: 'Driver declarations' }}
            />
            <Stack.Screen
              name="verify"
              options={{ headerShown: true, title: 'Verification' }}
            />
          </>
        ) : (
          <Stack.Screen name="(auth)" />
        )}
      </Stack>
    </SafeAreaProvider>
  );
}
