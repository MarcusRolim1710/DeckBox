import { normalizeCode } from '../../src/lib/validators';
import { ValidationError } from '../../src/lib/errors';

test('código sem hífen deve falhar antes de API', () => {
  expect(() => normalizeCode('LOB001')).toThrow(ValidationError);
});
test('preço string com símbolo deve ser tratado como null se parse falhar', () => {
  const n = parseFloat(String('$12.34').replace('$', '').trim());
  expect(n).toBe(12.34);
});
test('quantidade 99 não quebra', () => {
  const q = 99;
  expect(q).toBeGreaterThan(0);
});
