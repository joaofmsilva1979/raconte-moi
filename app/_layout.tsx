import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { initDatabase } from '@/db/database';
import { useSettingsStore } from '@/store/settingsStore';

export default function RootLayout() {
  useEffect(() => {
    initDatabase().then(() => {
      useSettingsStore.getState().loadSettings();
    }).catch(console.error);
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
    </Stack>
  );
}
