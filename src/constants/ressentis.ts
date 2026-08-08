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
  { category: 'good',     label: 'Je me sens bien', icon: '😊' },
  { category: 'other',    label: 'Autre',           icon: '✏️' },
];

export const RESSENTI_SUB_CATEGORIES: {
  sub: RessentSubCategory;
  label: string;
  icon: string;
}[] = [
  { sub: 'belly', label: 'Ventre', icon: '🫃' },
  { sub: 'head',  label: 'Tête',   icon: '🤯' },
  { sub: 'other', label: 'Autre',  icon: '💪' },
];

export const RESSENTI_LABELS: Record<RessentCategory, string> = {
  bloating: 'Ballonnement',
  nausea:   'Nausée',
  pain:     'Douleur',
  fatigue:  'Fatigue',
  good:     'Je me sens bien',
  other:    'Autre',
};

export const RESSENTI_ICONS: Record<RessentCategory, string> = {
  bloating: '😮‍💨',
  nausea:   '🤢',
  pain:     '😣',
  fatigue:  '😴',
  good:     '😊',
  other:    '✏️',
};

export const SUB_CATEGORY_LABELS: Record<RessentSubCategory, string> = {
  belly: 'ventre',
  head:  'tête',
  other: 'autre',
};
