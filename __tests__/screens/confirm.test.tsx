jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/store/recordingStore', () => ({
  useRecordingStore: jest.fn(),
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
import { useRecordingStore } from '@/store/recordingStore';
import ConfirmScreen from '@/app/confirm';

const mockUseRecordingStore = useRecordingStore as jest.MockedFunction<typeof useRecordingStore>;

describe('ConfirmScreen', () => {
  const saveEntry = jest.fn().mockResolvedValue(undefined);
  const updateEditedText = jest.fn();
  const discard = jest.fn();
  const reRecord = jest.fn();
  const push = jest.fn();
  const replace = jest.fn();
  const back = jest.fn();

  const baseState = {
    phase: 'confirming' as const,
    editedText: 'Un bol de céréales au lait.',
    rawText: 'euh céréales et lait',
    wasReformulated: true,
    mealType: 'breakfast' as const,
    recordedAt: new Date('2026-08-08T09:00:00Z'),
    saveEntry,
    updateEditedText,
    discard,
    reRecord,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (require('expo-router').useRouter as jest.Mock).mockReturnValue({ push, replace, back });
    mockUseRecordingStore.mockReturnValue(baseState as any);
  });

  it('renders the reformulated text in the TextInput', async () => {
    const { getByDisplayValue } = await render(<ConfirmScreen />);
    expect(getByDisplayValue('Un bol de céréales au lait.')).toBeTruthy();
  });

  it('shows the "✨ reformulé" badge when wasReformulated is true', async () => {
    const { getByText } = await render(<ConfirmScreen />);
    expect(getByText(/reformulé/)).toBeTruthy();
  });

  it('does not show reformulé badge when wasReformulated is false', async () => {
    mockUseRecordingStore.mockReturnValue({ ...baseState, wasReformulated: false } as any);
    const { queryByText } = await render(<ConfirmScreen />);
    expect(queryByText(/reformulé/)).toBeNull();
  });

  it('calls updateEditedText when text changes', async () => {
    const { getByDisplayValue } = await render(<ConfirmScreen />);
    fireEvent.changeText(getByDisplayValue('Un bol de céréales au lait.'), 'Nouveau texte');
    expect(updateEditedText).toHaveBeenCalledWith('Nouveau texte');
  });

  it('calls saveEntry and navigates to / on save', async () => {
    const { getByTestId } = await render(<ConfirmScreen />);
    await act(async () => {
      fireEvent.press(getByTestId('save-button'));
    });
    expect(saveEntry).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/');
  });

  it('calls discard and navigates to / on cancel', async () => {
    const { getByTestId } = await render(<ConfirmScreen />);
    fireEvent.press(getByTestId('discard-button'));
    expect(discard).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/');
  });

  it('navigates to /meal-picker when meal badge is tapped', async () => {
    const { getByTestId } = await render(<ConfirmScreen />);
    fireEvent.press(getByTestId('meal-badge'));
    expect(push).toHaveBeenCalledWith('/meal-picker');
  });

  it('shows "Voir original" link when wasReformulated is true', async () => {
    const { getByText } = await render(<ConfirmScreen />);
    expect(getByText('Voir original')).toBeTruthy();
  });

  it('reveals raw text when "Voir original" is pressed', async () => {
    const { getByText, queryByText } = await render(<ConfirmScreen />);
    expect(queryByText(/"euh céréales et lait"/)).toBeNull();
    await act(async () => {
      fireEvent.press(getByText('Voir original'));
    });
    expect(getByText(/"euh céréales et lait"/)).toBeTruthy();
  });
});
