jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///var/mobile/Containers/Data/Application/ABC/Documents/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  readDirectoryAsync: jest.fn().mockResolvedValue([]),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

jest.mock('@/db/database', () => ({
  getDatabase: jest.fn().mockResolvedValue({
    runAsync: jest.fn().mockResolvedValue(undefined),
    execAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
  }),
  closeAndResetDatabase: jest.fn().mockResolvedValue(undefined),
}));

import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import {
  getLocalDbPath,
  backupToIcloud,
  restoreFromIcloud,
  isBackupDue,
} from '@/services/icloudService';

const mockGetInfoAsync = FileSystem.getInfoAsync as jest.MockedFunction<typeof FileSystem.getInfoAsync>;
const mockMakeDirectoryAsync = FileSystem.makeDirectoryAsync as jest.MockedFunction<typeof FileSystem.makeDirectoryAsync>;
const mockCopyAsync = FileSystem.copyAsync as jest.MockedFunction<typeof FileSystem.copyAsync>;
const mockGetDocumentAsync = DocumentPicker.getDocumentAsync as jest.Mock;

describe('icloudService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([]);
    (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getLocalDbPath', () => {
    it('retourne le chemin correct vers la base de données locale', () => {
      expect(getLocalDbPath()).toBe(
        'file:///var/mobile/Containers/Data/Application/ABC/Documents/SQLite/notesdepatate.db'
      );
    });
  });

  describe('isBackupDue', () => {
    it('retourne true quand lastBackupAt est null', () => {
      expect(isBackupDue(null, 7)).toBe(true);
    });

    it('retourne true quand 8 jours se sont écoulés (> 7)', () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 86400000).toISOString();
      expect(isBackupDue(eightDaysAgo, 7)).toBe(true);
    });

    it('retourne false quand seulement 1 jour s\'est écoulé (< 7)', () => {
      const oneDayAgo = new Date(Date.now() - 1 * 86400000).toISOString();
      expect(isBackupDue(oneDayAgo, 7)).toBe(false);
    });

    it('retourne true quand exactement 7 jours se sont écoulés (>= 7)', () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      expect(isBackupDue(sevenDaysAgo, 7)).toBe(true);
    });
  });

  describe('backupToIcloud', () => {
    it('retourne une string ISO date valide', async () => {
      mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: true, uri: '' });

      const result = await backupToIcloud();

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('crée le répertoire de sauvegarde quand il n\'existe pas', async () => {
      mockGetInfoAsync.mockResolvedValue({ exists: false, isDirectory: false, uri: '' });

      await backupToIcloud();

      expect(mockMakeDirectoryAsync).toHaveBeenCalledTimes(1);
    });

    it('ne crée pas le répertoire quand il existe déjà', async () => {
      mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: true, uri: '' });

      await backupToIcloud();

      expect(mockMakeDirectoryAsync).not.toHaveBeenCalled();
    });
  });

  describe('restoreFromIcloud', () => {
    it('ne fait rien quand le sélecteur est annulé', async () => {
      mockGetDocumentAsync.mockResolvedValue({ canceled: true });

      await restoreFromIcloud();

      expect(mockCopyAsync).not.toHaveBeenCalled();
    });

    it('appelle copyAsync avec le fichier sélectionné comme source', async () => {
      mockGetDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///tmp/backup.db' }],
      });

      await restoreFromIcloud();

      expect(mockCopyAsync).toHaveBeenCalledWith({
        from: 'file:///tmp/backup.db',
        to: expect.stringContaining('SQLite/notesdepatate.db'),
      });
    });
  });
});
