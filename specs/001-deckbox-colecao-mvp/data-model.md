# Data Model: DeckBox — Álbum Digital (001-deckbox-colecao-mvp)

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md)

## Overview

MVP single-user local, 100% no aparelho. Sem backend. Entidades persistidas em **SQLite** (`expo-sqlite`) + cache de imagens em **FileSystem**. Valoração dual BRL/USD derivada de taxa diária.

## Entities

### 1. CollectionItem (tabela `collection_items`)

Representa a posse do usuário. PK = `code`. Um registro por `SET-NUMBER`, quantidade via `quantity` (badge `xN`).

| Campo | Tipo SQLite | Tipo TS | Regras | Notas |
|-------|-------------|---------|--------|-------|
| `code` | TEXT PK | `string` | `^[A-Z0-9]+-[0-9]+$` após normalização `trim().toUpperCase()`; único, imutável | Ex.: `LOB-001` |
| `name` | TEXT NOT NULL | `string` | não vazio, vem da API | Ex.: `Blue-Eyes White Dragon` |
| `imageUrl` | TEXT NOT NULL | `string` | URL https válida da API (`card_images[0].image_url`) | Remota |
| `imageLocalPath` | TEXT NULL | `string \| null` | caminho `FileSystem.cacheDirectory + deckbox/images/<code>.jpg` | Após download |
| `priceAtAcquisitionUSD` | REAL NULL | `number \| null` | `parseFloat(cardmarket_price)` ou null; **imutável** após insert | Auditoria |
| `currentPriceUSD` | REAL NULL | `number \| null` | mutável via ressincronização; null se API sem preço | Fonte da verdade |
| `currentPriceBRL` | REAL NULL | `number \| null` | derivado `round(currentPriceUSD * exchangeRateUsed, 2)` | Exibição principal |
| `exchangeRateUsed` | REAL NULL | `number \| null` | taxa USD→BRL usada no último sync | Ex.: 5.12 |
| `exchangeRateDate` | TEXT NULL | `string \| null` | ISO-8601 date (`YYYY-MM-DD`) da taxa | Para aviso stale |
| `quantity` | INTEGER NOT NULL | `number` | `>=1`, default 1; incremento em duplicata | Badge xN |
| `isFavorite` | INTEGER NOT NULL | `boolean` (0/1) | default 0 | Carrossel |
| `addedAt` | TEXT NOT NULL | `string` | ISO-8601 UTC no insert, `new Date().toISOString()` | Ordenação padrão desc |
| `lastPriceSyncAt` | TEXT NULL | `string \| null` | ISO-8601 UTC do último sync de preço | Auditoria |

**Índices**:
- `idx_collection_favorite` em `isFavorite` (carrossel)
- `idx_collection_addedAt` em `addedAt DESC` (grid)
- `idx_collection_name` em `name` (busca futura, opcional)

**Constraints**:
- `CHECK (quantity >= 1)`
- `CHECK (priceAtAcquisitionUSD IS NULL OR priceAtAcquisitionUSD >= 0)`
- `CHECK (currentPriceUSD IS NULL OR currentPriceUSD >= 0)`

**Transições**:
- Insert: `code` novo → `quantity=1`, `priceAtAcquisitionUSD = currentPriceUSD`, `currentPriceBRL` via taxa vigente, `imageLocalPath` após `downloadAsync` OK
- Duplicate insert: `code` existente → `quantity += 1` (ou `quantity = max(existing+1, requested)`), `currentPriceUSD` atualiza se diferente, `priceAtAcquisitionUSD` permanece
- Toggle favorite: `isFavorite = 1 - isFavorite`
- Edit quantity: `quantity = newVal` com validação `>=1`
- Remove: `DELETE WHERE code = ?` + `FileSystem.deleteAsync(imageLocalPath)` best-effort
- Ressincron: `currentPriceUSD = newUSD`, `currentPriceBRL = round(newUSD*rate,2)`, `exchangeRateUsed=rate`, `exchangeRateDate=today`, `lastPriceSyncAt=now`

### 2. ExchangeRate (tabela `exchange_rates`)

Cache diário da taxa USD→BRL.

