# Contract: Collection Service (interno — domínio local)

**Spec**: [spec.md](../spec.md) | **Data Model**: [data-model.md](../data-model.md)

Este contrato documenta a interface interna consumida pelas screens (`Home`, `Valores`, `NovaCarta`, `CardDetail`) e testada em `tests/unit` e `tests/integration`. Não é API HTTP — é o boundary de domínio local-first.

## Interface `collectionRepo` (`src/services/collectionRepo.ts`)

```ts
// Normalização (FR-001/019)
function normalizeCode(raw: string): string // trim + toUpperCase + replace(/\s+/, '-') + validate ^[A-Z0-9]+-[0-9]+$
  // throws ValidationError se inválido

// CRUD
async function addByCode(code: string): Promise<CollectionItem>
// 1. normalizeCode(code)
// 2. cardApi.fetchByCode(normalized) -> {name, imageUrl, priceUSD}
// 3. exchangeApi.getRate() -> rate
// 4. INSERT ou UPDATE quantity++ (transação SQLite)
// 5. imageCache.download(imageUrl, code) -> imageLocalPath
// throws NotFoundError | NetworkError | ValidationError

async function listAll(): Promise<CollectionItem[]> // ORDER BY addedAt DESC
async function listFavorites(): Promise<CollectionItem[]> // WHERE isFavorite=1
async function getByCode(code: string): Promise<CollectionItem | null>

async function toggleFavorite(code: string): Promise<CollectionItem>
async function updateQuantity(code: string, quantity: number): Promise<CollectionItem> // quantity >=1 else ValidationError
async function remove(code: string): Promise<void> // + best-effort delete imageLocalPath

async function resyncPrices(): Promise<{ updated: number; stale: number }>
// para cada item: cardApi.fetchByCode + exchangeApi.getRate -> UPDATE currentPriceUSD/BRL
```

## Interface `valuation` (`src/services/valuation.ts`) — puro, sem I/O

```ts
function computeTotals(items: CollectionItem[]): {
  totalValueUSD: number; // SUM(currentPriceUSD * quantity) where currentPriceUSD != null
  totalValueBRL: number; // SUM(currentPriceBRL * quantity) where currentPriceBRL != null
  itemsWithoutPrice: number;
  breakdown: { code, name, quantity, priceUSD, priceBRL, subtotalUSD, subtotalBRL }[]
}
function formatDual(priceUSD: number | null, priceBRL: number | null, rate: number | null): string
// ex.: "R$ 61,70 (US$ 12,34)" ou "Preço indisponível" se null
```

## Interface `cardApi` (`src/services/cardApi.ts`)

```ts
async function fetchByCode(code: string): Promise<{ name: string; imageUrl: string; priceUSD: number | null }>
// GET https://db.ygoprodeck.com/api/v7/cardinfo.php?num=<code>
// mapeia cardmarket_price -> priceUSD, lança NotFoundError em 400/empty
```

## Interface `exchangeApi` (`src/services/exchangeApi.ts`)

```ts
async function getRate(): Promise<{ rate: number; date: string; source: string; isStale: boolean }>
// tenta cache do dia em exchange_rates; se ausente, fetch AwesomeAPI -> fallback exchangerate.host -> cache
async function getRateForDate(date: string): Promise<...> // para auditoria
```

## Interface `imageCache` (`src/services/imageCache.ts`)

```ts
async function ensureCached(imageUrl: string, code: string): Promise<string> // retorna imageLocalPath
async function getLocalPath(code: string): Promise<string | null>
async function clearAll(): Promise<void> // ação do usuário
```

## Contract Tests (comportamento observável)

- `addByCode("LOB-001")` com mock YGOPRODeck success → `listAll()` contém item com `quantity=1`, `priceAtAcquisitionUSD == currentPriceUSD`, `currentPriceBRL == round(USD*rate,2)`, `imageLocalPath` existe
- `addByCode("LOB-001")` duplicado → `quantity==2`, `priceAtAcquisitionUSD` inalterado
- `addByCode("XXX-999")` → throws `NotFoundError`, nenhum item criado
- `addByCode` com `cardmarket_price=""` → `currentPriceUSD==null`, `computeTotals` exclui da soma e `itemsWithoutPrice==1`
- `toggleFavorite` → `listFavorites()` reflete em ≤1s
- `updateQuantity(code,0)` → throws `ValidationError`
- `computeTotals` com 3 itens (5*1, null*2, 10*1) → `totalUSD==15`, `totalBRL` proporcional, `breakdown` com 3 linhas
- Offline: `listAll()` e `computeTotals()` funcionam sem rede; `addByCode` sem rede → `NetworkError` com retry

## Error Hierarchy

```
ValidationError (code inválido, quantity <1)
NotFoundError   (código não encontrado na API)
NetworkError    (timeout, offline, rate limit)
StorageError    (SQLite/FileSystem)
```
Todas as camadas de UI devem exibir mensagem `pt-BR` testável e oferecer retry quando `NetworkError`.
