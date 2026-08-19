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
  mode: 'feeling' as const,
  categories: [],
  sub_categories: [],
  selected_meal: null,
  meal_day: 'today',
  notes: {},
  subNote: '',
  moment: null,
  sleepQuality: null,
  customPainLocations: [],
  selectSlot: jest.fn(),
  setMode: jest.fn(),
  toggleCategory: jest.fn(),
  toggleSubCategory: jest.fn(),
  applyCustomLocation: jest.fn(),
  selectMeal: jest.fn(),
  setMealDay: jest.fn(),
  setNote: jest.fn(),
  setSubNote: jest.fn(),
  setMoment: jest.fn(),
  setSleepQuality: jest.fn(),
  saveCustomLocation: jest.fn().mockResolvedValue(undefined),
  removeCustomLocation: jest.fn().mockResolvedValue(undefined),
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

  it('renders slot buttons for morning and meal options', async () => {
    const { getByTestId } = await render(<RessentisSheet primaryColor="#E85520" />);
    expect(getByTestId('slot-btn-morning')).toBeTruthy();
    expect(getByTestId('slot-btn-breakfast')).toBeTruthy();
    expect(getByTestId('slot-btn-lunch')).toBeTruthy();
  });

  it('calls selectSlot when a slot button is pressed', async () => {
    const { getByTestId } = await render(<RessentisSheet primaryColor="#E85520" />);
    fireEvent.press(getByTestId('slot-btn-morning'));
    expect(baseState.selectSlot).toHaveBeenCalledWith('morning');
  });

  it('renders all category buttons', async () => {
    const { getByTestId } = await render(<RessentisSheet primaryColor="#E85520" />);
    expect(getByTestId('category-btn-bloating')).toBeTruthy();
    expect(getByTestId('category-btn-pain')).toBeTruthy();
    expect(getByTestId('category-btn-good')).toBeTruthy();
  });

  it('calls toggleCategory when a category button is pressed', async () => {
    const { getByTestId } = await render(<RessentisSheet primaryColor="#E85520" />);
    fireEvent.press(getByTestId('category-btn-bloating'));
    expect(baseState.toggleCategory).toHaveBeenCalledWith('bloating');
  });

  it('shows sub_category selector when categories includes pain', async () => {
    mockUseRessentisStore.mockReturnValue({ ...baseState, categories: ['pain'] } as any);
    const { getByTestId } = await render(<RessentisSheet primaryColor="#E85520" />);
    expect(getByTestId('subcategory-btn-belly')).toBeTruthy();
    expect(getByTestId('subcategory-btn-head')).toBeTruthy();
  });

  it('does not show sub_category selector when categories does not include pain', async () => {
    mockUseRessentisStore.mockReturnValue({ ...baseState, categories: ['bloating'] } as any);
    const { queryByTestId } = await render(<RessentisSheet primaryColor="#E85520" />);
    expect(queryByTestId('subcategory-btn-belly')).toBeNull();
  });

  it('shows save button when categories is not empty', async () => {
    mockUseRessentisStore.mockReturnValue({ ...baseState, categories: ['good'] } as any);
    const { getByTestId } = await render(<RessentisSheet primaryColor="#E85520" />);
    expect(getByTestId('save-ressenti-btn')).toBeTruthy();
  });

  it('does not show save button when categories is empty', async () => {
    const { queryByTestId } = await render(<RessentisSheet primaryColor="#E85520" />);
    expect(queryByTestId('save-ressenti-btn')).toBeNull();
  });

  it('calls saveRessenti when save button is pressed', async () => {
    mockUseRessentisStore.mockReturnValue({ ...baseState, categories: ['good'] } as any);
    const { getByTestId } = await render(<RessentisSheet primaryColor="#E85520" />);
    fireEvent.press(getByTestId('save-ressenti-btn'));
    expect(baseState.saveRessenti).toHaveBeenCalled();
  });

  it('shows sleep quality selector when morning slot is selected', async () => {
    mockUseRessentisStore.mockReturnValue({ ...baseState, moment: 'morning' } as any);
    const { getByText } = await render(<RessentisSheet primaryColor="#E85520" />);
    expect(getByText('Comment as-tu dormi ?')).toBeTruthy();
  });

  it('shows today/yesterday selector when a meal slot is selected', async () => {
    mockUseRessentisStore.mockReturnValue({ ...baseState, selected_meal: 'lunch', mode: 'meal' } as any);
    const { getByTestId } = await render(<RessentisSheet primaryColor="#E85520" />);
    expect(getByTestId('day-btn-today')).toBeTruthy();
  });

  it('shows save button in morning mode when sleepQuality is set', async () => {
    mockUseRessentisStore.mockReturnValue({
      ...baseState, moment: 'morning', sleepQuality: 3,
    } as any);
    const { getByTestId } = await render(<RessentisSheet primaryColor="#E85520" />);
    expect(getByTestId('save-ressenti-btn')).toBeTruthy();
  });
});