| Campo | Tipo | Regras |
|-------|------|--------|
| `date` | TEXT PK | `YYYY-MM-DD` |
| `rate` | REAL NOT NULL | `>0` |
| `source` | TEXT NOT NULL | `awesomeapi` \| `exchangerate.host` \| `fallback` |
| `fetchedAt` | TEXT NOT NULL | ISO-8601 |

Uso: `collectionRepo` e `exchangeApi` resolvem taxa do dia para derivar `currentPriceBRL` sem nova rede para cada item.

### 3. Card (externo, não persistido) — YGOPRODeck DTO

```ts
type YgoProDeckCard = {
  id: number;
  name: string;
  card_images: { image_url: string; image_url_small: string }[];
  card_prices: { cardmarket_price: string; tcgplayer_price: string; ebay_price: string; amazon_price: string }[];
  card_sets?: { set_name: string; set_code: string; set_price: string }[];
}
```

Mapeamento: `name → CollectionItem.name`, `card_images[0].image_url → imageUrl`, `card_prices[0].cardmarket_price → priceUSD (parseFloat ou null)`. Validação de `set_code` exato opcional em `card_sets`.

### 4. Collection (agregado derivado, não tabela)

Calculado em `services/valuation.ts`:

```ts
type CollectionSummary = {
  totalItems: number;          // COUNT(*)
  totalCopies: number;         // SUM(quantity)
  totalValueUSD: number;       // SUM(currentPriceUSD * quantity) where not null
  totalValueBRL: number;       // SUM(currentPriceBRL * quantity) where not null
  favoritesCount: number;      // COUNT WHERE isFavorite=1
  itemsWithoutPrice: number;   // COUNT WHERE currentPriceUSD IS NULL
  items: CollectionItem[];
  exchangeRateCurrent: number | null;
  exchangeRateDate: string | null;
  isStale: boolean;            // exchangeRateDate < today
}
```

Invariantes (Constituição I): `totalValueBRL` e `totalValueUSD` são puros, reproduzíveis, testados com `SUM` ignorando `null` (nunca 0 silencioso).

## Validation Rules (do spec)

- FR-001/019: validação de `code` antes de API; FR-004/023: `imageLocalPath` via download; FR-005: duplicata incrementa; FR-008/009: dual totais; FR-010: `quantity >=1`; FR-012: `imageUrl` obrigatória; FR-015: formatação `pt-BR`; FR-018: `addedAt` UTC.

## State Transitions (visual)

```
[NovaCarta] --code válido + API OK--> [Preview] --Confirmar--> [Insert ou Increment quantity] --download imagem--> [Home grid+carrossel]
[Home] --toggle estrela--> [isFavorite flip] --> [carrossel atualiza]
[Detalhe] --editar quantity--> [UPDATE quantity] --> [Valores recalcula]
[Detalhe] --Remover + confirmar--> [DELETE] --> [Home/Valores atualizam]
[Valores] --ressincronizar--> [fetch YGOPRODeck + exchangeRate] --> [UPDATE currentPriceUSD/BRL]
```

## Migrations (expo-sqlite)

```sql
-- v1
CREATE TABLE IF NOT EXISTS collection_items (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  imageUrl TEXT NOT NULL,
  imageLocalPath TEXT,
  priceAtAcquisitionUSD REAL,
  currentPriceUSD REAL,
  currentPriceBRL REAL,
  exchangeRateUsed REAL,
  exchangeRateDate TEXT,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  isFavorite INTEGER NOT NULL DEFAULT 0,
  addedAt TEXT NOT NULL,
  lastPriceSyncAt TEXT
);
CREATE INDEX IF NOT EXISTS idx_collection_favorite ON collection_items(isFavorite);
CREATE INDEX IF NOT EXISTS idx_collection_addedAt ON collection_items(addedAt DESC);

CREATE TABLE IF NOT EXISTS exchange_rates (
  date TEXT PRIMARY KEY,
  rate REAL NOT NULL CHECK (rate > 0),
  source TEXT NOT NULL,
  fetchedAt TEXT NOT NULL
);
```

## Open Design Items (para tasks)

- Política de limpeza de cache de imagens (LRU por espaço) — fora do MVP, mas `imageCache.ts` deve expor `clearUnused()`.
- Ordenação padrão do grid: `addedAt DESC` (MVP) — documentado para futura busca/filtro.
