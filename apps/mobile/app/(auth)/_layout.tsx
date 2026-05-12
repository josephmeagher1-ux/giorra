import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function AuthLayout() {
  const signedIn = useAuthStore((s) => s.signedIn);
  if (signedIn) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
