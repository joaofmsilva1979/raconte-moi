import { ActivityType } from '@/types';

export const ACTIVITY_TYPES: { type: ActivityType; label: string; icon: string }[] = [
  { type: 'walk',    label: 'Marche',      icon: '🚶' },
  { type: 'swim',    label: 'Natation',    icon: '🏊' },
  { type: 'yoga',    label: 'Yoga',        icon: '🧘' },
  { type: 'bike',    label: 'Vélo',        icon: '🚴' },
  { type: 'stretch', label: 'Étirements',  icon: '🤸' },
  { type: 'gym',     label: 'Muscu',       icon: '💪' },
  { type: 'other',   label: 'Autre',       icon: '⚡' },
];

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  walk:    'Marche',
  swim:    'Natation',
  yoga:    'Yoga',
  bike:    'Vélo',
  stretch: 'Étirements',
  gym:     'Muscu',
  other:   'Activité',
};

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  walk:    '🚶',
  swim:    '🏊',
  yoga:    '🧘',
  bike:    '🚴',
  stretch: '🤸',
  gym:     '💪',
  other:   '⚡',
};

export const DURATION_PRESETS = [15, 30, 45, 60, 90];

export const DAILY_GOAL_MINUTES = 30;
