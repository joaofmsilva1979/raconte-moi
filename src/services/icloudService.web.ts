// Web stub — iCloud/FileSystem/Sharing ne fonctionnent pas sur web
export async function isBackupDue(): Promise<boolean> { return false; }
export async function backupWithRetry(): Promise<string> { return new Date().toISOString(); }
export async function backupToIcloud(): Promise<void> {}
export async function exportBackup(): Promise<void> {}
export async function restoreFromIcloud(): Promise<void> {}
