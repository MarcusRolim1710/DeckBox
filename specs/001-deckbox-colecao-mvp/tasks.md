# Tasks: DeckBox — Álbum Digital e Valoração de Coleção Yu-Gi-Oh

**Input**: Design documents from `/specs/001-deckbox-colecao-mvp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (ygoprodeck-api.yaml, exchange-rate-api.yaml, collection-service.md)
**Tech Stack**: React Native 0.75+ / Expo SDK 52 / TypeScript 5.5+ / expo-sqlite / expo-file-system / expo-image / FlashList / Zustand / React Navigation v6 / Jest + RN Testing Library + MSW
**Project Type**: mobile-app (Expo single project at `app/`)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- App root: `app/` (Expo managed)
- Source: `app/src/` with `navigation/`, `screens/`, `components/`, `services/`, `db/`, `store/`, `lib/`, `hooks/`
- Tests: `app/tests/unit/`, `app/tests/contract/`, `app/tests/integration/`
- All paths below are relative to repository root `C:\DEV\DeckBox\deckbox\`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure verification

- [x] T001 Verify Expo project structure per plan.md exists at `app/app.json`, `app/App.tsx`, `app/package.json`
- [x] T002 Verify and install dependencies via `app/package.json` (expo ~52.0.0, expo-sqlite ~15.0.0, expo-file-system ~18.0.0, expo-image ~2.0.0, @shopify/flash-list 1.7.1, zustand, react-navigation, zod, date-fns)
- [x] T003 [P] Configure linting and formatting tools in `app/.eslintrc.json` and `app/.prettierrc`
- [x] T004 [P] Verify TypeScript config in `app/tsconfig.json` and Jest config in `app/jest.config.js` with `jest-expo` preset

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Implement SQLite schema migrations in `app/src/db/schema.ts` with `CREATE TABLE collection_items (code TEXT PRIMARY KEY, name TEXT NOT NULL, imageUrl TEXT NOT NULL, imageLocalPath TEXT, priceAtAcquisitionUSD REAL CHECK (priceAtAcquisitionUSD IS NULL OR priceAtAcquisitionUSD >= 0), currentPriceUSD REAL CHECK (currentPriceUSD IS NULL OR currentPriceUSD >= 0), currentPriceBRL REAL, exchangeRateUsed REAL, exchangeRateDate TEXT, quantity INTEGER NOT NULL CHECK (quantity >= 1), isFavorite INTEGER NOT NULL DEFAULT 0, addedAt TEXT NOT NULL, lastPriceSyncAt TEXT)` and indices `idx_collection_favorite ON collection_items(isFavorite)`, `idx_collection_addedAt ON collection_items(addedAt DESC)`, `idx_collection_name ON collection_items(name)` plus `exchange_rates (date TEXT PK, rate REAL NOT NULL CHECK (rate > 0), source TEXT NOT NULL, fetchedAt TEXT NOT NULL)`
- [x] T006 Implement SQLite client and migration runner in `app/src/db/client.ts` (expo-sqlite openDatabase, `migrate()` with `CREATE TABLE IF NOT EXISTS`, version tracking)
- [x] T007 [P] Implement error hierarchy in `app/src/lib/errors.ts` with `ValidationError`, `NotFoundError`, `NetworkError`, `StorageError` extending Error with `name` and testable `pt-BR` messages
- [x] T008 [P] Implement structured logger in `app/src/lib/logger.ts` for API calls logging `code`, `latency`, `success/failure`, `price` without exposing secrets
- [x] T009 [P] Implement code validators in `app/src/lib/validators.ts` with `normalizeCode(raw: string): string` applying `trim().toUpperCase().replace(/\s+/, '-')` and validating against `"^[A-Z0-9]+-[0-9]+$"` (FR-019) throwing `ValidationError` if invalid, plus `validateQuantity(n: number)` enforcing `">=1"` with message `"Quantidade deve ser pelo menos 1 (use Remover para excluir)"`
- [x] T010 [P] Implement formatters in `app/src/lib/formatters.ts` using `Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'})` as `R$ 12,34` and `Intl.NumberFormat('pt-BR', {style:'currency', currency:'USD'})` as `US$ 12.34` with `formatDual()` returning `"R$ X (US$ Y)"`, `roundHalfEven(value, 2)` for `currentPriceBRL = round(currentPriceUSD * rate, 2)`, and date `pt-BR` display from ISO-8601 UTC `addedAt`
- [x] T011 Implement navigation skeleton in `app/src/navigation/AppNavigator.tsx` with React Navigation v6 `BottomTabs` exactly 3 destinations `Home | Valores | NovaCarta` (FR-014) plus `native-stack` for `CardDetailScreen` modal
- [x] T012 Implement Zustand store skeleton in `app/src/store/collectionStore.ts` with state `items: CollectionItem[]`, `favorites`, `totalsBRL/USD`, `exchangeRate`, `isStale` and actions `load`, `addByCode`, `toggleFavorite`, `updateQuantity`, `remove`, `resyncPrices`
- [x] T013 Configure test setup in `app/tests/setup.ts` with `jest-expo` mocks, `msw`/`fetch-mock` setup and `expo-sqlite`/`expo-file-system` mocks for unit/contract/integration

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Cadastrar nova carta pelo código (Priority: P1) 🎯 MVP

