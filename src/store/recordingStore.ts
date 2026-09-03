import { Platform } from 'react-native';
import { create } from 'zustand';
import { MealType } from '@/types';
import { startListening, stopListening, destroyListener } from '@/services/transcriptionService';
import { reformulateText } from '@/services/reformulationService';
import { createEntry } from '@/db/entriesRepository';
import { detectMealType } from '@/services/mealDetection';
import { getMealSlots } from '@/db/settingsRepository';

async function persistPhoto(tempUri: string): Promise<string> {
  if (Platform.OS === 'web') return tempUri;
  const FileSystem = await import('expo-file-system/legacy');
  const dir = (FileSystem.documentDirectory ?? '') + 'photos/';
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const dest = dir + `photo_${Date.now()}.jpg`;
  await FileSystem.moveAsync({ from: tempUri, to: dest });
  return dest;
}

export type RecordingPhase = 'idle' | 'recording' | 'processing' | 'confirming' | 'saving';

interface RecordingState {
  phase: RecordingPhase;
  partialTranscript: string;
  rawText: string;
  editedText: string;
  wasReformulated: boolean;
  mealType: MealType;
  mealTypeManuallySet: boolean;
  recordedAt: Date | null;
  photoUri: string | null;
  isPhotoTemporary: boolean;
  error: string | null;
}

interface RecordingActions {
  startRecording: () => void;
  stopRecording: () => Promise<void>;
  startManualEntry: (text: string) => void;
  updateEditedText: (text: string) => void;
  setMealType: (mealType: MealType) => void;
  setPhotoUri: (uri: string | null) => void;
  saveEntry: () => Promise<void>;
  reRecord: () => void;
  discard: () => void;
}

const initialState: RecordingState = {
  phase: 'idle',
  partialTranscript: '',
  rawText: '',
  editedText: '',
  wasReformulated: false,
  mealType: 'other',
  mealTypeManuallySet: false,
  recordedAt: null,
  photoUri: null,
  isPhotoTemporary: false,
  error: null,
};

export const useRecordingStore = create<RecordingState & RecordingActions>((set, get) => ({
  ...initialState,

  startRecording: () => {
    const now = new Date();
    set({ phase: 'recording', partialTranscript: '', recordedAt: now, error: null });

    if (!get().mealTypeManuallySet) {
      getMealSlots().then((slots) => {
        set({ mealType: detectMealType(now, slots) });
      });
    }

    startListening(
      (partial) => set({ partialTranscript: partial }),
      (err) => {
        if (get().phase !== 'recording') return; // erreurs post-stop → ignorer
        set({ phase: 'idle', error: err.message });
      }
    );
  },

  stopRecording: async () => {
    try {
      const raw = await stopListening();
      // iOS peut résoudre avec '' si onSpeechError fire avant onSpeechResults
      const finalText = raw || get().partialTranscript;
      set({ phase: 'processing', rawText: finalText, partialTranscript: '' });

      if (!finalText.trim()) {
        set({ phase: 'idle', error: 'Rien n\'entendu — réessaie en parlant près du micro.' });
        return;
      }

      const { text, wasReformulated } = await reformulateText(finalText);
      set({ editedText: text, wasReformulated, phase: 'confirming' });
    } catch (e) {
      console.error('[RecordingStore] stopRecording failed:', e);
      set({ phase: 'idle', error: (e instanceof Error ? e.message : null) ?? 'Erreur lors de l\'enregistrement' });
    }
  },

  startManualEntry: (text: string) => {
    const now = new Date();
    const { mealTypeManuallySet } = get();
    getMealSlots().then((slots) => {
      const mealType = mealTypeManuallySet ? get().mealType : detectMealType(now, slots);
      set({
        phase: 'confirming',
        rawText: text,
        editedText: text,
        wasReformulated: false,
        recordedAt: now,
        mealType,
        error: null,
      });
    });
  },

  updateEditedText: (text: string) => set({ editedText: text }),

  setMealType: (mealType: MealType) => set({ mealType, mealTypeManuallySet: true }),

  setPhotoUri: (photoUri: string | null) => set({ photoUri, isPhotoTemporary: photoUri !== null }),

  saveEntry: async () => {
    const { editedText, rawText, wasReformulated, mealType, recordedAt, photoUri, isPhotoTemporary } = get();
    set({ phase: 'saving' });

    try {
      let permanentPhotoUri = photoUri;
      if (photoUri && isPhotoTemporary) {
        permanentPhotoUri = await persistPhoto(photoUri).catch(() => photoUri);
      }

      await createEntry({
        transcript: editedText,
        raw_text: wasReformulated ? rawText : null,
        meal_type: mealType,
        recorded_at: (recordedAt ?? new Date()).toISOString(),
        photo_uri: permanentPhotoUri,
      });

      await destroyListener();
      set(initialState);
    } catch (e) {
      console.error('[RecordingStore] saveEntry failed:', e);
      // Revenir à confirming pour que l'utilisateur puisse réessayer
      set({ phase: 'confirming', error: 'Impossible de sauvegarder — réessaie' });
    }
  },

  reRecord: () => {
    set({ phase: 'idle', partialTranscript: '', rawText: '', editedText: '' });
  },

  discard: () => {
    destroyListener();
    set(initialState);
  },
}));
