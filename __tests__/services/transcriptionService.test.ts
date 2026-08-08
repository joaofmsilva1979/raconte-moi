jest.mock('@react-native-voice/voice', () => ({
  __esModule: true,
  default: {
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
    onSpeechPartialResults: null as any,
    onSpeechResults: null as any,
    onSpeechError: null as any,
  },
}));

import Voice from '@react-native-voice/voice';
import {
  startListening,
  stopListening,
  destroyListener,
} from '@/services/transcriptionService';

describe('transcriptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Voice as any).onSpeechPartialResults = null;
    (Voice as any).onSpeechResults = null;
    (Voice as any).onSpeechError = null;
  });

  describe('startListening', () => {
    it('calls Voice.start with fr-FR locale', () => {
      startListening(jest.fn(), jest.fn());
      expect(Voice.start).toHaveBeenCalledWith('fr-FR');
    });

    it('wires onSpeechPartialResults to call onPartialResult with first value', () => {
      const onPartial = jest.fn();
      startListening(onPartial, jest.fn());

      (Voice.onSpeechPartialResults as any)({ value: ['bonjour le monde'] });
      expect(onPartial).toHaveBeenCalledWith('bonjour le monde');
    });

    it('wires onSpeechResults to call onPartialResult with first value', () => {
      const onPartial = jest.fn();
      startListening(onPartial, jest.fn());

      (Voice.onSpeechResults as any)({ value: ['texte final'] });
      expect(onPartial).toHaveBeenCalledWith('texte final');
    });

    it('wires onSpeechError to call onError with an Error', () => {
      const onError = jest.fn();
      startListening(jest.fn(), onError);

      (Voice.onSpeechError as any)({ error: { message: 'mic denied' } });
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError.mock.calls[0][0].message).toBe('mic denied');
    });

    it('returns empty string when value array is empty', () => {
      const onPartial = jest.fn();
      startListening(onPartial, jest.fn());

      (Voice.onSpeechPartialResults as any)({ value: [] });
      expect(onPartial).toHaveBeenCalledWith('');
    });
  });

  describe('stopListening', () => {
    it('calls Voice.stop', async () => {
      await stopListening();
      expect(Voice.stop).toHaveBeenCalled();
    });
  });

  describe('destroyListener', () => {
    it('calls Voice.destroy', async () => {
      await destroyListener();
      expect(Voice.destroy).toHaveBeenCalled();
    });
  });
});
