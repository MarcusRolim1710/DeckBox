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

export async function fetchByCode(code: string): Promise<CardApiResult> {
  const start = Date.now();
  let priceUSD: number | null = null;
  try {
    const url = `${BASE_URL}?num=${encodeURIComponent(code)}`;
    const res = await fetch(url);
    const latency = Date.now() - start;
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      if (res.status === 400 || body.includes('No card')) {
        logApiCall({ code, latencyMs: latency, success: false, priceUSD: null, source: 'ygoprodeck' });
        throw new NotFoundError('Código não encontrado');
      }
      throw new NetworkError('Falha ao consultar API de cartas');
    }
    const json: any = await res.json();
    const data = json?.data?.[0];
    if (!data) throw new NotFoundError('Código não encontrado');
    priceUSD = parsePrice(data);
    const imageUrl: string = data?.card_images?.[0]?.image_url;
    if (!imageUrl) throw new NetworkError('Imagem não encontrada na resposta');
    logApiCall({ code, latencyMs: latency, success: true, priceUSD, source: 'ygoprodeck' });
    return { name: data.name, imageUrl, priceUSD };
  } catch (e: any) {
    if (e instanceof NotFoundError || e instanceof NetworkError) throw e;
    throw new NetworkError(e?.message ?? 'Erro de rede ao buscar carta');
  }
}
