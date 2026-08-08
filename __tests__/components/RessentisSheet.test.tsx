jest.mock('@/store/ressentisStore', () => ({
  useRessentisStore: jest.fn(),
}));

jest.mock('@/constants/ressentis', () => ({
  RESSENTI_CATEGORIES: [
    { category: 'bloating', label: 'Ballonnement', icon: '😮‍💨' },
    { category: 'pain',     label: 'Douleur',       icon: '😣' },
    { category: 'good',     label: 'Je me sens bien', icon: '😊' },
  ],
  RESSENTI_SUB_CATEGORIES: [
    { sub: 'belly', label: 'Ventre', icon: '🫃' },
    { sub: 'head',  label: 'Tête',   icon: '🤯' },
  ],
}));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRessentisStore } from '@/store/ressentisStore';
import { RessentisSheet } from '@/components/RessentisSheet';

const mockUseRessentisStore = useRessentisStore as jest.MockedFunction<typeof useRessentisStore>;

const baseState = {
  isSheetOpen: true,
  category: null,
  sub_category: null,
  selectCategory: jest.fn(),
  selectSubCategory: jest.fn(),
  saveRessenti: jest.fn().mockResolvedValue(undefined),
  closeSheet: jest.fn(),
};

describe('RessentisSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRessentisStore.mockReturnValue(baseState as any);
  });

  it('renders nothing when isSheetOpen is false', async () => {
    mockUseRessentisStore.mockReturnValue({ ...baseState, isSheetOpen: false } as any);
    const { queryByTestId } = await render(<RessentisSheet primaryColor="#E85520" />);
    expect(queryByTestId('ressentis-sheet')).toBeNull();
  });

  it('renders sheet when isSheetOpen is true', async () => {
    const { getByTestId } = await render(<RessentisSheet primaryColor="#E85520" />);
    expect(getByTestId('ressentis-sheet')).toBeTruthy();
  });

  it('renders all category buttons', async () => {
    const { getByTestId } = await render(<RessentisSheet primaryColor="#E85520" />);
    expect(getByTestId('category-btn-bloating')).toBeTruthy();
    expect(getByTestId('category-btn-pain')).toBeTruthy();
    expect(getByTestId('category-btn-good')).toBeTruthy();
  });

  it('calls selectCategory when a category button is pressed', async () => {
    const { getByTestId } = await render(<RessentisSheet primaryColor="#E85520" />);
    fireEvent.press(getByTestId('category-btn-bloating'));
    expect(baseState.selectCategory).toHaveBeenCalledWith('bloating');
  });

  it('shows sub_category selector when category is pain', async () => {
    mockUseRessentisStore.mockReturnValue({ ...baseState, category: 'pain' } as any);
    const { getByTestId } = await render(<RessentisSheet primaryColor="#E85520" />);
    expect(getByTestId('subcategory-btn-belly')).toBeTruthy();
    expect(getByTestId('subcategory-btn-head')).toBeTruthy();
  });

  it('does not show sub_category selector when category is not pain', async () => {
    mockUseRessentisStore.mockReturnValue({ ...baseState, category: 'bloating' } as any);
    const { queryByTestId } = await render(<RessentisSheet primaryColor="#E85520" />);
    expect(queryByTestId('subcategory-btn-belly')).toBeNull();
  });

  it('shows save button when a category is selected', async () => {
    mockUseRessentisStore.mockReturnValue({ ...baseState, category: 'good' } as any);
    const { getByTestId } = await render(<RessentisSheet primaryColor="#E85520" />);
    expect(getByTestId('save-ressenti-btn')).toBeTruthy();
  });

  it('does not show save button when no category is selected', async () => {
    const { queryByTestId } = await render(<RessentisSheet primaryColor="#E85520" />);
    expect(queryByTestId('save-ressenti-btn')).toBeNull();
  });

  it('calls saveRessenti when save button is pressed', async () => {
    mockUseRessentisStore.mockReturnValue({ ...baseState, category: 'good' } as any);
    const { getByTestId } = await render(<RessentisSheet primaryColor="#E85520" />);
    fireEvent.press(getByTestId('save-ressenti-btn'));
    expect(baseState.saveRessenti).toHaveBeenCalled();
  });
});
