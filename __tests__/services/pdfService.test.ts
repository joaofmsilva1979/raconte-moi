jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn().mockResolvedValue({ uri: 'file:///tmp/journal.pdf' }),
}));
jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///documents/',
  copyAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue(''),
  EncodingType: { Base64: 'base64' },
}));

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateJournalHtml, exportJournalAsPdf } from '@/services/pdfService';
import { Entry } from '@/types';

const mockEntries: Entry[] = [
  {
    id: 1,
    recorded_at: '2026-08-07T12:30:00',
    meal_type: 'lunch',
    transcript: 'Salade de quinoa',
    raw_text: 'salade quinoa',
    edited_at: null,
    created_at: '2026-08-07T12:30:00',
  },
  {
    id: 2,
    recorded_at: '2026-08-08T08:00:00',
    meal_type: 'breakfast',
    transcript: 'Café et tartines',
    raw_text: null,
    edited_at: null,
    created_at: '2026-08-08T08:00:00',
  },
];

describe('pdfService', () => {
  describe('generateJournalHtml', () => {
    let html: string;

    beforeAll(() => {
      html = generateJournalHtml(mockEntries, [], 'Eugénie', 'Août 2026', '#E85520');
    });

    it('contient le prénom Eugénie', () => {
      expect(html).toContain('Eugénie');
    });

    it('contient la période Août 2026', () => {
      expect(html).toContain('Août 2026');
    });

    it('contient les transcriptions des entrées', () => {
      expect(html).toContain('Salade de quinoa');
      expect(html).toContain('Café et tartines');
    });

    it('contient les labels de repas traduits', () => {
      expect(html).toContain('Déjeuner');
      expect(html).toContain('Petit-déjeuner');
    });

    it('contient la couleur primaire', () => {
      expect(html).toContain('#E85520');
    });

    it('contient le titre de l\'app', () => {
      expect(html).toContain('Raconte-moi');
    });
  });

  describe('exportJournalAsPdf', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('appelle Print.printToFileAsync avec le HTML contenant le prénom', async () => {
      await exportJournalAsPdf(mockEntries, [], 'Eugénie', 'Août 2026', '#E85520');
      expect(Print.printToFileAsync).toHaveBeenCalledWith({
        html: expect.stringContaining('Eugénie'),
      });
    });

    it('appelle Sharing.shareAsync avec un nom de fichier structuré et le mimeType PDF', async () => {
      await exportJournalAsPdf(mockEntries, [], 'Eugénie', 'Août 2026', '#E85520', '2026-08-01', '2026-08-13');
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        expect.stringContaining('NOTES-PATATE_Eugenie_DU20260801_AU20260813'),
        { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' }
      );
    });
  });
});
