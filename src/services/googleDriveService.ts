import * as AuthSession from 'expo-auth-session';
import * as FileSystem from 'expo-file-system/legacy';
import { getDatabase } from '@/db/database';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '@/config/googleDrive';

const DRIVE_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FOLDER_NAME = 'Les notes de patate — Backup';

export const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: TOKEN_URL,
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'lesnotesdepatate',
  path: 'google-auth',
});

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'email',
  'profile',
];

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: string; email: string }> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    }).toString(),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description ?? data.error);

  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

  // Decode email from id_token
  let email = '';
  if (data.id_token) {
    try {
      const payload = JSON.parse(atob(data.id_token.split('.')[1]));
      email = payload.email ?? '';
    } catch {}
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    email,
  };
}

// Get a fresh access token using the refresh token
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: string }> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }).toString(),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description ?? data.error);

  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };
}

// True if access token expires within the next 2 minutes
export function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() < Date.now() + 2 * 60 * 1000;
}

// Find or create the backup folder in Google Drive
async function ensureFolder(accessToken: string): Promise<string> {
  const q = encodeURIComponent(
    `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const res = await fetch(`${DRIVE_BASE}/files?q=${q}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (data.files?.length > 0) return data.files[0].id as string;

  const create = await fetch(`${DRIVE_BASE}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  const folder = await create.json();
  return folder.id as string;
}

// Backup the SQLite database to Google Drive
export async function backupToGoogleDrive(accessToken: string): Promise<void> {
  // Create a clean copy via VACUUM INTO
  const tempUri = (FileSystem.documentDirectory ?? '') + 'patate_export.db';
  const tempPath = tempUri.replace('file://', '');

  const db = await getDatabase();
  await db.execAsync(`VACUUM INTO '${tempPath}'`);

  const base64 = await FileSystem.readAsStringAsync(tempUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  await FileSystem.deleteAsync(tempUri, { idempotent: true });

  const folderId = await ensureFolder(accessToken);
  const today = new Date().toISOString().slice(0, 10);
  const fileName = `backup_${today}.db`;

  // Check if today's backup already exists (to update it instead of creating a new one)
  const q = encodeURIComponent(
    `name='${fileName}' and '${folderId}' in parents and trashed=false`
  );
  const existing = await fetch(`${DRIVE_BASE}/files?q=${q}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const existingData = await existing.json();
  const existingId: string | undefined = existingData.files?.[0]?.id;

  const boundary = 'patate_boundary';
  const metadata = JSON.stringify({
    name: fileName,
    ...(existingId ? {} : { parents: [folderId] }),
    mimeType: 'application/x-sqlite3',
  });

  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    `--${boundary}`,
    'Content-Type: application/x-sqlite3',
    'Content-Transfer-Encoding: base64',
    '',
    base64,
    `--${boundary}--`,
  ].join('\r\n');

  const url = existingId
    ? `${DRIVE_UPLOAD}/files/${existingId}?uploadType=multipart`
    : `${DRIVE_UPLOAD}/files?uploadType=multipart`;

  const upload = await fetch(url, {
    method: existingId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!upload.ok) {
    const err = await upload.json();
    throw new Error(err.error?.message ?? `Upload failed: ${upload.status}`);
  }
}

export interface DriveBackupFile {
  id: string;
  name: string;
  modifiedTime: string;
  size: string;
}

// List backup files in the Google Drive folder
export async function listBackups(accessToken: string): Promise<DriveBackupFile[]> {
  const q = encodeURIComponent(
    `name contains 'backup_' and name contains '.db' and trashed=false`
  );
  const res = await fetch(
    `${DRIVE_BASE}/files?q=${q}&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc&pageSize=10`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  return (data.files ?? []) as DriveBackupFile[];
}

// Download a backup file and replace the local database
export async function restoreFromGoogleDrive(
  accessToken: string,
  fileId: string
): Promise<void> {
  const res = await fetch(`${DRIVE_BASE}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);

  const blob = await res.blob();
  const reader = new FileReader();
  const base64 = await new Promise<string>((resolve, reject) => {
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const destUri = (FileSystem.documentDirectory ?? '') + 'SQLite/notesdepatate.db';
  await FileSystem.writeAsStringAsync(destUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
}
