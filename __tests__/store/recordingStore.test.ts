jest.mock('@/services/transcriptionService', () => ({
  startListening: jest.fn(),
  stopListening: jest.fn().mockResolvedValue(undefined),
  destroyListener: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/services/reformulationService', () => ({
  reformulateText: jest.fn(),
}));

jest.mock('@/services/mealDetection', () => ({
  detectMealType: jest.fn().mockReturnValue('breakfast'),
}));

jest.mock('@/db/settingsRepository', () => ({
  getMealSlots: jest.fn().mockResolvedValue([
    { meal_type: 'breakfast', label: 'Petit-déjeuner', icon: '☀️', start_hour: 6, end_hour: 10 },
  ]),
}));

jest.mock('@/db/entriesRepository', () => ({
  createEntry: jest.fn().mockResolvedValue(1),
}));

import { act } from '@testing-library/react-native';
import { useRecordingStore } from '@/store/recordingStore';
import * as transcriptionService from '@/services/transcriptionService';
import * as reformulationService from '@/services/reformulationService';
import * as entriesRepository from '@/db/entriesRepository';

const mockReformulate = reformulationService.reformulateText as jest.Mock;
const mockCreateEntry = entriesRepository.createEntry as jest.Mock;
const mockStartListening = transcriptionService.startListening as jest.Mock;
const mockStopListening = transcriptionService.stopListening as jest.Mock;

const INITIAL_STATE = {
  phase: 'idle' as const,
  partialTranscript: '',
  rawText: '',
  editedText: '',
  wasReformulated: false,
  mealType: 'other' as const,
  mealTypeManuallySet: false,
  recordedAt: null,
  photoUri: null,
  error: null,
};

describe('recordingStore', () => {
  beforeEach(() => {
    act(() => {
      useRecordingStore.setState(INITIAL_STATE);
    });
    jest.clearAllMocks();
  });

  describe('startRecording', () => {
    it('transitions to recording phase and calls startListening', () => {
      act(() => {
        useRecordingStore.getState().startRecording();
      });

      expect(useRecordingStore.getState().phase).toBe('recording');
      expect(mockStartListening).toHaveBeenCalled();
    });

    it('sets recordedAt to current time', () => {
      const before = new Date();
      act(() => {
        useRecordingStore.getState().startRecording();
      });
      const after = new Date();
      const recordedAt = useRecordingStore.getState().recordedAt!;
      expect(recordedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(recordedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('updates partialTranscript via onPartialResult callback', () => {
      act(() => {
        useRecordingStore.getState().startRecording();
      });

      const onPartial = mockStartListening.mock.calls[0][0];
      act(() => {
        onPartial('bonjour je mange');
      });

      expect(useRecordingStore.getState().partialTranscript).toBe('bonjour je mange');
    });

    it('sets error and returns to idle on transcription error', () => {
      act(() => {
        useRecordingStore.getState().startRecording();
      });

      const onError = mockStartListening.mock.calls[0][1];
      act(() => {
        onError(new Error('mic denied'));
      });

      expect(useRecordingStore.getState().phase).toBe('idle');
      expect(useRecordingStore.getState().error).toBe('mic denied');
    });
  });

  describe('stopRecording', () => {
    it('transitions through processing to confirming with reformulated text', async () => {
      mockReformulate.mockResolvedValue({ text: 'Un café et des tartines.', wasReformulated: true });
      mockStopListening.mockResolvedValueOnce('café et tartines');

      act(() => {
        useRecordingStore.getState().startRecording();
      });

      await act(async () => {
        await useRecordingStore.getState().stopRecording();
      });

      const state = useRecordingStore.getState();
      expect(state.phase).toBe('confirming');
      expect(state.rawText).toBe('café et tartines');
      expect(state.editedText).toBe('Un café et des tartines.');
      expect(state.wasReformulated).toBe(true);
    });

    it('uses raw text as editedText when reformulation is unavailable', async () => {
      mockReformulate.mockResolvedValue({ text: 'café au lait', wasReformulated: false });
      mockStopListening.mockResolvedValueOnce('café au lait');

      act(() => {
        useRecordingStore.getState().startRecording();
      });
      await act(async () => {
        await useRecordingStore.getState().stopRecording();
      });

      expect(useRecordingStore.getState().editedText).toBe('café au lait');
      expect(useRecordingStore.getState().wasReformulated).toBe(false);
    });
  });

  describe('saveEntry', () => {
    beforeEach(() => {
      act(() => {
        useRecordingStore.setState({
          phase: 'confirming',
          editedText: 'Un café au lait.',
          rawText: 'café au lait',
          wasReformulated: true,
          mealType: 'breakfast',
          recordedAt: new Date('2026-08-08T09:00:00Z'),
          error: null,
        });
      });
    });

    it('calls createEntry with correct params', async () => {
      await act(async () => {
        await useRecordingStore.getState().saveEntry();
      });

      expect(mockCreateEntry).toHaveBeenCalledWith({
        transcript: 'Un café au lait.',
        raw_text: 'café au lait',
        meal_type: 'breakfast',
        recorded_at: '2026-08-08T09:00:00.000Z',
        photo_uri: null,
      });
    });

    it('passes null as raw_text when not reformulated', async () => {
      act(() => {
        useRecordingStore.setState({ wasReformulated: false, rawText: 'café au lait' });
      });
      await act(async () => {
        await useRecordingStore.getState().saveEntry();
      });
      expect(mockCreateEntry).toHaveBeenCalledWith(
        expect.objectContaining({ raw_text: null })
      );
    });

    it('resets store to idle after save', async () => {
      await act(async () => {
        await useRecordingStore.getState().saveEntry();
      });
      expect(useRecordingStore.getState().phase).toBe('idle');
      expect(useRecordingStore.getState().editedText).toBe('');
    });
  });

  describe('updateEditedText', () => {
    it('updates editedText', () => {
      act(() => {
        useRecordingStore.getState().updateEditedText('nouveau texte');
      });
      expect(useRecordingStore.getState().editedText).toBe('nouveau texte');
    });
  });

  describe('setMealType', () => {
    it('updates mealType', () => {
      act(() => {
        useRecordingStore.getState().setMealType('dinner');
      });
      expect(useRecordingStore.getState().mealType).toBe('dinner');
    });
  });

  describe('reRecord', () => {
    it('resets transcript fields but keeps phase idle', () => {
      act(() => {
        useRecordingStore.setState({ phase: 'confirming', editedText: 'test', rawText: 'raw' });
        useRecordingStore.getState().reRecord();
      });
      const state = useRecordingStore.getState();
      expect(state.phase).toBe('idle');
      expect(state.editedText).toBe('');
      expect(state.rawText).toBe('');
    });
  });

  describe('discard', () => {
    it('resets store to initial state', () => {
      act(() => {
        useRecordingStore.setState({ phase: 'confirming', editedText: 'test' });
        useRecordingStore.getState().discard();
      });
      const state = useRecordingStore.getState();
      expect(state.phase).toBe('idle');
      expect(state.editedText).toBe('');
    });
  });
});
