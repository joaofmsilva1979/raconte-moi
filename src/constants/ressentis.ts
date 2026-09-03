import { RessentCategory, RessentSubCategory } from '@/types';

export const RESSENTI_CATEGORIES: {
  category: RessentCategory;
  label: string;
  icon: string;
}[] = [
  { category: 'bloating', label: 'Ballonnement', icon: '😮‍💨' },
  { category: 'nausea',   label: 'Nausée',        icon: '🤢' },
  { category: 'pain',     label: 'Douleur',        icon: '😣' },
  { category: 'fatigue',  label: 'Fatigue',        icon: '😴' },
  { category: 'cycle',   label: 'Règles',          icon: '🌸' },
  { category: 'good',     label: 'Je me sens bien', icon: '😊' },
  { category: 'other',    label: 'Autre',           icon: '✏️' },
];

// Sous-catégories pour "Douleur" (localisation corporelle)
export const RESSENTI_SUB_CATEGORIES: {
  sub: RessentSubCategory;
  label: string;
  icon: string;
}[] = [
  { sub: 'head',       label: 'Tête',      icon: '🤯' },
  { sub: 'jaw',        label: 'Mâchoires', icon: '😬' },
  { sub: 'neck',       label: 'Cou/Nuque', icon: '🦢' },
  { sub: 'shoulders',  label: 'Épaules',   icon: '🤷' },
  { sub: 'chest',      label: 'Thorax',    icon: '🫀' },
  { sub: 'upper_back', label: 'Dos haut',  icon: '⬆️' },
  { sub: 'lower_back', label: 'Dos bas',   icon: '⬇️' },
  { sub: 'belly',      label: 'Ventre',    icon: '🫃' },
  { sub: 'hips',       label: 'Hanches',   icon: '🦴' },
  { sub: 'pelvic',     label: 'Pelvien',   icon: '🔻' },
  { sub: 'legs',       label: 'Jambes',    icon: '🦵' },
  { sub: 'other',      label: 'Autre',     icon: '✏️' },
];

// Sous-catégories spécifiques aux "Règles"
export const CYCLE_SUB_CATEGORIES: {
  sub: RessentSubCategory;
  label: string;
  icon: string;
}[] = [
  { sub: 'flow_light',    label: 'Flux léger',        icon: '🩸' },
  { sub: 'flow_medium',   label: 'Flux modéré',       icon: '🩸' },
  { sub: 'flow_heavy',    label: 'Flux abondant',     icon: '🩸' },
  { sub: 'cramps_mild',     label: 'Crampes légères',   icon: '😣' },
  { sub: 'cramps_moderate', label: 'Crampes modérées',  icon: '😣' },
  { sub: 'cramps_severe',   label: 'Très douloureuses', icon: '🤢' },
  { sub: 'mood_low',      label: 'Humeur basse',      icon: '😔' },
  { sub: 'breast_tension',label: 'Seins sensibles',   icon: '🌸' },
  { sub: 'other',         label: 'Autre',             icon: '✏️' },
];

export const RESSENTI_LABELS: Record<RessentCategory, string> = {
  bloating: 'Ballonnement',
  nausea:   'Nausée',
  pain:     'Douleur',
  fatigue:  'Fatigue',
  cycle:    'Règles',
  good:     'Je me sens bien',
  other:    'Autre',
};

export const RESSENTI_ICONS: Record<RessentCategory, string> = {
  bloating: '😮‍💨',
  nausea:   '🤢',
  pain:     '😣',
  fatigue:  '😴',
  cycle:    '🌸',
  good:     '😊',
  other:    '✏️',
};

export const SUB_CATEGORY_LABELS: Record<RessentSubCategory, string> = {
  head:           'tête',
  jaw:            'mâchoires',
  neck:           'cou/nuque',
  shoulders:      'épaules',
  chest:          'thorax',
  upper_back:     'dos haut',
  lower_back:     'dos bas',
  belly:          'ventre',
  hips:           'hanches',
  pelvic:         'pelvien',
  legs:           'jambes',
  flow_light:     'flux léger',
  flow_medium:    'flux modéré',
  flow_heavy:     'flux abondant',
  cramps_mild:     'crampes légères',
  cramps_moderate: 'crampes modérées',
  cramps_severe:   'très douloureuses',
  mood_low:       'humeur basse',
  breast_tension: 'seins sensibles',
  other:          'autre',
};