**Goal**: Colecionador informa apenas `SET-NUMBER` (ex.: `LOB-001`), sistema consulta YGOPRODeck, exibe preview (imagem+nome+preço) para confirmação e persiste com `quantity=1` ou incrementa duplicata

**Independent Test**: Mockar YGOPRODeck `GET /cardinfo.php?num=LOB-001` retornando `{name, card_images[0].image_url, card_prices[0].cardmarket_price}`, chamar `addByCode(" lob-001 ")` e verificar `collection_items` contém `code="LOB-001"`, `quantity=1`, `priceAtAcquisitionUSD==currentPriceUSD`, `currentPriceBRL==round(USD*rate,2)`, `imageLocalPath` existe; duplicata incrementa para `x2` sem duplicar registro; `XXX-999` lança `NotFoundError` com mensagem "Código não encontrado"

### Tests for User Story 1

- [x] T014 [P] [US1] Contract test for YGOPRODeck success in `app/tests/contract/ygoprodeck.test.ts` covering `success_cardmarket_price` (status 200, has `data[0].name`, `data[0].card_images[0].image_url`, `data[0].card_prices[0].cardmarket_price`, `price_parsable: true`)
- [x] T015 [P] [US1] Contract test for YGOPRODeck not-found in `app/tests/contract/ygoprodeck.test.ts` covering `not_found` (status 400, `error_contains: "No card"`, throws `NotFoundError` with "Código não encontrado")
- [x] T016 [P] [US1] Contract test for missing price in `app/tests/contract/ygoprodeck.test.ts` covering `missing_price` (status 200, `cardmarket_price` empty, mapped to `null`, `computeTotals` excludes with warning "Preço indisponível — não entra na soma")
- [x] T017 [P] [US1] Contract test for malformed response in `app/tests/contract/ygoprodeck.test.ts` covering `malformed_response` (handles gracefully, shows retry affordance, throws `NetworkError`)
- [x] T018 [P] [US1] Unit test for code normalization in `app/tests/unit/validators.test.ts` covering `trim + toUpperCase + replace(/\s+/, '-')`, regex `"^[A-Z0-9]+-[0-9]+$"`, and `ValidationError` for `LOB001`/`lob 001` edge cases

### Implementation for User Story 1

