jest.mock('@/db/entriesRepository', () => ({
  getLastEntryBefore: jest.fn(),
}));

import { linkToLastEntry } from '@/services/ressentisService';
import * as entriesRepository from '@/db/entriesRepository';

const mockGetLastEntry = entriesRepository.getLastEntryBefore as jest.Mock;

describe('ressentisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('linkToLastEntry', () => {
    it('returns null entry_id and delay when no prior entry exists', async () => {
      mockGetLastEntry.mockResolvedValue(null);
      const result = await linkToLastEntry(new Date('2026-08-08T13:30:00.000Z'));
      expect(result).toEqual({ entry_id: null, delay_minutes: null });
    });

    it('returns correct entry_id and delay_minutes when a prior entry exists', async () => {
      mockGetLastEntry.mockResolvedValue({
        id: 5,
        recorded_at: '2026-08-08T12:46:00.000Z',
        meal_type: 'lunch',
        transcript: 'Salade',
        raw_text: null,
        edited_at: null,
        created_at: '2026-08-08T12:46:00.000Z',
      });
      const recordedAt = new Date('2026-08-08T13:30:00.000Z'); // 44 min later
      const result = await linkToLastEntry(recordedAt);
      expect(result.entry_id).toBe(5);
      expect(result.delay_minutes).toBe(44);
    });

    it('calls getLastEntryBefore with the ISO string of the given date', async () => {
      mockGetLastEntry.mockResolvedValue(null);
      const date = new Date('2026-08-08T13:30:00.000Z');
      await linkToLastEntry(date);
      expect(mockGetLastEntry).toHaveBeenCalledWith(date.toISOString());
    });
  });
});
