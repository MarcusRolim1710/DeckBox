# 🃏 DeckBox — Álbum Digital e Valoração de Coleção Yu-Gi-Oh!

> **Fichário digital no seu bolso.** Cadastre cartas pelo código `SET-NUMBER`, veja sua coleção como um álbum com favoritas em destaque e descubra **quanto vale sua coleção hoje** — com conversão automática **USD → BRL**.

<p align="center">
  <img src="app/assets/icon.png" width="120" alt="DeckBox Icon" />
  <br/>
  <a href="https://expo.dev"><img alt="Expo SDK 57" src="https://img.shields.io/badge/Expo-SDK%2057-000020?style=flat-square&logo=expo" /></a>
  <a href="https://reactnative.dev"><img alt="React Native 0.86" src="https://img.shields.io/badge/React_Native-0.86-61DAFB?style=flat-square&logo=react" /></a>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="License: Private" src="https://img.shields.io/badge/license-private-lightgrey?style=flat-square" />
</p>

---

## ✨ Demonstração

| Home — Álbum + Carrossel | Valores — Total Dual BRL/USD | Nova Carta — Código → Preview |
|:---:|:---:|:---:|
| ![Home](https://via.placeholder.com/280x580/0f172a/ffffff?text=Home%0ACarrossel+%2B+Grid) | ![Valores](https://via.placeholder.com/280x580/0f172a/ffffff?text=Valores%0AR%24+1.234%2C00+%28US%24+200%29) | ![Nova Carta](https://via.placeholder.com/280x580/0f172a/ffffff?text=Nova+Carta%0ALOB-001+%E2%86%92+Blue-Eyes) |
| `Carrossel horizontal de favoritas` + `Grid 3 colunas` com `FlashList` | `totalBRL = SUM(currentPriceBRL*quantity)` principal + `totalUSD` secundário + breakdown | Digite `LOB-001` ou `BLZD-EN015` → vê imagem + preço → **Confirmar** |

> **Empty State:** coleção vazia mostra CTA **“Adicionar primeira carta”** → `Nova Carta`

---

## 🚀 Funcionalidades (MVP)

| Funcionalidade | Descrição | Status |
|---|---|---|
| **📥 Cadastro por código** | Informe apenas `LOB-001` ou `BLZD-EN015` (aceita `yugioh_blzd-en015`, minúsculas, espaços). Consulta **YGOPRODeck API**, mostra preview para confirmação e salva. | ✅ |
| **🖼️ Álbum Home** | Carrossel de **favoritas** no topo + grid do álbum com todos os cards. `imageLocalPath` prioritário, fallback `imageUrl`, placeholder se falhar. Badge `xN` para quantidade. | ✅ |
| **⭐ Favoritas** | Toggle por estrela no tile ou no detalhe em ≤2 toques. Carrossel atualiza em ≤1s e persiste após reload. | ✅ |
| **🔢 Quantidade & Remoção** | Edite `quantity ≥1` ou remova com diálogo `Remover [nome]?`. Validação `CHECK (quantity >= 1)` + mensagem `pt-BR`. Valores recalcula em ≤500ms. | ✅ |
| **💰 Valores Dual** | `totalBRL` principal + `totalUSD` referência. Breakdown itemizado por carta. Itens sem preço mostram `X cartas sem preço — não entram na soma` (nunca `0` silencioso). | ✅ |
| **💱 Câmbio diário** | `currentPriceBRL = round(currentPriceUSD * rate, 2)` via **AwesomeAPI** (`USDBRL.bid`) com fallback `exchangerate.host`. Cache diário `exchange_rates` + aviso `Cotação desatualizada`. | ✅ |
| **📴 Offline first** | `Home` e `Valores` funcionam sem rede (SQLite + cache de imagens em disco). `Nova Carta` exige rede e oferece `Tentar novamente`. | ✅ |
| **🔍 Busca futura** | `search("blue")` → `WHERE name LIKE %q% OR code LIKE %q% ORDER BY addedAt DESC` (<500ms para 100 itens) + índice `idx_collection_name`. Sem UI no MVP, mas arquitetura pronta. | ✅ |

---

## 🧱 Stack Técnica

```
React Native 0.86 + Expo SDK 57 (managed)
TypeScript 5.x + Zustand 5 (estado leve) + React Navigation 6 (BottomTabs + Stack)
SQLite no aparelho (expo-sqlite 57.0.3) + FileSystem local (expo-file-system/legacy 57.0.7)
FlashList 2.0.2 (60fps para 500+ cards) + expo-image 57.0.5
Jest 29 + jest-expo 57 + Testing Library + MSW
```

**Arquitetura `app/src/`:**
```
src/
├── navigation/    BottomTabs: Home | Valores | NovaCarta (+ Stack CardDetail)
├── screens/       HomeScreen, ValoresScreen, NovaCartaScreen, CardDetailScreen
├── components/    CardTile, FavoriteCarousel, EmptyState, PriceBadge
├── services/      valuation.ts (puro), cardApi.ts, exchangeApi.ts, imageCache.ts, collectionRepo.ts
├── db/            schema.ts (collection_items + exchange_rates), client.ts
├── store/         collectionStore.ts (Zustand)
└── lib/           validators.ts (^[A-Z0-9]+-[A-Z0-9-]+$), formatters.ts (Intl pt-BR), errors.ts, logger.ts
```

**Modelo Canônico `CollectionItem` (SQLite):**

| Campo | Tipo | Regra |
|---|---|---|
| `code` | `TEXT PK` | `^[A-Z0-9]+-[A-Z0-9-]+$` após `trim().toUpperCase()` + strip `YUGIOH_` |
| `name` | `TEXT NOT NULL` | vindo da API |
| `imageUrl` | `TEXT NOT NULL` | `card_images[0].image_url` |
| `imageLocalPath` | `TEXT NULL` | `cacheDirectory/deckbox/images/<code>.jpg` |
| `priceAtAcquisitionUSD` | `REAL NULL CHECK >=0` | **imutável** após insert |
| `currentPriceUSD/BRL` | `REAL NULL CHECK >=0` | `BRL = round(USD*rate,2)` |
| `exchangeRateUsed/Date` | `REAL/TEXT` | taxa do dia |
| `quantity` | `INTEGER NOT NULL CHECK >=1` | badge `xN`, incremento em duplicata |
| `isFavorite` | `INTEGER DEFAULT 0` | carrossel |
| `addedAt` | `TEXT NOT NULL` | ISO-8601 UTC, ordem `DESC` |
| `lastPriceSyncAt` | `TEXT NULL` | auditoria |

---

## 🏁 Quickstart — Rode no seu celular em 2 minutos

### Pré-requisitos
- Node 20+, `npm`
- Celular com **Expo Go SDK 57** (Play Store / App Store)

### 1. Instalar e rodar

```bash
cd app
npm install --legacy-peer-deps
npx expo start --clear
```

Escaneie o **QR Code** com o Expo Go.

> Se viu `The installed version of Expo Go is for SDK 57` antes: **este projeto já está no SDK 57** — atualize com `npx expo install --fix` se precisar.

### 2. Teste manual (9 cenários — `specs/001-deckbox-colecao-mvp/quickstart.md`)

| # | Ação | Esperado |
|---|---|---|
| 1 | `Nova Carta` → ` lob-001 ` (com espaços) → Buscar → Confirmar | Tile aparece na Home em ≤3s, `quantity=1` |
| 2 | Repetir `LOB-001` | Badge `x2`, `priceAtAcquisitionUSD` preservado |
| 3 | `XXX-999` | `Código não encontrado` em ≤2s, sem registro |
| 4 | Código sem preço (mock) | `Preço indisponível — não entra na soma`, excluído do total |
| 5 | Home com 10 cards (3 fav) | Carrossel 3 + Grid 10, `EmptyState` se vazio |
| 6 | Tocar ★ no tile | Carrossel ganha 1 item em ≤1s, persiste após reload |
| 7 | Detalhe → `quantity 1→3` | Badge `x3`, Valores recalcula ≤500ms |
| 8 | `quantity=0` | Erro `Quantidade deve ser pelo menos 1 (use Remover para excluir)` |
| 9 | Remover → `Remover [nome]?` → Confirmar | Sai do grid/carrossel e total recalcula |

**Offline:** com coleção populada, ative **modo avião**, feche e abra o app — Home e Valores devem navegar com cache, `Nova Carta` mostra `Sem conexão — Tentar novamente`.

---

## 🧪 Testes

```bash
cd app
npm test                    # unit (valuation, validators)
npm run test:contract       # YGOPRODeck + câmbio com fixtures
npm run test:integration    # repo + Home/Valores
npx tsc --noEmit            # validação TypeScript (deve sair EXIT 0)
```

Logs estruturados: `src/lib/logger.ts` registra `code, latencyMs, success, priceUSD, source` sem expor segredos.

---

## 📦 Gerar APK instalável (sem precisar do Expo Go)

```bash
npm i -g eas-cli
eas login
cd app
eas build:configure          # cria eas.json
eas build --platform android --profile preview   # → .apk
# produção Play Store:
eas build --platform android --profile production # → .aab
```

---

## 🗂️ Estrutura de Docs (Spec Kit)

```
specs/001-deckbox-colecao-mvp/
├── spec.md               # 23 FRs + 8 SCs + 6 User Stories
├── plan.md               # Stack, arquitetura, 3 telas + detalhe
├── research.md           # Decisões YGOPRODeck, câmbio, SQLite, FlashList
├── data-model.md         # Entidades + migrations SQL
├── contracts/            # ygoprodeck-api.yaml, exchange-rate-api.yaml, collection-service.md
├── quickstart.md         # 9 cenários manuais
└── tasks.md              # 62 tarefas (Setup → Foundational → US1..US6 → Polish)
.specify/memory/constitution.md  # 5 princípios (Valuation NON-NEGOTIABLE, Album-First, etc.)
```

---

## 🤝 Contribuição

1. Leia `spec.md` e `constitution.md` antes de abrir PR
2. Siga o fluxo `spec → plan → tasks → implement`
3. Todo PR que tocar `collection_items` ou valoração **DEVE** citar o princípio da Constituição que afeta
4. `npm run format` antes de commitar

---

## 📄 Licença

Privado — uso pessoal do autor. Imagens e preços vêm da **YGOPRODeck API** e são propriedade de seus respectivos detentores (Konami / Yu-Gi-Oh!).

---

<p align="center">
  Feito com ❤️ por <b>Marcus Rolim</b> • <a href="mailto:marcus.rolim1710@gmail.com">marcus.rolim1710@gmail.com</a> • DeckBox v1.0.0 MVP
</p>
