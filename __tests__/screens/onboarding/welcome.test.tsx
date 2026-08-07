import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('@/store/settingsStore', () => ({
  useSettingsStore: jest.fn(() => ({
    saveFirstName: jest.fn(() => Promise.resolve()),
  })),
}));

jest.mock('@/hooks/useColorTheme', () => ({
  useColorTheme: jest.fn(() => ({
    primary: '#E85520', accent: '#F5855A', background: '#FDEEE8', name: 'Corail',
  })),
}));

import WelcomeScreen from '../../../app/onboarding/index';
import { router } from 'expo-router';

const mockPush = router.push as jest.Mock;

describe('WelcomeScreen (Étape 1)', () => {
  beforeEach(() => { mockPush.mockClear(); });

  it('affiche le logo, le titre, le champ et le bouton', async () => {
    const { getByText, getByPlaceholderText } = await render(<WelcomeScreen />);
    expect(getByText('Les notes de patate')).toBeTruthy();
    expect(getByText("Comment tu t'appelles ?")).toBeTruthy();
    expect(getByPlaceholderText('Eugénie')).toBeTruthy();
    expect(getByText('Bonjour →')).toBeTruthy();
  });

  it('navigue vers /onboarding/goal avec un prénom valide', async () => {
    const { getByPlaceholderText, getByText } = await render(<WelcomeScreen />);
    await fireEvent.changeText(getByPlaceholderText('Eugénie'), 'Marie');
    await fireEvent.press(getByText('Bonjour →'));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/goal');
    });
  });

  it('ne navigue pas si le champ est vide', async () => {
    const { getByText } = await render(<WelcomeScreen />);
    await fireEvent.press(getByText('Bonjour →'));
    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
