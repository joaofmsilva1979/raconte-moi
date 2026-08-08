jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  return {
    useRouter: jest.fn(),
    Redirect: ({ href }: { href: string }) => <Text testID="redirect">{href}</Text>,
  };
});

jest.mock('@/store/settingsStore', () => ({
  useSettingsStore: jest.fn(),
}));

jest.mock('@/store/recordingStore', () => ({
  useRecordingStore: jest.fn(),
}));

jest.mock('@/store/journalStore', () => ({
  useJournalStore: jest.fn(),
}));

jest.mock('@/components/JournalSheet', () => ({
  JournalSheet: () => null,
}));

jest.mock('@/hooks/useColorTheme', () => ({
  useColorTheme: () => ({
    primary: '#E85520',
    background: '#FFF8F5',
    accent: '#F5855A',
    name: 'orange',
  }),
}));

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { useSettingsStore } from '@/store/settingsStore';
import { useRecordingStore } from '@/store/recordingStore';
import { useJournalStore } from '@/store/journalStore';
import HomeScreen from '@/app/index';

const mockSettings = useSettingsStore as jest.MockedFunction<typeof useSettingsStore>;
const mockRecording = useRecordingStore as jest.MockedFunction<typeof useRecordingStore>;
const mockJournal = useJournalStore as jest.MockedFunction<typeof useJournalStore>;

const baseDoneSettings = {
  settings: {
    first_name: 'Eugénie',
    primary_color: '#E85520',
    goal: 'watch' as const,
    onboarding_done: true,
    icloud_backup: false,
    backup_interval: 7,
    last_backup_at: null,
  },
  loadSettings: jest.fn().mockResolvedValue(undefined),
};

const baseRecordingState = {
  phase: 'idle' as const,
  partialTranscript: '',
  mealType: 'breakfast' as const,
  recordedAt: null,
  startRecording: jest.fn(),
  stopRecording: jest.fn().mockResolvedValue(undefined),
};

const baseJournalState = {
  isSheetOpen: false,
  openSheet: jest.fn().mockResolvedValue(undefined),
  closeSheet: jest.fn(),
  refreshCurrentDay: jest.fn().mockResolvedValue(undefined),
};

describe('HomeScreen', () => {
  const push = jest.fn();
  const replace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (require('expo-router').useRouter as jest.Mock).mockReturnValue({ push, replace });
    mockSettings.mockReturnValue(baseDoneSettings as any);
    mockRecording.mockReturnValue(baseRecordingState as any);
    mockJournal.mockReturnValue(baseJournalState as any);
  });

  it('redirects to /onboarding when onboarding_done is false', async () => {
    mockSettings.mockReturnValue({
      ...baseDoneSettings,
      settings: { ...baseDoneSettings.settings, onboarding_done: false },
    } as any);
    const { getByText } = await render(<HomeScreen />);
    expect(getByText('/onboarding')).toBeTruthy();
  });

  it('shows greeting with first name', async () => {
    const { getByText } = await render(<HomeScreen />);
    expect(getByText(/Eugénie/)).toBeTruthy();
  });

  it('renders the MicButton', async () => {
    const { getByTestId } = await render(<HomeScreen />);
    expect(getByTestId('mic-button')).toBeTruthy();
  });

  it('calls startRecording on mic pressIn', async () => {
    const { getByTestId } = await render(<HomeScreen />);
    fireEvent(getByTestId('mic-button'), 'pressIn');
    expect(baseRecordingState.startRecording).toHaveBeenCalled();
  });

  it('calls stopRecording with partialTranscript on mic pressOut', async () => {
    mockRecording.mockReturnValue({
      ...baseRecordingState,
      phase: 'recording' as const,
      partialTranscript: 'café au lait',
    } as any);

    const { getByTestId } = await render(<HomeScreen />);
    await act(async () => {
      fireEvent(getByTestId('mic-button'), 'pressOut');
    });
    expect(baseRecordingState.stopRecording).toHaveBeenCalledWith('café au lait');
  });

  it('shows WaveformView when recording', async () => {
    mockRecording.mockReturnValue({
      ...baseRecordingState,
      phase: 'recording' as const,
    } as any);

    const { getByTestId } = await render(<HomeScreen />);
    expect(getByTestId('waveform')).toBeTruthy();
  });

  it('navigates to /confirm when phase becomes confirming', async () => {
    mockRecording.mockReturnValue({
      ...baseRecordingState,
      phase: 'confirming' as const,
    } as any);

    await render(<HomeScreen />);
    expect(push).toHaveBeenCalledWith('/confirm');
  });

  it('renders the journal opener button', async () => {
    const { getByTestId } = await render(<HomeScreen />);
    expect(getByTestId('open-journal-btn')).toBeTruthy();
  });

  it('calls openSheet when journal opener is pressed', async () => {
    const openSheet = jest.fn().mockResolvedValue(undefined);
    mockJournal.mockReturnValue({ ...baseJournalState, openSheet } as any);

    const { getByTestId } = await render(<HomeScreen />);
    fireEvent.press(getByTestId('open-journal-btn'));
    expect(openSheet).toHaveBeenCalled();
  });

  it('calls refreshCurrentDay when phase returns to idle from a non-idle phase', async () => {
    const refreshCurrentDay = jest.fn().mockResolvedValue(undefined);
    mockJournal.mockReturnValue({ ...baseJournalState, refreshCurrentDay } as any);

    mockRecording.mockReturnValue({
      ...baseRecordingState,
      phase: 'saving' as const,
    } as any);

    const { rerender } = await render(<HomeScreen />);

    mockRecording.mockReturnValue({
      ...baseRecordingState,
      phase: 'idle' as const,
    } as any);

    await act(async () => {
      await rerender(<HomeScreen />);
    });

    expect(refreshCurrentDay).toHaveBeenCalled();
  });
});
