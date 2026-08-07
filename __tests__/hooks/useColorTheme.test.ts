jest.mock('@/store/settingsStore', () => ({
  useSettingsStore: jest.fn(),
}));

jest.mock('@/services/colorSystem', () => ({
  getPaletteByPrimary: jest.fn((primary: string) => {
    const palettes: Record<string, any> = {
      '#E85520': { name: 'Corail', primary: '#E85520', accent: '#F5855A', background: '#FDEEE8' },
      '#5C7A4E': { name: 'Sauge', primary: '#5C7A4E', accent: '#82A870', background: '#EEF5EC' },
    };
    return palettes[primary] || null;
  }),
  getDefaultPalette: jest.fn(() => ({
    name: 'Corail',
    primary: '#E85520',
    accent: '#F5855A',
    background: '#FDEEE8',
  })),
}));

import { renderHook } from '@testing-library/react-native';
import { useColorTheme } from '@/hooks/useColorTheme';
import { useSettingsStore } from '@/store/settingsStore';

describe('useColorTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retourne Corail quand primary_color est #E85520', async () => {
    (useSettingsStore as jest.Mock).mockImplementation((selector: any) =>
      selector({ settings: { primary_color: '#E85520' } })
    );
    const { result } = await renderHook(() => useColorTheme());
    expect(result.current.primary).toBe('#E85520');
    expect(result.current.accent).toBe('#F5855A');
    expect(result.current.background).toBe('#FDEEE8');
    expect(result.current.name).toBe('Corail');
  });

  it('retourne Sauge quand primary_color est #5C7A4E', async () => {
    (useSettingsStore as jest.Mock).mockImplementation((selector: any) =>
      selector({ settings: { primary_color: '#5C7A4E' } })
    );
    const { result } = await renderHook(() => useColorTheme());
    expect(result.current.primary).toBe('#5C7A4E');
    expect(result.current.name).toBe('Sauge');
  });

  it('retourne Corail par défaut si settings est null', async () => {
    (useSettingsStore as jest.Mock).mockImplementation((selector: any) =>
      selector({ settings: null })
    );
    const { result } = await renderHook(() => useColorTheme());
    expect(result.current.primary).toBe('#E85520');
    expect(result.current.name).toBe('Corail');
  });
});
