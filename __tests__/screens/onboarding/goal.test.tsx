import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('@/store/settingsStore', () => ({
  useSettingsStore: jest.fn(() => ({
    saveGoal: jest.fn(() => Promise.resolve()),
  })),
}));

jest.mock('@/hooks/useColorTheme', () => ({
  useColorTheme: jest.fn(() => ({
    primary: '#E85520', accent: '#F5855A', background: '#FDEEE8', name: 'Corail',
  })),
}));

import GoalScreen from '../../../app/onboarding/goal';
import { router } from 'expo-router';

const mockPush = router.push as jest.Mock;

describe('GoalScreen (Étape 2)', () => {
  beforeEach(() => { mockPush.mockClear(); });

  it('affiche les 3 options', async () => {
    const { getByText } = await render(<GoalScreen />);
    expect(getByText('Surveiller ce que je mange')).toBeTruthy();
    expect(getByText("Me souvenir de ce que j'ai mangé")).toBeTruthy();
    expect(getByText('Autre chose')).toBeTruthy();
  });

  it('navigue vers /onboarding/slots après sélection + Continuer', async () => {
    const { getByText } = await render(<GoalScreen />);
    await fireEvent.press(getByText('Surveiller ce que je mange'));
    await fireEvent.press(getByText('Continuer →'));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/slots');
    });
  });
});
