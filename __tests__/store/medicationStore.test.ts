jest.mock('@/db/medicationsRepository', () => ({
  getMedications: jest.fn().mockResolvedValue([]),
  addMedication: jest.fn().mockResolvedValue(1),
  deleteMedication: jest.fn().mockResolvedValue(undefined),
  logMedication: jest.fn().mockResolvedValue(1),
}));

jest.mock('@/store/journalStore', () => ({
  useJournalStore: {
    getState: () => ({
      refreshCurrentDay: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

import { act } from '@testing-library/react-native';
import { useMedicationStore } from '@/store/medicationStore';
import * as medicationsRepo from '@/db/medicationsRepository';

const mockGetMedications = medicationsRepo.getMedications as jest.Mock;
const mockAddMedication = medicationsRepo.addMedication as jest.Mock;
const mockDeleteMedication = medicationsRepo.deleteMedication as jest.Mock;
const mockLogMedication = medicationsRepo.logMedication as jest.Mock;

const FIXED_TIME = '2026-08-08T09:00:00.000Z';
const SAMPLE_MED = { id: 1, name: 'Doliprane', dosage: '500mg', created_at: FIXED_TIME };

describe('medicationStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMedications.mockResolvedValue([]);
    act(() => {
      useMedicationStore.setState({
        isSheetOpen: false,
        medications: [],
        selectedMedicationId: null,
        timing: null,
        mealType: null,
        efficacy: null,
        note: '',
        recordedAt: FIXED_TIME,
      });
    });
  });

  describe('openSheet', () => {
    it('sets isSheetOpen to true and resets form fields', () => {
      act(() => {
        useMedicationStore.setState({ selectedMedicationId: 1, timing: 'before', efficacy: 3 });
        useMedicationStore.getState().openSheet();
      });
      const state = useMedicationStore.getState();
      expect(state.isSheetOpen).toBe(true);
      expect(state.selectedMedicationId).toBeNull();
      expect(state.timing).toBeNull();
      expect(state.efficacy).toBeNull();
    });
  });

  describe('closeSheet', () => {
    it('sets isSheetOpen to false and resets form fields', () => {
      act(() => {
        useMedicationStore.setState({ isSheetOpen: true, selectedMedicationId: 1, timing: 'during' });
        useMedicationStore.getState().closeSheet();
      });
      const state = useMedicationStore.getState();
      expect(state.isSheetOpen).toBe(false);
      expect(state.selectedMedicationId).toBeNull();
      expect(state.timing).toBeNull();
    });
  });

  describe('loadMedications', () => {
    it('loads and sets medications list', async () => {
      mockGetMedications.mockResolvedValue([SAMPLE_MED]);
      await act(async () => {
        await useMedicationStore.getState().loadMedications();
      });
      expect(useMedicationStore.getState().medications).toEqual([SAMPLE_MED]);
    });
  });

  describe('addNewMedication', () => {
    it('adds medication and refreshes list', async () => {
      mockGetMedications.mockResolvedValue([SAMPLE_MED]);
      await act(async () => {
        await useMedicationStore.getState().addNewMedication('Doliprane', '500mg');
      });
      expect(mockAddMedication).toHaveBeenCalledWith('Doliprane', '500mg');
      expect(useMedicationStore.getState().medications).toEqual([SAMPLE_MED]);
    });

    it('adds medication without dosage', async () => {
      await act(async () => {
        await useMedicationStore.getState().addNewMedication('Ibuprofène');
      });
      expect(mockAddMedication).toHaveBeenCalledWith('Ibuprofène', undefined);
    });
  });

  describe('removeMedication', () => {
    it('deletes medication and refreshes list', async () => {
      act(() => { useMedicationStore.setState({ medications: [SAMPLE_MED] }); });
      mockGetMedications.mockResolvedValue([]);
      await act(async () => {
        await useMedicationStore.getState().removeMedication(1);
      });
      expect(mockDeleteMedication).toHaveBeenCalledWith(1);
      expect(useMedicationStore.getState().medications).toEqual([]);
    });
  });

  describe('selectMedication / setTiming / setMealType / setEfficacy / setNote', () => {
    it('selectMedication sets selectedMedicationId', () => {
      act(() => { useMedicationStore.getState().selectMedication(3); });
      expect(useMedicationStore.getState().selectedMedicationId).toBe(3);
    });

    it('setTiming sets timing', () => {
      act(() => { useMedicationStore.getState().setTiming('after'); });
      expect(useMedicationStore.getState().timing).toBe('after');
    });

    it('setMealType sets mealType', () => {
      act(() => { useMedicationStore.getState().setMealType('dinner'); });
      expect(useMedicationStore.getState().mealType).toBe('dinner');
    });

    it('setEfficacy sets efficacy', () => {
      act(() => { useMedicationStore.getState().setEfficacy(2); });
      expect(useMedicationStore.getState().efficacy).toBe(2);
    });

    it('setNote sets note', () => {
      act(() => { useMedicationStore.getState().setNote('bien toléré'); });
      expect(useMedicationStore.getState().note).toBe('bien toléré');
    });
  });

  describe('saveMedicationLog', () => {
    it('is a no-op when selectedMedicationId is null', async () => {
      await act(async () => {
        await useMedicationStore.getState().saveMedicationLog();
      });
      expect(mockLogMedication).not.toHaveBeenCalled();
    });

    it('is a no-op when timing is null', async () => {
      act(() => { useMedicationStore.setState({ selectedMedicationId: 1, timing: null }); });
      await act(async () => {
        await useMedicationStore.getState().saveMedicationLog();
      });
      expect(mockLogMedication).not.toHaveBeenCalled();
    });

    it('logs medication and resets form on success', async () => {
      act(() => {
        useMedicationStore.setState({
          selectedMedicationId: 1,
          timing: 'before',
          mealType: 'lunch',
          efficacy: 2,
          note: 'ok',
          recordedAt: FIXED_TIME,
        });
      });
      // set() is called before the dynamic import of journalStore, so state is
      // already reset even if the dynamic import throws in the Jest environment.
      await act(async () => {
        await useMedicationStore.getState().saveMedicationLog().catch(() => {});
      });
      expect(mockLogMedication).toHaveBeenCalledWith({
        medication_id: 1,
        timing: 'before',
        meal_type: 'lunch',
        efficacy: 2,
        note: 'ok',
        recorded_at: FIXED_TIME,
      });
      const state = useMedicationStore.getState();
      expect(state.isSheetOpen).toBe(false);
      expect(state.selectedMedicationId).toBeNull();
      expect(state.timing).toBeNull();
    });

    it('trims empty note to undefined', async () => {
      act(() => {
        useMedicationStore.setState({ selectedMedicationId: 1, timing: 'during', note: '   ', recordedAt: FIXED_TIME });
      });
      await act(async () => {
        await useMedicationStore.getState().saveMedicationLog().catch(() => {});
      });
      expect(mockLogMedication).toHaveBeenCalledWith(expect.objectContaining({ note: undefined }));
    });
  });
});
