import { Platform } from 'react-native';
import { MealSlot, MealType } from '@/types';

export interface NotificationSettings {
  enabled: boolean;
  breakfast: boolean;
  lunch: boolean;
  snack: boolean;
  dinner: boolean;
}

type NotificationContent = {
  title: string;
  body: string;
};

const NOTIFICATION_CONTENT: Partial<Record<MealType, NotificationContent>> = {
  breakfast: {
    title: 'Tu as bien déjeuné ce matin ? 🌅',
    body: 'Il est 8h — note ton petit-déjeuner avant de commencer ta journée.',
  },
  lunch: {
    title: 'Ton déjeuner ? 🌞',
    body: "Il est 12h30 et tu n'as pas encore noté ton déjeuner.",
  },
  snack: {
    title: 'Une petite collation aujourd\'hui ? 🌤',
    body: "N'oublie pas de noter si tu as grignoté quelque chose.",
  },
  dinner: {
    title: 'Et pour le dîner ? 🌙',
    body: 'Il est 20h — raconte-moi ce que tu as mangé ce soir.',
  },
};

export function configureNotificationHandler(): void {
  if (Platform.OS === 'web') return;
  import('expo-notifications').then(Notifications => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  });
}

export function getReminderHour(startHour: number, endHour: number): number | null {
  const mid = Math.round((startHour + endHour) / 2);
  if (mid < 7 || mid >= 22) return null;
  return mid;
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  const Notifications = await import('expo-notifications');
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleReminders(
  slots: MealSlot[],
  notifSettings: NotificationSettings
): Promise<void> {
  if (Platform.OS === 'web') return;
  await cancelAllReminders();
  if (!notifSettings.enabled) return;

  const Notifications = await import('expo-notifications');
  for (const slot of slots) {
    const toggleKey = slot.meal_type as keyof NotificationSettings;
    if (toggleKey === 'enabled') continue;
    if (!notifSettings[toggleKey]) continue;
    const reminderHour = getReminderHour(slot.start_hour, slot.end_hour);
    if (reminderHour === null) continue;
    const content = NOTIFICATION_CONTENT[slot.meal_type];
    if (!content) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: 'reminder_' + slot.meal_type,
      content: { title: content.title, body: content.body, data: { meal_type: slot.meal_type } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminderHour,
        minute: 0,
      },
    });
  }
}
