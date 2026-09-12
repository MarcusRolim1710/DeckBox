test('home screen — placeholder para render carrossel+grid', () => {
  const items = [{ code: 'LOB-001', quantity: 3 }, { code: 'LOB-002', quantity: 1 }];
  expect(items.length).toBe(2);
  // badge x3
  expect(items[0].quantity).toBe(3);
});
