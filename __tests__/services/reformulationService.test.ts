jest.mock('@/modules/AppleIntelligence', () => ({
  reformulate: jest.fn(),
  isAvailable: jest.fn(),
}));

import * as AppleIntelligence from '@/modules/AppleIntelligence';
import { reformulateText } from '@/services/reformulationService';

const mockReformulate = AppleIntelligence.reformulate as jest.Mock;
const mockIsAvailable = AppleIntelligence.isAvailable as jest.Mock;

describe('reformulationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when Apple Intelligence is available', () => {
    beforeEach(() => {
      mockIsAvailable.mockReturnValue(true);
    });

    it('returns reformulated text with wasReformulated true', async () => {
      mockReformulate.mockResolvedValue('Un bol de céréales au lait.');

      const result = await reformulateText('euh céréales et lait');

      expect(result).toEqual({
        text: 'Un bol de céréales au lait.',
        wasReformulated: true,
      });
      expect(mockReformulate).toHaveBeenCalledWith('euh céréales et lait');
    });

    it('falls back to raw text when reformulate throws', async () => {
      mockReformulate.mockRejectedValue(new Error('NOT_AVAILABLE'));

      const result = await reformulateText('euh céréales et lait');

      expect(result).toEqual({
        text: 'euh céréales et lait',
        wasReformulated: false,
      });
    });

    it('falls back to raw text when reformulate returns empty string', async () => {
      mockReformulate.mockResolvedValue('');

      const result = await reformulateText('café au lait');

      expect(result).toEqual({
        text: 'café au lait',
        wasReformulated: false,
      });
    });
  });

  describe('when Apple Intelligence is not available', () => {
    beforeEach(() => {
      mockIsAvailable.mockReturnValue(false);
    });

    it('returns raw text with wasReformulated false without calling reformulate', async () => {
      const result = await reformulateText('café et tartines');

      expect(result).toEqual({
        text: 'café et tartines',
        wasReformulated: false,
      });
      expect(mockReformulate).not.toHaveBeenCalled();
    });
  });
});
