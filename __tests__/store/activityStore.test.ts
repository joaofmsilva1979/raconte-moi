jest.mock('@/db/activitiesRepository', () => ({
  createActivity: jest.fn().mockResolvedValue(1),
  getTodayTotalMinutes: jest.fn().mockResolvedValue(0),
}));

import { act } from '@testing-library/react-native';
import { useActivityStore } from '@/store/activityStore';
import * as activitiesRepo from '@/db/activitiesRepository';

const mockCreateActivity = activitiesRepo.createActivity as jest.Mock;
const mockGetTodayTotal = activitiesRepo.getTodayTotalMinutes as jest.Mock;

const FIXED_TIME = '2026-08-08T09:00:00.000Z';

describe('activityStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTodayTotal.mockResolvedValue(0);
    act(() => {
      useActivityStore.setState({
        isSheetOpen: false,
        selectedType: null,
        durationMinutes: null,
        note: '',
        recordedAt: FIXED_TIME,
        todayTotalMinutes: 0,
      });
    });
  });

  describe('openSheet', () => {
    it('sets isSheetOpen to true', () => {
      act(() => { useActivityStore.getState().openSheet(); });
      expect(useActivityStore.getState().isSheetOpen).toBe(true);
    });
  });

  describe('closeSheet', () => {
    it('resets sheet fields', () => {
      act(() => {
        useActivityStore.setState({ isSheetOpen: true, selectedType: 'walk', durationMinutes: 30 });
        useActivityStore.getState().closeSheet();
      });
      const state = useActivityStore.getState();
      expect(state.isSheetOpen).toBe(false);
      expect(state.selectedType).toBeNull();
      expect(state.durationMinutes).toBeNull();
      expect(state.note).toBe('');
    });
  });

  describe('selectType', () => {
    it('sets selectedType', () => {
      act(() => { useActivityStore.getState().selectType('run'); });
      expect(useActivityStore.getState().selectedType).toBe('run');
    });
  });

  describe('setDuration', () => {
    it('sets durationMinutes', () => {
      act(() => { useActivityStore.getState().setDuration(45); });
      expect(useActivityStore.getState().durationMinutes).toBe(45);
    });

    it('accepts null to clear duration', () => {
      act(() => {
        useActivityStore.setState({ durationMinutes: 30 });
        useActivityStore.getState().setDuration(null);
      });
      expect(useActivityStore.getState().durationMinutes).toBeNull();
    });
  });

  describe('setNote', () => {
    it('sets note', () => {
      act(() => { useActivityStore.getState().setNote('belle balade'); });
      expect(useActivityStore.getState().note).toBe('belle balade');
    });
  });

  describe('saveActivity', () => {
    it('saves activity and resets when type and duration are set', async () => {
      mockGetTodayTotal.mockResolvedValue(45);
      act(() => {
        useActivityStore.setState({ selectedType: 'walk', durationMinutes: 30, note: 'parc', recordedAt: FIXED_TIME });
      });

      await act(async () => {
        await useActivityStore.getState().saveActivity();
      });

      expect(mockCreateActivity).toHaveBeenCalledWith({
        recorded_at: FIXED_TIME,
        activity_type: 'walk',
        duration_minutes: 30,
        note: 'parc',
      });
      expect(useActivityStore.getState().isSheetOpen).toBe(false);
      expect(useActivityStore.getState().selectedType).toBeNull();
      expect(useActivityStore.getState().durationMinutes).toBeNull();
      expect(useActivityStore.getState().todayTotalMinutes).toBe(45);
    });

    it('trims empty note to null', async () => {
      act(() => {
        useActivityStore.setState({ selectedType: 'bike', durationMinutes: 20, note: '   ', recordedAt: FIXED_TIME });
      });
      await act(async () => {
        await useActivityStore.getState().saveActivity();
      });
      expect(mockCreateActivity).toHaveBeenCalledWith(expect.objectContaining({ note: null }));
    });

    it('is a no-op when selectedType is null', async () => {
      await act(async () => {
        await useActivityStore.getState().saveActivity();
      });
      expect(mockCreateActivity).not.toHaveBeenCalled();
    });

    it('is a no-op when durationMinutes is null', async () => {
      act(() => { useActivityStore.setState({ selectedType: 'walk', durationMinutes: null }); });
      await act(async () => {
        await useActivityStore.getState().saveActivity();
      });
      expect(mockCreateActivity).not.toHaveBeenCalled();
    });

    it('is a no-op when durationMinutes is 0', async () => {
      act(() => { useActivityStore.setState({ selectedType: 'walk', durationMinutes: 0 }); });
      await act(async () => {
        await useActivityStore.getState().saveActivity();
      });
      expect(mockCreateActivity).not.toHaveBeenCalled();
    });
  });

  describe('loadTodayTotal', () => {
    it('loads and sets todayTotalMinutes', async () => {
      mockGetTodayTotal.mockResolvedValue(60);
      await act(async () => {
        await useActivityStore.getState().loadTodayTotal();
      });
      expect(useActivityStore.getState().todayTotalMinutes).toBe(60);
    });
  });
});
