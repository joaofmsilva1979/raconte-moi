import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

const mockCompleteOnboarding = jest.fn(() => Promise.resolve());
jest.mock('@/store/settingsStore', () => ({
  useSettingsStore: jest.fn(() => ({
    completeOnboarding: mockCompleteOnboarding,
  })),
}));

jest.mock('@/hooks/useColorTheme', () => ({
  useColorTheme: jest.fn(() => ({
    primary: '#E85520', accent: '#F5855A', background: '#FDEEE8', name: 'Corail',
  })),
}));

// expo-audio and expo-notifications are already mocked in jest.setup.js

import PermissionsScreen from '../../../app/onboarding/permissions';
import { router } from 'expo-router';

const mockReplace = router.replace as jest.Mock;

describe('PermissionsScreen (Étape 5)', () => {
  beforeEach(() => { mockReplace.mockClear(); mockCompleteOnboarding.mockClear(); });

  it('affiche les cartes micro et notifications', async () => {
    const { getByText } = await render(<PermissionsScreen />);
    expect(getByText('Microphone')).toBeTruthy();
    expect(getByText('Notifications')).toBeTruthy();
    expect(getByText("C'est parti ! 🥔")).toBeTruthy();
  });

  it("demande les permissions, complète l'onboarding et redirige vers /", async () => {
    const { requestRecordingPermissionsAsync } = require('expo-audio');
    const { getByText } = await render(<PermissionsScreen />);

    await fireEvent.press(getByText("C'est parti ! 🥔"));

    await waitFor(() => {
      expect(requestRecordingPermissionsAsync).toHaveBeenCalled();
      expect(mockCompleteOnboarding).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });
});
