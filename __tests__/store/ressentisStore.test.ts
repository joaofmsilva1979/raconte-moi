jest.mock('@/services/ressentisService', () => ({
  linkToLastEntry: jest.fn(),
}));

jest.mock('@/db/ressentisRepository', () => ({
  createRessenti: jest.fn(),
}));

import { act } from '@testing-library/react-native';
import { useRessentisStore } from '@/store/ressentisStore';
import * as ressentisService from '@/services/ressentisService';
import * as ressentisRepository from '@/db/ressentisRepository';

const mockLink = ressentisService.linkToLastEntry as jest.Mock;
const mockCreate = ressentisRepository.createRessenti as jest.Mock;

const INITIAL = {
  isSheetOpen: false,
  categories: [],
  sub_category: null,
};

describe('ressentisStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => { useRessentisStore.setState(INITIAL); });
  });

  describe('openSheet', () => {
    it('sets isSheetOpen to true', () => {
      act(() => { useRessentisStore.getState().openSheet(); });
      expect(useRessentisStore.getState().isSheetOpen).toBe(true);
    });
  });

  describe('closeSheet', () => {
    it('sets isSheetOpen to false and resets categories', () => {
      act(() => {
        useRessentisStore.setState({ isSheetOpen: true, categories: ['pain'], sub_category: 'belly' });
        useRessentisStore.getState().closeSheet();
      });
      expect(useRessentisStore.getState().isSheetOpen).toBe(false);
      expect(useRessentisStore.getState().categories).toEqual([]);
      expect(useRessentisStore.getState().sub_category).toBeNull();
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

    it('clears sub_category when pain is deselected', () => {
      act(() => {
        useRessentisStore.setState({ ...INITIAL, categories: ['pain'], sub_category: 'belly' });
        useRessentisStore.getState().toggleCategory('pain');
      });
      expect(useRessentisStore.getState().sub_category).toBeNull();
    });
  });

  describe('selectSubCategory', () => {
    it('sets sub_category', () => {
      act(() => { useRessentisStore.getState().selectSubCategory('head'); });
      expect(useRessentisStore.getState().sub_category).toBe('head');
    });
  });

  describe('saveRessenti', () => {
    it('calls createRessenti for each selected category and resets state', async () => {
      mockLink.mockResolvedValue({ entry_id: 3, delay_minutes: 45 });
      mockCreate.mockResolvedValue(1);

      act(() => {
        useRessentisStore.setState({ categories: ['pain', 'fatigue'], sub_category: 'belly', isSheetOpen: true });
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

    it('does nothing when categories is empty', async () => {
      await act(async () => {
        await useRessentisStore.getState().saveRessenti();
      });
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });
});
