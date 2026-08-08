jest.mock('@/store/journalStore', () => ({
  useJournalStore: jest.fn(),
}));

jest.mock('@/components/JournalTimeline', () => ({
  JournalTimeline: () => null,
}));

jest.mock('@/utils/dateUtils', () => ({
  formatDate: jest.fn((date: Date) => date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')),
  formatDateLabel: jest.fn((dateStr: string) => dateStr === '2026-08-08' ? "Aujourd'hui" : dateStr),
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

const mockUseJournalStore = useJournalStore as jest.MockedFunction<typeof useJournalStore>;

const baseState = {
  isSheetOpen: true,
  entries: [],
  viewedDate: '2026-08-08',
  closeSheet: jest.fn(),
  goToPreviousDay: jest.fn().mockResolvedValue(undefined),
  goToNextDay: jest.fn().mockResolvedValue(undefined),
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

  it("shows the date label (Aujourd'hui)", async () => {
    const { getByText } = await render(
      <JournalSheet primaryColor="#E85520" onAddEntry={onAddEntry} />
    );
    expect(getByText("Aujourd'hui")).toBeTruthy();
  });

  it('calls goToPreviousDay when ‹ is pressed', async () => {
    const { getByTestId } = await render(
      <JournalSheet primaryColor="#E85520" onAddEntry={onAddEntry} />
    );
    fireEvent.press(getByTestId('prev-day-btn'));
    expect(baseState.goToPreviousDay).toHaveBeenCalled();
  });

  it('calls goToNextDay when › is pressed and not on today', async () => {
    mockUseJournalStore.mockReturnValue({
      ...baseState,
      viewedDate: '2026-08-07',
    } as any);
    const { getByTestId } = await render(
      <JournalSheet primaryColor="#E85520" onAddEntry={onAddEntry} />
    );
    fireEvent.press(getByTestId('next-day-btn'));
    expect(baseState.goToNextDay).toHaveBeenCalled();
  });

  it('calls onAddEntry when the add button is pressed', async () => {
    const { getByTestId } = await render(
      <JournalSheet primaryColor="#E85520" onAddEntry={onAddEntry} />
    );
    fireEvent.press(getByTestId('add-entry-btn'));
    expect(onAddEntry).toHaveBeenCalled();
  });
});
