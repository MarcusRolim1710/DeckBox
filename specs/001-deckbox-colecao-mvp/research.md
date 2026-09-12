# Research: DeckBox — Álbum Digital e Valoração (001-deckbox-colecao-mvp)

**Date**: 2026-09-12
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## 1. YGOPRODeck API — Identidade e Preço da Carta

**Decision**: Usar `https://db.ygoprodeck.com/api/v7/cardinfo.php` como fonte primária, com query por `?num=<CODE>` ou fallback `?name=` quando a API não suportar busca direta por `cardcode` em todos os sets. Preço considerado: `card_prices[0].cardmarket_price` como principal, com fallback para `tcgplayer_price` / `ebay_price` / `amazon_price` (primeiro não-nulo). Imagem: `card_images[0].image_url` (ou `image_url_small` para grid).

**Rationale**: É a API pública citada no briefing e na spec, com maior cobertura de sets Yu-Gi-Oh e com campos estáveis `cardmarket_price`/`tcgplayer_price` já usados pela comunidade. Documentação confirma rate limit generoso e resposta com `data[0]` contendo `name`, `card_images`, `card_prices` e `card_sets[].set_code` para validação do código informado. Permite validar `set_code` exato para garantir que `LOB-001` retornou a carta correta.

**Alternatives considered**:
- `yugiohprices.com` / `yugiprices` — cobertura menor, sem imagem oficial, preço menos confiável.
- Scraping de `yugiohcarddatabase` — frágil, sem contrato, viola ToS.
- API própria com backend proxy — rejeitada no MVP por Constituição IV (simplicidade local-first); pode ser introduzida em fase pós-MVP se rate limit virar problema.

**Open items → plan**: Definir normalização de `code` (trim, upper-case, regex `^[A-Z0-9]+-[0-9]+$`) antes da chamada; em `cardApi.ts` implementar `fetchByCode(code)` que tenta `?setcode=`/`?num=` e, se 400/empty, tenta busca por `card_sets[].set_code` filtrando `data`. Armazenar `priceUSD` como `parseFloat(cardmarket_price)` ou `null`.

---

## 2. API de Câmbio USD→BRL — Conversão Diária (FR-022 opção C)

**Decision**: **AwesomeAPI** (`https://economia.awesomeapi.com.br/json/last/USD-BRL`) como primeira opção, com fallback para `exchangerate.host` (`https://api.exchangerate.host/convert?from=USD&to=BRL`). Cache diário no SQLite (`exchange_rates` table: `date PK, rate, source`) e `exchangeRateDate` em cada item.

**Rationale**: AwesomeAPI é gratuita, sem chave para `USD-BRL`, resposta simples `USDBRL.bid` e `create_date`, usada amplamente em apps BR e retorna `pt-BR` friendly. `exchangerate.host` é fallback sem chave com boa disponibilidade. Ambas permitem arredondamento bancário para 2 casas e sinalização de "cotação desatualizada" quando `exchangeRateDate < today`.

**Alternatives considered**:
- Banco Central PTAX — oficial mas exige parsing mais complexo e janela de cotação diária com delay.
- Fixer/currencylayer — exigem API key paga para BRL.
- Taxa fixa hardcoded — rejeitada por violar FR-022 (precisa ser diária e auditável).

**Regra de negócio**: Em `exchangeApi.ts`, `getRate()` retorna taxa do dia do cache ou busca remota; em caso de falha, mantém última taxa conhecida e marca `isStale=true` para exibir aviso em Valores ("cotação de DD/MM"). `currentPriceBRL = roundHalfEven(currentPriceUSD * rate, 2)`.

---

## 3. Persistência Local no Aparelho — SQLite vs AsyncStorage

**Decision**: **expo-sqlite** (SQLite) para metadados da coleção + **expo-file-system** para imagens. `AsyncStorage` apenas para flags leves (ex.: `exchangeRateCurrent`), não para coleção.

**Rationale**: SQLite suporta 500+ itens com queries indexadas por `code` e `isFavorite`, transações para `quantity` increment, e tipos `REAL`/`INTEGER`/`TEXT` adequados para preços e datas. `AsyncStorage` tem limite de 6MB e serialização JSON completa a cada escrita — inadequado para coleção e valoração `SUM`. `expo-sqlite` é oficial, funciona offline, e permite migrations versionadas.

