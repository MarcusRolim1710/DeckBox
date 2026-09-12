# Implementation Plan: DeckBox — Álbum Digital e Valoração de Coleção Yu-Gi-Oh

**Branch**: `001-deckbox-colecao-mvp` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-deckbox-colecao-mvp/spec.md`

## Summary

DeckBox MVP é um app **mobile nativo** (React Native com Expo como padrão) que implementa o fichário digital de Yu-Gi-Oh descrito no briefing: 3 telas (`Home` com carrossel de favoritas + grid do álbum, `Valores` com total dual BRL/USD e `Nova Carta` via código `SET-NUMBER`). Abordagem técnica: **local-first single-user** sem backend — metadados em **SQLite** no aparelho (`expo-sqlite`) e imagens em **cache local em disco** (`expo-file-system`), consulta à **YGOPRODeck API** para hidratar `name`/`imageUrl`/`price` por código, e **API de câmbio** diária (AwesomeAPI/exchangerate.host) para conversão USD→BRL com armazenamento dual. Valoração é `SUM(currentPriceBRL*quantity)` (principal) + `SUM(currentPriceUSD*quantity)` (referência), com testes de contrato obrigatórios para ambas as APIs e operação offline para leitura.

## Technical Context

**Language/Version**: TypeScript 5.5+ / Node 20+ (tooling); React Native 0.75+ com Expo SDK 52
**Primary Dependencies**: Expo (managed workflow), expo-sqlite, expo-file-system, React Navigation (bottom-tabs + stack), Zustand (estado leve) ou React Context, date-fns, intl (formatação pt-BR)
**Storage**: SQLite no aparelho (tabela `collection_items`) + FileSystem do aparelho para cache de imagens (`FileSystem.cacheDirectory + /deckbox/images/<code>.jpg`); sem backend/cloud no MVP
**Testing**: Jest + React Native Testing Library (unit/component), Detox ou Maestro (e2e opcional MVP), MSW / fetch-mock para contratos de API, testes de valoração puros
**Target Platform**: iOS 15+ e Android 8+ (API 26+) via Expo; single-user local (FR-021)
**Project Type**: mobile-app (Expo)
**Performance Goals**:
- Cadastro de código válido → tile visível em Home ≤3s após Confirmar (SC-001)
- Fluxo Nova Carta completo ≤30s (SC-002)
- Valores recalcula e exibe totais BRL+USD corretamente em 100% dos casos (SC-003)
- Home com 10 e 200 itens renderiza sem congelamento >200ms; grid 500 itens sem jank perceptível (60fps alvo, virtualização com FlashList)
- Toggle de favorita reflete no carrossel ≤1s (SC-006); edição de quantidade/remoção ≤500ms (SC-007)
**Constraints**:
- Offline-first para leitura: Home e Valores funcionam sem rede usando SQLite + cache de imagens; Nova Carta exige rede
- Valoração determinística e auditável (Constituição I): `currentPriceBRL` sempre derivado de `currentPriceUSD * exchangeRateUsed` com 2 casas e `exchangeRateDate` persistido
- Imagem obrigatória com fallback: `imageLocalPath` prioritário, `imageUrl` remoto como fallback, placeholder se ambos falharem
- 3 destinos de navegação fixos (Home/Valores/Nova Carta) — sem adição sem emenda
- Moeda dual obrigatória (FR-022 opção C): exibir `R$ X (US$ Y)` com aviso quando cotação desatualizada
**Scale/Scope**:
- MVP: até 500 cartas distintas (referência de performance), N cópias por código via `quantity` (badge xN)
- Single collection por instalação (single-user); sem multi-tenant no MVP
- 3 telas + 1 detalhe de carta (modal/stack) + ~6 fluxos principais (US1-US5)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verificado contra `/.specify/memory/constitution.md` v1.0.0:

- **I. Collection Valuation Integrity (NON-NEGOTIABLE)**: ✅ PASS — Plano mantém `priceAtAcquisitionUSD` imutável, `currentPriceUSD` mutável, `currentPriceBRL` derivado com `exchangeRateUsed`+`exchangeRateDate`, cálculo puro `SUM(*quantity)` em módulo de domínio (`services/valuation.ts`) com testes unitários. Valores exige breakdown itemizado BRL+USD.
- **II. API-Verified Card Identity**: ✅ PASS — Código `SET-NUMBER` normalizado (`trim`+`upper-case`+regex `^[A-Z0-9]+-[0-9]+$`), consulta YGOPRODeck como única fonte para `name`/`imageUrl`/`price`; sem entrada manual no MVP; erro "Código não encontrado" sem registro parcial; `imageUrl` obrigatória; preço nulo armazenado como `null` excluído da soma com aviso; testes de contrato para sucesso/not-found/sem-preço/malformado.
- **III. Album-First UX**: ✅ PASS — Navegação fixa em 3 abas; Home = carrossel horizontal de favoritas + grid (FlashList) com imagem+nome+badge; empty state com CTA; favorita é `isFavorite` boolean com toggle em ≤2 toques; duplicatas = 1 tile por code com `xN` (uniforme); filtros adiados mas ordenação padrão `addedAt desc` preservada.
- **IV. Simplicity & Local-First Data Ownership**: ✅ PASS — MVP 100% local no aparelho (SQLite + FileSystem), sem login/cloud; modelo canônico exatamente `CollectionItem` da spec (FR-004 + FR-023); lógica de domínio isolada de UI; edição/remoção speccadas; sem features especulativas (top-10/gráficos) no MVP.
- **V. Quality, Testing & Observability**: ✅ PASS — Testes obrigatórios para valoração, quantity/favorite, API success/not-found/price-missing, estados vazios; mocks em unit + suite de contrato com fixtures gravadas; mensagens observáveis para todos os erros; logging estruturado para chamadas de API (code, latency, success/failure, price) sem expor segredos; orçamento de performance para 500 itens documentado.

**Gates**: Nenhuma violação. Não há necessidade de tabela de Complexity Tracking.

*Re-check pós-Phase 1*: Mantido PASS — data-model e contratos preservam todos os invariantes acima.

## Project Structure

### Documentation (this feature)

```text
specs/001-deckbox-colecao-mvp/
├── plan.md              # Este arquivo (/speckit.plan)
├── research.md          # Phase 0 output (/speckit.plan)
├── data-model.md        # Phase 1 output (/speckit.plan)
├── quickstart.md        # Phase 1 output (/speckit.plan)
├── contracts/           # Phase 1 output (/speckit.plan)
│   ├── ygoprodeck-api.yaml
│   ├── exchange-rate-api.yaml
│   └── collection-service.md
└── tasks.md             # Phase 2 output (/speckit.tasks - NÃO criado por /speckit.plan)
```

### Source Code (repository root)

```text
# Mobile app Expo (single project)
app/
├── app.json / app.config.ts
├── package.json
├── src/
│   ├── navigation/          # BottomTabs: Home | Valores | NovaCarta
│   ├── screens/
│   │   ├── HomeScreen.tsx        # carrossel + grid (FlashList)
│   │   ├── ValoresScreen.tsx     # totalBRL principal + totalUSD + breakdown
│   │   ├── NovaCartaScreen.tsx   # input code → preview → confirmar
│   │   └── CardDetailScreen.tsx  # detalhe, favoritar, editar qtd, remover
│   ├── components/
│   │   ├── CardTile.tsx
│   │   ├── FavoriteCarousel.tsx
│   │   ├── EmptyState.tsx
│   │   └── PriceBadge.tsx        # R$ X (US$ Y)
│   ├── services/
│   │   ├── valuation.ts          # SUM BRL/USD puros + testes
│   │   ├── cardApi.ts            # YGOPRODeck client + normalização de code
│   │   ├── exchangeApi.ts        # câmbio USD→BRL + cache diário
│   │   ├── imageCache.ts         # download → FileSystem, lookup local
│   │   └── collectionRepo.ts     # SQLite CRUD + quantity/favorite
│   ├── db/
│   │   ├── schema.ts             # tabela collection_items
│   │   └── client.ts             # expo-sqlite init/migrations
│   ├── store/
│   │   └── collectionStore.ts    # Zustand store
│   ├── hooks/
│   └── lib/
│       ├── formatters.ts         # Intl BRL/USD pt-BR, datas
│       └── validators.ts         # regex code, quantity
├── assets/
└── tests/
    ├── unit/                     # valuation, validators, formatters
    ├── contract/                 # ygoprodeck + exchange fixtures
    └── integration/              # repo + imageCache + offline

# Docs e specs fora do app
specs/
```

**Structure Decision**: Projeto único **Expo mobile-app** (Option 1 adaptada para mobile). Sem `backend/` separado no MVP; APIs externas consumidas diretamente do app com cache local. Estrutura `src/services` isola domínio para testabilidade (Constituição IV/V).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

*Nenhuma violação — tabela vazia.*
