import {
  formatDate,
  formatDateLabel,
  formatTime,
  addDays,
} from '@/utils/dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('formats a date as YYYY-MM-DD', () => {
      expect(formatDate(new Date('2026-08-08T15:00:00'))).toBe('2026-08-08');
    });

    it('pads month and day with zeros', () => {
      expect(formatDate(new Date('2026-01-05T10:00:00'))).toBe('2026-01-05');
    });
  });

  describe('formatDateLabel', () => {
    const TODAY = new Date('2026-08-08T12:00:00');

    it('returns "Aujourd\'hui" for today', () => {
      expect(formatDateLabel('2026-08-08', TODAY)).toBe("Aujourd'hui");
    });

    it('returns "Hier" for yesterday', () => {
      expect(formatDateLabel('2026-08-07', TODAY)).toBe('Hier');
    });

    it('returns a French weekday + date label for older dates', () => {
      const label = formatDateLabel('2026-08-05', TODAY);
      expect(label).toMatch(/mer\. 5 août/);
    });
  });

  describe('formatTime', () => {
    it('extracts HH:MM from an ISO string', () => {
      expect(formatTime('2026-08-08T09:07:00.000Z')).toMatch(/^\d{2}:\d{2}$/);
    });

    it('pads hours and minutes with zeros', () => {
      const date = new Date('2026-08-08T09:07:00.000Z');
      const local = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
      expect(formatTime('2026-08-08T09:07:00.000Z')).toBe(local);
    });
  });

  describe('addDays', () => {
    it('adds positive days', () => {
      expect(addDays('2026-08-08', 1)).toBe('2026-08-09');
    });

    it('subtracts days with negative input', () => {
      expect(addDays('2026-08-08', -1)).toBe('2026-08-07');
    });

    it('crosses month boundaries correctly', () => {
      expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
    });
  });
});
