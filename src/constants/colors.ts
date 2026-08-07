import { ColorPalette } from '@/types';

export const COLOR_PALETTES: ColorPalette[] = [
  { name: 'Corail',      primary: '#E85520', accent: '#F5855A', background: '#FDEEE8' },
  { name: 'Terracotta',  primary: '#C4623A', accent: '#D9845C', background: '#FAEAE0' },
  { name: 'Miel',        primary: '#C8943A', accent: '#DEB96A', background: '#FDF5E0' },
  { name: 'Sauge',       primary: '#5C7A4E', accent: '#82A870', background: '#EEF5EC' },
  { name: 'Teal',        primary: '#3A8A8A', accent: '#60AAAA', background: '#E8F5F5' },
  { name: 'Lavande',     primary: '#4F7FFF', accent: '#7FA0FF', background: '#EEF2FF' },
  { name: 'Prune',       primary: '#7B5EA7', accent: '#A080CC', background: '#F3EEFF' },
  { name: 'Rose',        primary: '#C96B8A', accent: '#DF90AA', background: '#FEEEF4' },
  { name: 'Bordeaux',    primary: '#A03050', accent: '#C05878', background: '#FAEAEE' },
  { name: 'Cacao',       primary: '#5C4A35', accent: '#8A6E52', background: '#F5EEE6' },
];

export const DEFAULT_COLOR = COLOR_PALETTES[0]; // Corail
