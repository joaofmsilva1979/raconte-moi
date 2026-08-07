import { COLOR_PALETTES, DEFAULT_COLOR } from '@/constants/colors';
import { ColorPalette } from '@/types';

export function getDefaultPalette(): ColorPalette {
  return DEFAULT_COLOR;
}

export function getPaletteByPrimary(primary: string): ColorPalette | null {
  return COLOR_PALETTES.find(p => p.primary === primary) ?? null;
}

export function getAllPalettes(): ColorPalette[] {
  return COLOR_PALETTES;
}