**Alternatives considered**:
- Apenas AsyncStorage — rejeitada por limite e performance.
- Realm/WatermelonDB — poderosas mas adicionam complexidade e bundle maior; overkill para MVP single-table.
- MMKV — rápida mas sem SQL e com API menos portável para Flutter futuro (SQLite é comum a ambos).

**Schema**: Tabela única `collection_items` com PK `code`, índices em `isFavorite` e `addedAt` (ver `data-model.md`).

---

## 4. Cache Local de Imagens — FileSystem no Aparelho

**Decision**: Baixar imagem no momento do cadastro via `FileSystem.downloadAsync(imageUrl, FileSystem.cacheDirectory + 'deckbox/images/<CODE>.jpg')` e persistir `imageLocalPath`. Leitura prioriza `imageLocalPath` (via `expo-image`/`Image` com `cachePolicy`), fallback para `imageUrl` remota. Limpeza apenas por ação do usuário ("Limpar cache") ou LRU por espaço em `plan` futuro.

**Rationale**: Atende FR-023 e SC-010 (offline 100% após primeiro cache). FileSystem é a API recomendada pela Expo para blobs; evita base64 em SQLite e mantém grid fluido (imagens locais decodificam mais rápido). Permite validação de `imageUrl` divergente (re-download).

**Alternatives considered**:
- Base64 em SQLite — estoura tamanho e memória.
- Apenas URL remota com `expo-image` cache automático — funciona mas não garante offline total após reinstalação de cache do SO.
- `react-native-fast-image` — nativo mas fora do ecossistema Expo managed; `expo-image` já cobre.

---

## 5. Navegação e Estado

**Decision**: **React Navigation v6** (`@react-navigation/bottom-tabs` + `native-stack`) com 3 abas fixas: `Home`, `Valores`, `NovaCarta`. Estado global leve com **Zustand** (`collectionStore`: `items`, `favorites`, `totalsBRL/USD`, `exchangeRate`).

**Rationale**: React Navigation é padrão Expo, suporta deep linking e tabs fixas exigidas pela Constituição III. Zustand é minimalista, sem boilerplate de Redux, suficiente para single-user local e testes puros. Alternativa Context puro geraria prop drilling para grid/carrossel.

**Alternatives considered**:
- Expo Router (file-based) — moderno mas adiciona convenção de arquivos desnecessária para 3 telas fixas.
- Redux Toolkit — robusto mas overkill para MVP sem backend.

---

## 6. Performance do Grid — 500 Cartas

**Decision**: **FlashList** (`@shopify/flash-list`) no lugar de `FlatList`, com `estimatedItemSize`, `numColumns=3`, e `expo-image` com `contentFit="cover"` + `transition`.

**Rationale**: FlashList recicla células e mantém 60fps com 500+ imagens locais, validado em benchmarks Shopify. Necessário para SC-004 (sem congelamento >200ms). `expo-image` tem decodificação nativa e cache disk.

**Alternatives considered**:
- FlatList puro — jank com 500 imagens, especialmente em Android mid-tier.
- Virtualização manual — complexidade desnecessária.

---

## 7. Stack Mobile — React Native (Expo) vs Flutter

**Decision**: **React Native com Expo (managed)** como padrão do plano; Flutter documentado como alternativa aceitável se equipe preferir Dart.

**Rationale**: TypeScript compartilhado com tooling web se necessário, ecossistema Expo cobre SQLite/FileSystem/Navigation sem eject, e briefing não impõe Dart. Spec FR-020 já define React Native como padrão. Flutter exigiria reescrever `services` em Dart sem ganho funcional para MVP.

**Alternatives considered**:
- Flutter — equivalente em performance, mas exige Dart e `sqflite`/`path_provider` em vez de Expo APIs; mantido como alternativa.

---

## 8. Validação e Formatação

**Decision**: Validação de `code` com `zod` ou regex puro `^[A-Z0-9]+-[0-9]+$` após `trim().toUpperCase().replace(/\s+/, '-')`; formatação monetária com `Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'|'USD'})` e `roundHalfEven` manual para BRL derivado.

**Rationale**: Zod já é dependência comum Expo; regex garante FR-019 antes de chamar API. `Intl` é nativo e atende FR-015 sem libs extras.

---

## Conclusão

Todas as incógnitas do Technical Context foram resolvidas sem `NEEDS CLARIFICATION` restante. Próxima fase (Phase 1) gera `data-model.md`, contratos e `quickstart.md` com base nestas decisões.
