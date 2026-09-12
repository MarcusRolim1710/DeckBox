import { ValidationError } from './errors';

const CODE_REGEX = /^[A-Z0-9]+-[0-9]+$/;

export function normalizeCode(raw: string): string {
  if (!raw || typeof raw !== 'string') throw new ValidationError('Código não pode ser vazio');
  const normalized = raw.trim().toUpperCase().replace(/\s+/g, '-');
  if (!CODE_REGEX.test(normalized)) {
    throw new ValidationError('Formato inválido. Use SET-NÚMERO, ex.: LOB-001');
  }
  return normalized;
}

export function validateQuantity(q: number): void {
  if (!Number.isInteger(q) || q < 1) {
    throw new ValidationError('Quantidade deve ser pelo menos 1 (use Remover para excluir)');
  }
}
