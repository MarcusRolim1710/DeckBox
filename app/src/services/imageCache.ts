import * as FileSystem from 'expo-file-system/legacy';

const DIR = (FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? 'file:///cache/') + 'deckbox/images/';

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
}

export async function ensureCached(imageUrl: string, code: string): Promise<string> {
  await ensureDir();
  const localPath = `${DIR}${code}.jpg`;
  const info = await FileSystem.getInfoAsync(localPath);
  if (info.exists) return localPath;
  const res = await FileSystem.downloadAsync(imageUrl, localPath);
  return res.uri;
}

export async function getLocalPath(code: string): Promise<string | null> {
  const p = `${DIR}${code}.jpg`;
  const info = await FileSystem.getInfoAsync(p);
  return info.exists ? p : null;
}

export async function clearAll(): Promise<void> {
  const info = await FileSystem.getInfoAsync(DIR);
  if (info.exists) await FileSystem.deleteAsync(DIR, { idempotent: true });
}
