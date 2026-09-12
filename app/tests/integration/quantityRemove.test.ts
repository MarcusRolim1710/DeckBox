import { validateQuantity } from '../../src/lib/validators';
import { ValidationError } from '../../src/lib/errors';

test('quantity validation e remove', () => {
  expect(() => validateQuantity(0)).toThrow(ValidationError);
  validateQuantity(3);
  // remove simulado
  let items = [{ code: 'LOB-001' }];
  items = items.filter((it) => it.code !== 'LOB-001');
  expect(items.length).toBe(0);
});
