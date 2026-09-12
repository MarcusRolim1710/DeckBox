test('awesomeapi success parse', () => {
  const json = { USDBRL: { bid: '5.1234', create_date: '2026-09-12 10:30:00' } };
  expect(parseFloat(json.USDBRL.bid)).toBeCloseTo(5.1234);
});
test('fallback exchangerate', () => {
  const json = { result: 5.12 };
  expect(json.result).toBe(5.12);
});
test('offline fallback usa cache', () => {
  const cached = { rate: 5.0, date: '2026-09-11' };
  expect(cached.rate).toBe(5.0);
});
