import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard, TextInput,
} from 'react-native';
import { useHydrationStore } from '@/store/hydrationStore';

const PRESETS: { label: string; icon: string; ml: number }[] = [
  { label: 'Verre',     icon: '🥛', ml: 200  },
  { label: 'Grand',     icon: '🧃', ml: 350  },
  { label: '½ litre',   icon: '💧', ml: 500  },
  { label: 'Bouteille', icon: '🍶', ml: 750  },
];

interface HydrationSheetProps {
  primaryColor: string;
}

export function HydrationSheet({ primaryColor }: HydrationSheetProps) {
  const { isSheetOpen, todayTotalMl, logWater, closeSheet } = useHydrationStore();
  const [custom, setCustom] = useState('');

  if (!isSheetOpen) return null;

  function handleCustom() {
    const n = parseInt(custom, 10);
    if (!isNaN(n) && n > 0) {
      logWater(n);
      setCustom('');
    }
  }

  const liters = (todayTotalMl / 1000).toFixed(1);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={closeSheet}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>💧 Hydratation</Text>
            {todayTotalMl > 0 && (
              <Text style={styles.total}>{liters} L aujourd'hui</Text>
            )}
          </View>

          <Text style={styles.sectionLabel}>Qu'est-ce que tu bois ?</Text>
          <View style={styles.grid}>
            {PRESETS.map(p => (
              <TouchableOpacity
                key={p.ml}
                style={styles.presetBtn}
                onPress={() => { logWater(p.ml); setCustom(''); }}
                activeOpacity={0.8}
              >
                <Text style={styles.presetIcon}>{p.icon}</Text>
                <Text style={styles.presetLabel}>{p.label}</Text>
                <Text style={styles.presetMl}>{p.ml} ml</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.customRow}>
            <TextInput
              style={styles.customInput}
              value={custom}
              onChangeText={setCustom}
              placeholder="Autre (ml)"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={4}
              returnKeyType="done"
              onSubmitEditing={handleCustom}
            />
            <TouchableOpacity
              onPress={handleCustom}
              style={[styles.customBtn, { backgroundColor: primaryColor }]}
              disabled={!custom || isNaN(parseInt(custom, 10))}
            >
              <Text style={styles.customBtnText}>+ Ajouter</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={closeSheet} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: '#F0F9FF',
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
    width: 36, height: 4,
    backgroundColor: '#BAE6FD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#0C4A6E' },
  total: {
    fontSize: 13, fontWeight: '700',
    backgroundColor: '#DBEAFE', color: '#1D4ED8',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#0369A1',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  grid: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  presetBtn: {
    flex: 1, minWidth: 70,
    alignItems: 'center', paddingVertical: 12,
    backgroundColor: 'white', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#BAE6FD', gap: 2,
  },
  presetIcon: { fontSize: 24 },
  presetLabel: { fontSize: 11, fontWeight: '600', color: '#0369A1' },
  presetMl: { fontSize: 10, color: '#7DD3FC' },
  customRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  customInput: {
    flex: 1, borderWidth: 1.5, borderColor: '#BAE6FD', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 14,
    color: '#0C4A6E', backgroundColor: 'white',
  },
  customBtn: {
    borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center',
  },
  customBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  cancelBtn: { alignItems: 'center', padding: 8 },
  cancelText: { fontSize: 13, color: '#9CA3AF' },
});