- [x] T019 [P] [US1] Implement YGOPRODeck client in `app/src/services/cardApi.ts` with `fetchByCode(code: string): Promise<{name, imageUrl, priceUSD}>` doing `GET https://db.ygoprodeck.com/api/v7/cardinfo.php?num=<code>` mapping `data[0].name -> name`, `data[0].card_images[0].image_url -> imageUrl`, `parseFloat(data[0].card_prices[0].cardmarket_price) || parseFloat(tcgplayer_price) || null -> priceUSD`, validating `imageUrl` mandatory, throwing `NotFoundError` on 400/empty, `NetworkError` on timeout/rate-limit, logging `code/latency/success/price`
- [x] T020 [P] [US1] Implement exchange rate service in `app/src/services/exchangeApi.ts` with `getRate(): Promise<{rate, date, source, isStale}>` checking cache `exchange_rates` for today, fetching AwesomeAPI `GET https://economia.awesomeapi.com.br/json/last/USD-BRL` parsing `parseFloat(USDBRL.bid)` as primary, fallback `GET https://api.exchangerate.host/convert?from=USD&to=BRL` parsing `result || info.rate`, caching via `INSERT OR REPLACE INTO exchange_rates(date, rate, source, fetchedAt)`, returning `isStale=true` when `exchangeRateDate < today`, and `currentPriceBRL = roundHalfEven(currentPriceUSD * rate, 2)` derivation
- [x] T021 [P] [US1] Implement image cache service in `app/src/services/imageCache.ts` with `ensureCached(imageUrl: string, code: string): Promise<string>` using `FileSystem.downloadAsync(imageUrl, FileSystem.cacheDirectory + 'deckbox/images/<CODE>.jpg')`, persisting `imageLocalPath`, `getLocalPath(code)`, and `clearAll()` for user action
- [x] T022 [US1] Implement collection repository addByCode in `app/src/services/collectionRepo.ts` with `addByCode(code: string): Promise<CollectionItem>` steps: 1) `normalizeCode(code)` with `trim().toUpperCase()` and regex `"^[A-Z0-9]+-[0-9]+$"` (FR-001/FR-019), 2) `cardApi.fetchByCode(normalized)`, 3) `exchangeApi.getRate()`, 4) SQLite transaction `INSERT` with `quantity=1`, `priceAtAcquisitionUSD = currentPriceUSD` (immutable), `currentPriceBRL = round(USD*rate,2)`, `exchangeRateUsed`, `exchangeRateDate`, `addedAt = new Date().toISOString()` or `UPDATE quantity = quantity+1` keeping `priceAtAcquisitionUSD` unchanged and updating `currentPriceUSD/BRL` if different (FR-005), 5) `imageCache.ensureCached(imageUrl, code)`, 6) idempotency guard against double-tap Confirmar, throwing `ValidationError | NotFoundError | NetworkError` with `pt-BR` messages
- [x] T023 [US1] Implement Nova Carta screen in `app/src/screens/NovaCartaScreen.tsx` with input for `code`, normalização live feedback for invalid format, async fetch preview showing `image`, `name`, `price` as `"R$ X (US$ Y)"` or `"Preço indisponível — não entra na soma"`, Confirmar button persisting via `collectionRepo.addByCode`, error states "Código não encontrado" (≤2s), "Código inválido", API offline/timeout with "Tentar novamente", and success navigation to Home grid showing tile in ≤3s (SC-001/SC-002)
- [x] T024 [US1] Integration test for Nova Carta flow in `app/tests/integration/novaCartaFlow.test.ts` covering valid code ` lob-001 ` normalized → saved, duplicate increments `quantity` to 3 preserving `priceAtAcquisitionUSD`, invalid `XXX-999` shows error without partial record, price=null saved with aviso, and offline `addByCode` throws `NetworkError` while `listAll()` remains readable

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently — cadastro via código com API-verified identity, dual price derivation, and local persistence

---

## Phase 4: User Story 2 - Visualizar álbum e carrossel de favoritas na Home (Priority: P1)

**Goal**: Home como fichário digital: carrossel horizontal de favoritas no topo + grid do álbum com todas as cartas (imagem+nome+badge xN), empty state com CTA, rolagem fluida até 500 itens

**Independent Test**: Popular `collection_items` com 10 cartas (3 com `isFavorite=1`) e verificar `HomeScreen` renderiza carrossel 3 itens rolagem horizontal + grid 10 tiles com `imageLocalPath` prioritário fallback `imageUrl`, placeholder se ambos falharem, badge `xN` para `quantity>1`, e coleção vazia mostra `EmptyState` com CTA "Adicionar primeira carta" → Nova Carta

### Implementation for User Story 2

