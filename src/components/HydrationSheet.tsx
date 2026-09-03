import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard, TextInput, ScrollView,
} from 'react-native';
import { useHydrationStore } from '@/store/hydrationStore';
import { useSettingsStore } from '@/store/settingsStore';

// Objectifs journaliers OMS selon genre (ml)
const DAILY_GOAL_ML: Record<string, number> = {
  female: 2000,
  male:   2500,
  other:  2200,
  null:   2200,
};

const PRESETS: { label: string; icon: string; ml: number }[] = [
  { label: 'Petit verre', icon: '🥛', ml: 150 },
  { label: 'Verre',       icon: '💧', ml: 250 },
  { label: 'Grand verre', icon: '🧃', ml: 400 },
  { label: '½ bouteille', icon: '🍶', ml: 500 },
  { label: 'Bouteille',   icon: '💦', ml: 750 },
];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatMl(ml: number): string {
  return ml >= 1000 ? `${(ml / 1000).toFixed(1)} L` : `${ml} ml`;
}

interface HydrationSheetProps {
  primaryColor: string;
}

export function HydrationSheet({ primaryColor }: HydrationSheetProps) {
  const { isSheetOpen, todayLogs, todayTotalMl, logWater, deleteLog, closeSheet } = useHydrationStore();
  const { settings } = useSettingsStore();
  const [custom, setCustom] = useState('');

  if (!isSheetOpen) return null;

  const gender = settings?.gender ?? null;
  const goalMl = DAILY_GOAL_ML[gender ?? 'null'] ?? 2200;
  const progress = Math.min(todayTotalMl / goalMl, 1);
  const goalReached = todayTotalMl >= goalMl;

  function handleCustom() {
    const n = parseInt(custom, 10);
    if (!isNaN(n) && n > 0) {
      logWater(n);
      setCustom('');
      Keyboard.dismiss();
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={closeSheet}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
            {/* En-tête + progression */}
            <View style={styles.header}>
              <Text style={styles.title}>💧 Hydratation</Text>
              <Text style={[styles.totalBadge, goalReached && styles.totalBadgeDone]}>
                {goalReached ? '✓ ' : ''}{formatMl(todayTotalMl)} / {formatMl(goalMl)}
              </Text>
            </View>

            {/* Barre de progression */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any, backgroundColor: goalReached ? '#16A34A' : '#0EA5E9' }]} />
            </View>
            <Text style={styles.progressLabel}>
              {goalReached
                ? `Objectif atteint ! (${formatMl(goalMl)} recommandés)`
                : `Encore ${formatMl(goalMl - todayTotalMl)} pour atteindre l'objectif`}
            </Text>

            {/* Boutons rapides */}
            <Text style={styles.sectionLabel}>Ajouter une prise</Text>
            <View style={styles.grid}>
              {PRESETS.map(p => (
                <TouchableOpacity
                  key={p.ml}
                  style={styles.presetBtn}
                  onPress={() => logWater(p.ml)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.presetIcon}>{p.icon}</Text>
                  <Text style={styles.presetLabel}>{p.label}</Text>
                  <Text style={styles.presetMl}>{p.ml} ml</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Champ personnalisé */}
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                value={custom}
                onChangeText={setCustom}
                placeholder="Autre quantité (ml)"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={4}
                returnKeyType="done"
                onSubmitEditing={handleCustom}
              />
              <TouchableOpacity
                onPress={handleCustom}
                style={[styles.customBtn, { backgroundColor: primaryColor, opacity: (!custom || isNaN(parseInt(custom, 10))) ? 0.4 : 1 }]}
                disabled={!custom || isNaN(parseInt(custom, 10))}
              >
                <Text style={styles.customBtnText}>+ Ajouter</Text>
              </TouchableOpacity>
            </View>

            {/* Liste des prises du jour */}
            {todayLogs.length > 0 && (
              <View style={styles.logSection}>
                <Text style={styles.sectionLabel}>Aujourd'hui</Text>
                {[...todayLogs].reverse().map(log => (
                  <TouchableOpacity
                    key={log.id}
                    style={styles.logEntry}
                    onLongPress={() => deleteLog(log.id)}
                    delayLongPress={600}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.logTime}>{formatTime(log.recorded_at)}</Text>
                    <Text style={styles.logMl}>{log.amount_ml} ml</Text>
                    <Text style={styles.logHint}>Maintenir pour supprimer</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity onPress={closeSheet} style={styles.closeBtn}>
              <Text style={styles.closeText}>Fermer</Text>
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
    backgroundColor: '#F0F9FF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '85%',
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
    justifyContent: 'space-between', marginBottom: 10,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#0C4A6E' },
  totalBadge: {
    fontSize: 13, fontWeight: '700',
    backgroundColor: '#DBEAFE', color: '#1D4ED8',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  totalBadgeDone: { backgroundColor: '#DCFCE7', color: '#166534' },
  progressBar: {
    height: 8, backgroundColor: '#E0F2FE', borderRadius: 4,
    overflow: 'hidden', marginBottom: 6,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabel: { fontSize: 11, color: '#0369A1', marginBottom: 16 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#0369A1',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },
  grid: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  presetBtn: {
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8,
    backgroundColor: 'white', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#BAE6FD',
    minWidth: 64, flex: 1,
  },
  presetIcon: { fontSize: 20, marginBottom: 2 },
  presetLabel: { fontSize: 10, fontWeight: '600', color: '#0369A1', textAlign: 'center' },
  presetMl: { fontSize: 9, color: '#7DD3FC', marginTop: 1 },
  customRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  customInput: {
    flex: 1, borderWidth: 1.5, borderColor: '#BAE6FD', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 14,
    color: '#0C4A6E', backgroundColor: 'white',
  },
  customBtn: {
    borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center',
  },
  customBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  logSection: { marginBottom: 12 },
  logEntry: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#BAE6FD',
  },
  logTime: { fontSize: 12, color: '#0369A1', width: 48 },
  logMl: { fontSize: 13, fontWeight: '700', color: '#0C4A6E', flex: 1 },
  logHint: { fontSize: 10, color: '#BAE6FD', fontStyle: 'italic' },
  closeBtn: { alignItems: 'center', paddingVertical: 12 },
  closeText: { fontSize: 14, fontWeight: '600', color: '#0369A1' },
});
