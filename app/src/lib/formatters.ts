export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(value);
}

export function formatDual(priceUSD: number | null, priceBRL: number | null): string {
  if (priceUSD == null && priceBRL == null) return 'Preço indisponível';
  if (priceBRL != null && priceUSD != null) return `${formatBRL(priceBRL)} (${formatUSD(priceUSD)})`;
  if (priceBRL != null) return formatBRL(priceBRL);
  return formatUSD(priceUSD!);
}

export function formatDateISOToLocal(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function roundHalfEven(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
