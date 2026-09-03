import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { useActivityStore } from '@/store/activityStore';
import { ACTIVITY_TYPES, DURATION_PRESETS, DAILY_GOAL_MINUTES } from '@/constants/activities';

interface ActivitySheetProps {
  primaryColor: string;
}

function isoToHHMM(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function hhmmToISO(hhmm: string, baseISO: string): string | null {
  const parts = hhmm.split(':');
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  const d = new Date(baseISO);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export function ActivitySheet({ primaryColor }: ActivitySheetProps) {
  const {
    isSheetOpen, selectedType, durationMinutes, note, recordedAt, todayTotalMinutes,
    customActivities,
    closeSheet, selectType, setDuration, setNote, setRecordedAt, saveActivity,
    addNewCustomActivity,
  } = useActivityStore();

  const [customDuration, setCustomDuration] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [newActivityName, setNewActivityName] = useState('');
  const [showAddActivity, setShowAddActivity] = useState(false);

  if (!isSheetOpen) return null;

  const goalMet = todayTotalMinutes >= DAILY_GOAL_MINUTES;
  const canSave = selectedType !== null && durationMinutes !== null && durationMinutes > 0;

  const displayTime = timeInput || isoToHHMM(recordedAt);

  function handleTimeChange(text: string) {
    setTimeInput(text);
    const iso = hhmmToISO(text, recordedAt);
    if (iso) setRecordedAt(iso);
  }

  function handleCustomDuration(text: string) {
    setCustomDuration(text);
    const n = parseInt(text, 10);
    if (!isNaN(n) && n > 0) setDuration(n);
    else setDuration(null);
  }

  function handlePreset(min: number) {
    setDuration(min);
    setCustomDuration('');
    Keyboard.dismiss();
  }

  async function handleAddActivity() {
    const name = newActivityName.trim();
    if (!name) return;
    await addNewCustomActivity(name);
    setNewActivityName('');
    setShowAddActivity(false);
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

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Activité physique</Text>
              {todayTotalMinutes > 0 && (
                <Text style={[styles.todayBadge, goalMet && styles.todayBadgeDone]}>
                  {goalMet ? '✓' : '⏱'} {todayTotalMinutes}min aujourd'hui
                </Text>
              )}
            </View>

            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>🕐 Heure</Text>
              <TextInput
                style={styles.timeInput}
                value={displayTime}
                onChangeText={handleTimeChange}
                keyboardType="numbers-and-punctuation"
                placeholder="HH:MM"
                placeholderTextColor="#9CA3AF"
                maxLength={5}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                blurOnSubmit
              />
            </View>

            <Text style={styles.sectionLabel}>Quelle activité ?</Text>
            <ScrollView
              contentContainerStyle={styles.typesGrid}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {ACTIVITY_TYPES.map((item) => {
                const sel = selectedType === item.type;
                return (
                  <TouchableOpacity
                    key={item.type}
                    onPress={() => selectType(item.type)}
                    style={[styles.typeBtn, sel && styles.typeBtnSelected]}
                  >
                    <Text style={styles.typeIcon}>{item.icon}</Text>
                    <Text style={[styles.typeLabel, sel && styles.typeLabelSelected]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Activités custom */}
            {(customActivities.length > 0 || showAddActivity) && (
              <View style={styles.customRow}>
                {customActivities.map(a => {
                  const typeKey = `custom:${a.id}:${a.name}`;
                  const sel = selectedType === typeKey;
                  return (
                    <TouchableOpacity
                      key={a.id}
                      onPress={() => selectType(typeKey)}
                      style={[styles.typeBtn, sel && styles.typeBtnSelected, styles.typeBtnCustom]}
                    >
                      <Text style={styles.typeIcon}>⭐</Text>
                      <Text style={[styles.typeLabel, sel && styles.typeLabelSelected]}>{a.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {showAddActivity && (
              <View style={styles.addActivityBox}>
                <TextInput
                  style={styles.addActivityInput}
                  placeholder="Ex: tir à l'arc, aquagym…"
                  placeholderTextColor="#9CA3AF"
                  value={newActivityName}
                  onChangeText={setNewActivityName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleAddActivity}
                />
                <TouchableOpacity
                  onPress={handleAddActivity}
                  style={[styles.addActivityBtn, { backgroundColor: '#16A34A' }]}
                >
                  <Text style={styles.addActivityBtnText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setShowAddActivity(!showAddActivity)}
              style={styles.addActivityTrigger}
            >
              <Text style={styles.addActivityTriggerText}>
                {showAddActivity ? '✕ Annuler' : '+ Ajouter une activité'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>Durée</Text>
            <View style={styles.durationRow}>
              {DURATION_PRESETS.map((min) => {
                const sel = durationMinutes === min && !customDuration;
                return (
                  <TouchableOpacity
                    key={min}
                    onPress={() => handlePreset(min)}
                    style={[styles.durationBtn, sel && styles.durationBtnSelected]}
                  >
                    <Text style={[styles.durationText, sel && styles.durationTextSelected]}>
                      {min >= 60 ? `${min / 60}h` : `${min}min`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TextInput
                style={[styles.durationInput, customDuration ? styles.durationInputActive : null]}
                placeholder="Autre"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                value={customDuration}
                onChangeText={handleCustomDuration}
                maxLength={3}
              />
            </View>

            <TextInput
              style={styles.noteInput}
              placeholder="Note optionnelle (ex: parc du château…)"
              placeholderTextColor="#9CA3AF"
              value={note}
              onChangeText={setNote}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              blurOnSubmit
            />

            <TouchableOpacity
              onPress={saveActivity}
              disabled={!canSave}
              style={[styles.saveBtn, canSave ? styles.saveBtnActive : styles.saveBtnDisabled]}
            >
              <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
                {canSave
                  ? `✓ Enregistrer${durationMinutes ? ` · ${durationMinutes}min` : ''}`
                  : 'Choisis une activité et une durée'}
              </Text>
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
    backgroundColor: '#F0FFF4',
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
    backgroundColor: '#86EFAC',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '700', color: '#14532D' },
  todayBadge: {
    fontSize: 12, fontWeight: '700',
    backgroundColor: '#FEF9C3', color: '#854D0E',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
  },
  todayBadgeDone: { backgroundColor: '#DCFCE7', color: '#166534' },
  timeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16, backgroundColor: 'white',
    borderRadius: 12, borderWidth: 1.5, borderColor: '#BBF7D0',
    paddingHorizontal: 14, paddingVertical: 8,
  },
  timeLabel: { fontSize: 14, fontWeight: '600', color: '#166534' },
  timeInput: {
    fontSize: 16, fontWeight: '700', color: '#14532D',
    textAlign: 'right', minWidth: 60,
  },
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: '#166534',
    marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  typesGrid: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  typeBtn: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 16, borderWidth: 1.5, borderColor: '#BBF7D0',
    backgroundColor: '#F0FFF4', gap: 4, minWidth: 72,
  },
  typeBtnSelected: { backgroundColor: '#DCFCE7', borderColor: '#16A34A' },
  typeIcon: { fontSize: 22 },
  typeLabel: { fontSize: 11, fontWeight: '600', color: '#166534' },
  typeLabelSelected: { color: '#15803D' },
  customRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  typeBtnCustom: { backgroundColor: '#F0FFF4' },
  addActivityBox: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  addActivityInput: {
    flex: 1, borderWidth: 1.5, borderColor: '#BBF7D0', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7, fontSize: 13,
    color: '#166534', backgroundColor: 'white',
  },
  addActivityBtn: { borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  addActivityBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  addActivityTrigger: { marginBottom: 16 },
  addActivityTriggerText: { fontSize: 12, color: '#16A34A', fontWeight: '600' },
  durationRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  durationBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 14, borderWidth: 1.5,
    borderColor: '#BBF7D0', backgroundColor: '#F0FFF4',
  },
  durationBtnSelected: { backgroundColor: '#DCFCE7', borderColor: '#16A34A' },
  durationText: { fontSize: 13, fontWeight: '700', color: '#166534' },
  durationTextSelected: { color: '#15803D' },
  durationInput: {
    borderWidth: 1.5, borderColor: '#BBF7D0', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 7,
    fontSize: 13, fontWeight: '700', color: '#166534',
    backgroundColor: '#F0FFF4', width: 70, textAlign: 'center',
  },
  durationInputActive: { borderColor: '#16A34A', backgroundColor: '#DCFCE7' },
  noteInput: {
    borderWidth: 1.5, borderColor: '#BBF7D0', borderRadius: 10,
    padding: 10, fontSize: 13, color: '#166534',
    backgroundColor: 'white', marginBottom: 16,
  },
  saveBtn: { borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 4 },
  saveBtnActive: { backgroundColor: '#16A34A' },
  saveBtnDisabled: { backgroundColor: '#D1FAE5' },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  saveBtnTextDisabled: { color: '#166534' },
  cancelBtn: { alignItems: 'center', padding: 8 },
  cancelText: { fontSize: 13, color: '#9CA3AF' },
});
