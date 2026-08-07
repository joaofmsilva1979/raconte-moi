import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { getAppSettings } from '@/db/settingsRepository';

jest.mock('@/db/settingsRepository', () => ({
  getAppSettings: jest.fn(),
}));

import IndexScreen from '../../app/index';

describe('IndexScreen — route guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (router.replace as jest.Mock).mockClear();
  });

  it('redirige vers /onboarding si onboarding_done est false', async () => {
    (getAppSettings as jest.Mock).mockResolvedValue({ onboarding_done: false });
    render(<IndexScreen />);
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('ne redirige pas si onboarding_done est true', async () => {
    (getAppSettings as jest.Mock).mockResolvedValue({ onboarding_done: true });
    render(<IndexScreen />);
    await waitFor(() => {
      expect(router.replace).not.toHaveBeenCalled();
    });
  });
});
