jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///var/mobile/Containers/Data/Application/ABC/Documents/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
}));

import * as FileSystem from 'expo-file-system';
import {
  getLocalDbPath,
  getIcloudBackupPath,
  icloudBackupExists,
  backupToIcloud,
  restoreFromIcloud,
  isBackupDue,
} from '@/services/icloudService';

const mockGetInfoAsync = FileSystem.getInfoAsync as jest.MockedFunction<typeof FileSystem.getInfoAsync>;
const mockMakeDirectoryAsync = FileSystem.makeDirectoryAsync as jest.MockedFunction<typeof FileSystem.makeDirectoryAsync>;
const mockCopyAsync = FileSystem.copyAsync as jest.MockedFunction<typeof FileSystem.copyAsync>;

describe('icloudService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLocalDbPath', () => {
    it('retourne le chemin correct vers la base de données locale', () => {
      expect(getLocalDbPath()).toBe(
        'file:///var/mobile/Containers/Data/Application/ABC/Documents/SQLite/notesdepatate.db'
      );
    });
  });

  describe('getIcloudBackupPath', () => {
    it('retourne un chemin contenant com~apple~CloudDocs et Les notes de patate/backup.db', () => {
      const path = getIcloudBackupPath();
      expect(path).toContain('com~apple~CloudDocs');
      expect(path).toContain('Les notes de patate/backup.db');
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

  describe('icloudBackupExists', () => {
    it('retourne true quand le fichier existe', async () => {
      mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: false, uri: '', size: 0, modificationTime: 0 });
      await expect(icloudBackupExists()).resolves.toBe(true);
    });

    it('retourne false quand le fichier n\'existe pas', async () => {
      mockGetInfoAsync.mockResolvedValue({ exists: false, isDirectory: false, uri: '' });
      await expect(icloudBackupExists()).resolves.toBe(false);
    });
  });

  describe('backupToIcloud', () => {
    it('appelle makeDirectoryAsync puis copyAsync quand le dossier n\'existe pas', async () => {
      mockGetInfoAsync.mockResolvedValue({ exists: false, isDirectory: false, uri: '' });

      const result = await backupToIcloud();

      expect(mockMakeDirectoryAsync).toHaveBeenCalledTimes(1);
      expect(mockCopyAsync).toHaveBeenCalledTimes(1);
      expect(typeof result).toBe('string');
      expect(() => new Date(result)).not.toThrow();
    });

    it('retourne une string ISO date valide', async () => {
      mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: true, uri: '' });

      const result = await backupToIcloud();

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('n\'appelle pas makeDirectoryAsync quand le dossier existe déjà', async () => {
      mockGetInfoAsync.mockResolvedValue({ exists: true, isDirectory: true, uri: '' });

      await backupToIcloud();

      expect(mockMakeDirectoryAsync).not.toHaveBeenCalled();
      expect(mockCopyAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('restoreFromIcloud', () => {
    it('appelle copyAsync avec le chemin iCloud comme source et le chemin local comme destination', async () => {
      await restoreFromIcloud();

      expect(mockCopyAsync).toHaveBeenCalledTimes(1);
      const call = mockCopyAsync.mock.calls[0][0];
      expect(call.from).toContain('com~apple~CloudDocs');
      expect(call.from).toContain('Les notes de patate/backup.db');
      expect(call.to).toContain('SQLite/notesdepatate.db');
    });
  });
});
