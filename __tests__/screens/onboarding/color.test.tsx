import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

const mockSavePrimaryColor = jest.fn(() => Promise.resolve());
jest.mock('@/store/settingsStore', () => ({
  useSettingsStore: jest.fn(() => ({
    settings: { primary_color: '#E85520' },
    savePrimaryColor: mockSavePrimaryColor,
  })),
}));

jest.mock('@/hooks/useColorTheme', () => ({
  useColorTheme: jest.fn(() => ({
    primary: '#E85520', accent: '#F5855A', background: '#FDEEE8', name: 'Corail',
  })),
}));

import ColorScreen from '../../../app/onboarding/color';
import { router } from 'expo-router';

const mockPush = router.push as jest.Mock;

describe('ColorScreen (Étape 4)', () => {
  beforeEach(() => { mockPush.mockClear(); mockSavePrimaryColor.mockClear(); });

  it('affiche 10 swatches de couleur', async () => {
    const { getAllByTestId } = await render(<ColorScreen />);
    expect(getAllByTestId('color-swatch')).toHaveLength(10);
  });

  it("navigue vers /onboarding/permissions sur J'adore", async () => {
    const { getByText } = await render(<ColorScreen />);
    await fireEvent.press(getByText("J'adore →"));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/permissions');
    });
  });

  it('sauvegarde la couleur sélectionnée (Sauge = index 3)', async () => {
    const { getAllByTestId, getByText } = await render(<ColorScreen />);
    await fireEvent.press(getAllByTestId('color-swatch')[3]);
    await fireEvent.press(getByText("J'adore →"));
    await waitFor(() => {
      expect(mockSavePrimaryColor).toHaveBeenCalledWith('#5C7A4E');
    });
  });
});
