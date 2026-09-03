// Web-only layout — bypasse toute l'initialisation native (SQLite, notifications, iCloud)
// et force le rendu directement. Si l'app est toujours blanche avec ce fichier,
// le problème est dans un composant enfant, pas dans l'initialisation.
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';

export default function RootLayoutWeb() {
  useEffect(() => {
    // Charger les settings (DB web stub — no-op instantané)
    useSettingsStore.getState().loadSettings().catch(() => {});
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" options={{ animation: 'none' }} />
      <Stack.Screen name="settings" />
      <Stack.Screen name="pro-notes" options={{ headerShown: true, presentation: 'modal' }} />
      <Stack.Screen name="pro-note-detail" options={{ headerShown: true }} />
    </Stack>
  );
}