- [x] T025 [P] [US2] Implement CardTile component in `app/src/components/CardTile.tsx` displaying card `image` prioritizing `imageLocalPath` fallback to `imageUrl` (FR-012), placeholder with `name/code` on failure with retry, `name` below image, `quantity` badge `xN` (e.g., `x3`), star icon for `isFavorite` toggle reachable in ≤2 taps (FR-007), optimized for FlashList with `expo-image` `contentFit="cover"` and `transition`
- [x] T026 [P] [US2] Implement FavoriteCarousel component in `app/src/components/FavoriteCarousel.tsx` as horizontal `FlashList`/`FlatList` rendering `listFavorites()` (WHERE `isFavorite=1`) with highlighted images, empty state message "Nenhuma favorita ainda — toque na estrela para destacar" when `favoritesCount==0` without breaking layout (FR-006)
- [x] T027 [P] [US2] Implement EmptyState component in `app/src/components/EmptyState.tsx` for empty collection showing message and CTA button "Adicionar primeira carta" navigating to `NovaCarta` (FR-006, SC-004)
- [x] T028 [US2] Implement HomeScreen in `app/src/screens/HomeScreen.tsx` composing `FavoriteCarousel` (top) + album `FlashList` grid with `numColumns=3`, `estimatedItemSize`, `ORDER BY addedAt DESC` (default ordering, data-model), offline reading from SQLite + `imageLocalPath` cache (FR-016), pull-to-refresh, and navigation to `CardDetailScreen` on tile press
- [x] T029 [P] [US2] Extend collection repository read methods in `app/src/services/collectionRepo.ts` with `listAll(): Promise<CollectionItem[]> ORDER BY addedAt DESC`, `listFavorites(): Promise<CollectionItem[]> WHERE isFavorite=1`, `getByCode(code)` for Home data sourcing (if not already implemented in US1)
- [x] T030 [US2] Integration test for Home rendering in `app/tests/integration/homeScreen.test.tsx` verifying 5 cartas (2 favoritas) → carrossel 2 + grid 5, empty collection → EmptyState with CTA, `quantity=3` shows `x3` badge, 50/200 items scroll without jank >200ms, placeholder on image failure, and offline modo avião still shows cached images (SC-004/SC-010)
- [x] T031 [P] [US2] Performance harness in `app/tests/integration/homePerformance.test.ts` seeding 500 items and asserting Home renders without freeze >200ms, FlashList maintains 60fps target, `computeTotals` <100ms

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently — cadastro populates Home album with carrossel+grid

---

## Phase 5: User Story 3 - Consultar valor total da coleção (Priority: P1)

**Goal**: Tela Valores exibe valoração determinística auditável dual `totalBRL = SUM(currentPriceBRL*quantity)` principal + `totalUSD = SUM(currentPriceUSD*quantity)` secundário com breakdown itemizado e tratamento `price=null`

**Independent Test**: Criar 3 cartas (USD 5×1, USD 10×1 com BRL 51.20, null×2) e verificar Valores mostra `Total: R$ 89,60 (US$ 17,50)` ou cálculo equivalente, breakdown `código|nome|qtd|unit BRL (USD)|subtotal`, carta sem preço excluída com contador "1 carta sem preço" e aviso, coleção vazia mostra "Sua coleção ainda não tem valor — adicione cartas" com total 0, ressincronização atualiza `currentPriceUSD/BRL` mantendo `priceAtAcquisitionUSD` imutável

### Tests for User Story 3

- [x] T032 [P] [US3] Unit tests for valuation arithmetic in `app/tests/unit/valuation.test.ts` covering `computeTotals(items)` pure `SUM(currentPriceBRL*quantity)` and `SUM(currentPriceUSD*quantity)` where not null, `itemsWithoutPrice` count, `priceAtAcquisitionUSD` immutability, rounding `roundHalfEven(USD*rate,2)`, and edge `price=null` excluded not as 0 silently (Constitution I)
- [x] T033 [P] [US3] Contract tests for exchange rate in `app/tests/contract/exchangeRate.test.ts` covering `awesomeapi_success` (status 200 has `USDBRL.bid` parsable), `exchangerate_fallback` (status 200 has `result` parsable), `offline_fallback` (uses cached rate, shows stale warning, keeps USD)

### Implementation for User Story 3

