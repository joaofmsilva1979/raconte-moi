import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase, closeAndResetDatabase } from '@/db/database';

const DB_NAME = 'notesdepatate.db';

export function getLocalDbPath(): string {
  return (FileSystem.documentDirectory ?? '') + 'SQLite/' + DB_NAME;
}

function getBackupsDir(): string {
  return (FileSystem.documentDirectory ?? '') + 'backups/';
}

function fsPathFromUri(uri: string): string {
  return uri.startsWith('file://') ? uri.slice(7) : uri;
}

async function ensureBackupsDir(): Promise<void> {
  const dir = getBackupsDir();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

async function pruneOldBackups(keep = 5): Promise<void> {
  const dir = getBackupsDir();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) return;
  const files = (await FileSystem.readDirectoryAsync(dir))
    .filter(f => f.endsWith('.db'))
    .sort();
  const toDelete = files.slice(0, Math.max(0, files.length - keep));
  await Promise.all(toDelete.map(f => FileSystem.deleteAsync(dir + f, { idempotent: true })));
}

export async function backupToIcloud(): Promise<string> {
  await ensureBackupsDir();
  const now = new Date();
  // backup_2026-08-13_1430.db
  const stamp = now.toISOString().slice(0, 16).replace('T', '_').replace(':', 'h');
  const destUri = getBackupsDir() + `backup_${stamp}.db`;
  const destPath = fsPathFromUri(destUri);

  // VACUUM INTO crée une copie propre et cohérente même pendant la lecture
  const db = await getDatabase();
  await db.runAsync(`VACUUM INTO '${destPath}'`);

  await pruneOldBackups(5);
  return now.toISOString();
}

export async function exportBackup(): Promise<void> {
  const isoDate = await backupToIcloud();
  const stamp = isoDate.slice(0, 16).replace('T', '_').replace(':', 'h');
  const fileUri = getBackupsDir() + `backup_${stamp}.db`;

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Le partage n\'est pas disponible sur cet appareil.');

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/octet-stream',
    dialogTitle: 'Exporter la sauvegarde',
    UTI: 'public.data',
  });
}

export async function restoreFromIcloud(): Promise<void> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return;

  const srcUri = result.assets[0].uri;
  const dest = getLocalDbPath();

  // Ferme et réinitialise la connexion SQLite avant d'écraser le fichier
  await closeAndResetDatabase();
  await FileSystem.copyAsync({ from: srcUri, to: dest });
}

export async function listLocalBackups(): Promise<string[]> {
  const dir = getBackupsDir();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) return [];
  const files = await FileSystem.readDirectoryAsync(dir);
  return files.filter(f => f.endsWith('.db')).sort().reverse();
}

export function isBackupDue(lastBackupAt: string | null, intervalDays: number): boolean {
  if (!lastBackupAt) return true;
  const elapsedDays = (Date.now() - new Date(lastBackupAt).getTime()) / (1000 * 60 * 60 * 24);
  return elapsedDays >= intervalDays;
}

export async function backupWithRetry(maxAttempts = 3): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await backupToIcloud();
    } catch (e) {
      lastError = e;
      if (attempt < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}
