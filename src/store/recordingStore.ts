import { create } from 'zustand';
import { MealType } from '@/types';
import { startListening, stopListening, destroyListener } from '@/services/transcriptionService';
import { reformulateText } from '@/services/reformulationService';
import { createEntry } from '@/db/entriesRepository';
import { detectMealType } from '@/services/mealDetection';
import { getMealSlots } from '@/db/settingsRepository';

export type RecordingPhase = 'idle' | 'recording' | 'processing' | 'confirming' | 'saving';

interface RecordingState {
  phase: RecordingPhase;
  partialTranscript: string;
  rawText: string;
  editedText: string;
  wasReformulated: boolean;
  mealType: MealType;
  recordedAt: Date | null;
  photoUri: string | null;
  error: string | null;
}

interface RecordingActions {
  startRecording: () => void;
  stopRecording: (finalText: string) => Promise<void>;
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
  recordedAt: null,
  photoUri: null,
  error: null,
};

export const useRecordingStore = create<RecordingState & RecordingActions>((set, get) => ({
  ...initialState,

  startRecording: () => {
    const now = new Date();
    set({ phase: 'recording', partialTranscript: '', recordedAt: now, error: null });

    getMealSlots().then((slots) => {
      set({ mealType: detectMealType(now, slots) });
    });

    startListening(
      (partial) => set({ partialTranscript: partial }),
      (err) => set({ phase: 'idle', error: err.message })
    );
  },

  stopRecording: async (finalText: string) => {
    await stopListening();
    set({ phase: 'processing', rawText: finalText });

    const { text, wasReformulated } = await reformulateText(finalText);
    set({ editedText: text, wasReformulated, phase: 'confirming' });
  },

  updateEditedText: (text: string) => set({ editedText: text }),

  setMealType: (mealType: MealType) => set({ mealType }),

  setPhotoUri: (photoUri: string | null) => set({ photoUri }),

  saveEntry: async () => {
    const { editedText, rawText, wasReformulated, mealType, recordedAt, photoUri } = get();
    set({ phase: 'saving' });

    await createEntry({
      transcript: editedText,
      raw_text: wasReformulated ? rawText : null,
      meal_type: mealType,
      recorded_at: (recordedAt ?? new Date()).toISOString(),
      photo_uri: photoUri,
    });

    await destroyListener();
    set(initialState);
  },

  reRecord: () => {
    set({ phase: 'idle', partialTranscript: '', rawText: '', editedText: '' });
  },

  discard: () => {
    destroyListener();
    set(initialState);
  },
}));
