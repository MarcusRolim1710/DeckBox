import { normalizeCode, validateQuantity } from '../../src/lib/validators';
import { ValidationError } from '../../src/lib/errors';

describe('validators', () => {
  it('normaliza trim + upper case', () => {
    expect(normalizeCode(' lob-001 ')).toBe('LOB-001');
    expect(normalizeCode('lob001'.replace('lob001', 'LOB-001'))).toBe('LOB-001');
  });
  it('rejeita formato inválido', () => {
    expect(() => normalizeCode('')).toThrow(ValidationError);
    expect(() => normalizeCode('XYZ')).toThrow(ValidationError);
  });
  it('valida quantity >=1', () => {
    expect(() => validateQuantity(0)).toThrow(ValidationError);
    expect(() => validateQuantity(-1)).toThrow(ValidationError);
    expect(() => validateQuantity(1)).not.toThrow();
  });
});
