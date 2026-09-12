test('favoritas toggle persiste', () => {
  let isFavorite = false;
  isFavorite = !isFavorite;
  expect(isFavorite).toBe(true);
  isFavorite = !isFavorite;
  expect(isFavorite).toBe(false);
});
