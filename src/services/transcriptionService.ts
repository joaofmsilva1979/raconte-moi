import { NativeModules } from 'react-native';

// @react-native-voice/voice crée un NativeEventEmitter au chargement du module.
// En Expo Go, ce module natif n'existe pas — on ne require() jamais le package
// pour éviter le crash. Le stub ci-dessous est utilisé à la place.
const VOICE_STUB = {
  start: (_locale?: string) => Promise.resolve(),
  stop: () => {},
  destroy: () => Promise.resolve(),
  onSpeechPartialResults: null as any,
  onSpeechResults: null as any,
  onSpeechError: null as any,
};

let _Voice: typeof VOICE_STUB | null = null;
function getVoice() {
  if (!_Voice) {
    if (NativeModules.Voice) {
      // Module natif disponible (dev build ou iPhone réel)
      _Voice = require('@react-native-voice/voice').default;
    } else {
      // Expo Go : module natif absent, stub silencieux
      _Voice = VOICE_STUB;
    }
  }
  return _Voice!;
}

function permissionMessage(): string {
  return 'Accès au micro refusé. Va dans Réglages › Raconte-moi › Microphone et Reconnaissance vocale pour les activer.';
}

function isPermissionError(msg: string): boolean {
  return /not.allowed|permission|denied|authoriz|not authorized/i.test(msg);
}

export function startListening(
  onPartialResult: (text: string) => void,
  onError: (err: Error) => void
): void {
  const Voice = getVoice();
  Voice.onSpeechPartialResults = (e: any) => {
    onPartialResult(e.value?.[0] ?? '');
  };
  Voice.onSpeechResults = (e: any) => {
    onPartialResult(e.value?.[0] ?? '');
  };
  Voice.onSpeechError = (e: any) => {
    const raw = e.error?.message ?? 'Transcription error';
    onError(new Error(isPermissionError(raw) ? permissionMessage() : raw));
  };
  // Voice.start() rejette si la permission est refusée avant même que onSpeechError fire
  Voice.start('fr-FR').catch((err: unknown) => {
    const raw = err instanceof Error ? err.message : String(err);
    onError(new Error(isPermissionError(raw) ? permissionMessage() : raw));
  });
}

export function stopListening(): Promise<string> {
  const Voice = getVoice();
  return new Promise<string>((resolve) => {
    const timer = setTimeout(() => resolve(''), 5000);
    Voice.onSpeechResults = (e: any) => {
      clearTimeout(timer);
      resolve(e.value?.[0] ?? '');
    };
    Voice.stop();
  });
}

export async function destroyListener(): Promise<void> {
  await getVoice().destroy();
}
