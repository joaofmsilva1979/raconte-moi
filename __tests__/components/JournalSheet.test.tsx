jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('@/store/journalStore', () => ({
  useJournalStore: jest.fn(),
}));

jest.mock('@/components/JournalTimeline', () => ({
  JournalTimeline: () => null,
}));

jest.mock('@/db/entriesRepository', () => ({
  getActiveDates: jest.fn().mockResolvedValue([]),
  updateEntryTranscript: jest.fn().mockResolvedValue(undefined),
  updateEntryPhoto: jest.fn().mockResolvedValue(undefined),
  deleteEntry: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/db/ressentisRepository', () => ({
  updateRessenti: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/utils/dateUtils', () => ({
  formatDate: jest.fn(() => '2026-08-19'),
  formatDateLabel: jest.fn((dateStr: string) => dateStr === '2026-08-19' ? "Aujourd'hui" : dateStr),
  addDays: jest.fn((dateStr: string, n: number) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d + n);
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }),
}));

jest.mock('@/constants/meals', () => ({
  DEFAULT_MEAL_SLOTS: [
    { meal_type: 'breakfast', label: 'Petit-déjeuner', icon: '☀️', start_hour: 6, end_hour: 10 },
  ],
}));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useJournalStore } from '@/store/journalStore';
import { JournalSheet } from '@/components/JournalSheet';
import { router } from 'expo-router';

const mockUseJournalStore = useJournalStore as jest.MockedFunction<typeof useJournalStore>;

const baseState = {
  isSheetOpen: true,
  entries: [],
  ressentis: [],
  activities: [],
  sleepLog: null,
  medicationLogs: [],
  comfortAidLogs: [],
  viewedDate: '2026-08-19',
  closeSheet: jest.fn(),
  loadDay: jest.fn().mockResolvedValue(undefined),
  refreshCurrentDay: jest.fn().mockResolvedValue(undefined),
  deleteRessentiLog: jest.fn().mockResolvedValue(undefined),
  deleteActivityLog: jest.fn().mockResolvedValue(undefined),
  deleteMedLog: jest.fn().mockResolvedValue(undefined),
  deleteAidLog: jest.fn().mockResolvedValue(undefined),
  deleteSleep: jest.fn().mockResolvedValue(undefined),
};

describe('JournalSheet', () => {
  const onAddEntry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseJournalStore.mockReturnValue(baseState as any);
  });

  it('renders nothing when isSheetOpen is false', async () => {
    mockUseJournalStore.mockReturnValue({ ...baseState, isSheetOpen: false } as any);
    const { queryByTestId } = await render(
      <JournalSheet primaryColor="#E85520" onAddEntry={onAddEntry} />
    );
    expect(queryByTestId('journal-sheet')).toBeNull();
  });

  it('renders the sheet when isSheetOpen is true', async () => {
    const { getByTestId } = await render(
      <JournalSheet primaryColor="#E85520" onAddEntry={onAddEntry} />
    );
    expect(getByTestId('journal-sheet')).toBeTruthy();
  });

  it('renders prev-week and next-week navigation buttons', async () => {
    const { getByTestId } = await render(
      <JournalSheet primaryColor="#E85520" onAddEntry={onAddEntry} />
    );
    expect(getByTestId('prev-week-btn')).toBeTruthy();
    expect(getByTestId('next-week-btn')).toBeTruthy();
  });

  it('pressing prev-week-btn does not throw', async () => {
    const { getByTestId } = await render(
      <JournalSheet primaryColor="#E85520" onAddEntry={onAddEntry} />
    );
    expect(() => fireEvent.press(getByTestId('prev-week-btn'))).not.toThrow();
  });

  it('calls onAddEntry when the add button is pressed', async () => {
    const { getByTestId } = await render(
      <JournalSheet primaryColor="#E85520" onAddEntry={onAddEntry} />
    );
    fireEvent.press(getByTestId('add-entry-btn'));
    expect(onAddEntry).toHaveBeenCalled();
  });

  it('renders settings button when sheet is open', async () => {
    const { getByTestId } = await render(<JournalSheet primaryColor="#E85520" onAddEntry={jest.fn()} />);
    expect(getByTestId('settings-btn')).toBeTruthy();
  });

  it('navigates to settings on settings button press', async () => {
    const { getByTestId } = await render(<JournalSheet primaryColor="#E85520" onAddEntry={jest.fn()} />);
    fireEvent.press(getByTestId('settings-btn'));
    expect(router.push).toHaveBeenCalledWith('/settings');
  });
});
