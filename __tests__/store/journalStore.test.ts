jest.mock('@/db/entriesRepository', () => ({
  getEntriesForDay: jest.fn(),
}));

jest.mock('@/db/ressentisRepository', () => ({
  getRessentisForDay: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/db/activitiesRepository', () => ({
  getActivitiesForDay: jest.fn().mockResolvedValue([]),
  deleteActivity: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/db/sleepRepository', () => ({
  getSleepForDay: jest.fn().mockResolvedValue(null),
  deleteSleepLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/db/medicationsRepository', () => ({
  getMedicationLogsForDay: jest.fn().mockResolvedValue([]),
  deleteMedicationLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/db/comfortAidsRepository', () => ({
  getComfortAidLogsForDay: jest.fn().mockResolvedValue([]),
  deleteComfortAidLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/utils/dateUtils', () => ({
  formatDate: jest.fn(),
  addDays: jest.fn(),
}));

import { act } from '@testing-library/react-native';
import { useJournalStore } from '@/store/journalStore';
import * as entriesRepository from '@/db/entriesRepository';
import * as dateUtils from '@/utils/dateUtils';

const mockGetEntries = entriesRepository.getEntriesForDay as jest.Mock;
const mockFormatDate = dateUtils.formatDate as jest.Mock;
const mockAddDays = dateUtils.addDays as jest.Mock;

const FAKE_TODAY = '2026-08-08';
const FAKE_YESTERDAY = '2026-08-07';
const FAKE_TOMORROW = '2026-08-09';

const SAMPLE_ENTRY = {
  id: 1,
  recorded_at: '2026-08-08T09:00:00.000Z',
  meal_type: 'breakfast' as const,
  transcript: 'Café au lait',
  raw_text: null,
  edited_at: null,
  created_at: '2026-08-08T09:00:00.000Z',
};

const INITIAL_STATE = {
  viewedDate: FAKE_TODAY,
  entries: [],
  ressentis: [],
  isLoading: false,
  isSheetOpen: false,
};

describe('journalStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatDate.mockReturnValue(FAKE_TODAY);
    mockGetEntries.mockResolvedValue([]);
    (require('@/db/ressentisRepository').getRessentisForDay as jest.Mock).mockResolvedValue([]);
    act(() => { useJournalStore.setState(INITIAL_STATE); });
  });

  describe('openSheet', () => {
    it('sets isSheetOpen to true and loads today', async () => {
      mockGetEntries.mockResolvedValue([SAMPLE_ENTRY]);

      await act(async () => {
        await useJournalStore.getState().openSheet();
      });

      expect(useJournalStore.getState().isSheetOpen).toBe(true);
      expect(useJournalStore.getState().viewedDate).toBe(FAKE_TODAY);
      expect(useJournalStore.getState().entries).toEqual([SAMPLE_ENTRY]);
      expect(mockGetEntries).toHaveBeenCalledWith(FAKE_TODAY);
    });
  });

  describe('closeSheet', () => {
    it('sets isSheetOpen to false', () => {
      act(() => { useJournalStore.setState({ isSheetOpen: true }); });
      act(() => { useJournalStore.getState().closeSheet(); });
      expect(useJournalStore.getState().isSheetOpen).toBe(false);
    });
  });

  describe('loadDay', () => {
    it('loads entries for the given date and sets viewedDate', async () => {
      mockGetEntries.mockResolvedValue([SAMPLE_ENTRY]);

      await act(async () => {
        await useJournalStore.getState().loadDay(FAKE_YESTERDAY);
      });

      expect(useJournalStore.getState().viewedDate).toBe(FAKE_YESTERDAY);
      expect(useJournalStore.getState().entries).toEqual([SAMPLE_ENTRY]);
      expect(useJournalStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading during fetch then clears it', async () => {
      let resolve: (v: any) => void;
      mockGetEntries.mockReturnValue(new Promise(r => { resolve = r; }));

      act(() => { useJournalStore.getState().loadDay(FAKE_TODAY); });
      expect(useJournalStore.getState().isLoading).toBe(true);

      await act(async () => {
        resolve!([]);
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(useJournalStore.getState().isLoading).toBe(false);
    });

    it('loads ressentis for the given date', async () => {
      const mockRessentis = [{ id: 1, recorded_at: '2026-08-08T13:30:00.000Z', category: 'bloating' }];
      (require('@/db/ressentisRepository').getRessentisForDay as jest.Mock).mockResolvedValue(mockRessentis);

      await act(async () => {
        await useJournalStore.getState().loadDay(FAKE_TODAY);
      });

      expect(useJournalStore.getState().ressentis).toEqual(mockRessentis);
    });
  });

  describe('goToPreviousDay', () => {
    it('loads the previous day', async () => {
      mockAddDays.mockReturnValue(FAKE_YESTERDAY);

      await act(async () => {
        await useJournalStore.getState().goToPreviousDay();
      });

      expect(mockAddDays).toHaveBeenCalledWith(FAKE_TODAY, -1);
      expect(mockGetEntries).toHaveBeenCalledWith(FAKE_YESTERDAY);
    });
  });

  describe('goToNextDay', () => {
    it('loads the next day when it is before or equal to today', async () => {
      act(() => { useJournalStore.setState({ viewedDate: FAKE_YESTERDAY }); });
      mockAddDays.mockReturnValue(FAKE_TODAY);
      mockFormatDate.mockReturnValue(FAKE_TODAY);

      await act(async () => {
        await useJournalStore.getState().goToNextDay();
      });

      expect(mockGetEntries).toHaveBeenCalledWith(FAKE_TODAY);
    });

    it('does not load when next day would be in the future', async () => {
      act(() => { useJournalStore.setState({ viewedDate: FAKE_TODAY }); });
      mockAddDays.mockReturnValue(FAKE_TOMORROW);
      mockFormatDate.mockReturnValue(FAKE_TODAY);

      await act(async () => {
        await useJournalStore.getState().goToNextDay();
      });

      expect(mockGetEntries).not.toHaveBeenCalled();
    });
  });

  describe('refreshCurrentDay', () => {
    it('reloads entries for the current viewedDate', async () => {
      mockGetEntries.mockResolvedValue([SAMPLE_ENTRY]);

      await act(async () => {
        await useJournalStore.getState().refreshCurrentDay();
      });

      expect(mockGetEntries).toHaveBeenCalledWith(FAKE_TODAY);
      expect(useJournalStore.getState().entries).toEqual([SAMPLE_ENTRY]);
    });
  });
});
