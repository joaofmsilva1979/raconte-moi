jest.mock('@/services/ressentisService', () => ({
  linkToLastEntry: jest.fn(),
}));

jest.mock('@/db/ressentisRepository', () => ({
  createRessenti: jest.fn(),
}));

jest.mock('@/db/customPainLocationsRepository', () => ({
  getCustomPainLocations: jest.fn().mockResolvedValue([]),
  addCustomPainLocation: jest.fn().mockResolvedValue(1),
  deleteCustomPainLocation: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/db/sleepRepository', () => ({
  createSleepLog: jest.fn().mockResolvedValue(1),
}));

import { act } from '@testing-library/react-native';
import { useRessentisStore } from '@/store/ressentisStore';
import * as ressentisService from '@/services/ressentisService';
import * as ressentisRepository from '@/db/ressentisRepository';

const mockLink = ressentisService.linkToLastEntry as jest.Mock;
const mockCreate = ressentisRepository.createRessenti as jest.Mock;

const INITIAL = {
  isSheetOpen: false,
  mode: null,
  categories: [],
  sub_categories: [],
};

describe('ressentisStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => { useRessentisStore.setState(INITIAL); });
  });

  describe('openSheet', () => {
    it('sets isSheetOpen to true', async () => {
      await act(async () => { await useRessentisStore.getState().openSheet(); });
      expect(useRessentisStore.getState().isSheetOpen).toBe(true);
    });
  });

  describe('closeSheet', () => {
    it('sets isSheetOpen to false and resets categories', () => {
      act(() => {
        useRessentisStore.setState({ isSheetOpen: true, categories: ['pain'], sub_categories: ['belly'] });
        useRessentisStore.getState().closeSheet();
      });
      expect(useRessentisStore.getState().isSheetOpen).toBe(false);
      expect(useRessentisStore.getState().categories).toEqual([]);
      expect(useRessentisStore.getState().sub_categories).toEqual([]);
    });
  });

  describe('toggleCategory', () => {
    it('adds category when not selected', () => {
      act(() => { useRessentisStore.getState().toggleCategory('bloating'); });
      expect(useRessentisStore.getState().categories).toContain('bloating');
    });

    it('removes category when already selected', () => {
      act(() => {
        useRessentisStore.setState({ ...INITIAL, categories: ['bloating'] });
        useRessentisStore.getState().toggleCategory('bloating');
      });
      expect(useRessentisStore.getState().categories).not.toContain('bloating');
    });

    it('allows selecting multiple categories', () => {
      act(() => {
        useRessentisStore.getState().toggleCategory('bloating');
        useRessentisStore.getState().toggleCategory('fatigue');
      });
      expect(useRessentisStore.getState().categories).toContain('bloating');
      expect(useRessentisStore.getState().categories).toContain('fatigue');
    });

    it('clears sub_categories when pain is deselected', () => {
      act(() => {
        useRessentisStore.setState({ ...INITIAL, categories: ['pain'], sub_categories: ['belly'] });
        useRessentisStore.getState().toggleCategory('pain');
      });
      expect(useRessentisStore.getState().sub_categories).toEqual([]);
    });
  });

  describe('toggleSubCategory', () => {
    it('adds sub_category when not selected', () => {
      act(() => { useRessentisStore.getState().toggleSubCategory('head'); });
      expect(useRessentisStore.getState().sub_categories).toContain('head');
    });

    it('removes sub_category when already selected', () => {
      act(() => {
        useRessentisStore.setState({ ...INITIAL, sub_categories: ['head'] });
        useRessentisStore.getState().toggleSubCategory('head');
      });
      expect(useRessentisStore.getState().sub_categories).not.toContain('head');
    });

    it('allows selecting multiple sub_categories', () => {
      act(() => {
        useRessentisStore.getState().toggleSubCategory('belly');
        useRessentisStore.getState().toggleSubCategory('head');
      });
      expect(useRessentisStore.getState().sub_categories).toContain('belly');
      expect(useRessentisStore.getState().sub_categories).toContain('head');
    });
  });

  describe('saveRessenti', () => {
    it('calls createRessenti for each selected category and resets state', async () => {
      mockLink.mockResolvedValue({ entry_id: 3, delay_minutes: 45 });
      mockCreate.mockResolvedValue(1);

      act(() => {
        useRessentisStore.setState({ categories: ['pain', 'fatigue'], sub_categories: ['belly'], isSheetOpen: true });
      });

      await act(async () => {
        await useRessentisStore.getState().saveRessenti();
      });

      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'pain', sub_category: 'belly' })
      );
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'fatigue', sub_category: null })
      );
      expect(useRessentisStore.getState().isSheetOpen).toBe(false);
      expect(useRessentisStore.getState().categories).toEqual([]);
    });

    it('creates multiple rows for pain with multiple sub_categories', async () => {
      mockLink.mockResolvedValue({ entry_id: 5, delay_minutes: 10 });
      mockCreate.mockResolvedValue(1);

      act(() => {
        useRessentisStore.setState({ categories: ['pain'], sub_categories: ['belly', 'head'], isSheetOpen: true });
      });

      await act(async () => {
        await useRessentisStore.getState().saveRessenti();
      });

      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'pain', sub_category: 'belly' })
      );
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'pain', sub_category: 'head' })
      );
    });

    it('does nothing when categories is empty', async () => {
      await act(async () => {
        await useRessentisStore.getState().saveRessenti();
      });
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });
});
