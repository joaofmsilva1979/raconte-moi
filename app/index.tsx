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

  useEffect(() => {
    loadSettings();
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
      <Text style={styles.greeting}>
        {greeting} {settings.first_name} ☀️
      </Text>

      <MealBadge
        mealType={mealType}
        time={recordedAt ?? new Date()}
        onPress={() => router.push('/meal-picker')}
        primaryColor={primary}
      />

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

      <TouchableOpacity
        testID="add-ressenti-btn"
        onPress={openRessentisSheet}
        style={styles.ressentisBtn}
      >
        <Text style={styles.ressentsBtnText}>💜 Ajouter un ressenti</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="open-journal-btn"
        onPress={openSheet}
        style={styles.journalOpener}
      >
        <Text style={[styles.journalOpenerText, { color: primary }]}>↑ Journal</Text>
      </TouchableOpacity>

      <RessentisSheet primaryColor={primary} />
      <JournalSheet primaryColor={primary} onAddEntry={closeSheet} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D1A0E',
    textAlign: 'center',
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
    fontSize: 12,
    color: '#C09070',
    fontStyle: 'italic',
  },
  journalOpener: {
    position: 'absolute',
    bottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  journalOpenerText: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.7,
  },
  ressentisBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  ressentsBtnText: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '600',
  },
});