- [x] T034 [P] [US3] Implement valuation domain service in `app/src/services/valuation.ts` with `computeTotals(items: CollectionItem[]): {totalValueUSD, totalValueBRL, itemsWithoutPrice, breakdown: {code,name,quantity,priceUSD,priceBRL,subtotalUSD,subtotalBRL}[]}` as pure reproducible `SUM(*quantity)` ignoring `null` (never 0), `formatDual(priceUSD, priceBRL)` returning `"R$ 61,70 (US$ 12,34)"` or `"Preço indisponível"`, and `CollectionSummary` type with `totalItems`, `totalCopies`, `favoritesCount`, `exchangeRateCurrent`, `isStale`
- [x] T035 [P] [US3] Implement PriceBadge component in `app/src/components/PriceBadge.tsx` showing `R$ X (US$ Y)` via `Intl.NumberFormat pt-BR` (FR-015) with `price=null` displaying "Preço indisponível — não entra na soma" and stale rate warning "Cotação de DD/MM"
- [x] T036 [US3] Implement ValoresScreen in `app/src/screens/ValoresScreen.tsx` showing `totalBRL` principal large + `totalUSD` secondary, `FlatList` breakdown itemizado (`code`, `name`, `qtd`, `unit BRL/USD`, `subtotal BRL/USD`), seção "X cartas sem preço" excluídas, empty state `total 0` with "Sua coleção ainda não tem valor — adicione cartas", stale `exchangeRateDate < today` warning, offline support using last known prices (FR-008/FR-016), and expandable audit detail showing `priceAtAcquisitionUSD`, `currentPriceUSD/BRL`, `exchangeRateUsed`, `lastPriceSyncAt` (FR-009)
- [x] T037 [US3] Implement resync logic in `app/src/services/collectionRepo.ts` with `resyncPrices(): Promise<{updated, stale}>` iterating items `cardApi.fetchByCode` + `exchangeApi.getRate` → `UPDATE currentPriceUSD=newUSD, currentPriceBRL=round(newUSD*rate,2), exchangeRateUsed=rate, exchangeRateDate=today, lastPriceSyncAt=now` where price changed, keeping `priceAtAcquisitionUSD` immutable
- [x] T038 [US3] Integration test for Valores in `app/tests/integration/valoresScreen.test.tsx` covering 3 cartas totals 45 with breakdown, null price excluded with counter, empty 0 with message, resync reflects new price preserving acquisition, and user can explain total from breakdown (SC-003/SC-009)

**Checkpoint**: At this point, User Stories 1, 2 AND 3 should all work independently — the 3 P1 stories form the MVP core (cadastro → álbum → valoração)

---

## Phase 6: User Story 4 - Gerenciar cartas favoritas (Priority: P2)

**Goal**: Alternar `isFavorite` em ≤2 toques (estrela no tile e no detalhe) refletindo no carrossel em ≤1s e persistindo após reload

**Independent Test**: Tocar estrela em tile não favorito → `isFavorite` true, carrossel ganha 1 item em ≤1s sem reload; desfavoritar no carrossel → sai do carrossel mas fica no grid; nenhuma favorita → carrossel mostra mensagem discreta sem quebrar layout; fechar/reabrir app persiste estado (SC-006)

### Implementation for User Story 4

- [x] T039 [P] [US4] Implement toggleFavorite in `app/src/services/collectionRepo.ts` with `toggleFavorite(code: string): Promise<CollectionItem>` doing `UPDATE collection_items SET isFavorite = 1 - isFavorite WHERE code = ?` and returning updated item
- [x] T040 [US4] Implement favorite toggle in CardTile in `app/src/components/CardTile.tsx` wiring star icon to `collectionRepo.toggleFavorite` + `collectionStore` update with optimistic UI and ≤1s carousel reflection
- [x] T041 [US4] Implement favorite handling in FavoriteCarousel in `app/src/components/FavoriteCarousel.tsx` subscribing to store `favorites`, animating add/remove, empty state handling
- [x] T042 [US4] Implement CardDetailScreen favorite toggle in `app/src/screens/CardDetailScreen.tsx` showing large image (priority `imageLocalPath`), `name`, `code`, full price audit (`priceAtAcquisitionUSD`, `currentPriceUSD/BRL`, `exchangeRateUsed`, `lastPriceSyncAt`), star toggle, and ensuring toggle from detail syncs Home carrossel/grid
- [x] T043 [US4] Wire Zustand favorites sync in `app/src/store/collectionStore.ts` ensuring `toggleFavorite` updates `items` and `favorites` derived `COUNT WHERE isFavorite=1` and persists to SQLite
- [x] T044 [US4] Integration test for favorites in `app/tests/integration/favorites.test.ts` covering toggle via tile → carrossel updates ≤1s, unfavorite removes from carousel keeps grid, empty carousel message, and persistence after reload (SC-006)

**Checkpoint**: At this point, favoritas complement emotional value of the album without breaking P1 flows

---

## Phase 7: User Story 5 - Gerenciar quantidade e remover cartas (Priority: P2)

