import { useState, useEffect } from 'react';
import { View, Text, TextInput, Switch, StyleSheet } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';
import { useColorTheme } from '@/hooks/useColorTheme';
import { scheduleReminders } from '@/services/notificationService';
import { MealSlot, MealType } from '@/types';
import { settingsStyles } from './settingsStyles';

export function MealSlotsSection() {
  const { mealSlots, settings, saveMealSlot, saveMealSlotEnabled } = useSettingsStore();
  const { primary } = useColorTheme();

  const [localSlots, setLocalSlots] = useState<MealSlot[]>(mealSlots);
  const [rawHours, setRawHours] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mealSlots.length > 0) setLocalSlots(mealSlots);
  }, [mealSlots]);

  const updateHour = (meal_type: MealType, field: 'start_hour' | 'end_hour', raw: string) => {
    setRawHours(prev => ({ ...prev, [`${meal_type}_${field}`]: raw }));
  };

  const handleSlotBlur = async (meal_type: MealType) => {
    const slot = localSlots.find(s => s.meal_type === meal_type);
    if (!slot) return;

    const startRaw = rawHours[`${meal_type}_start_hour`];
    const endRaw = rawHours[`${meal_type}_end_hour`];
    const startVal = startRaw !== undefined ? parseInt(startRaw, 10) : slot.start_hour;
    const endVal = endRaw !== undefined ? parseInt(endRaw, 10) : slot.end_hour;

    const start = isNaN(startVal) ? slot.start_hour : Math.min(23, Math.max(0, startVal));
    const end = isNaN(endVal) ? slot.end_hour : Math.min(23, Math.max(0, endVal));

    const validStart = start < end ? start : slot.start_hour;
    const validEnd = end > start ? end : slot.end_hour;

    setLocalSlots(prev => prev.map(s =>
      s.meal_type === meal_type ? { ...s, start_hour: validStart, end_hour: validEnd } : s
    ));
    setRawHours(prev => {
      const next = { ...prev };
      delete next[`${meal_type}_start_hour`];
      delete next[`${meal_type}_end_hour`];
      return next;
    });

    await saveMealSlot(meal_type, validStart, validEnd);
    if (settings) {
      await scheduleReminders(localSlots, {
        enabled: settings.notifications_enabled,
        breakfast: settings.notifications_breakfast,
        lunch: settings.notifications_lunch,
        snack: settings.notifications_snack,
        dinner: settings.notifications_dinner,
      });
    }
  };

  return (
    <View style={settingsStyles.card}>
      {localSlots.map(slot => (
        <View key={slot.meal_type} style={styles.slotRow}>
          <View style={styles.slotLeft}>
            <Switch
              value={slot.enabled !== 0}
              onValueChange={v => saveMealSlotEnabled(slot.meal_type, v)}
              trackColor={{ true: primary }}
              style={styles.slotSwitch}
            />
            <Text style={[styles.slotLabel, slot.enabled === 0 && styles.slotLabelDisabled]}>
              {slot.icon} {slot.label}
            </Text>
          </View>
          {slot.enabled !== 0 && (
            <View style={styles.slotControls}>
              <TextInput
                testID={`slot-start-${slot.meal_type}`}
                style={[styles.hourInput, { borderColor: primary, color: primary }]}
                value={rawHours[`${slot.meal_type}_start_hour`] ?? String(slot.start_hour)}
                onChangeText={v => updateHour(slot.meal_type, 'start_hour', v)}
                onBlur={() => handleSlotBlur(slot.meal_type)}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
              />
              <Text style={[styles.slotSep, { color: primary }]}>h — </Text>
              <TextInput
                testID={`slot-end-${slot.meal_type}`}
                style={[styles.hourInput, { borderColor: primary, color: primary }]}
                value={rawHours[`${slot.meal_type}_end_hour`] ?? String(slot.end_hour)}
                onChangeText={v => updateHour(slot.meal_type, 'end_hour', v)}
                onBlur={() => handleSlotBlur(slot.meal_type)}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
              />
              <Text style={[styles.slotSep, { color: primary }]}>h</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0D0B8',
  },
  slotLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slotSwitch: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },
  slotLabel: { fontSize: 15, fontWeight: '600', color: '#5C3020' },
  slotLabelDisabled: { color: '#C09070' },
  slotControls: { flexDirection: 'row', alignItems: 'center' },
  hourInput: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    width: 48,
  },
  slotSep: { fontSize: 14, fontWeight: '600', marginHorizontal: 2 },
});
