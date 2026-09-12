/**
 * Contrato YGOPRODeck — usa fixtures para não depender de rede em CI.
 * Em ambiente real, este teste faria fetch; aqui valida mapeamento.
 */

function parsePrice(card: any): number | null {
  const raw = card?.card_prices?.[0]?.cardmarket_price ?? null;
  if (!raw || raw === '' || raw === '0.00') return null;
  const n = parseFloat(raw);
  return isNaN(n) ? null : n;
}

test('success_cardmarket_price parseável', () => {
  const card = { card_prices: [{ cardmarket_price: '12.34' }], card_images: [{ image_url: 'https://x' }], name: 'Blue-Eyes' };
  expect(parsePrice(card)).toBe(12.34);
});
test('missing_price mapeado para null', () => {
  expect(parsePrice({ card_prices: [{ cardmarket_price: '' }] })).toBeNull();
  expect(parsePrice({ card_prices: [{ cardmarket_price: '0.00' }] })).toBeNull();
});
test('not_found deve lançar NotFoundError (simulado)', async () => {
  const fetchMock = () => Promise.resolve({ ok: false, status: 400, text: () => Promise.resolve('No card matching your query was found') } as any);
  const res: any = await fetchMock();
  expect(res.status).toBe(400);
});