**Goal**: Editar `quantity >=1` e remover com confirmação, atualizando grid badge `xN`, carrossel, e Valores total em ≤500ms consistentemente

**Independent Test**: Editar `quantity` 1→3 via detalhe → badge `x3`, Valores recalcula subtotal; tentar `quantity=0` → rejeita com "Quantidade deve ser pelo menos 1 (use Remover para excluir)"; remover com diálogo "Remover [nome] da coleção?" → delete, grid/carrossel atualizam, total recalcula; validar `CHECK (quantity >= 1)` at DB level (SC-007)

### Implementation for User Story 5

- [x] T045 [P] [US5] Implement updateQuantity in `app/src/services/collectionRepo.ts` with `updateQuantity(code: string, quantity: number): Promise<CollectionItem>` validating `quantity >=1` else throwing `ValidationError` with "Quantidade deve ser pelo menos 1 (use Remover para excluir)" (FR-010), `CHECK (quantity >= 1)` at SQLite, and `UPDATE quantity = ?`
- [x] T046 [P] [US5] Implement remove in `app/src/services/collectionRepo.ts` with `remove(code: string): Promise<void>` doing `DELETE WHERE code = ?` + best-effort `FileSystem.deleteAsync(imageLocalPath)` and clearing store entry
- [x] T047 [US5] Implement quantity editing UI in `app/src/screens/CardDetailScreen.tsx` adding stepper/input for `quantity` with validation `>=1`, error message display, optimistic `collectionStore` update, and Valores recalculation in ≤500ms
- [x] T048 [US5] Implement remove confirmation dialog in `app/src/screens/CardDetailScreen.tsx` showing `Alert` "Remover [nome] da coleção?" with Confirmar/Cancelar, performing `collectionRepo.remove` and navigating back to Home with grid/carrossel refresh
- [x] T049 [US5] Wire quantity/remove sync in `app/src/store/collectionStore.ts` ensuring `updateQuantity`/`remove` recompute `totalValueBRL/USD` via `valuation.computeTotals` and update `totalCopies`/`totalItems`
- [x] T050 [US5] Integration test for quantity and remove in `app/tests/integration/quantityRemove.test.ts` covering edit 1→3 badge and Valores recalc, 0/negative rejected, remove dialog confirmed deletes and recalculates, and transaction idempotency

**Checkpoint**: At this point, US5 ensures collection fidelity to physical collection and correct valuation with quantity

---

## Phase 8: User Story 6 - Buscar e filtrar vibe futura (Priority: P3) — Preparatória

**Goal**: Arquitetura não bloqueia busca/filtro futuro; modelo suporta busca por `name`/`code` substring em <500ms e ordenação padrão estável `addedAt DESC`

**Independent Test**: Com 100 cartas, chamar `searchByName("blue")` ou `listAll` filtrado retorna em <500ms; limpar filtro restaura `ORDER BY addedAt DESC`; índice `idx_collection_name` existe

### Implementation for User Story 6

- [x] T051 [P] [US6] Verify and document default ordering in `app/src/services/collectionRepo.ts` ensuring `listAll()` uses `ORDER BY addedAt DESC` (MVP default, data-model) stable after filter clear
- [x] T052 [P] [US6] Implement search helper in `app/src/services/collectionRepo.ts` with `search(query: string): Promise<CollectionItem[]>` doing `SELECT WHERE name LIKE %query% OR code LIKE %query%` using `idx_collection_name` and asserting <500ms for 100 items
- [x] T053 [US6] Add preparatory unit test in `app/tests/unit/edgeCases.test.ts` covering search substring performance and default ordering stability (without building filter UI per Constitution III deferral)

**Checkpoint**: US6 is non-blocking architectural readiness — no UI required for MVP

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, resiliência, and validation

