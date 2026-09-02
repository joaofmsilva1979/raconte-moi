import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard, ScrollView, Alert,
} from 'react-native';
import { useComfortAidStore } from '@/store/comfortAidStore';
import { MealType } from '@/types';

interface Props { primaryColor: string }

type AidSlot = MealType | 'morning';

const SLOT_OPTS: { id: AidSlot; icon: string; label: string }[] = [
  { id: 'morning',   icon: '🌅', label: 'Au réveil' },
  { id: 'breakfast', icon: '☀️', label: 'Petit-déj' },
  { id: 'lunch',     icon: '🌞', label: 'Déjeuner' },
  { id: 'snack',     icon: '🌤', label: 'Collation' },
  { id: 'dinner',    icon: '🌙', label: 'Dîner' },
];

export function ComfortAidSheet({ primaryColor }: Props) {
  const {
    isSheetOpen, aids, selectedAidIds, mealType, note,
    closeSheet, toggleAid, setMealType, setNote, saveComfortAidLogs, addNewAid,
  } = useComfortAidStore();

  const [newAidName, setNewAidName] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  if (!isSheetOpen) return null;

  const canSave = selectedAidIds.length > 0;

  async function handleAdd() {
    const name = newAidName.trim();
    if (!name) return;
    await addNewAid(name);
    setNewAidName('');
    setShowAdd(false);
  }

  async function handleSave() {
    if (!canSave) return;
    try {
      await saveComfortAidLogs();
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
            <Text style={styles.title}>🩹 Accessoire aidant</Text>
            <Text style={styles.subtitle}>Qu'est-ce qui t'a aidé ?</Text>

            {/* Aid picker — multi-select */}
            <Text style={styles.label}>Accessoire(s) utilisé(s)</Text>
            <View style={styles.chipRow}>
              {aids.map(aid => {
                const sel = selectedAidIds.includes(aid.id);
                return (
                  <TouchableOpacity
                    key={aid.id}
                    onPress={() => toggleAid(aid.id)}
                    style={[styles.chip, sel && { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' }]}
                  >
                    <Text style={[styles.chipText, sel && styles.chipTextSel]}>{aid.name}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => setShowAdd(!showAdd)}
                style={[styles.chip, { borderStyle: 'dashed' }]}
              >
                <Text style={[styles.chipText, { color: '#0EA5E9' }]}>+ Ajouter</Text>
              </TouchableOpacity>
            </View>

            {aids.length === 0 && !showAdd && (
              <Text style={styles.emptyHint}>
                Bouillotte, position antalgique, massage… ajoute tes accessoires habituels.
              </Text>
            )}

            {showAdd && (
              <View style={styles.addBox}>
                <TextInput
                  style={[styles.input, { borderColor: '#0EA5E9' }]}
                  placeholder="Ex: bouillotte, position antalgique…"
                  placeholderTextColor="#C09070"
                  value={newAidName}
                  onChangeText={setNewAidName}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={handleAdd}
                  style={[styles.addBtn, { backgroundColor: '#0EA5E9' }]}
                >
                  <Text style={styles.addBtnText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Lien repas / moment */}
            <Text style={styles.label}>Moment (optionnel)</Text>
            <View style={styles.chipRow}>
              {SLOT_OPTS.map(s => {
                const sel = mealType === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => setMealType(sel ? null : s.id)}
                    style={[styles.chip, sel && { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' }]}
                  >
                    <Text style={[styles.chipText, sel && styles.chipTextSel]}>
                      {s.icon} {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Note */}
            <Text style={styles.label}>Note (optionnel)</Text>
            <TextInput
              style={[styles.noteInput, { borderColor: '#0EA5E9' }]}
              placeholder="Durée, intensité, contexte…"
              placeholderTextColor="#C09070"
              value={note}
              onChangeText={setNote}
              multiline
            />

            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.saveBtn,
                { backgroundColor: canSave ? '#0EA5E9' : '#D1B8A8', opacity: canSave ? 1 : 0.6 },
              ]}
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
    maxHeight: '85%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#D1C4B8',
    alignSelf: 'center',
    marginTop: 12, marginBottom: 4,
  },
  title: {
    fontSize: 20, fontWeight: '800', color: '#1C0A00',
    letterSpacing: -0.5, marginBottom: 4, marginTop: 8,
  },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginBottom: 16 },
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
  chipText: { fontSize: 13, fontWeight: '600', color: '#5C3020' },
  chipTextSel: { color: 'white' },
  emptyHint: {
    fontSize: 13, color: '#C09070', fontStyle: 'italic',
    marginTop: 8, lineHeight: 18,
  },
  addBox: { marginTop: 12, gap: 8 },
  input: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#2D1A0E', backgroundColor: 'white',
  },
  addBtn: { borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  addBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  noteInput: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#2D1A0E', backgroundColor: 'white',
    minHeight: 64, textAlignVertical: 'top',
  },
  saveBtn: { marginTop: 24, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },
  saveBtnTextDisabled: { color: '#075985' },
  cancelBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  cancelText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
});
