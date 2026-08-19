import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { initDatabase } from '@/db/database';
import { useSettingsStore } from '@/store/settingsStore';
import { configureNotificationHandler, scheduleReminders, NotificationSettings } from '@/services/notificationService';
import { MealType } from '@/types';
import { useRecordingStore } from '@/store/recordingStore';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => useSettingsStore.getState().loadSettings())
      .then(() => {
        const { settings, mealSlots } = useSettingsStore.getState();
        if (settings) {
          const notifSettings: NotificationSettings = {
            enabled: settings.notifications_enabled,
            breakfast: settings.notifications_breakfast,
            lunch: settings.notifications_lunch,
            snack: settings.notifications_snack,
            dinner: settings.notifications_dinner,
          };
          configureNotificationHandler();
          return scheduleReminders(mealSlots, notifSettings);
        }
      })
      .then(async () => {
        try {
          const { settings } = useSettingsStore.getState();
          if (settings?.icloud_backup) {
            const { isBackupDue, backupWithRetry } = await import('@/services/icloudService');
            if (isBackupDue(settings.last_backup_at, settings.backup_interval)) {
              const date = await backupWithRetry();
              await useSettingsStore.getState().saveLastBackupAt(date);
            }
          }
        } catch {}
      })
      .then(() => setDbReady(true))
      .catch(() => setDbReady(true)); // Ne jamais bloquer le render, même si la DB échoue
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const run = async () => {
      const Notifications = await import('expo-notifications');
      const sub = Notifications.addNotificationResponseReceivedListener(response => {
        const mealType = response.notification.request.content.data?.meal_type as MealType | undefined;
        if (mealType) useRecordingStore.getState().setMealType(mealType);
      });
      return () => sub.remove();
    };
    run();
  }, []);

  if (!dbReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      <Stack.Screen name="settings" />
      <Stack.Screen name="pro-notes" options={{ headerShown: true, presentation: 'modal' }} />
      <Stack.Screen name="pro-note-detail" options={{ headerShown: true }} />
    </Stack>
  );
}
