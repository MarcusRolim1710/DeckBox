import { ValidationError } from './errors';

const CODE_REGEX = /^[A-Z0-9]+-[A-Z0-9-]+$/;

export function normalizeCode(raw: string): string {
  if (!raw || typeof raw !== 'string') throw new ValidationError('Código não pode ser vazio');
  // Trata prefixos comuns como "yugioh_" e normaliza underscores/espaços
  let s = raw.trim().toUpperCase();
  // remove prefixo YUGIOH_ se houver
  s = s.replace(/^YUGIOH[_-]/, '');
  // normaliza underscores e espaços para hífen, colapsa múltiplos hífens
  s = s.replace(/[\s_]+/g, '-').replace(/-+/g, '-');
  if (!CODE_REGEX.test(s)) {
    throw new ValidationError('Formato inválido. Use SET-NÚMERO, ex.: LOB-001 ou BLZD-EN015');
  }
  return s;
}

export function validateQuantity(q: number): void {
  if (!Number.isInteger(q) || q < 1) {
    throw new ValidationError('Quantidade deve ser pelo menos 1 (use Remover para excluir)');
  }
}
