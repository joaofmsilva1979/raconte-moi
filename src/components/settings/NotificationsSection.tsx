import { View, Text, Switch, StyleSheet } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';
import { useColorTheme } from '@/hooks/useColorTheme';
import { scheduleReminders } from '@/services/notificationService';
import { settingsStyles } from './settingsStyles';

export function NotificationsSection() {
  const { settings, mealSlots, saveNotificationSetting } = useSettingsStore();
  const { primary } = useColorTheme();

  const notifEnabled = settings?.notifications_enabled ?? false;

  const handleNotificationToggle = async (
    key: 'notifications_enabled' | 'notifications_breakfast' | 'notifications_lunch' | 'notifications_snack' | 'notifications_dinner',
    value: boolean
  ) => {
    await saveNotificationSetting(key, value);
    if (settings) {
      const updated = { ...settings, [key]: value };
      await scheduleReminders(mealSlots, {
        enabled: updated.notifications_enabled,
        breakfast: updated.notifications_breakfast,
        lunch: updated.notifications_lunch,
        snack: updated.notifications_snack,
        dinner: updated.notifications_dinner,
      });
    }
  };

  const mealNotifRows: Array<{
    key: 'notifications_breakfast' | 'notifications_lunch' | 'notifications_snack' | 'notifications_dinner';
    testID: string;
    label: string;
    icon: string;
  }> = [
    { key: 'notifications_breakfast', testID: 'toggle-notifications-breakfast', label: 'Petit-déjeuner', icon: '☀️' },
    { key: 'notifications_lunch', testID: 'toggle-notifications-lunch', label: 'Déjeuner', icon: '🌞' },
    { key: 'notifications_snack', testID: 'toggle-notifications-snack', label: 'Collation', icon: '🌤' },
    { key: 'notifications_dinner', testID: 'toggle-notifications-dinner', label: 'Dîner', icon: '🌙' },
  ];

  return (
    <View style={settingsStyles.card}>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Rappels activés</Text>
        <Switch
          testID="toggle-notifications-enabled"
          value={notifEnabled}
          onValueChange={value => handleNotificationToggle('notifications_enabled', value)}
          trackColor={{ true: primary }}
        />
      </View>
      {notifEnabled && mealNotifRows.map(row => (
        <View key={row.key} style={styles.switchRow}>
          <Text style={styles.switchLabel}>{row.icon} {row.label}</Text>
          <Switch
            testID={row.testID}
            value={settings?.[row.key] ?? false}
            onValueChange={value => handleNotificationToggle(row.key, value)}
            trackColor={{ true: primary }}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0D0B8',
  },
  switchLabel: { fontSize: 15, color: '#2D1A0E', fontWeight: '500' },
});
