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
  mealTypeManuallySet: boolean;
  recordedAt: Date | null;
  photoUri: string | null;
  error: string | null;
}

interface RecordingActions {
  startRecording: () => void;
  stopRecording: (finalText: string) => Promise<void>;
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
      (err) => set({ phase: 'idle', error: err.message })
    );
  },

  stopRecording: async (finalText: string) => {
    await stopListening();
    set({ phase: 'processing', rawText: finalText });

    const { text, wasReformulated } = await reformulateText(finalText);
    set({ editedText: text, wasReformulated, phase: 'confirming' });
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
