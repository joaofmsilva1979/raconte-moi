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
  category: null,
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
    it('sets isSheetOpen to false and resets category', () => {
      act(() => {
        useRessentisStore.setState({ isSheetOpen: true, category: 'pain', sub_category: 'belly' });
        useRessentisStore.getState().closeSheet();
      });
      expect(useRessentisStore.getState().isSheetOpen).toBe(false);
      expect(useRessentisStore.getState().category).toBeNull();
      expect(useRessentisStore.getState().sub_category).toBeNull();
    });
  });

  describe('selectCategory', () => {
    it('sets category', () => {
      act(() => { useRessentisStore.getState().selectCategory('bloating'); });
      expect(useRessentisStore.getState().category).toBe('bloating');
    });

    it('clears sub_category when category changes', () => {
      act(() => {
        useRessentisStore.setState({ category: 'pain', sub_category: 'belly' });
        useRessentisStore.getState().selectCategory('nausea');
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
    it('calls createRessenti with correct params and resets state', async () => {
      mockLink.mockResolvedValue({ entry_id: 3, delay_minutes: 45 });
      mockCreate.mockResolvedValue(1);

      act(() => {
        useRessentisStore.setState({ category: 'pain', sub_category: 'belly', isSheetOpen: true });
      });

      await act(async () => {
        await useRessentisStore.getState().saveRessenti();
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'pain',
          sub_category: 'belly',
          entry_id: 3,
          delay_minutes: 45,
          note: null,
        })
      );
      expect(useRessentisStore.getState().isSheetOpen).toBe(false);
      expect(useRessentisStore.getState().category).toBeNull();
    });

    it('does nothing when category is null', async () => {
      await act(async () => {
        await useRessentisStore.getState().saveRessenti();
      });
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });
});
