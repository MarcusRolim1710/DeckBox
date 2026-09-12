import { roundHalfEven } from '../lib/formatters';

export type CollectionItem = {
  code: string;
  name: string;
  imageUrl: string;
  imageLocalPath: string | null;
  priceAtAcquisitionUSD: number | null;
  currentPriceUSD: number | null;
  currentPriceBRL: number | null;
  exchangeRateUsed: number | null;
  exchangeRateDate: string | null;
  quantity: number;
  isFavorite: boolean;
  addedAt: string;
  lastPriceSyncAt: string | null;
};

export type Breakdown = {
  code: string;
  name: string;
  quantity: number;
  priceUSD: number | null;
  priceBRL: number | null;
  subtotalUSD: number | null;
  subtotalBRL: number | null;
};

export function computeTotals(items: CollectionItem[]): {
  totalValueUSD: number;
  totalValueBRL: number;
  itemsWithoutPrice: number;
  breakdown: Breakdown[];
} {
  let totalUSD = 0;
  let totalBRL = 0;
  let without = 0;
  const breakdown: Breakdown[] = items.map((it) => {
    const priceUSD = it.currentPriceUSD;
    const priceBRL = it.currentPriceBRL;
    const hasPrice = priceUSD != null && priceBRL != null;
    if (!hasPrice && priceUSD == null) without += 1;
    const subtotalUSD = priceUSD != null ? roundHalfEven(priceUSD * it.quantity, 2) : null;
    const subtotalBRL = priceBRL != null ? roundHalfEven(priceBRL * it.quantity, 2) : null;
    if (subtotalUSD != null) totalUSD = roundHalfEven(totalUSD + subtotalUSD, 2);
    if (subtotalBRL != null) totalBRL = roundHalfEven(totalBRL + subtotalBRL, 2);
    return { code: it.code, name: it.name, quantity: it.quantity, priceUSD, priceBRL, subtotalUSD, subtotalBRL };
  });
  return { totalValueUSD: totalUSD, totalValueBRL: totalBRL, itemsWithoutPrice: without, breakdown };
}
