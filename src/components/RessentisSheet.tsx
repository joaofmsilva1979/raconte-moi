import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { useRessentisStore, SheetMode } from '@/store/ressentisStore';
import { RESSENTI_CATEGORIES, RESSENTI_SUB_CATEGORIES } from '@/constants/ressentis';
import { DEFAULT_MEAL_SLOTS } from '@/constants/meals';
import { SleepQuality } from '@/types';

interface RessentisSheetProps {
  primaryColor: string;
}

const SLEEP_OPTIONS: { quality: SleepQuality; icon: string; label: string }[] = [
  { quality: 1, icon: '😣', label: 'Mal' },
  { quality: 2, icon: '😐', label: 'Moyen' },
  { quality: 3, icon: '😊', label: 'Bien' },
];

const MODE_TABS: { id: SheetMode; icon: string; label: string }[] = [
  { id: 'morning', icon: '☀️', label: 'Au réveil' },
  { id: 'meal',    icon: '🍽',  label: 'Suite à un repas' },
  { id: 'feeling', icon: '💜',  label: 'Comment tu te sens ?' },
];

export function RessentisSheet({ primaryColor }: RessentisSheetProps) {
  const {
    isSheetOpen, mode, categories, sub_categories, selected_meal, meal_day,
    notes, subNote, sleepQuality, customPainLocations,
    setMode, toggleCategory, toggleSubCategory, applyCustomLocation, selectMeal,
    setMealDay, setNote, setSubNote, setSleepQuality,
    saveCustomLocation, removeCustomLocation, saveRessenti, closeSheet,
  } = useRessentisStore();

  if (!isSheetOpen) return null;

  const painSelected = categories.includes('pain');
  const otherSelected = categories.includes('other');

  const canSave = mode === 'morning'
    ? sleepQuality !== null || categories.length > 0
    : categories.length > 0;

  const showSaveCustom = sub_categories.includes('other') && subNote.trim().length > 2
    && !customPainLocations.some(l => l.label.toLowerCase() === subNote.trim().toLowerCase());

  const showMealSelector = mode === 'meal';
  const showCategories = mode === 'meal' || mode === 'feeling' || (mode === 'morning' && categories.length > 0 || mode === 'morning');

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

          {/* Mode selector tabs */}
          <View style={styles.modeTabs}>
            {MODE_TABS.map((tab) => {
              const sel = mode === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id!}
                  testID={`mode-tab-${tab.id}`}
                  onPress={() => setMode(sel ? null : tab.id)}
                  style={[styles.modeTab, sel && styles.modeTabSelected]}
                >
                  <Text style={styles.modeTabIcon}>{tab.icon}</Text>
                  <Text style={[styles.modeTabLabel, sel && styles.modeTabLabelSelected]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {mode === null && (
            <Text style={styles.hint}>Choisis un contexte pour commencer</Text>
          )}

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* AU RÉVEIL: sleep quality */}
            {mode === 'morning' && (
              <View style={styles.sleepSection}>
                <Text style={styles.sleepQuestion}>Comment as-tu dormi ?</Text>
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
                        <Text style={[styles.sleepLabel, sel && styles.sleepLabelSelected]}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* SUITE À UN REPAS: day + meal selector */}
            {showMealSelector && (
              <View style={styles.mealSection}>
                <View style={styles.dayToggle}>
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
                <View style={styles.mealRow}>
                  {DEFAULT_MEAL_SLOTS.map((slot) => {
                    const sel = selected_meal === slot.meal_type;
                    return (
                      <TouchableOpacity
                        key={slot.meal_type}
                        testID={`meal-btn-${slot.meal_type}`}
                        onPress={() => selectMeal(slot.meal_type as any)}
                        style={[styles.mealBtn, sel && styles.mealBtnSelected]}
                      >
                        <Text style={styles.mealIcon}>{slot.icon}</Text>
                        <Text style={[styles.mealLabel, sel && styles.mealLabelSelected]}>{slot.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* FEELING CATEGORIES — visible in all modes */}
            {mode !== null && (
              <View style={styles.categoriesSection}>
                {(mode === 'meal' || mode === 'feeling') && (
                  <Text style={styles.question}>Comment tu te sens ?</Text>
                )}
                {mode === 'morning' && (
                  <Text style={styles.question}>Et comment tu te sens ?</Text>
                )}
                <View style={styles.categoriesContainer}>
                  {RESSENTI_CATEGORIES.map((item) => {
                    const selected = categories.includes(item.category);
                    return (
                      <TouchableOpacity
                        key={item.category}
                        testID={`category-btn-${item.category}`}
                        onPress={() => toggleCategory(item.category)}
                        style={[styles.categoryBtn, selected && styles.categoryBtnSelected]}
                      >
                        <Text style={styles.categoryIcon}>{item.icon}</Text>
                        <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

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

                {painSelected && (
                  <View style={styles.subSection}>
                    <Text style={styles.subQuestion}>Où as-tu mal ?</Text>

                    {customPainLocations.length > 0 && (
                      <View style={styles.customLocRow}>
                        {customPainLocations.map((loc) => {
                          const sel = sub_categories.includes('other') && subNote === loc.label;
                          return (
                            <View key={loc.id} style={styles.customLocChip}>
                              <TouchableOpacity
                                onPress={() => applyCustomLocation(loc)}
                                style={[styles.customLocBtn, sel && styles.customLocBtnSelected]}
                              >
                                <Text style={[styles.customLocText, sel && styles.customLocTextSelected]}>
                                  ⭐ {loc.label}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => removeCustomLocation(loc.id)}
                                style={styles.customLocDelete}
                              >
                                <Text style={styles.customLocDeleteText}>✕</Text>
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    <View style={styles.subCategories}>
                      {RESSENTI_SUB_CATEGORIES.map((item) => {
                        const selected = sub_categories.includes(item.sub);
                        return (
                          <TouchableOpacity
                            key={item.sub}
                            testID={`subcategory-btn-${item.sub}`}
                            onPress={() => toggleSubCategory(item.sub)}
                            style={[styles.subBtn, selected && styles.subBtnSelected]}
                          >
                            <Text style={styles.subIcon}>{item.icon}</Text>
                            <Text style={[styles.subLabel, selected && styles.subLabelSelected]}>
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {sub_categories.includes('other') && (
                      <View style={styles.subNoteRow}>
                        <TextInput
                          style={[styles.noteInput, { flex: 1, marginBottom: 0 }]}
                          placeholder="Précise où tu as mal… (ex: genou)"
                          placeholderTextColor="#C09070"
                          value={subNote}
                          onChangeText={setSubNote}
                          returnKeyType="done"
                          onSubmitEditing={Keyboard.dismiss}
                          blurOnSubmit
                        />
                        {showSaveCustom && (
                          <TouchableOpacity
                            onPress={() => saveCustomLocation(subNote)}
                            style={styles.saveCustomBtn}
                          >
                            <Text style={styles.saveCustomText}>💾</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                    {showSaveCustom && (
                      <Text style={styles.saveCustomHint}>Appuie sur 💾 pour créer un raccourci</Text>
                    )}
                  </View>
                )}
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

            <TouchableOpacity testID="close-ressenti-btn" onPress={closeSheet} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Annuler</Text>
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
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 36,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 10,
    maxHeight: '90%',
  },
  handle: {
    width: 36, height: 4, backgroundColor: '#D8B4FE',
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  modeTabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modeTab: {
    flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6,
    borderRadius: 16, borderWidth: 1.5, borderColor: '#E9D5FF',
    backgroundColor: '#F5F0FF', gap: 4,
  },
  modeTabSelected: { backgroundColor: '#EDE9FE', borderColor: '#8B5CF6' },
  modeTabIcon: { fontSize: 18 },
  modeTabLabel: { fontSize: 10, fontWeight: '700', color: '#5C3020', textAlign: 'center' },
  modeTabLabelSelected: { color: '#6D28D9' },
  hint: {
    fontSize: 13, color: '#C09070', textAlign: 'center',
    fontStyle: 'italic', marginTop: 8, marginBottom: 8,
  },
  sleepSection: {
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12,
    marginBottom: 12, borderWidth: 1, borderColor: '#BFDBFE',
  },
  sleepQuestion: { fontSize: 14, fontWeight: '700', color: '#1E40AF', marginBottom: 8 },
  sleepRow: { flexDirection: 'row', gap: 10 },
  sleepBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#BFDBFE', backgroundColor: 'white',
  },
  sleepBtnSelected: { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' },
  sleepIcon: { fontSize: 24 },
  sleepLabel: { fontSize: 12, fontWeight: '600', color: '#1E40AF', marginTop: 2 },
  sleepLabelSelected: { color: '#1D4ED8' },
  mealSection: { marginBottom: 12 },
  dayToggle: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  dayBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#E9D5FF', backgroundColor: '#F5F0FF',
  },
  dayBtnSelected: { backgroundColor: '#EDE9FE', borderColor: '#8B5CF6' },
  dayBtnText: { fontSize: 13, fontWeight: '600', color: '#5C3020' },
  dayBtnTextSelected: { color: '#6D28D9' },
  mealRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mealBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#E9D5FF', backgroundColor: '#F5F0FF',
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  mealBtnSelected: { backgroundColor: '#EDE9FE', borderColor: '#8B5CF6' },
  mealIcon: { fontSize: 16 },
  mealLabel: { fontSize: 13, fontWeight: '600', color: '#5C3020' },
  mealLabelSelected: { color: '#6D28D9' },
  categoriesSection: { marginBottom: 8 },
  question: { fontSize: 15, fontWeight: '700', color: '#2D1A0E', marginBottom: 10 },
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  categoryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F5F0FF', borderWidth: 1.5, borderColor: '#E9D5FF',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
  },
  categoryBtnSelected: { backgroundColor: '#EDE9FE', borderColor: '#8B5CF6' },
  categoryIcon: { fontSize: 18 },
  categoryLabel: { fontSize: 13, color: '#5C3020', fontWeight: '600' },
  categoryLabelSelected: { color: '#6D28D9' },
  noteInput: {
    marginTop: 10, borderWidth: 1.5, borderColor: '#E9D5FF',
    borderRadius: 10, padding: 10, fontSize: 14, color: '#2D1A0E',
    backgroundColor: 'white', minHeight: 44, marginBottom: 4,
  },
  subSection: { marginTop: 12 },
  subQuestion: { fontSize: 13, fontWeight: '700', color: '#6D28D9', marginBottom: 8 },
  customLocRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  customLocChip: { flexDirection: 'row', alignItems: 'center' },
  customLocBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 14, borderWidth: 1.5, borderColor: '#C4B5FD',
    backgroundColor: '#EDE9FE',
  },
  customLocBtnSelected: { backgroundColor: '#DDD6FE', borderColor: '#7C3AED' },
  customLocText: { fontSize: 12, fontWeight: '700', color: '#5B21B6' },
  customLocTextSelected: { color: '#4C1D95' },
  customLocDelete: { marginLeft: -4, paddingHorizontal: 6, paddingVertical: 5 },
  customLocDeleteText: { fontSize: 10, color: '#9CA3AF' },
  subCategories: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  subBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F5F0FF', borderWidth: 1.5, borderColor: '#E9D5FF',
    borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6,
  },
  subBtnSelected: { backgroundColor: '#EDE9FE', borderColor: '#8B5CF6' },
  subIcon: { fontSize: 14 },
  subLabel: { fontSize: 12, color: '#5C3020', fontWeight: '600' },
  subLabelSelected: { color: '#6D28D9' },
  subNoteRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  saveCustomBtn: {
    width: 40, height: 44, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, backgroundColor: '#EDE9FE', borderWidth: 1.5, borderColor: '#8B5CF6',
  },
  saveCustomText: { fontSize: 18 },
  saveCustomHint: { fontSize: 10, color: '#9370C0', fontStyle: 'italic', marginTop: 4 },
  saveBtn: {
    marginTop: 16, backgroundColor: '#8B5CF6',
    borderRadius: 14, padding: 14, alignItems: 'center',
  },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  closeBtn: { marginTop: 10, alignItems: 'center', padding: 8 },
  closeBtnText: { fontSize: 13, color: '#9CA3AF' },
});
