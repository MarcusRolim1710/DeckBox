type LogPayload = Record<string, unknown>;

export function logInfo(message: string, payload?: LogPayload) {
  // Estruturado para diagnóstico de API sem expor segredos
  console.log(`[INFO] ${message}`, payload ?? {});
}

export function logError(message: string, payload?: LogPayload) {
  console.error(`[ERROR] ${message}`, payload ?? {});
}

export function logApiCall(params: {
  code: string;
  latencyMs: number;
  success: boolean;
  priceUSD: number | null;
  source: string;
}) {
  logInfo('cardApi.call', params);
}
