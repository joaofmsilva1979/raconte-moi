import * as FileSystem from 'expo-file-system/legacy';

const DB_NAME = 'notesdepatate.db';

export function getLocalDbPath(): string {
  return (FileSystem.documentDirectory ?? '') + 'SQLite/' + DB_NAME;
}

export function getIcloudBackupPath(): string | null {
  const doc = FileSystem.documentDirectory;
  if (!doc) return null;
  // Transforme /Documents/ en iCloud Drive
  const icloud = doc.replace('/Documents/', '/Library/Mobile Documents/com~apple~CloudDocs/');
  return icloud + 'Les notes de patate/backup.db';
}

export async function icloudBackupExists(): Promise<boolean> {
  const path = getIcloudBackupPath();
  if (!path) return false;
  const info = await FileSystem.getInfoAsync(path);
  return info.exists;
}

export async function backupToIcloud(): Promise<string> {
  const src = getLocalDbPath();
  const dest = getIcloudBackupPath();
  if (!dest) throw new Error('iCloud non disponible');
  // Crée le dossier parent si nécessaire
  const dir = dest.substring(0, dest.lastIndexOf('/'));
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  await FileSystem.copyAsync({ from: src, to: dest });
  return new Date().toISOString();
}

export async function restoreFromIcloud(): Promise<void> {
  const src = getIcloudBackupPath();
  if (!src) throw new Error('iCloud non disponible');
  const dest = getLocalDbPath();
  await FileSystem.copyAsync({ from: src, to: dest });
}

export function isBackupDue(lastBackupAt: string | null, intervalDays: number): boolean {
  if (!lastBackupAt) return true;
  const last = new Date(lastBackupAt).getTime();
  const now = Date.now();
  const elapsedDays = (now - last) / (1000 * 60 * 60 * 24);
  return elapsedDays >= intervalDays;
}
