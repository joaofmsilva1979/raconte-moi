import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, PanResponder, Modal, TextInput, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';
import { useColorTheme } from '@/hooks/useColorTheme';
import { useRecordingStore } from '@/store/recordingStore';
import { useJournalStore } from '@/store/journalStore';
import { useRessentisStore } from '@/store/ressentisStore';
import { MicButton } from '@/components/MicButton';
import { WaveformView } from '@/components/WaveformView';
import { JournalSheet } from '@/components/JournalSheet';
import { RessentisSheet } from '@/components/RessentisSheet';
import { ActivitySheet } from '@/components/ActivitySheet';
import { MedicationSheet } from '@/components/MedicationSheet';
import { ComfortAidSheet } from '@/components/ComfortAidSheet';
import { useActivityStore } from '@/store/activityStore';
import { useMedicationStore } from '@/store/medicationStore';
import { useComfortAidStore } from '@/store/comfortAidStore';
import { DAILY_GOAL_MINUTES } from '@/constants/activities';

export default function HomeScreen() {
  const router = useRouter();
  const { settings, loadSettings } = useSettingsStore();
  const { primary, background } = useColorTheme();
  const {
    phase,
    partialTranscript,
    startRecording,
    stopRecording,
    startManualEntry,
    error: recordingError,
  } = useRecordingStore();
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualText, setManualText] = useState('');
  const { openSheet, closeSheet, refreshCurrentDay } = useJournalStore();
  const { openSheet: openRessentisSheet } = useRessentisStore();
  const { openSheet: openActivitySheet, todayTotalMinutes, loadTodayTotal } = useActivityStore();
  const { openSheet: openMedicationSheet, loadMedications } = useMedicationStore();
  const { openSheet: openComfortAidSheet, loadAids } = useComfortAidStore();

  useEffect(() => {
    loadSettings();
    loadTodayTotal();
    loadMedications();
    loadAids();
  }, []);

  useEffect(() => {
    if (phase === 'confirming') {
      router.push('/confirm');
    }
  }, [phase]);

  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (prevPhaseRef.current !== 'idle' && phase === 'idle') {
      refreshCurrentDay();
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dy }) => dy < -40,
      onPanResponderRelease: (_, { dy }) => {
        if (dy < -40) openSheet();
      },
    })
  ).current;

  if (!settings?.onboarding_done) {
    return <Redirect href="/onboarding" />;
  }

  const isRecording = phase === 'recording';
  const isProcessing = phase === 'processing';
  const hour = new Date().getHours();
  const greeting = hour < 18 ? 'Bonjour' : 'Bonsoir';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: background }]}
      {...panResponder.panHandlers}
    >
      {/* Top bar: trends icon */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={[styles.topIconBtn, { backgroundColor: primary + '20' }]}
            accessibilityLabel="Réglages"
            accessibilityRole="button"
          >
            <Text style={styles.topIconText}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.greetingName} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.55}>
            {settings.first_name} ☀️
          </Text>
        </View>
        <View style={styles.topBtns}>
          <TouchableOpacity
            onPress={() => router.push('/pro-notes')}
            style={[styles.topIconBtn, { backgroundColor: primary + '20' }]}
            accessibilityLabel="Notes médicales"
            accessibilityRole="button"
          >
            <Text style={styles.topIconText}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="trends-btn"
            onPress={() => router.push('/trends')}
            style={[styles.topIconBtn, { backgroundColor: primary + '20' }]}
            accessibilityLabel="Tendances"
            accessibilityRole="button"
          >
            <Text style={styles.topIconText}>📈</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Center: mic hero */}
      <View style={styles.centerSection}>
        {isRecording && (
          <View style={styles.liveArea}>
            <WaveformView isActive={isRecording} primaryColor={primary} />
            {partialTranscript ? (
              <Text style={styles.partialTranscript}>{partialTranscript}</Text>
            ) : null}
          </View>
        )}

        {isProcessing && (
          <Text style={styles.processingText}>Reformulation en cours…</Text>
        )}

        {recordingError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {recordingError}</Text>
            {recordingError.includes('Réglages') && (
              <TouchableOpacity onPress={() => Linking.openSettings()}>
                <Text style={styles.errorLink}>→ Ouvrir les Réglages</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <MicButton
          primaryColor={primary}
          isRecording={isRecording}
          onPressIn={startRecording}
          onPressOut={stopRecording}
        />

        <Text style={styles.hint}>
          {isRecording ? 'Relâche pour terminer' : 'Maintiens appuyé et parle'}
        </Text>

        {!isRecording && !isProcessing && (
          <TouchableOpacity onPress={() => { setManualText(''); setShowManualModal(true); }} accessibilityLabel="Saisir manuellement">
            <Text style={[styles.manualLink, { color: primary }]}>✏️ Écrire à la place</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom: pills + activity chip + journal */}
      <View style={styles.bottomSection}>
        {todayTotalMinutes > 0 && (
          <Text style={[styles.activitySummary, todayTotalMinutes >= DAILY_GOAL_MINUTES && styles.activitySummaryDone]}>
            {todayTotalMinutes >= DAILY_GOAL_MINUTES
              ? `✓ Objectif atteint · ${todayTotalMinutes} min`
              : `⏱ ${todayTotalMinutes} min · objectif ${DAILY_GOAL_MINUTES} min`}
          </Text>
        )}
        <View style={styles.actionRow}>
          <TouchableOpacity
            testID="add-ressenti-btn"
            onPress={openRessentisSheet}
            style={[styles.actionBtn, styles.actionBtnRessentis]}
            activeOpacity={0.82}
            accessibilityLabel="Ajouter un ressenti"
            accessibilityRole="button"
          >
            <Text style={[styles.actionBtnText, { color: '#7C3AED' }]}>💜 Ressentis</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="add-activity-btn"
            onPress={openActivitySheet}
            style={[styles.actionBtn, styles.actionBtnActivites]}
            activeOpacity={0.82}
            accessibilityLabel="Ajouter une activité physique"
            accessibilityRole="button"
          >
            <Text style={[styles.actionBtnText, { color: '#16A34A' }]}>🏃 Activités</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            testID="add-medication-btn"
            onPress={openMedicationSheet}
            style={[styles.actionBtn, styles.actionBtnMedicaments]}
            activeOpacity={0.82}
            accessibilityLabel="Ajouter un médicament"
            accessibilityRole="button"
          >
            <Text style={[styles.actionBtnText, { color: '#0369A1' }]}>💊 Médicaments</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="add-comfort-aid-btn"
            onPress={openComfortAidSheet}
            style={[styles.actionBtn, styles.actionBtnAccessoires]}
            activeOpacity={0.82}
            accessibilityLabel="Ajouter un accessoire aidant"
            accessibilityRole="button"
          >
            <Text style={[styles.actionBtnText, { color: '#0284C7' }]}>🩹 Accessoires</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          testID="open-journal-btn"
          onPress={openSheet}
          style={[styles.journalOpener, { borderColor: primary + '40' }]}
          accessibilityLabel="Ouvrir mon journal du jour"
          accessibilityRole="button"
        >
          <Text style={[styles.journalOpenerText, { color: primary }]}>📖 Mon journal du jour</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showManualModal} transparent animationType="fade" onRequestClose={() => setShowManualModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Décris ton repas</Text>
            <Text style={styles.modalSubtitle}>Ce que tu as mangé, bu, ressenti — tu pourras ajouter une 📷 photo juste après.</Text>
            <TextInput
              style={styles.modalInput}
              value={manualText}
              onChangeText={setManualText}
              placeholder="Ex : soupe de légumes, une douleur après…"
              placeholderTextColor="#C09070"
              multiline
              autoFocus
            />
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: primary }]}
              onPress={() => {
                if (!manualText.trim()) return;
                setShowManualModal(false);
                startManualEntry(manualText.trim());
              }}
            >
              <Text style={styles.modalBtnText}>Continuer →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowManualModal(false)} style={styles.modalCancel}>
              <Text style={[styles.modalCancelText, { color: primary }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <RessentisSheet primaryColor={primary} />
      <ActivitySheet primaryColor={primary} />
      <MedicationSheet primaryColor={primary} />
      <ComfortAidSheet primaryColor={primary} />
      <JournalSheet primaryColor={primary} onAddEntry={closeSheet} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingHorizontal: 24,
  },
  greetingBlock: {
    flex: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
  greeting: {
    fontSize: 17,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.1,
  },
  greetingName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1C0A00',
    letterSpacing: -1,
    marginTop: -4,
  },
  topLeft: { width: 80, alignItems: 'flex-start' },
  topBtns: { flexDirection: 'row', gap: 8, marginTop: 4, width: 80, justifyContent: 'flex-end' },
  topIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  topIconText: { fontSize: 16 },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 10,
  },
  liveArea: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  partialTranscript: {
    fontSize: 14,
    color: '#2D1A0E',
    textAlign: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#F0D0B8',
    width: '100%',
    lineHeight: 20,
  },
  processingText: {
    fontSize: 13,
    color: '#9070C0',
    fontStyle: 'italic',
    letterSpacing: 0.1,
  },
  errorBox: {
    alignItems: 'center',
    width: '100%',
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    width: '100%',
  },
  errorLink: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  hint: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  journalOpener: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    shadowColor: '#2D1A0E',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  journalOpenerText: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 22,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionBtnRessentis: { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' },
  actionBtnActivites: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  actionBtnMedicaments: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  actionBtnAccessoires: { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  activitySummary: {
    fontSize: 12,
    color: '#854D0E',
    fontWeight: '600',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'center',
  },
  activitySummaryDone: {
    color: '#166534',
    backgroundColor: '#DCFCE7',
  },
  manualLink: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFF8F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 14,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D1A0E',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#F0D0B8',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#2D1A0E',
    minHeight: 90,
    backgroundColor: 'white',
    textAlignVertical: 'top',
  },
  modalBtn: {
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  modalBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  modalCancel: {
    alignItems: 'center',
    padding: 4,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
