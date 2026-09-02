import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard, ScrollView, Alert,
} from 'react-native';
import { useMedicationStore } from '@/store/medicationStore';
import { MealType, MedicationTiming } from '@/types';

interface Props { primaryColor: string }

const TIMINGS: { id: MedicationTiming; label: string }[] = [
  { id: 'before', label: 'Avant le repas' },
  { id: 'during', label: 'Pendant' },
  { id: 'after',  label: 'Après le repas' },
];

const MEAL_OPTS: { id: MealType; icon: string; label: string }[] = [
  { id: 'breakfast', icon: '☀️', label: 'Petit-déj' },
  { id: 'lunch',     icon: '🌞', label: 'Déjeuner' },
  { id: 'snack',     icon: '🌤', label: 'Collation' },
  { id: 'dinner',    icon: '🌙', label: 'Dîner' },
];

const EFFICACY_OPTS: { val: 1 | 2 | 3; icon: string; label: string }[] = [
  { val: 1, icon: '😞', label: 'Nul' },
  { val: 2, icon: '😐', label: 'Limité' },
  { val: 3, icon: '😊', label: 'Efficace' },
];

export function MedicationSheet({ primaryColor }: Props) {
  const {
    isSheetOpen, medications, selectedMedicationId, timing, mealType,
    efficacy, note, closeSheet, selectMedication, setTiming, setMealType,
    setEfficacy, setNote, saveMedicationLog, addNewMedication,
  } = useMedicationStore();

  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addError, setAddError] = useState(false);

  if (!isSheetOpen) return null;

  const canSave = selectedMedicationId !== null && timing !== null;

  async function handleAdd() {
    const name = newMedName.trim();
    if (!name) { setAddError(true); return; }
    setAddError(false);
    await addNewMedication(name, newMedDosage.trim() || undefined);
    setNewMedName('');
    setNewMedDosage('');
    setShowAdd(false);
  }

  async function handleSave() {
    if (!canSave) return;
    try {
      await saveMedicationLog();
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Impossible d\'enregistrer.');
    }
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

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>💊 Médicament</Text>

            {/* Medication picker */}
            <Text style={styles.label}>Médicament pris</Text>
            {medications.length === 0 && !showAdd && (
              <Text style={styles.emptyHint}>Aucun médicament enregistré — ajoute-en un ci-dessous.</Text>
            )}
            <View style={styles.chipRow}>
              {medications.map(med => {
                const sel = selectedMedicationId === med.id;
                return (
                  <TouchableOpacity
                    key={med.id}
                    onPress={() => selectMedication(sel ? null : med.id)}
                    style={[styles.chip, sel && { backgroundColor: primaryColor, borderColor: primaryColor }]}
                  >
                    <Text style={[styles.chipText, sel && styles.chipTextSel]}>
                      {med.name}{med.dosage ? ` · ${med.dosage}` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => setShowAdd(!showAdd)}
                style={[styles.chip, { borderStyle: 'dashed' }]}
              >
                <Text style={[styles.chipText, { color: primaryColor }]}>+ Ajouter</Text>
              </TouchableOpacity>
            </View>

            {showAdd && (
              <View style={styles.addBox}>
                <TextInput
                  style={[styles.input, { borderColor: addError ? '#DC2626' : primaryColor }]}
                  placeholder="Nom du médicament"
                  placeholderTextColor="#C09070"
                  value={newMedName}
                  onChangeText={v => { setNewMedName(v); if (v.trim()) setAddError(false); }}
                />
                {addError && <Text style={styles.fieldError}>Le nom est obligatoire.</Text>}
                <TextInput
                  style={[styles.input, { borderColor: primaryColor }]}
                  placeholder="Dosage (optionnel)"
                  placeholderTextColor="#C09070"
                  value={newMedDosage}
                  onChangeText={setNewMedDosage}
                />
                <TouchableOpacity
                  onPress={handleAdd}
                  style={[styles.addBtn, { backgroundColor: primaryColor }]}
                >
                  <Text style={styles.addBtnText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Timing */}
            <Text style={styles.label}>Moment de prise</Text>
            <View style={styles.chipRow}>
              {TIMINGS.map(t => {
                const sel = timing === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setTiming(sel ? null : t.id)}
                    style={[styles.chip, sel && { backgroundColor: primaryColor, borderColor: primaryColor }]}
                  >
                    <Text style={[styles.chipText, sel && styles.chipTextSel]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Meal type */}
            <Text style={styles.label}>Repas associé (optionnel)</Text>
            <View style={styles.chipRow}>
              {MEAL_OPTS.map(m => {
                const sel = mealType === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => setMealType(sel ? null : m.id)}
                    style={[styles.chip, sel && { backgroundColor: primaryColor, borderColor: primaryColor }]}
                  >
                    <Text style={[styles.chipText, sel && styles.chipTextSel]}>{m.icon} {m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Efficacy */}
            <Text style={styles.label}>Effet ressenti (optionnel)</Text>
            <View style={styles.chipRow}>
              {EFFICACY_OPTS.map(e => {
                const sel = efficacy === e.val;
                return (
                  <TouchableOpacity
                    key={e.val}
                    onPress={() => setEfficacy(sel ? null : e.val)}
                    style={[styles.chip, styles.chipLarge, sel && { backgroundColor: primaryColor, borderColor: primaryColor }]}
                  >
                    <Text style={styles.efficacyIcon}>{e.icon}</Text>
                    <Text style={[styles.chipText, sel && styles.chipTextSel]}>{e.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Note */}
            <Text style={styles.label}>Note (optionnel)</Text>
            <TextInput
              style={[styles.noteInput, { borderColor: primaryColor }]}
              placeholder="Ex: avec un verre d'eau…"
              placeholderTextColor="#C09070"
              value={note}
              onChangeText={setNote}
              multiline
            />

            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: canSave ? primaryColor : '#D1B8A8', opacity: canSave ? 1 : 0.6 }]}
              disabled={!canSave}
            >
              <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>Enregistrer</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={closeSheet} style={styles.cancelBtn}>
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
    backgroundColor: '#FFF8F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#D1C4B8',
    alignSelf: 'center',
    marginTop: 12, marginBottom: 4,
  },
  title: {
    fontSize: 20, fontWeight: '800', color: '#1C0A00',
    letterSpacing: -0.5, marginBottom: 20, marginTop: 8,
  },
  label: {
    fontSize: 12, fontWeight: '700', color: '#C09070',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 8, marginTop: 16,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1.5, borderColor: '#E8D0B8', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: 'white',
  },
  chipLarge: { alignItems: 'center', minWidth: 80 },
  chipText: { fontSize: 13, fontWeight: '600', color: '#5C3020' },
  chipTextSel: { color: 'white' },
  efficacyIcon: { fontSize: 22, marginBottom: 2 },
  emptyHint: {
    fontSize: 13, color: '#C09070', fontStyle: 'italic',
    marginBottom: 10, lineHeight: 18,
  },
  fieldError: {
    fontSize: 12, color: '#DC2626', marginTop: -4,
  },
  addBox: { marginTop: 12, gap: 8 },
  input: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#2D1A0E', backgroundColor: 'white',
  },
  addBtn: {
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  addBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  noteInput: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#2D1A0E', backgroundColor: 'white',
    minHeight: 72, textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: 24, borderRadius: 16, paddingVertical: 14, alignItems: 'center',
  },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },
  saveBtnTextDisabled: { color: '#5C3020' },
  cancelBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  cancelText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
});