- [x] T054 [P] Implement offline resilience in `app/src/screens/HomeScreen.tsx` and `app/src/screens/ValoresScreen.tsx` handling `NetworkError` with retry affordance and displaying cached data + stale warning when `exchangeRateDate < today` (FR-013/FR-016, SC-008)
- [x] T055 [P] Implement image fallback resilience in `app/src/components/CardTile.tsx` and `app/src/screens/CardDetailScreen.tsx` showing placeholder with `name/code` when both `imageLocalPath` and `imageUrl` fail, with retry `imageCache.ensureCached` (FR-012)
- [x] T056 [P] Implement duplicate rapid-tap idempotency guard in `app/src/screens/NovaCartaScreen.tsx` and `app/src/services/collectionRepo.ts` preventing double increment on double Confirmar (FR-017)
- [x] T057 [P] Add edge case handling in `app/tests/unit/edgeCases.test.ts` covering `code` with especiais/sem hífen (e.g., `LOB001` → ValidationError), API timeout/rate-limit retry, múltiplas artes (escolher `card_images[0]`), `price` string `$12.34` normalization, `quantity=99` badge layout, `addedAt` ISO-8601 UTC vs `pt-BR` display, and taxa stale fallback keeping USD with aviso "cotação indisponível"
- [x] T058 [P] Performance audit for 500 items in `app/src/screens/HomeScreen.tsx` ensuring `FlashList` `estimatedItemSize` tuned, `expo-image` caching, and verifying no freeze >200ms; add `app/tests/integration/homePerformance.test.ts` seed 500 script if missing
- [x] T059 [P] Security hardening in `app/src/services/cardApi.ts` and `app/src/services/exchangeApi.ts` ensuring only `code` is transmitted to third parties (no collection totals), logging without secrets, and validating `https` `imageUrl`
- [x] T060 Run quickstart.md validation in `app/` executing `npm test`, `npm run test:contract`, `npm run test:integration` and manual checklist 9 scenarios (SC-001 to SC-010) including cadastro ≤3s, Nova Carta ≤30s, Valores totals corretos, Home 10/200 itens fluido, "Código não encontrado" ≤2s, favorita ≤1s, quantidade/remoção ≤500ms, offline modo avião, imagens cache 100%
- [x] T061 [P] Code cleanup and refactoring pass across `app/src/services/`, `app/src/components/`, `app/src/lib/` extracting shared constants and ensuring business logic lives in `services/` not UI (Constitution IV)
- [x] T062 [P] Documentation updates in `app/README.md` and `specs/001-deckbox-colecao-mvp/quickstart.md` reflecting final implementation notes and seed scripts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3): US1 → US2 → US3 → US4 → US5 → US6
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories; delivers the data ingestion pipeline (`cardApi` + `exchangeApi` + `imageCache` + `collectionRepo.addByCode`)
- **User Story 2 (P1)**: Can start after Foundational - Depends on US1 for data but independently testable with seeded SQLite data (Home reads `listAll`/`listFavorites`)
- **User Story 3 (P1)**: Can start after Foundational - Depends on US1 data but independently testable with pure `valuation.computeTotals` unit tests; `ValoresScreen` reads same repo as Home
- **User Story 4 (P2)**: Can start after Foundational + US2 (carousel/grid existence) - `toggleFavorite` is additive; testable via `favorites.test.ts`
- **User Story 5 (P2)**: Can start after Foundational + US2/US3 - `updateQuantity`/`remove` affect grid+Valores but testable independently with seeded items
- **User Story 6 (P3)**: Can start after Foundational + US2 - Architectural readiness only, no UI dependency

### Within Each User Story

- Contract/unit tests (if marked) MUST be written and FAIL before implementation where TDD requested
- `collectionRepo` methods before screens that consume them
- `CardTile`/`FavoriteCarousel`/`EmptyState` before `HomeScreen` composition
- `valuation` pure service before `ValoresScreen`
- Core implementation before integration tests
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003, T004)
- All Foundational tasks marked [P] can run in parallel: T007, T008, T009, T010 (different files: `errors.ts`, `logger.ts`, `validators.ts`, `formatters.ts`)
- Once Foundational phase completes, US1, US2, US3 can start in parallel if team capacity allows (they share no files except `collectionRepo` which should be coordinated; alternative is sequential P1 chaining)
- Within US1: T014-T018 (contract/unit tests) can run in parallel; T019-T021 (`cardApi.ts`, `exchangeApi.ts`, `imageCache.ts`) can run in parallel
- Within US2: T025, T026, T027 (components) can run in parallel
- Within US3: T032-T033 (tests) and T034-T035 (valuation, PriceBadge) can run in parallel
- Within US4: T039 can run alone, then T040-T042 in parallel after
- Within US5: T045, T046 in parallel
- Within US6: T051, T052 in parallel
- Polish: T054-T059 can run in parallel (different files)

---

