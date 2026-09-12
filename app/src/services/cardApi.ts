import { NotFoundError, NetworkError } from '../lib/errors';
import { logApiCall } from '../lib/logger';

const BASE_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

export type CardApiResult = {
  name: string;
  imageUrl: string;
  priceUSD: number | null;
};

function parsePrice(card: any): number | null {
  const raw = card?.card_prices?.[0]?.cardmarket_price ?? card?.card_prices?.[0]?.tcgplayer_price ?? null;
  if (raw == null || raw === '' || raw === '0' || raw === '0.00') return null;
  const n = parseFloat(String(raw).replace('$', '').trim());
  return isNaN(n) ? null : n;
}

let cardSetsCache: Array<{ set_name: string; set_code: string }> | null = null;

async function getCardSets(): Promise<Array<{ set_name: string; set_code: string }>> {
  if (cardSetsCache) return cardSetsCache;
  try {
    const res = await fetch('https://db.ygoprodeck.com/api/v7/cardsets.php');
    if (!res.ok) return [];
    const json: any = await res.json();
    cardSetsCache = Array.isArray(json) ? json : json?.data ?? [];
    return cardSetsCache ?? [];
  } catch {
    return [];
  }
}

async function fetchBySetCodeFiltering(code: string): Promise<CardApiResult | null> {
  // Extrai prefixo do set (ex: LOB de LOB-001, BLZD de BLZD-EN015)
  const prefix = code.split('-')[0];
  const sets = await getCardSets();
  // tenta encontrar set_name cujo set_code corresponda ao prefixo
  const candidates = sets.filter((s) => s.set_code?.toUpperCase() === prefix);
  // se não encontrou, tenta busca direta por cardset com prefixo como nome parcial
  const setNames = candidates.length > 0 ? candidates.map((c) => c.set_name) : [];
  // fallback: se nenhum candidato, tenta usar o prefixo como nome direto (ex: LOB -> tenta LOB)
  const tryNames = setNames.length > 0 ? setNames : [prefix];

  for (const setName of tryNames.slice(0, 3)) {
    try {
      const url = `${BASE_URL}?cardset=${encodeURIComponent(setName)}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const json: any = await res.json();
      const data: any[] = json?.data ?? [];
      // procura exata por set_code
      for (const card of data) {
        const setsArr: any[] = card?.card_sets ?? [];
        const match = setsArr.find((cs: any) => (cs.set_code ?? '').toUpperCase() === code.toUpperCase());
        if (match) {
          const priceUSD = parsePrice(card);
          const imageUrl: string = card?.card_images?.[0]?.image_url;
          if (!imageUrl) continue;
          return { name: card.name, imageUrl, priceUSD };
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

export async function fetchByCode(code: string): Promise<CardApiResult> {
  const start = Date.now();
  let priceUSD: number | null = null;
  try {
    // Estratégia 1: tenta via ?num + offset (legado, pode falhar com 400)
    try {
      const url = `${BASE_URL}?num=${encodeURIComponent(code)}&offset=0`;
      const res = await fetch(url);
      if (res.ok) {
        const json: any = await res.json();
        const data = json?.data?.[0];
        if (data) {
          priceUSD = parsePrice(data);
          const imageUrl: string = data?.card_images?.[0]?.image_url;
          if (imageUrl) {
            const latency = Date.now() - start;
            logApiCall({ code, latencyMs: latency, success: true, priceUSD, source: 'ygoprodeck-num' });
            return { name: data.name, imageUrl, priceUSD };
          }
        }
      }
    } catch {
      // ignora e tenta próxima estratégia
    }

    // Estratégia 2: busca por set_code via cardsets -> cardset
    const viaSet = await fetchBySetCodeFiltering(code);
    if (viaSet) {
      const latency = Date.now() - start;
      logApiCall({ code, latencyMs: latency, success: true, priceUSD: viaSet.priceUSD, source: 'ygoprodeck-set' });
      return viaSet;
    }

    // Estratégia 3: fallback genérico - busca por nome parcial se o usuário colou algo como "yugioh_blzd-en015"
    // tenta buscar via fname com o código como termo
    try {
      const url = `${BASE_URL}?fname=${encodeURIComponent(code)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json: any = await res.json();
        const data: any[] = json?.data ?? [];
        // filtra novamente por set_code se houver
        for (const card of data) {
          const setsArr: any[] = card?.card_sets ?? [];
          if (setsArr.some((cs: any) => (cs.set_code ?? '').toUpperCase() === code.toUpperCase())) {
            priceUSD = parsePrice(card);
            const imageUrl: string = card?.card_images?.[0]?.image_url;
            if (imageUrl) {
              const latency = Date.now() - start;
              logApiCall({ code, latencyMs: latency, success: true, priceUSD, source: 'ygoprodeck-fname' });
              return { name: card.name, imageUrl, priceUSD };
            }
          }
        }
      }
    } catch {
      // ignora
    }

    const latency = Date.now() - start;
    logApiCall({ code, latencyMs: latency, success: false, priceUSD: null, source: 'ygoprodeck' });
    throw new NotFoundError('Código não encontrado');
  } catch (e: any) {
    if (e instanceof NotFoundError || e instanceof NetworkError) throw e;
    const latency = Date.now() - start;
    logApiCall({ code, latencyMs: latency, success: false, priceUSD: null, source: 'ygoprodeck' });
    throw new NetworkError(e?.message ?? 'Erro de rede ao buscar carta');
  }
}
