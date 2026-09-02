jest.mock('@/db/comfortAidsRepository', () => ({
  getComfortAids: jest.fn().mockResolvedValue([]),
  addComfortAid: jest.fn().mockResolvedValue(1),
  deleteComfortAid: jest.fn().mockResolvedValue(undefined),
  logComfortAid: jest.fn().mockResolvedValue(1),
}));

jest.mock('@/store/journalStore', () => ({
  useJournalStore: {
    getState: () => ({
      refreshCurrentDay: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

import { act } from '@testing-library/react-native';
import { useComfortAidStore } from '@/store/comfortAidStore';
import * as comfortAidsRepo from '@/db/comfortAidsRepository';

const mockGetComfortAids = comfortAidsRepo.getComfortAids as jest.Mock;
const mockAddComfortAid = comfortAidsRepo.addComfortAid as jest.Mock;
const mockDeleteComfortAid = comfortAidsRepo.deleteComfortAid as jest.Mock;
const mockLogComfortAid = comfortAidsRepo.logComfortAid as jest.Mock;

const FIXED_TIME = '2026-08-08T09:00:00.000Z';
const SAMPLE_AID = { id: 1, name: 'Bouillotte', created_at: FIXED_TIME };

describe('comfortAidStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetComfortAids.mockResolvedValue([]);
    act(() => {
      useComfortAidStore.setState({
        isSheetOpen: false,
        aids: [],
        selectedAidIds: [],
        mealType: null,
        note: '',
        recordedAt: FIXED_TIME,
      });
    });
  });

  describe('openSheet', () => {
    it('sets isSheetOpen to true and resets selection', () => {
      act(() => {
        useComfortAidStore.setState({ selectedAidIds: [1, 2], mealType: 'lunch' });
        useComfortAidStore.getState().openSheet();
      });
      const state = useComfortAidStore.getState();
      expect(state.isSheetOpen).toBe(true);
      expect(state.selectedAidIds).toEqual([]);
      expect(state.mealType).toBeNull();
    });
  });

  describe('closeSheet', () => {
    it('sets isSheetOpen to false and resets all fields', () => {
      act(() => {
        useComfortAidStore.setState({ isSheetOpen: true, selectedAidIds: [1], mealType: 'breakfast', note: 'bien' });
        useComfortAidStore.getState().closeSheet();
      });
      const state = useComfortAidStore.getState();
      expect(state.isSheetOpen).toBe(false);
      expect(state.selectedAidIds).toEqual([]);
      expect(state.mealType).toBeNull();
      expect(state.note).toBe('');
    });
  });

  describe('loadAids', () => {
    it('loads and sets aids list', async () => {
      mockGetComfortAids.mockResolvedValue([SAMPLE_AID]);
      await act(async () => {
        await useComfortAidStore.getState().loadAids();
      });
      expect(useComfortAidStore.getState().aids).toEqual([SAMPLE_AID]);
    });
  });

  describe('addNewAid', () => {
    it('adds aid and refreshes list', async () => {
      mockGetComfortAids.mockResolvedValue([SAMPLE_AID]);
      await act(async () => {
        await useComfortAidStore.getState().addNewAid('Bouillotte');
      });
      expect(mockAddComfortAid).toHaveBeenCalledWith('Bouillotte');
      expect(useComfortAidStore.getState().aids).toEqual([SAMPLE_AID]);
    });
  });

  describe('removeAid', () => {
    it('deletes aid and refreshes list', async () => {
      act(() => { useComfortAidStore.setState({ aids: [SAMPLE_AID] }); });
      mockGetComfortAids.mockResolvedValue([]);
      await act(async () => {
        await useComfortAidStore.getState().removeAid(1);
      });
      expect(mockDeleteComfortAid).toHaveBeenCalledWith(1);
      expect(useComfortAidStore.getState().aids).toEqual([]);
    });
  });

  describe('toggleAid', () => {
    it('adds id when not yet selected', () => {
      act(() => { useComfortAidStore.getState().toggleAid(1); });
      expect(useComfortAidStore.getState().selectedAidIds).toEqual([1]);
    });

    it('removes id when already selected', () => {
      act(() => {
        useComfortAidStore.setState({ selectedAidIds: [1, 2] });
        useComfortAidStore.getState().toggleAid(1);
      });
      expect(useComfortAidStore.getState().selectedAidIds).toEqual([2]);
    });

    it('can toggle multiple aids independently', () => {
      act(() => {
        useComfortAidStore.getState().toggleAid(1);
        useComfortAidStore.getState().toggleAid(3);
      });
      expect(useComfortAidStore.getState().selectedAidIds).toEqual([1, 3]);
    });
  });

  describe('setMealType / setNote / setRecordedAt', () => {
    it('setMealType sets mealType', () => {
      act(() => { useComfortAidStore.getState().setMealType('morning'); });
      expect(useComfortAidStore.getState().mealType).toBe('morning');
    });

    it('setNote sets note', () => {
      act(() => { useComfortAidStore.getState().setNote('soulagement rapide'); });
      expect(useComfortAidStore.getState().note).toBe('soulagement rapide');
    });

    it('setRecordedAt sets recordedAt', () => {
      const iso = '2026-08-08T14:00:00.000Z';
      act(() => { useComfortAidStore.getState().setRecordedAt(iso); });
      expect(useComfortAidStore.getState().recordedAt).toBe(iso);
    });
  });

  describe('saveComfortAidLogs', () => {
    it('is a no-op when no aids selected', async () => {
      await act(async () => {
        await useComfortAidStore.getState().saveComfortAidLogs();
      });
      expect(mockLogComfortAid).not.toHaveBeenCalled();
    });

    it('logs all selected aids in parallel and resets', async () => {
      act(() => {
        useComfortAidStore.setState({
          selectedAidIds: [1, 2],
          mealType: 'lunch',
          note: 'efficace',
          recordedAt: FIXED_TIME,
        });
      });
      // set() is called before the dynamic import of journalStore, so state is
      // already reset even if the dynamic import throws in the Jest environment.
      await act(async () => {
        await useComfortAidStore.getState().saveComfortAidLogs().catch(() => {});
      });
      expect(mockLogComfortAid).toHaveBeenCalledTimes(2);
      expect(mockLogComfortAid).toHaveBeenCalledWith({
        comfort_aid_id: 1,
        recorded_at: FIXED_TIME,
        meal_type: 'lunch',
        note: 'efficace',
      });
      expect(mockLogComfortAid).toHaveBeenCalledWith({
        comfort_aid_id: 2,
        recorded_at: FIXED_TIME,
        meal_type: 'lunch',
        note: 'efficace',
      });
      const state = useComfortAidStore.getState();
      expect(state.isSheetOpen).toBe(false);
      expect(state.selectedAidIds).toEqual([]);
      expect(state.mealType).toBeNull();
    });

    it('sends null note when note is empty', async () => {
      act(() => {
        useComfortAidStore.setState({ selectedAidIds: [1], mealType: null, note: '   ', recordedAt: FIXED_TIME });
      });
      await act(async () => {
        await useComfortAidStore.getState().saveComfortAidLogs().catch(() => {});
      });
      expect(mockLogComfortAid).toHaveBeenCalledWith(expect.objectContaining({ note: null }));
    });
  });
});
