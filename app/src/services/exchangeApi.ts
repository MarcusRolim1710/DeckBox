import { getDb } from '../db/client';
import { NetworkError } from '../lib/errors';
import { roundHalfEven } from '../lib/formatters';

const AWESOME_URL = 'https://economia.awesomeapi.com.br/json/last/USD-BRL';
const FALLBACK_URL = 'https://api.exchangerate.host/convert?from=USD&to=BRL';

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getRate(): Promise<{ rate: number; date: string; source: string; isStale: boolean }> {
  const today = todayISODate();
  const db = await getDb();
  // tenta cache do dia
  const cached = await db.getFirstAsync<{ rate: number; date: string; source: string }>(
    'SELECT rate, date, source FROM exchange_rates WHERE date = ?',
    [today]
  );
  if (cached) return { rate: cached.rate, date: cached.date, source: cached.source, isStale: false };

  // tenta AwesomeAPI
  try {
    const res = await fetch(AWESOME_URL);
    if (res.ok) {
      const json: any = await res.json();
      const bid = parseFloat(json?.USDBRL?.bid);
      const createDate: string = json?.USDBRL?.create_date ?? today;
      const date = createDate.slice(0, 10);
      if (!isNaN(bid)) {
        await db.runAsync('INSERT OR REPLACE INTO exchange_rates(date, rate, source, fetchedAt) VALUES (?,?,?,?)', [
          today,
          bid,
          'awesomeapi',
          new Date().toISOString(),
        ]);
        return { rate: bid, date: today, source: 'awesomeapi', isStale: false };
      }
    }
  } catch {}

  // fallback
  try {
    const res = await fetch(FALLBACK_URL);
    if (res.ok) {
      const json: any = await res.json();
      const rate = json?.result ?? json?.info?.rate;
      const n = parseFloat(String(rate));
      if (!isNaN(n)) {
        await db.runAsync('INSERT OR REPLACE INTO exchange_rates(date, rate, source, fetchedAt) VALUES (?,?,?,?)', [
          today,
          n,
          'exchangerate.host',
          new Date().toISOString(),
        ]);
        return { rate: n, date: today, source: 'exchangerate.host', isStale: false };
      }
    }
  } catch {}

  // último cache disponível
  const last = await db.getFirstAsync<{ rate: number; date: string }>(
    'SELECT rate, date FROM exchange_rates ORDER BY date DESC LIMIT 1'
  );
  if (last) return { rate: last.rate, date: last.date, source: 'cache', isStale: true };
  throw new NetworkError('Cotação indisponível');
}

export function deriveBRL(priceUSD: number | null, rate: number | null): number | null {
  if (priceUSD == null || rate == null) return null;
  return roundHalfEven(priceUSD * rate, 2);
}
