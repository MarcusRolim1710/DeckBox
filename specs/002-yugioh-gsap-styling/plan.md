# Implementation Plan: Estilização Gráfica Yu-Gi-Oh! Millenium Puzzle + GSAP

**Branch**: `002-yugioh-gsap-styling` | **Spec**: `spec.md` | **Base**: `001-deckbox-colecao-mvp`
**Date**: 2026-09-12

## Summary
Aplicar tema **Millenium Puzzle** (ink #0f172a, gold #D4A017, sand #F5E6C8, hieróglifo watermark) em todo o MVP, instalar e integrar **GSAP 3 + @gsap/react** (skills `gsap-core`, `gsap-react`, `gsap-timeline`, `gsap-performance`), entregar **TabBar custom**, **QuantityModal separado** e animações por tela (Home stagger, Valores count-up, NovaCarta flip, Modal timeline reversível) — mantendo `FlashList`, `SQLite`, `FileSystem legacy` e valoração dual intactos.

> **Aviso Expo nativo vs GSAP DOM**: GSAP anima DOM. Em `expo start --web` usa GSAP direto. Em iOS/Android nativo, RN não tem DOM — plano prevê **expo web como alvo primário das animações GSAP** e fallback `react-native-reanimated` espelhando as mesmas timelines (mapeamento `x/y/scale/rotation/autoAlpha` → `transform`). Research detalha.

## Technical Context
- **Language/Version**: TypeScript ~6.0, React 19.2, React Native 0.86, Expo SDK 57 (bump herdado de `001` pós upgrade SDK 52→57: nota de stack drift)
- **Primary Dependencies (existentes)**: `expo`, `expo-sqlite 57.0.3`, `expo-file-system 57.0.7`, `expo-image 57.0.5`, `@shopify/flash-list 2.0.2`, `zustand 5`, `react-navigation 6`, `react-native-reanimated 4.5.1`, `react-native-gesture-handler`
- **Novas Deps (single source)**: `gsap ^3.12.5`, `@gsap/react ^2.1.1` — versão única para spec/plan/tasks/research; `gsap ^3.12` genérico descontinuado
- **Dual driver**: `web=GSAP DOM` (`expo start --web`), `native=reanimated` mirror via `app/src/hooks/useAnimatedGSAP.ts` (mapeia `AnimationSpec` → `useAnimatedStyle withTiming`). `gsap.matchMedia` no web, `AccessibilityInfo` no nativo — ver `research.md:R1/R2`.
- **Storage**: sem mudança (SQLite + FileSystem cache `deckbox/images/<code>.jpg`)
- **Testing**: `jest-expo`, `@testing-library/react-native` + mocks `gsap`/`@gsap/react` em `tests/setup.ts`; testes visuais via snapshot + `useGSAP` reduced-motion
- **Target Platform**: iOS 15+/Android 8+ (via Expo) + **Web** (onde GSAP brilha); TabBar custom funciona em ambos, animações GSAP plenas no web e mapeadas via reanimated no nativo
- **Project Type**: mobile-app Expo + web
- **Performance Goals**:
  - Animações só `transform`/`autoAlpha` (compositor), `will-change: transform` nos cards
  - Stagger em vez de N tweens, `gsap.quickTo` para followers se houver
  - Home 500 itens sem jank >200ms alvo 60fps, `FlashList` preservado
  - Respeito `prefers-reduced-motion: reduce` → duração 0/skip (`gsap.matchMedia`)
- **Constraints**:
  - 3 abas fixas (Constituição III) — TabBar custom não pode adicionar/renomear
  - Não quebrar `validators.ts` `^[A-Z0-9]+-[A-Z0-9-]+$` (já com `yugioh_` strip) nem `cardApi` multi-estratégia (cardsets.php)
  - Imagem prioritária `imageLocalPath` → `imageUrl` → placeholder mantida
  - Sem backend/cloud no MVP
- **Scale/Scope**: 4 telas (Home, Valores, NovaCarta, CardDetail) + 1 modal (QuantityModal) + TabBar custom + theme provider; ~8 componentes estilizados

## Constitution Check
- **I. Valuation Integrity**: PASS — estilização não altera `services/valuation.ts` `SUM(*quantity)` nem `priceAtAcquisition` imutável; `ValoresScreen` só anima exibição do total.
- **II. API-Verified Identity**: PASS — `NovaCartaScreen` mantém `normalizeCode` + `fetchByCode` (cardsets.php); animação só no preview.
- **III. Album-First UX**: PASS — 3 destinos preservados; Home mantém carrossel+grid; TabBar custom só visual.
- **IV. Simplicity & Local-First**: PASS — sem backend novo; theme/tokens isolados, sem lib de estado extra; lógica em `services/` preservada.
- **V. Quality & Observability**: PASS — testes para TabBar, modal, reduced-motion; logging API preservado; performance orçamento documentado.

**Gates**: sem violação; sem Complexity Tracking necessário.

## Project Structure

### Docs desta feature
```
specs/002-yugioh-gsap-styling/
├── spec.md
├── plan.md                 # este
├── research.md             # Phase 0
├── data-model.md           # Phase 1 (ThemeTokens)
├── quickstart.md           # Phase 1 (validação visual + GSAP)
└── contracts/
    ├── theme-tokens.yaml
    └── animation-contracts.md
```

### Source (raiz `app/`)
```
app/
├── src/
│   ├── theme/
│   │   ├── tokens.ts              # colors, radius, spacing, typography, shadows
│   │   ├── ThemeProvider.tsx      # contexto + gsap.defaults
│   │   └── useTheme.ts
│   ├── components/
│   │   ├── CustomTabBar.tsx       # NEW - TabBar Millenium + GSAP
│   │   ├── QuantityModal.tsx      # NEW - modal separado
│   │   ├── CardTile.tsx           # estilizar (puzzle border, gold badge)
│   │   ├── FavoriteCarousel.tsx   # estilizar + stagger GSAP
│   │   ├── EmptyState.tsx         # estilizar (ilustração puzzle)
│   │   ├── PriceBadge.tsx         # estilizar (gold)
│   │   └── DialogConfirm.tsx      # estilizar
│   ├── screens/
│   │   ├── HomeScreen.tsx         # + useGSAP stagger
│   │   ├── ValoresScreen.tsx      # + count-up gsap
│   │   ├── NovaCartaScreen.tsx    # + flip preview gsap
│   │   └── CardDetailScreen.tsx   # + abre QuantityModal
│   ├── navigation/
│   │   └── AppNavigator.tsx       # pluga CustomTabBar
│   └── hooks/
│       └── useReducedMotion.ts    # gsap.matchMedia wrapper
├── assets/
│   ├── icon.png / splash.png / adaptive-icon.png (substituir finais Millenium)
│   └── hieroglyph-watermark.svg
└── tests/
    ├── unit/theme.test.ts
    ├── integration/customTabBar.test.tsx
    └── integration/quantityModal.test.tsx
```

**Structure Decision**: Estilização aditiva sobre `001` — sem mover `services/db`. `src/theme/` é o único novo domínio; animação via `useGSAP({scope})` + `gsap.context()` fallback.

## Phase 0: Research

**Perguntas NEEDS CLARIFICATION**
- R1: GSAP + Expo nativo vs web — como usar `@gsap/react` sem DOM?
- R2: `@gsap/react` + `react-native-reanimated` convivência e `gsap.matchMedia` no RN?
- R3: Padrão `useGSAP` com `scope` + `contextSafe` para TabBar/Modal sem leak?
- R4: Performance em `FlashList` com stagger GSAP + `will-change` em RN?

**Saídas→ `research.md` com Decision/Rationale/Alternatives**

## Phase 1: Design

- **data-model.md**: entidade `ThemeTokens {colors, radius, spacing, typography, shadows}` + `AnimationSpec {timeline, ease, duration, stagger, reducedMotionFallback}`
- **contracts/theme-tokens.yaml**: contrato de tokens (cores hex, escalas, tipografia)
- **contracts/animation-contracts.md**: timelines por tela (targets, vars, triggers, cleanup)
- **quickstart.md**: `npm install → npx expo start --web` + cenários visuais (Home stagger, Valores count-up, TabBar glow, Modal open/close, reduced-motion toggle)

## Complexity Tracking
| Violation | Why | Alternative Rejected |
|-----------|-----|----------------------|
| — | — | — |

## Next Step (Phase 2 tasks quando aprovado)
- Já esboçado em `spec.md` US1–US5 → será quebrado em `tasks.md` (T001…).
