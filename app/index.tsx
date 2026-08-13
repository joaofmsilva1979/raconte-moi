import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, PanResponder } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';
import { useColorTheme } from '@/hooks/useColorTheme';
import { useRecordingStore } from '@/store/recordingStore';
import { useJournalStore } from '@/store/journalStore';
import { useRessentisStore } from '@/store/ressentisStore';
import { MicButton } from '@/components/MicButton';
import { WaveformView } from '@/components/WaveformView';
import { MealBadge } from '@/components/MealBadge';
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
    mealType,
    recordedAt,
    startRecording,
    stopRecording,
  } = useRecordingStore();
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
        <View style={{ width: 80 }} />
        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.greetingName}>{settings.first_name} ☀️</Text>
        </View>
        <View style={styles.topBtns}>
          <TouchableOpacity
            onPress={() => router.push('/pro-notes')}
            style={styles.topIconBtn}
          >
            <Text style={styles.topIconText}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="trends-btn"
            onPress={() => router.push('/trends')}
            style={styles.topIconBtn}
          >
            <Text style={styles.topIconText}>📈</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Meal badge — compact, centered */}
      <View style={styles.mealRow}>
        <MealBadge
          mealType={mealType}
          time={recordedAt ?? new Date()}
          onPress={() => router.push('/meal-picker')}
          primaryColor={primary}
        />
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

        <MicButton
          primaryColor={primary}
          isRecording={isRecording}
          onPressIn={startRecording}
          onPressOut={() => stopRecording(partialTranscript)}
        />

        <Text style={styles.hint}>
          {isRecording ? 'Relâche pour terminer' : 'Maintiens appuyé et parle'}
        </Text>
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
            style={[styles.actionBtn, { backgroundColor: '#7C3AED' }]}
            activeOpacity={0.82}
          >
            <Text style={styles.actionBtnText}>💜 Ressentis</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="add-activity-btn"
            onPress={openActivitySheet}
            style={[styles.actionBtn, { backgroundColor: '#16A34A' }]}
            activeOpacity={0.82}
          >
            <Text style={styles.actionBtnText}>🏃 Activités</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            testID="add-medication-btn"
            onPress={openMedicationSheet}
            style={[styles.actionBtn, { backgroundColor: '#0369A1' }]}
            activeOpacity={0.82}
          >
            <Text style={styles.actionBtnText}>💊 Médicaments</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="add-comfort-aid-btn"
            onPress={openComfortAidSheet}
            style={[styles.actionBtn, { backgroundColor: '#0EA5E9' }]}
            activeOpacity={0.82}
          >
            <Text style={styles.actionBtnText}>🩹 Accessoires</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          testID="open-journal-btn"
          onPress={openSheet}
          style={[styles.journalOpener, { borderColor: primary + '60' }]}
        >
          <Text style={[styles.journalOpenerText, { color: primary }]}>📖 Mon journal du jour</Text>
        </TouchableOpacity>
      </View>

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
    alignItems: 'center',
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
  topBtns: { flexDirection: 'row', gap: 8, marginTop: 4 },
  topIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F0FF',
    alignItems: 'center', justifyContent: 'center',
  },
  topIconText: { fontSize: 16 },
  mealRow: {
    alignItems: 'center',
    marginTop: 10,
  },
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
  hint: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  journalOpener: {
    paddingVertical: 11,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
  },
  journalOpenerText: {
    fontSize: 14,
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
  },
  actionBtnText: {
    fontSize: 15,
    color: 'white',
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
});
