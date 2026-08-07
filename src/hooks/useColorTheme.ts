import { useSettingsStore } from '@/store/settingsStore';
import { getPaletteByPrimary, getDefaultPalette } from '@/services/colorSystem';
import { ColorPalette } from '@/types';

export function useColorTheme(): ColorPalette {
  const settings = useSettingsStore(state => state.settings);
  if (!settings?.primary_color) return getDefaultPalette();
  return getPaletteByPrimary(settings.primary_color) ?? getDefaultPalette();
}
