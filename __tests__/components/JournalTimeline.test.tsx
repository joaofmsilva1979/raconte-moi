jest.mock('@/utils/dateUtils', () => ({
  formatTime: jest.fn((iso: string) => '09:00'),
}));

jest.mock('@/constants/ressentis', () => ({
  RESSENTI_LABELS: { bloating: 'Ballonnement', pain: 'Douleur', good: 'Je me sens bien', nausea: 'Nausée', fatigue: 'Fatigue', other: 'Autre' },
  RESSENTI_ICONS: { bloating: '😮‍💨', pain: '😣', good: '😊', nausea: '🤢', fatigue: '😴', other: '✏️' },
  SUB_CATEGORY_LABELS: { belly: 'ventre', head: 'tête', other: 'autre' },
}));

import React from 'react';
import { render } from '@testing-library/react-native';
import { JournalTimeline } from '@/components/JournalTimeline';
import { Entry, MealSlot, Ressenti } from '@/types';

const SLOTS: MealSlot[] = [
  { meal_type: 'breakfast', label: 'Petit-déjeuner', icon: '☀️', start_hour: 6, end_hour: 10 },
  { meal_type: 'lunch', label: 'Déjeuner', icon: '🌞', start_hour: 11, end_hour: 14 },
  { meal_type: 'snack', label: 'Collation', icon: '🌤', start_hour: 14, end_hour: 18 },
  { meal_type: 'dinner', label: 'Dîner', icon: '🌙', start_hour: 18, end_hour: 22 },
];

const ENTRY: Entry = {
  id: 1,
  recorded_at: '2026-08-08T09:00:00.000Z',
  meal_type: 'breakfast',
  transcript: 'Café au lait, deux tartines.',
  raw_text: null,
  edited_at: null,
  created_at: '2026-08-08T09:00:00.000Z',
};

describe('JournalTimeline', () => {
  it('renders all meal slots', async () => {
    const { getByTestId } = await render(
      <JournalTimeline entries={[]} slots={SLOTS} primaryColor="#E85520" />
    );
    expect(getByTestId('timeline-slot-breakfast')).toBeTruthy();
    expect(getByTestId('timeline-slot-lunch')).toBeTruthy();
    expect(getByTestId('timeline-slot-snack')).toBeTruthy();
    expect(getByTestId('timeline-slot-dinner')).toBeTruthy();
  });

  it('shows "En attente…" for slots with no entry', async () => {
    const { getByTestId } = await render(
      <JournalTimeline entries={[]} slots={SLOTS} primaryColor="#E85520" />
    );
    expect(getByTestId('pending-breakfast')).toBeTruthy();
    expect(getByTestId('pending-lunch')).toBeTruthy();
  });

  it('shows entry text and time for slots with an entry', async () => {
    const { getByText, getByTestId, queryByTestId } = await render(
      <JournalTimeline entries={[ENTRY]} slots={SLOTS} primaryColor="#E85520" />
    );
    expect(getByTestId('entry-1')).toBeTruthy();
    expect(getByText('Café au lait, deux tartines.')).toBeTruthy();
    expect(queryByTestId('pending-breakfast')).toBeNull();
  });

  it('shows "En attente…" for slots without entries even when other slots have entries', async () => {
    const { getByTestId } = await render(
      <JournalTimeline entries={[ENTRY]} slots={SLOTS} primaryColor="#E85520" />
    );
    expect(getByTestId('pending-lunch')).toBeTruthy();
    expect(getByTestId('pending-snack')).toBeTruthy();
    expect(getByTestId('pending-dinner')).toBeTruthy();
  });

  const RESSENTI: Ressenti = {
    id: 10,
    recorded_at: '2026-08-08T13:30:00.000Z',
    category: 'bloating',
    sub_category: null,
    note: null,
    entry_id: null,
    delay_minutes: null,
  };

  it('renders a ressenti item when ressentis prop is provided', async () => {
    const { getByTestId } = await render(
      <JournalTimeline entries={[]} slots={SLOTS} primaryColor="#E85520" ressentis={[RESSENTI]} />
    );
    expect(getByTestId('timeline-ressenti-10')).toBeTruthy();
    expect(getByTestId('ressenti-card-10')).toBeTruthy();
  });

  it('renders ressentis even when entries are empty', async () => {
    const { getByText } = await render(
      <JournalTimeline entries={[]} slots={SLOTS} primaryColor="#E85520" ressentis={[RESSENTI]} />
    );
    expect(getByText(/Ballonnement/)).toBeTruthy();
  });

  it('renders without ressentis when prop is omitted (backward compatible)', async () => {
    const { queryByTestId } = await render(
      <JournalTimeline entries={[]} slots={SLOTS} primaryColor="#E85520" />
    );
    expect(queryByTestId('timeline-ressenti-10')).toBeNull();
  });
});
