import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';
import { useColorTheme } from '@/hooks/useColorTheme';
import { useRecordingStore } from '@/store/recordingStore';
import { MicButton } from '@/components/MicButton';
import { WaveformView } from '@/components/WaveformView';
import { MealBadge } from '@/components/MealBadge';

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

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (phase === 'confirming') {
      router.push('/confirm');
    }
  }, [phase]);

  if (!settings?.onboarding_done) {
    return <Redirect href="/onboarding" />;
  }

  const isRecording = phase === 'recording';
  const isProcessing = phase === 'processing';
  const hour = new Date().getHours();
  const greeting = hour < 18 ? 'Bonjour' : 'Bonsoir';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background }]}>
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
        {isRecording ? 'Relâche pour terminer' : 'Appuie et parle'}
      </Text>
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
    alignSelf: 'flex-start',
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
});
