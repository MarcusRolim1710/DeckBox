import { computeTotals } from '../../src/services/valuation';

test('valores — total dual e stale', () => {
  const items: any = [
    { code: 'A', name: 'A', quantity: 1, currentPriceUSD: 10, currentPriceBRL: 50, exchangeRateDate: '2026-09-12' },
    { code: 'B', name: 'B', quantity: 2, currentPriceUSD: null, currentPriceBRL: null, exchangeRateDate: null },
  ];
  const { totalValueBRL, totalValueUSD, itemsWithoutPrice } = computeTotals(items);
  expect(totalValueBRL).toBe(50);
  expect(totalValueUSD).toBe(10);
  expect(itemsWithoutPrice).toBe(1);
});
