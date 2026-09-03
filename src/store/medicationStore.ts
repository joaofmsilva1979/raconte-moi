import { create } from 'zustand';
import { Medication, MedicationTiming, MealType } from '@/types';
import { getMedications, addMedication, deleteMedication, logMedication } from '@/db/medicationsRepository';

interface MedicationState {
  isSheetOpen: boolean;
  medications: Medication[];
  selectedMedicationId: number | null;
  timing: MedicationTiming | null;
  mealType: MealType | null;
  efficacy: 1 | 2 | 3 | null;
  note: string;
  recordedAt: string;
}

interface MedicationActions {
  openSheet: () => void;
  closeSheet: () => void;
  loadMedications: () => Promise<void>;
  addNewMedication: (name: string, dosage?: string) => Promise<void>;
  removeMedication: (id: number) => Promise<void>;
  selectMedication: (id: number | null) => void;
  setTiming: (timing: MedicationTiming | null) => void;
  setMealType: (mealType: MealType | null) => void;
  setEfficacy: (efficacy: 1 | 2 | 3 | null) => void;
  setNote: (note: string) => void;
  setRecordedAt: (iso: string) => void;
  saveMedicationLog: () => Promise<void>;
}

const INITIAL: MedicationState = {
  isSheetOpen: false,
  medications: [],
  selectedMedicationId: null,
  timing: null,
  mealType: null,
  efficacy: null,
  note: '',
  recordedAt: new Date().toISOString(),
};

export const useMedicationStore = create<MedicationState & MedicationActions>((set, get) => ({
  ...INITIAL,

  openSheet: () => set({
    isSheetOpen: true,
    selectedMedicationId: null,
    timing: null,
    mealType: null,
    efficacy: null,
    note: '',
    recordedAt: new Date().toISOString(),
  }),

  closeSheet: () => set({
    isSheetOpen: false,
    selectedMedicationId: null,
    timing: null,
    mealType: null,
    efficacy: null,
    note: '',
    recordedAt: new Date().toISOString(),
  }),

  loadMedications: async () => {
    const medications = await getMedications();
    set({ medications });
  },

  addNewMedication: async (name, dosage) => {
    await addMedication(name, dosage);
    const medications = await getMedications();
    set({ medications });
  },

  removeMedication: async (id) => {
    await deleteMedication(id);
    const medications = await getMedications();
    set({ medications });
  },

  selectMedication: (id) => set({ selectedMedicationId: id }),

  setTiming: (timing) => set({ timing }),

  setMealType: (mealType) => set({ mealType }),

  setEfficacy: (efficacy) => set({ efficacy }),

  setNote: (note) => set({ note }),

  setRecordedAt: (recordedAt) => set({ recordedAt }),

  saveMedicationLog: async () => {
    const { selectedMedicationId, timing, mealType, efficacy, note, recordedAt } = get();
    if (!selectedMedicationId) return;
    await logMedication({
      medication_id: selectedMedicationId,
      timing: timing ?? undefined,
      meal_type: mealType ?? undefined,
      efficacy: efficacy ?? undefined,
      note: note.trim() || undefined,
      recorded_at: recordedAt,
    });
    set({
      isSheetOpen: false,
      selectedMedicationId: null,
      timing: null,
      mealType: null,
      efficacy: null,
      note: '',
      recordedAt: new Date().toISOString(),
    });
    // Refresh journal if open
    const { useJournalStore } = await import('@/store/journalStore');
    await useJournalStore.getState().refreshCurrentDay();
  },
}));
