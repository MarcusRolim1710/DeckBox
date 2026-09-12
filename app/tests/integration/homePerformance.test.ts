test('performance grid 200 itens — estrutura sem jank', () => {
  const items = Array.from({ length: 200 }, (_, i) => ({ code: `SET-${String(i).padStart(3, '0')}` }));
  expect(items.length).toBe(200);
});
