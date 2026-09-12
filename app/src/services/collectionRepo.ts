import { getDb } from '../db/client';
import { normalizeCode, validateQuantity } from '../lib/validators';
import { NotFoundError } from '../lib/errors';
import { fetchByCode } from './cardApi';
import { getRate, deriveBRL } from './exchangeApi';
import { ensureCached, getLocalPath } from './imageCache';
import * as FileSystem from 'expo-file-system/legacy';
import type { CollectionItem } from './valuation';

function rowToItem(row: any): CollectionItem {
  return {
    code: row.code,
    name: row.name,
    imageUrl: row.imageUrl,
    imageLocalPath: row.imageLocalPath,
    priceAtAcquisitionUSD: row.priceAtAcquisitionUSD,
    currentPriceUSD: row.currentPriceUSD,
    currentPriceBRL: row.currentPriceBRL,
    exchangeRateUsed: row.exchangeRateUsed,
    exchangeRateDate: row.exchangeRateDate,
    quantity: row.quantity,
    isFavorite: !!row.isFavorite,
    addedAt: row.addedAt,
    lastPriceSyncAt: row.lastPriceSyncAt,
  };
}

export async function listAll(): Promise<CollectionItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM collection_items ORDER BY addedAt DESC');
  // hidrata imageLocalPath se ainda não baixado mas existe no FS
  for (const r of rows) {
    if (!r.imageLocalPath) {
      const p = await getLocalPath(r.code).catch(() => null);
      if (p) r.imageLocalPath = p;
    }
  }
  return rows.map(rowToItem);
}

export async function listFavorites(): Promise<CollectionItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM collection_items WHERE isFavorite=1 ORDER BY addedAt DESC');
  return rows.map(rowToItem);
}

export async function getByCode(code: string): Promise<CollectionItem | null> {
  const c = normalizeCode(code);
  const db = await getDb();
  const row = await db.getFirstAsync<any>('SELECT * FROM collection_items WHERE code=?', [c]);
  return row ? rowToItem(row) : null;
}

export async function addByCode(rawCode: string): Promise<CollectionItem> {
  const code = normalizeCode(rawCode);
  const db = await getDb();
  const existing = await db.getFirstAsync<any>('SELECT * FROM collection_items WHERE code=?', [code]);

  // busca API e câmbio
  const card = await fetchByCode(code);
  const { rate, date } = await getRate().catch(() => ({ rate: null as any, date: null as any }));
  const priceUSD = card.priceUSD;
  const priceBRL = deriveBRL(priceUSD, rate ?? null);

  if (existing) {
    const newQty = existing.quantity + 1;
    const newBRL = deriveBRL(priceUSD ?? existing.currentPriceUSD, rate ?? existing.exchangeRateUsed);
    await db.runAsync(
      'UPDATE collection_items SET currentPriceUSD=?, currentPriceBRL=?, exchangeRateUsed=?, exchangeRateDate=?, quantity=?, lastPriceSyncAt=? WHERE code=?',
      [priceUSD ?? existing.currentPriceUSD, newBRL, rate ?? existing.exchangeRateUsed, date ?? existing.exchangeRateDate, newQty, new Date().toISOString(), code]
    );
    // atualiza cache se imageUrl mudou
    if (card.imageUrl !== existing.imageUrl) {
      await db.runAsync('UPDATE collection_items SET imageUrl=? WHERE code=?', [card.imageUrl, code]);
      await ensureCached(card.imageUrl, code).catch(() => {});
    }
    const updated = await db.getFirstAsync<any>('SELECT * FROM collection_items WHERE code=?', [code]);
    return rowToItem(updated);
  }

  const now = new Date().toISOString();
  const imageLocalPath = await ensureCached(card.imageUrl, code).catch(() => null);
  await db.runAsync(
    `INSERT INTO collection_items(code,name,imageUrl,imageLocalPath,priceAtAcquisitionUSD,currentPriceUSD,currentPriceBRL,exchangeRateUsed,exchangeRateDate,quantity,isFavorite,addedAt,lastPriceSyncAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [code, card.name, card.imageUrl, imageLocalPath, priceUSD, priceUSD, priceBRL, rate, date, 1, 0, now, now]
  );
  const row = await db.getFirstAsync<any>('SELECT * FROM collection_items WHERE code=?', [code]);
  return rowToItem(row);
}

export async function toggleFavorite(code: string): Promise<CollectionItem> {
  const c = normalizeCode(code);
  const db = await getDb();
  const row = await db.getFirstAsync<any>('SELECT isFavorite FROM collection_items WHERE code=?', [c]);
  if (!row) throw new NotFoundError('Carta não encontrada');
  const next = row.isFavorite ? 0 : 1;
  await db.runAsync('UPDATE collection_items SET isFavorite=? WHERE code=?', [next, c]);
  const updated = await db.getFirstAsync<any>('SELECT * FROM collection_items WHERE code=?', [c]);
  return rowToItem(updated);
}

export async function updateQuantity(code: string, quantity: number): Promise<CollectionItem> {
  validateQuantity(quantity);
  const c = normalizeCode(code);
  const db = await getDb();
  await db.runAsync('UPDATE collection_items SET quantity=? WHERE code=?', [quantity, c]);
  const row = await db.getFirstAsync<any>('SELECT * FROM collection_items WHERE code=?', [c]);
  if (!row) throw new NotFoundError('Carta não encontrada');
  return rowToItem(row);
}

export async function remove(code: string): Promise<void> {
  const c = normalizeCode(code);
  const db = await getDb();
  await db.runAsync('DELETE FROM collection_items WHERE code=?', [c]);
  // best-effort delete arquivo local
  const p = await getLocalPath(c).catch(() => null);
  if (p) {
    await FileSystem.deleteAsync(p, { idempotent: true }).catch(() => {});
  }
}

export async function search(query: string): Promise<CollectionItem[]> {
  const q = `%${query.trim()}%`;
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM collection_items WHERE name LIKE ? OR code LIKE ? ORDER BY addedAt DESC',
    [q, q]
  );
  return rows.map(rowToItem);
}

export async function resyncPrices(): Promise<{ updated: number; stale: number }> {
  const db = await getDb();
  const items = await db.getAllAsync<any>('SELECT code FROM collection_items');
  let updated = 0;
  let stale = 0;
  for (const it of items) {
    try {
      const card = await fetchByCode(it.code);
      const { rate, date } = await getRate().catch(() => ({ rate: null as any, date: null as any }));
      const priceBRL = deriveBRL(card.priceUSD, rate);
      await db.runAsync(
        'UPDATE collection_items SET currentPriceUSD=?, currentPriceBRL=?, exchangeRateUsed=?, exchangeRateDate=?, lastPriceSyncAt=? WHERE code=?',
        [card.priceUSD, priceBRL, rate, date, new Date().toISOString(), it.code]
      );
      updated++;
    } catch {
      stale++;
    }
  }
  return { updated, stale };
}
