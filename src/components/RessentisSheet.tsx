import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRessentisStore } from '@/store/ressentisStore';
import { RESSENTI_CATEGORIES, RESSENTI_SUB_CATEGORIES } from '@/constants/ressentis';
import { DEFAULT_MEAL_SLOTS } from '@/constants/meals';

interface RessentisSheetProps {
  primaryColor: string;
}

export function RessentisSheet({ primaryColor }: RessentisSheetProps) {
  const { isSheetOpen, categories, sub_category, selected_meal, meal_day, toggleCategory, selectSubCategory, selectMeal, setMealDay, saveRessenti, closeSheet } =
    useRessentisStore();

  if (!isSheetOpen) return null;

  const painSelected = categories.includes('pain');

  return (
    <View testID="ressentis-sheet" style={styles.sheet}>
      <View style={styles.handle} />

      <Text style={styles.mealQuestion}>Suite à quel repas ?</Text>
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

      <Text style={styles.question}>Comment tu te sens ?</Text>

      <ScrollView contentContainerStyle={styles.categoriesContainer}>
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
      </ScrollView>

      {painSelected && (
        <View style={styles.subSection}>
          <Text style={styles.subQuestion}>Où as-tu mal ?</Text>
          <View style={styles.subCategories}>
            {RESSENTI_SUB_CATEGORIES.map((item) => {
              const selected = sub_category === item.sub;
              return (
                <TouchableOpacity
                  key={item.sub}
                  testID={`subcategory-btn-${item.sub}`}
                  onPress={() => selectSubCategory(item.sub)}
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
        </View>
      )}

      {categories.length > 0 && (
        <TouchableOpacity
          testID="save-ressenti-btn"
          onPress={saveRessenti}
          style={styles.saveBtn}
        >
          <Text style={styles.saveBtnText}>💜 Noter ce ressenti</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity testID="close-ressenti-btn" onPress={closeSheet} style={styles.closeBtn}>
        <Text style={styles.closeBtnText}>Annuler</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FDF8FF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#D8B4FE',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  question: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D1A0E',
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 4,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F0FF',
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryBtnSelected: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
  },
  categoryIcon: { fontSize: 18 },
  categoryLabel: { fontSize: 13, color: '#5C3020', fontWeight: '600' },
  categoryLabelSelected: { color: '#6D28D9' },
  subSection: { marginTop: 16 },
  subQuestion: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6D28D9',
    marginBottom: 8,
  },
  subCategories: { flexDirection: 'row', gap: 8 },
  subBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F0FF',
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  subBtnSelected: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
  },
  subIcon: { fontSize: 16 },
  subLabel: { fontSize: 12, color: '#5C3020', fontWeight: '600' },
  subLabelSelected: { color: '#6D28D9' },
  saveBtn: {
    marginTop: 20,
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  closeBtn: { marginTop: 10, alignItems: 'center', padding: 8 },
  closeBtnText: { fontSize: 13, color: '#9CA3AF' },
  mealQuestion: { fontSize: 13, fontWeight: '700', color: '#C09070', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  dayToggle: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  dayBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#E9D5FF', backgroundColor: '#F5F0FF',
  },
  dayBtnSelected: { backgroundColor: '#EDE9FE', borderColor: '#8B5CF6' },
  dayBtnText: { fontSize: 13, fontWeight: '600', color: '#5C3020' },
  dayBtnTextSelected: { color: '#6D28D9' },
  mealRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  mealBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#E9D5FF', backgroundColor: '#F5F0FF',
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  mealBtnSelected: { backgroundColor: '#EDE9FE', borderColor: '#8B5CF6' },
  mealIcon: { fontSize: 14 },
  mealLabel: { fontSize: 12, fontWeight: '600', color: '#5C3020' },
  mealLabelSelected: { color: '#6D28D9' },
});
