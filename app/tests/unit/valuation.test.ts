import { computeTotals } from '../../src/services/valuation';
import type { CollectionItem } from '../../src/services/valuation';

function item(over: Partial<CollectionItem>): CollectionItem {
  return {
    code: 'LOB-001',
    name: 'Blue-Eyes',
    imageUrl: 'https://x',
    imageLocalPath: null,
    priceAtAcquisitionUSD: 10,
    currentPriceUSD: 10,
    currentPriceBRL: 50,
    exchangeRateUsed: 5,
    exchangeRateDate: '2026-09-12',
    quantity: 1,
    isFavorite: false,
    addedAt: new Date().toISOString(),
    lastPriceSyncAt: null,
    ...over,
  };
}

test('SUM BRL/USD excluindo null', () => {
  const items = [item({ currentPriceUSD: 5, currentPriceBRL: 25, quantity: 1, code: 'A' }), item({ currentPriceUSD: null, currentPriceBRL: null, quantity: 2, code: 'B' }), item({ currentPriceUSD: 10, currentPriceBRL: 50, quantity: 1, code: 'C' })];
  const { totalValueUSD, totalValueBRL, itemsWithoutPrice } = computeTotals(items as any);
  expect(totalValueUSD).toBe(15);
  expect(totalValueBRL).toBe(75);
  expect(itemsWithoutPrice).toBe(1);
});

test('breakdown e subtotais', () => {
  const items = [item({ currentPriceUSD: 12.34, currentPriceBRL: 61.7, quantity: 2, code: 'LOB-001' })];
  const { breakdown } = computeTotals(items as any);
  expect(breakdown[0].subtotalUSD).toBe(24.68);
  expect(breakdown[0].subtotalBRL).toBe(123.4);
});
