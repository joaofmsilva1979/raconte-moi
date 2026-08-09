jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('id'),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

import * as Notifications from 'expo-notifications';
import {
  configureNotificationHandler,
  getReminderHour,
  scheduleReminders,
  cancelAllReminders,
  NotificationSettings,
} from '@/services/notificationService';
import { MealSlot } from '@/types';

const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;

const ALL_SLOTS: MealSlot[] = [
  { meal_type: 'breakfast', label: 'Petit-déj',  icon: '☀️', start_hour: 6,  end_hour: 10 },
  { meal_type: 'lunch',     label: 'Déjeuner',   icon: '🌞', start_hour: 11, end_hour: 14 },
  { meal_type: 'snack',     label: 'Collation',  icon: '🌤', start_hour: 14, end_hour: 18 },
  { meal_type: 'dinner',    label: 'Dîner',      icon: '🌙', start_hour: 18, end_hour: 22 },
];

const ALL_ENABLED: NotificationSettings = {
  enabled: true,
  breakfast: true,
  lunch: true,
  snack: true,
  dinner: true,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getReminderHour', () => {
  it('retourne 8 pour la plage 6h-10h', () => {
    expect(getReminderHour(6, 10)).toBe(8);
  });

  it('retourne 13 pour la plage 11h-14h (arrondi de 12.5)', () => {
    expect(getReminderHour(11, 14)).toBe(13);
  });

  it('retourne 16 pour la plage 14h-18h', () => {
    expect(getReminderHour(14, 18)).toBe(16);
  });

  it('retourne 20 pour la plage 18h-22h', () => {
    expect(getReminderHour(18, 22)).toBe(20);
  });

  it('retourne null pour la plage 22h-24h (hors plage)', () => {
    expect(getReminderHour(22, 24)).toBeNull();
  });

  it('retourne null pour la plage 0h-5h (hors plage)', () => {
    expect(getReminderHour(0, 5)).toBeNull();
  });
});

describe('cancelAllReminders', () => {
  it('appelle cancelAllScheduledNotificationsAsync', async () => {
    await cancelAllReminders();
    expect(mockNotifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
  });
});

describe('configureNotificationHandler', () => {
  it('appelle setNotificationHandler', () => {
    configureNotificationHandler();
    expect(mockNotifications.setNotificationHandler).toHaveBeenCalledTimes(1);
  });
});

describe('scheduleReminders', () => {
  it('appelle scheduleNotificationAsync 4 fois quand tout est activé', async () => {
    await scheduleReminders(ALL_SLOTS, ALL_ENABLED);
    expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledTimes(4);
  });

  it('n\'appelle jamais scheduleNotificationAsync si enabled est false', async () => {
    const settings: NotificationSettings = { ...ALL_ENABLED, enabled: false };
    await scheduleReminders(ALL_SLOTS, settings);
    expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(mockNotifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
  });

  it('appelle scheduleNotificationAsync 3 fois si snack est désactivé', async () => {
    const settings: NotificationSettings = { ...ALL_ENABLED, snack: false };
    await scheduleReminders(ALL_SLOTS, settings);
    expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledTimes(3);
    const calls = (mockNotifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    const identifiers = calls.map((call: any[]) => call[0].identifier);
    expect(identifiers).not.toContain('reminder_snack');
  });
});
