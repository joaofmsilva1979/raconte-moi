import Voice from '@react-native-voice/voice';

export function startListening(
  onPartialResult: (text: string) => void,
  onError: (err: Error) => void
): void {
  Voice.onSpeechPartialResults = (e) => {
    onPartialResult(e.value?.[0] ?? '');
  };
  Voice.onSpeechResults = (e) => {
    onPartialResult(e.value?.[0] ?? '');
  };
  Voice.onSpeechError = (e) => {
    onError(new Error(e.error?.message ?? 'Transcription error'));
  };
  Voice.start('fr-FR');
}

export async function stopListening(): Promise<void> {
  await Voice.stop();
}

export async function destroyListener(): Promise<void> {
  await Voice.destroy();
}
