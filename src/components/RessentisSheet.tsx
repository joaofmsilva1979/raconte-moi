import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { useRessentisStore } from '@/store/ressentisStore';
import { RESSENTI_CATEGORIES, RESSENTI_SUB_CATEGORIES } from '@/constants/ressentis';
import { MealType, SleepQuality } from '@/types';

interface RessentisSheetProps {
  primaryColor: string;
}

const SLEEP_OPTIONS: { quality: SleepQuality; icon: string; label: string }[] = [
  { quality: 1, icon: '😣', label: 'Mal' },
  { quality: 2, icon: '😐', label: 'Moyen' },
  { quality: 3, icon: '😊', label: 'Bien' },
];

type AnySlot = 'morning' | MealType;

const SLOT_OPTS: { id: AnySlot; icon: string; label: string }[] = [
  { id: 'morning',   icon: '🌅', label: 'Au réveil' },
  { id: 'breakfast', icon: '☀️', label: 'Petit-déj' },
  { id: 'lunch',     icon: '🌞', label: 'Déjeuner' },
  { id: 'snack',     icon: '🌤', label: 'Collation' },
  { id: 'dinner',    icon: '🌙', label: 'Dîner' },
];

function currentSlot(mode: string | null, selected_meal: MealType | null, moment: string | null): AnySlot | null {
  if (moment === 'morning') return 'morning';
  if (mode === 'meal' && selected_meal) return selected_meal as AnySlot;
  return null;
}

