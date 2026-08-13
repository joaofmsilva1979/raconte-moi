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
import { useActivityStore } from '@/store/activityStore';
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

  useEffect(() => {
    loadSettings();
    loadTodayTotal();
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
      {/* Top: greeting + meal badge + tendances */}
      <View style={styles.topSection}>
        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>
            {greeting} {settings.first_name} ☀️
          </Text>
          <TouchableOpacity
            testID="trends-btn"
            onPress={() => router.push('/trends')}
            style={styles.trendsBtn}
          >
            <Text style={styles.trendsBtnText}>📈</Text>
          </TouchableOpacity>
        </View>
        <MealBadge
          mealType={mealType}
          time={recordedAt ?? new Date()}
          onPress={() => router.push('/meal-picker')}
          primaryColor={primary}
        />
      </View>

      {/* Center: mic + hint + live transcript */}
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
          <Text style={styles.processingText}>Reformulation…</Text>
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

      {/* Bottom: action buttons + activity summary */}
      <View style={styles.bottomSection}>
        {todayTotalMinutes > 0 && (
          <Text style={[styles.activitySummary, todayTotalMinutes >= DAILY_GOAL_MINUTES && styles.activitySummaryDone]}>
            {todayTotalMinutes >= DAILY_GOAL_MINUTES
              ? `✓ Objectif atteint · ${todayTotalMinutes}min aujourd'hui`
              : `⏱ ${todayTotalMinutes}min · objectif ${DAILY_GOAL_MINUTES}min`}
          </Text>
        )}
        <View style={styles.actionRow}>
          <TouchableOpacity
            testID="add-ressenti-btn"
            onPress={openRessentisSheet}
            style={[styles.primaryBtn, { backgroundColor: '#7C3AED' }]}
            activeOpacity={0.82}
          >
            <Text style={styles.primaryBtnText}>💜 Ressenti</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="add-activity-btn"
            onPress={openActivitySheet}
            style={styles.secondaryBtn}
            activeOpacity={0.82}
          >
            <Text style={styles.secondaryBtnText}>🏃</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Journal opener — absolute bottom */}
      <TouchableOpacity
        testID="open-journal-btn"
        onPress={openSheet}
        style={[styles.journalOpener, { borderColor: primary }]}
      >
        <Text style={[styles.journalOpenerText, { color: primary }]}>📖 Mon journal du jour</Text>
      </TouchableOpacity>

      <RessentisSheet primaryColor={primary} />
      <ActivitySheet primaryColor={primary} />
      <JournalSheet primaryColor={primary} onAddEntry={closeSheet} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 8,
    gap: 12,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1C0A00',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  trendsBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F0FF',
    alignItems: 'center', justifyContent: 'center',
  },
  trendsBtnText: { fontSize: 16 },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: 72,
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
    borderRadius: 10,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#F0D0B8',
    width: '100%',
  },
  processingText: {
    fontSize: 13,
    color: '#9070C0',
    fontStyle: 'italic',
  },
  hint: {
    fontSize: 16,
    color: '#2D1A0E',
    fontWeight: '600',
    textAlign: 'center',
  },
  journalOpener: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.7)',
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
  primaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    color: 'white',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  secondaryBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#F0FFF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 20,
  },
  activitySummary: {
    fontSize: 12,
    color: '#854D0E',
    fontWeight: '600',
    marginBottom: 10,
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
  },
  activitySummaryDone: {
    color: '#166534',
    backgroundColor: '#DCFCE7',
  },
});
