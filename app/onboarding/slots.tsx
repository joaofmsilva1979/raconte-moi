import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Switch } from 'react-native';
import { router } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';
import { useColorTheme } from '@/hooks/useColorTheme';
import { OnboardingProgress } from '@/components/OnboardingProgress';
import { MealSlot, MealType } from '@/types';

export default function SlotsScreen() {
  const { mealSlots, saveMealSlot, saveMealSlotEnabled } = useSettingsStore();
  const { primary } = useColorTheme();
  const [localSlots, setLocalSlots] = useState<MealSlot[]>(mealSlots);
  const [rawHours, setRawHours] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mealSlots.length > 0) setLocalSlots(mealSlots);
  }, [mealSlots]);

  const updateHour = (meal_type: MealType, field: 'start_hour' | 'end_hour', raw: string) => {
    setRawHours(prev => ({ ...prev, [`${meal_type}_${field}`]: raw }));
  };

  const commitHour = (meal_type: MealType, field: 'start_hour' | 'end_hour') => {
    const key = `${meal_type}_${field}`;
    const raw = rawHours[key];
    if (raw === undefined) return;
    const val = parseInt(raw, 10);
    setLocalSlots(prev =>
      prev.map(s => {
        if (s.meal_type !== meal_type) return s;
        if (isNaN(val)) return s;
        const hour = Math.min(23, Math.max(0, val));
        if (field === 'start_hour' && hour >= s.end_hour) return s;
        if (field === 'end_hour' && hour <= s.start_hour) return s;
        return { ...s, [field]: hour };
      })
    );
    setRawHours(prev => { const next = { ...prev }; delete next[key]; return next; });
  };

  const handleContinue = async () => {
    await Promise.all(
      localSlots.map(s => saveMealSlot(s.meal_type, s.start_hour, s.end_hour))
    );
    router.push('/onboarding/color');
  };

  return (
    <View style={styles.container}>
      <OnboardingProgress currentStep={3} totalSteps={5} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Mes horaires</Text>
        <Text style={styles.subtitle}>
          Ajuste les plages. L'app détecte le bon repas automatiquement.
        </Text>

        {localSlots.map(slot => (
          <View key={slot.meal_type} style={styles.row}>
            <View style={styles.rowLeft}>
              <Switch
                value={slot.enabled !== 0}
                onValueChange={v => saveMealSlotEnabled(slot.meal_type, v)}
                trackColor={{ true: primary }}
                style={styles.rowSwitch}
              />
              <Text style={[styles.mealLabel, slot.enabled === 0 && styles.mealLabelOff]}>
                {slot.icon} {slot.label}
              </Text>
            </View>
            {slot.enabled !== 0 && (
              <View style={styles.controls}>
                <TextInput
                  style={[styles.hourInput, { borderColor: primary, color: primary }]}
                  value={rawHours[`${slot.meal_type}_start_hour`] ?? String(slot.start_hour)}
                  onChangeText={v => updateHour(slot.meal_type, 'start_hour', v)}
                  onBlur={() => commitHour(slot.meal_type, 'start_hour')}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                />
                <Text style={[styles.sep, { color: primary }]}>h — </Text>
                <TextInput
                  style={[styles.hourInput, { borderColor: primary, color: primary }]}
                  value={rawHours[`${slot.meal_type}_end_hour`] ?? String(slot.end_hour)}
                  onChangeText={v => updateHour(slot.meal_type, 'end_hour', v)}
                  onBlur={() => commitHour(slot.meal_type, 'end_hour')}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                />
                <Text style={[styles.sep, { color: primary }]}>h</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: primary }]}
        onPress={handleContinue}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Parfait →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5', padding: 24 },
  content: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', color: '#2D1A0E', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#C09070', marginBottom: 24, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0D0B8',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowSwitch: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },
  mealLabel: { fontSize: 15, fontWeight: '600', color: '#5C3020' },
  mealLabelOff: { color: '#C09070' },
  controls: { flexDirection: 'row', alignItems: 'center' },
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
  sep: { fontSize: 14, fontWeight: '600', marginHorizontal: 2 },
  button: {
    borderRadius: 14, padding: 16, alignItems: 'center',
    marginBottom: 8, marginTop: 16,
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
