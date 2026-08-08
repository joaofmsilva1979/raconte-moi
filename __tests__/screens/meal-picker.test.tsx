jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/store/recordingStore', () => ({
  useRecordingStore: jest.fn(),
}));

jest.mock('@/hooks/useColorTheme', () => ({
  useColorTheme: () => ({
    primary: '#E85520',
    background: '#FFF8F5',
    accent: '#F5855A',
    name: 'orange',
  }),
}));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRecordingStore } from '@/store/recordingStore';
import MealPickerScreen from '@/app/meal-picker';

const mockUseRecordingStore = useRecordingStore as jest.MockedFunction<typeof useRecordingStore>;

describe('MealPickerScreen', () => {
  const setMealType = jest.fn();
  const back = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (require('expo-router').useRouter as jest.Mock).mockReturnValue({ back });
    mockUseRecordingStore.mockReturnValue({
      mealType: 'breakfast',
      setMealType,
    } as any);
  });

  it('renders all four standard meal options', async () => {
    const { getByText } = await render(<MealPickerScreen />);
    expect(getByText(/Petit-déjeuner/)).toBeTruthy();
    expect(getByText(/Déjeuner/)).toBeTruthy();
    expect(getByText(/Collation/)).toBeTruthy();
    expect(getByText(/Dîner/)).toBeTruthy();
  });

  it('shows a checkmark on the currently selected meal', async () => {
    const { getByTestId } = await render(<MealPickerScreen />);
    const selected = getByTestId('meal-option-breakfast');
    expect(selected).toBeTruthy();
  });

  it('calls setMealType and back when a different meal is tapped', async () => {
    const { getByTestId } = await render(<MealPickerScreen />);
    await fireEvent.press(getByTestId('meal-option-dinner'));
    expect(setMealType).toHaveBeenCalledWith('dinner');
    expect(back).toHaveBeenCalled();
  });

  it('calls setMealType and back even when the current meal is re-tapped', async () => {
    const { getByTestId } = await render(<MealPickerScreen />);
    await fireEvent.press(getByTestId('meal-option-breakfast'));
    expect(setMealType).toHaveBeenCalledWith('breakfast');
    expect(back).toHaveBeenCalled();
  });
});