export function RessentisSheet({ primaryColor }: RessentisSheetProps) {
  const {
    isSheetOpen, mode, categories, sub_categories, selected_meal, meal_day,
    notes, subNote, sleepQuality, customPainLocations, moment,
    selectSlot, toggleCategory, toggleSubCategory, applyCustomLocation,
    setMealDay, setNote, setSubNote, setSleepQuality,
    saveCustomLocation, removeCustomLocation, saveRessenti, closeSheet,
  } = useRessentisStore();

  const [showAddPain, setShowAddPain] = useState(false);
  const [addPainText, setAddPainText] = useState('');

  if (!isSheetOpen) return null;

  const slot = currentSlot(mode, selected_meal, moment);
  const painSelected = categories.includes('pain');
  const otherSelected = categories.includes('other');
  const isMealSlot = slot !== null && slot !== 'morning';
  const isMorning = slot === 'morning';

  function handleAddPain() {
    const name = addPainText.trim();
    if (name.length < 2) return;
    saveCustomLocation(name);
    setAddPainText('');
    setShowAddPain(false);
  }

  const canSave = categories.length > 0 || (isMorning && sleepQuality !== null);

  function handleSlotPress(id: AnySlot) {
    selectSlot(slot === id ? null : id);
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={closeSheet}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View testID="ressentis-sheet" style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={styles.title}>💜 Ressentis</Text>
            <Text style={styles.subtitle}>Comment tu te sens ?</Text>

            {/* Catégories — visibles immédiatement */}
            <View style={styles.chipRow}>
              {RESSENTI_CATEGORIES.map((item) => {
                const selected = categories.includes(item.category);
                return (
                  <TouchableOpacity
                    key={item.category}
                    testID={`category-btn-${item.category}`}
                    onPress={() => toggleCategory(item.category)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={styles.chipIcon}>{item.icon}</Text>
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Localisation douleur — inline quand douleur sélectionnée */}
            {painSelected && (
              <View style={styles.expandBox}>
                <Text style={styles.expandLabel}>Où as-tu mal ?</Text>

                {customPainLocations.length > 0 && (
                  <View style={styles.subRow}>
                    {customPainLocations.map((loc) => {
                      const sel = sub_categories.includes('other') && subNote === loc.label;
                      return (
                        <View key={loc.id} style={styles.customChipWrap}>
                          <TouchableOpacity
                            onPress={() => applyCustomLocation(loc)}
                            style={[styles.subChip, sel && styles.subChipSelected]}
                          >
                            <Text style={[styles.subChipText, sel && styles.subChipTextSelected]}>
                              ⭐ {loc.label}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => removeCustomLocation(loc.id)}
                            style={styles.customDelete}
                          >
                            <Text style={styles.customDeleteText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}

                <View style={styles.subRow}>
                  {RESSENTI_SUB_CATEGORIES.filter(i => i.sub !== 'other').map((item) => {
                    const selected = sub_categories.includes(item.sub);
                    return (
                      <TouchableOpacity
                        key={item.sub}
                        testID={`subcategory-btn-${item.sub}`}
                        onPress={() => toggleSubCategory(item.sub)}
                        style={[styles.subChip, selected && styles.subChipSelected]}
                      >
                        <Text style={styles.subChipIcon}>{item.icon}</Text>
                        <Text style={[styles.subChipText, selected && styles.subChipTextSelected]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    testID="subcategory-btn-other"
                    onPress={() => setShowAddPain(v => !v)}
                    style={[styles.subChip, { borderStyle: 'dashed' }]}
                  >
                    <Text style={[styles.subChipText, { color: '#7C3AED' }]}>✏️ Autre</Text>
                  </TouchableOpacity>
                </View>

                {showAddPain && (
                  <View style={styles.addPainBox}>
                    <TextInput
                      style={styles.addPainInput}
                      placeholder="Ex: genou, cheville, cou…"
                      placeholderTextColor="#B090D0"
                      value={addPainText}
                      onChangeText={setAddPainText}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleAddPain}
                      blurOnSubmit
                    />
                    <TouchableOpacity
                      onPress={handleAddPain}
                      style={[styles.addPainBtn, addPainText.trim().length < 2 && { opacity: 0.4 }]}
                      disabled={addPainText.trim().length < 2}
                    >
                      <Text style={styles.addPainBtnText}>Ajouter</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Note libre — inline quand "Autre" sélectionné */}
            {otherSelected && (
              <TextInput
                style={styles.noteInput}
                placeholder="Décris ce que tu ressens…"
                placeholderTextColor="#C09070"
                value={notes['other'] ?? ''}
                onChangeText={(text) => setNote('other', text)}
                multiline
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                blurOnSubmit
              />
            )}

            {/* Moment — optionnel */}
            <Text style={styles.sectionLabel}>Moment (optionnel)</Text>
            <View style={styles.chipRow}>
              {SLOT_OPTS.map((s) => {
                const sel = slot === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    testID={`slot-btn-${s.id}`}
                    onPress={() => handleSlotPress(s.id)}
                    style={[styles.chip, sel && styles.chipSlotSelected]}
                  >
                    <Text style={styles.chipIcon}>{s.icon}</Text>
                    <Text style={[styles.chipText, sel && styles.chipTextSelected]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sommeil — inline si Au réveil sélectionné */}
            {isMorning && (
              <View style={styles.expandBox}>
                <Text style={styles.expandLabel}>Comment as-tu dormi ?</Text>
                <Text style={styles.sleepHint}>
                  Ton ressenti au réveil — douleurs, raideurs, fatigue matinale. Pas un suivi automatique comme Apple Santé, mais ce que tu as vraiment vécu en te levant.
                </Text>
                <View style={styles.sleepRow}>
                  {SLEEP_OPTIONS.map(({ quality, icon, label }) => {
                    const sel = sleepQuality === quality;
                    return (
                      <TouchableOpacity
                        key={quality}
                        onPress={() => setSleepQuality(sel ? null : quality)}
                        style={[styles.sleepBtn, sel && styles.sleepBtnSelected]}
                      >
                        <Text style={styles.sleepIcon}>{icon}</Text>
                        <Text style={[styles.sleepLabel, sel && styles.sleepLabelSelected]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Hier / Aujourd'hui — seulement si repas sélectionné */}
            {isMealSlot && (
              <View style={styles.dayRow}>
                {(['today', 'yesterday'] as const).map((day) => (
                  <TouchableOpacity
                    key={day}
                    testID={`day-btn-${day}`}
                    onPress={() => setMealDay(day)}
                    style={[styles.dayBtn, meal_day === day && styles.dayBtnSelected]}
                  >
                    <Text style={[styles.dayBtnText, meal_day === day && styles.dayBtnTextSelected]}>
                      {day === 'today' ? "Aujourd'hui" : 'Hier'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {canSave && (
              <TouchableOpacity
                testID="save-ressenti-btn"
                onPress={saveRessenti}
                style={styles.saveBtn}
              >
                <Text style={styles.saveBtnText}>💜 Enregistrer</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity testID="close-ressenti-btn" onPress={closeSheet} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: '#FDF8FF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 10,
    maxHeight: '90%',
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#D8B4FE',
    borderRadius: 2, alignSelf: 'center',
    marginTop: 12, marginBottom: 4,
  },
  title: {
    fontSize: 20, fontWeight: '800', color: '#1C0A00',
    letterSpacing: -0.5, marginBottom: 4, marginTop: 8,
  },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginBottom: 16 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#E9D5FF', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: '#F5F0FF',
  },
  chipSelected: { backgroundColor: '#EDE9FE', borderColor: '#8B5CF6' },
  chipSlotSelected: { backgroundColor: '#EDE9FE', borderColor: '#8B5CF6' },
  chipIcon: { fontSize: 16 },
  chipText: { fontSize: 13, fontWeight: '600', color: '#5C3020' },
  chipTextSelected: { color: '#6D28D9' },

  expandBox: {
    backgroundColor: '#F5F0FF', borderRadius: 14,
    padding: 14, marginTop: 10, marginBottom: 4,
    borderWidth: 1, borderColor: '#E9D5FF', gap: 10,
  },
  expandLabel: { fontSize: 12, fontWeight: '700', color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 0.4 },

  subRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  subChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: '#C4B5FD', borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: 'white',
  },
  subChipSelected: { backgroundColor: '#DDD6FE', borderColor: '#7C3AED' },
  subChipIcon: { fontSize: 13 },
  subChipText: { fontSize: 12, fontWeight: '600', color: '#5C3020' },
  subChipTextSelected: { color: '#4C1D95' },

  customChipWrap: { flexDirection: 'row', alignItems: 'center' },
  customDelete: { marginLeft: -4, paddingHorizontal: 6, paddingVertical: 5 },
  customDeleteText: { fontSize: 10, color: '#9CA3AF' },

  addPainBox: { marginTop: 10, gap: 8 },
  addPainInput: {
    borderWidth: 1.5, borderColor: '#8B5CF6', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#2D1A0E', backgroundColor: 'white',
  },
  addPainBtn: {
    backgroundColor: '#8B5CF6', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  addPainBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },

  noteInput: {
    marginTop: 10, borderWidth: 1.5, borderColor: '#E9D5FF',
    borderRadius: 10, padding: 10, fontSize: 14, color: '#2D1A0E',
    backgroundColor: 'white', minHeight: 52,
  },

  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#C09070',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 20, marginBottom: 8,
  },

  sleepHint: {
    fontSize: 12, color: '#C09070', fontStyle: 'italic',
    lineHeight: 17, marginBottom: 10, marginTop: 2,
  },
  sleepRow: { flexDirection: 'row', gap: 10 },
  sleepBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#C4B5FD', backgroundColor: 'white',
  },
  sleepBtnSelected: { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' },
  sleepIcon: { fontSize: 24 },
  sleepLabel: { fontSize: 12, fontWeight: '600', color: '#1E40AF', marginTop: 2 },
  sleepLabelSelected: { color: '#1D4ED8' },

  dayRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  dayBtn: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#E9D5FF', backgroundColor: '#F5F0FF',
  },
  dayBtnSelected: { backgroundColor: '#EDE9FE', borderColor: '#8B5CF6' },
  dayBtnText: { fontSize: 13, fontWeight: '600', color: '#5C3020' },
  dayBtnTextSelected: { color: '#6D28D9' },

  saveBtn: {
    marginTop: 20, backgroundColor: '#8B5CF6',
    borderRadius: 16, paddingVertical: 14, alignItems: 'center',
  },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },
  cancelBtn: { marginTop: 10, alignItems: 'center', paddingVertical: 10 },
  cancelText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
});