## Parallel Example: User Story 1

```bash
# Launch all contract/unit tests for US1 together:
Task: "Contract test for YGOPRODeck success in app/tests/contract/ygoprodeck.test.ts" (T014)
Task: "Contract test for YGOPRODeck not-found in app/tests/contract/ygoprodeck.test.ts" (T015)
Task: "Contract test for missing price in app/tests/contract/ygoprodeck.test.ts" (T016)
Task: "Unit test for code normalization in app/tests/unit/validators.test.ts" (T018)

# Launch all services for US1 together (different files, no dependencies):
Task: "Implement YGOPRODeck client in app/src/services/cardApi.ts" (T019)
Task: "Implement exchange rate service in app/src/services/exchangeApi.ts" (T020)
Task: "Implement image cache service in app/src/services/imageCache.ts" (T021)
```

## Parallel Example: User Story 2

```bash
# Launch all components for US2 together:
Task: "Implement CardTile component in app/src/components/CardTile.tsx" (T025)
Task: "Implement FavoriteCarousel component in app/src/components/FavoriteCarousel.tsx" (T026)
Task: "Implement EmptyState component in app/src/components/EmptyState.tsx" (T027)
```

## Parallel Example: User Story 3

```bash
# Launch valuation + UI in parallel:
Task: "Implement valuation domain service in app/src/services/valuation.ts" (T034)
Task: "Implement PriceBadge component in app/src/components/PriceBadge.tsx" (T035)
Task: "Unit tests for valuation arithmetic in app/tests/unit/valuation.test.ts" (T032)
```

---

## Implementation Strategy

### MVP First (User Stories 1+2+3 Only — P1 core)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T013) — CRITICAL blocks all stories
3. Complete Phase 3: US1 — Cadastrar nova carta (T014-T024)
4. **STOP and VALIDATE**: Test US1 independently via `npm run test:contract -- ygoprodeck` and `novaCartaFlow` integration
5. Complete Phase 4: US2 — Álbum Home (T025-T031)
6. Complete Phase 5: US3 — Valores dual BRL/USD (T032-T038)
7. **STOP and VALIDATE**: Test P1 MVP end-to-end via quickstart scenarios 1-4,7-8; verify `SUM(currentPriceBRL*quantity)` and `SUM(currentPriceUSD*quantity)` correctness
8. Deploy/demo MVP if ready (3 P1 stories deliver the differential value + album metaphor)

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Deploy/Demo (data ingestion)
3. Add US2 → Test independently → Deploy/Demo (fichário digital)
4. Add US3 → Test independently → Deploy/Demo (MVP! valoração dual)
5. Add US4 → Test independently → Deploy/Demo (personalização favoritas)
6. Add US5 → Test independently → Deploy/Demo (fidelidade da coleção física)
7. Add US6 → Architectural readiness → Polish phase
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers (after Foundational):

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (Nova Carta pipeline) + US3 (valoração — pair with valuation pure logic)
   - Developer B: US2 (Home album + components)
   - Developer C: US4 + US5 (mutations: favorite, quantity, remove) + US6 preparatória
3. Stories complete and integrate independently; `collectionRepo.ts` requires coordination (use feature branches per story or assign single owner)

---

## Notes

- [P] tasks = different files, no dependencies — safe to parallelize
- [Story] label maps task to specific user story for traceability (US1-US6)
- Each user story is independently completable and testable — seed `collection_items` directly for isolated tests
- Verify contract tests fail (mock 400/empty) before implementing `cardApi`/`exchangeApi`
- Commit after each task or logical group; push per story phase
- Stop at any checkpoint to validate story independently via quickstart.md scenarios
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
- Constitution compliance: I (valuation pure/SUM, dual BRL/USD, auditável), II (API-verified code, regex, price null handling), III (3 tabs, carrossel+grid, empty state), IV (local-first SQLite+FileSystem, model `CollectionItem` exact), V (contract tests, observability, performance 500)
- Data-model constraints quoted verbatim in task descriptions: `"^[A-Z0-9]+-[0-9]+$"`, `"CHECK (quantity >= 1)"`, `"CHECK (priceAtAcquisitionUSD IS NULL OR priceAtAcquisitionUSD >= 0)"`, `"currentPriceBRL = round(currentPriceUSD * exchangeRateUsed, 2)"`, `"imageLocalPath"` priority
