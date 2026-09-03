export const ACTIVITY_TYPES: { type: string; label: string; icon: string }[] = [
  { type: 'walk',    label: 'Marche',      icon: '🚶' },
  { type: 'swim',    label: 'Natation',    icon: '🏊' },
  { type: 'yoga',    label: 'Yoga',        icon: '🧘' },
  { type: 'bike',    label: 'Vélo',        icon: '🚴' },
  { type: 'stretch', label: 'Étirements',  icon: '🤸' },
  { type: 'gym',     label: 'Muscu',       icon: '💪' },
  { type: 'other',   label: 'Autre',       icon: '⚡' },
];

const PREDEFINED_LABELS: Record<string, string> = {
  walk: 'Marche', swim: 'Natation', yoga: 'Yoga', bike: 'Vélo',
  stretch: 'Étirements', gym: 'Muscu', other: 'Activité',
};

const PREDEFINED_ICONS: Record<string, string> = {
  walk: '🚶', swim: '🏊', yoga: '🧘', bike: '🚴',
  stretch: '🤸', gym: '💪', other: '⚡',
};

export function getActivityLabel(type: string, customName?: string): string {
  return PREDEFINED_LABELS[type] ?? customName ?? type;
}

export function getActivityIcon(type: string): string {
  return PREDEFINED_ICONS[type] ?? '⭐';
}

export const DURATION_PRESETS = [15, 30, 45, 60, 90];

export const DAILY_GOAL_MINUTES = 30;
