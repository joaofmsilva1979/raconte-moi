import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

const mockSaveMealSlot = jest.fn(() => Promise.resolve());
jest.mock('@/store/settingsStore', () => ({
  useSettingsStore: jest.fn(() => ({
    mealSlots: [
      { meal_type: 'breakfast', label: 'Petit-déjeuner', icon: '☀️', start_hour: 6,  end_hour: 10 },
      { meal_type: 'lunch',     label: 'Déjeuner',       icon: '🌞', start_hour: 11, end_hour: 14 },
      { meal_type: 'snack',     label: 'Collation',      icon: '🌤', start_hour: 14, end_hour: 18 },
      { meal_type: 'dinner',    label: 'Dîner',          icon: '🌙', start_hour: 18, end_hour: 22 },
    ],
    saveMealSlot: mockSaveMealSlot,
  })),
}));

jest.mock('@/hooks/useColorTheme', () => ({
  useColorTheme: jest.fn(() => ({
    primary: '#E85520', accent: '#F5855A', background: '#FDEEE8', name: 'Corail',
  })),
}));

import SlotsScreen from '../../../app/onboarding/slots';
import { router } from 'expo-router';

const mockPush = router.push as jest.Mock;

describe('SlotsScreen (Étape 3)', () => {
  beforeEach(() => { mockPush.mockClear(); mockSaveMealSlot.mockClear(); });

  it('affiche les 4 repas', async () => {
    const { getByText } = await render(<SlotsScreen />);
    expect(getByText(/Petit-déjeuner/)).toBeTruthy();
    expect(getByText(/Déjeuner/)).toBeTruthy();
    expect(getByText(/Collation/)).toBeTruthy();
    expect(getByText(/Dîner/)).toBeTruthy();
  });

  it('navigue vers /onboarding/color sur Parfait', async () => {
    const { getByText } = await render(<SlotsScreen />);
    await fireEvent.press(getByText('Parfait →'));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/color');
    });
  });
});
