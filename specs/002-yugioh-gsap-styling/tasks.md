# Tasks: Estilização Gráfica Yu-Gi-Oh! Millenium Puzzle + GSAP

**Input**: Design documents from `/specs/002-yugioh-gsap-styling/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (theme-tokens.yaml, animation-contracts.md), quickstart.md
**Tech Stack**: Expo SDK 57, React Native 0.86, TypeScript ~6.0, expo-sqlite 57.0.3, expo-file-system legacy 57.0.7, expo-image 57.0.5, FlashList 2.0.2, Zustand 5, React Navigation 6, react-native-reanimated 4.5.1 + NEW gsap ^3.12.5 + @gsap/react ^2.1.1
**Project Type**: mobile-app Expo + web (GSAP DOM pleno em web, mirror reanimated em nativo)
**Branch**: `002-yugioh-gsap-styling` (depende de `001-deckbox-colecao-mvp` já merged)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- App root: `app/` (Expo managed)
- Source: `app/src/theme/`, `app/src/components/`, `app/src/screens/`, `app/src/navigation/`, `app/src/hooks/`, `app/assets/`
- Tests: `app/tests/unit/`, `app/tests/integration/`
- All paths below are relative to repository root `C:\DEV\DeckBox\deckbox\`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Instalar GSAP e preparar base de estilização sem quebrar MVP

- [ ] T001 Instalar dependências GSAP em `app/package.json` executando `npm install gsap@^3.12.5 @gsap/react@^2.1.1 --save` e verificar `gsap` + `@gsap/react` em dependencies
- [ ] T002 Verificar `app/package.json` scripts mantêm `start`, `web`, `test` e que `expo start --web` ainda inicia após install
- [ ] T003 [P] Criar estrutura de tema em `app/src/theme/` com diretórios vazios e placeholder `app/assets/hieroglyph-watermark.svg` (5% opacity)
- [ ] T004 [P] Configurar mocks GSAP em `app/tests/setup.ts` adicionando `jest.mock('gsap')` e `jest.mock('@gsap/react', () => ({useGSAP: jest.fn((cb)=> cb())}))` para testes não quebrarem

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tokens e provider que BLOQUEIAM todos os US de estilização; sem isso nenhuma tela pode ser estilizada

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Implementar tokens Millenium em `app/src/theme/tokens.ts` exportando `colors {ink:"#0f172a", slate:"#1e293b", gold:"#D4A017", goldMuted:"#9A7B2E", sand:"#F5E6C8", warning:"#b45309", success:"#16a34a", surface:"#ffffff"}`, `radius {sm:8, md:12, puzzle:16}`, `spacing {xs:4, sm:8, md:12, lg:16, xl:24}`, `typography {display:{fontFamily:"Cinzel", size:22, weight:"700"}, heading, body}`, `shadows {card:"0 4px 12px rgba(0,0,0,0.4)", goldGlow:"0 0 12px rgba(212,160,23,0.6)"}` — sem cores hardcoded fora deste arquivo (FR-S01)
- [ ] T006 Implementar `ThemeProvider` em `app/src/theme/ThemeProvider.tsx` com `React.createContext<ThemeTokens>`, `gsap.defaults({duration:0.6, ease:"power2.out"})` (gsap-core SKILL.md:201) e provider envolvendo `App.tsx`, expondo `useTheme()` hook
- [ ] T007 Implementar hook `useReducedMotion` em `app/src/hooks/useReducedMotion.ts` usando `gsap.matchMedia().add({reduceMotion:"(prefers-reduced-motion: reduce)"}, (ctx)=>{...})` (gsap-core SKILL.md:207) no web e fallback `AccessibilityInfo.isReduceMotionEnabled()` no nativo, retornando `boolean` para zerar durations (FR-S05)
- [ ] T007b [P] Configurar `reanimated` mirror para nativo em `app/src/hooks/useAnimatedGSAP.ts` mapeando `AnimationSpec` GSAP → `useAnimatedStyle` com `withTiming` e mesmos `duration/ease/stagger`, documentando dual driver `web=GSAP / native=reanimated` em `specs/002-yugioh-gsap-styling/research.md` (FR-S03) — movido de US5 para Foundational para bloquear GSAP web+nativo desde o início
- [ ] T008 Criar hook `useTheme` em `app/src/theme/useTheme.ts` consumindo contexto e exportando `tokens`
- [ ] T009 Aplicar `ThemeProvider` em `app/App.tsx` envolvendo `<AppNavigator />` e verificar `npx tsc --noEmit` passa
- [ ] T010 [P] Substituir assets placeholder em `app/assets/icon.png`, `app/assets/splash.png`, `app/assets/adaptive-icon.png` por versões Millenium finais (gold/ink) 1024x1024 e `hieroglyph-watermark.svg` (watermark `opacity:0.05` overlay `background`, contraste `gold on ink >=4.5:1` verificado)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Tema Global e Tokens (Priority: P1) 🎯 MVP Estilização

**Goal**: Tema aplicado globalmente; todas as telas leem tokens e fundo ink + watermark aparece

**Independent Test**: Abrir Home/Valores/NovaCarta/CardDetail — fundo `ink #0f172a`, textos `sand #F5E6C8`/`textSecondary #94a3b8`, headers `gold #D4A017`, sem cor fora de `tokens.ts`; `ThemeProvider` presente via `useTheme()`.

- [ ] T011 [US1] Verificar aplicação de `ThemeProvider` em headers de `app/src/navigation/AppNavigator.tsx` usando `tokens.colors.ink` como `headerStyle.backgroundColor` e `tokens.colors.gold` como `headerTintColor`
- [ ] T012 [US1] Estilizar background global em `app/src/screens/HomeScreen.tsx` aplicando `tokens.colors.ink` + `hieroglyph-watermark.svg` 5% como overlay e tipografia `tokens.typography`
- [ ] T013 [US1] Estilizar background global em `app/src/screens/ValoresScreen.tsx` com mesmos tokens + watermark
- [ ] T014 [US1] Estilizar background global em `app/src/screens/NovaCartaScreen.tsx` com mesmos tokens
- [ ] T015 [US1] Estilizar background global em `app/src/screens/CardDetailScreen.tsx` com mesmos tokens
- [ ] T016 [P] [US1] Unit test para tokens em `app/tests/unit/theme.test.ts` verificando `tokens.colors.gold === "#D4A017"`, `tokens.colors.ink === "#0f172a"`, `tokens.radius.puzzle === 16`, `tokens.shadows.goldGlow` definido e que nenhum componente importa cor literal fora de `tokens.ts` (FR-S01)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently — tema global aplicado

---

## Phase 4: User Story 2 - TabBar Custom Millenium (Priority: P1)

**Goal**: Substituir TabBar padrão por `CustomTabBar` Millenium com ícones puzzle (album/coins/plus), ativo preenchido + sublinhado gold, animação GSAP `scale 1.08 back.out(1.7)` no `onTabPress`

**Independent Test**: TabBar mostra 3 ícones Millenium, ativo com fill gold + sublinhado; tocar troca anima `scale 1.08` + glow ≤300ms; com `prefers-reduced-motion: reduce` duração 0; sem quebrar `FR-014` (exatamente 3 destinos); teste `CustomTabBar.test.tsx` passa.

### Tests for User Story 2

- [ ] T017 [P] [US2] Integration test para TabBar em `app/tests/integration/customTabBar.test.tsx` verificando render 3 tabs `Home|Valores|NovaCarta`, `onTabPress` chama `navigation.navigate`, animação `gsap.to` chamada com `scale:1.08`, e `reduceMotion=true` zera duration

### Implementation for User Story 2

- [ ] T018 [P] [US2] Criar ícones Millenium SVG em `app/assets/icons/tab-home.svg`, `app/assets/icons/tab-valores.svg`, `app/assets/icons/tab-nova.svg` (24dp, 2 variantes outline/filled)
- [ ] T019 [US2] Implementar `CustomTabBar` em `app/src/components/CustomTabBar.tsx` com props `{state, descriptors, navigation}` (BottomTabBarProps), usando `useGSAP({scope: containerRef})` + `contextSafe` para `onTabPress` (gsap-react SKILL.md:81), animações `gsap.from(".tab-item", {y:10, autoAlpha:0, stagger:0.06, duration:0.4, ease:"power2.out"})` no mount e `gsap.timeline().to(active,{scale:1.08, duration:0.15, ease:"back.out(1.7)"}).to(active,{scale:1, duration:0.2})` + gold glow (contracts/animation-contracts.md TabBar), cleanup `ctx.revert()`, e `gsap.matchMedia` reduceMotion
- [ ] T020 [US2] Integrar `CustomTabBar` em `app/src/navigation/AppNavigator.tsx` passando `tabBar: (props) => <CustomTabBar {...props} />` em `Tab.Navigator screenOptions` e removendo `screenOptions` padrão que conflita, mantendo `Tab.Screen name Home|Valores|NovaCarta` (FR-S02)
- [ ] T021 [US2] Estilizar `CustomTabBar` com tokens em `app/src/components/CustomTabBar.tsx` usando `tokens.colors.ink` fundo, `tokens.colors.gold` ativo, `tokens.colors.sand` inativo, `tokens.shadows.goldGlow`, `tokens.radius.puzzle` chanfro

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently — tema + TabBar Millenium

---

## Phase 5: User Story 3 - Animações GSAP por Tela (Priority: P1)

**Goal**: Cada tela anima com GSAP: Home fav stagger, Valores count-up, NovaCarta flip preview, usando só `transform`/`autoAlpha`, `stagger`, `gsap.matchMedia` reduceMotion

**Independent Test**: Home: 3 favs entram `y:20→0 stagger 0.08` 0.5s; Valores: totalBRL faz count-up 0.8s `power2.out` com `R$ X` pt-BR; NovaCarta: preview entra `scale 0.9→1 rotationY 8→0 back.out(1.2)`; com reduceMotion todos duração 0; sem jank >200ms para 500 itens.

- [ ] T022 [P] [US3] Implementar Home fav stagger em `app/src/components/FavoriteCarousel.tsx` usando `useGSAP(()=>{gsap.from(".fav-item", {y:20, autoAlpha:0, duration:0.5, ease:"power3.out", stagger:{amount:0.3, from:"start"}})}, {scope: containerRef})` (gsap-core SKILL.md:101, animation-contracts.md), com `will-change: transform` (gsap-performance SKILL.md:26) em itens
- [ ] T023 [P] [US3] Implementar Home grid stagger em `app/src/screens/HomeScreen.tsx` usando `useGSAP(()=>{gsap.from(".card-tile", {scale:0.9, autoAlpha:0, stagger:0.04, duration:0.4, ease:"power2.out"})}, {scope: listRef})` após `FlashList` render, preservando `numColumns=3` e `estimatedItemSize`
- [ ] T024 [P] [US3] Implementar Valores count-up em `app/src/screens/ValoresScreen.tsx` usando `useGSAP` com `gsap.to(countObj, {val: totalBRL, duration:0.8, ease:"power2.out", onUpdate: ()=> setDisplay(formatBRL(countObj.val))})` para BRL e USD paralelos (animation-contracts.md), + `gsap.from(".breakdown-row", {x:-12, autoAlpha:0, stagger:0.05})`
- [ ] T025 [P] [US3] Implementar NovaCarta flip preview em `app/src/screens/NovaCartaScreen.tsx` usando `useGSAP` + `contextSafe` para `onSearch` success: `gsap.fromTo(previewRef.current, {scale:0.9, rotationY:8, autoAlpha:0}, {scale:1, rotationY:0, autoAlpha:1, duration:0.45, ease:"back.out(1.2)"})` + input focus `gsap.to(inputRef,{boxShadow: shadows.goldGlow, duration:0.2})`
- [ ] T026 [US3] Wire `useReducedMotion` em todas as telas GSAP em `app/src/screens/HomeScreen.tsx`, `app/src/screens/ValoresScreen.tsx`, `app/src/screens/NovaCartaScreen.tsx` fazendo `duration: isReduced ? 0 : 0.5` e testando via DevTools Rendering → Emulate `prefers-reduced-motion: reduce` (FR-S05)

**Checkpoint**: At this point, User Stories 1, 2 AND 3 should all work independently — tema + TabBar + animações por tela

---

## Phase 6: User Story 4 - Componentes Estilizados Millenium (Priority: P1)

**Goal**: `CardTile`, `PriceBadge`, `EmptyState`, `QuantityModal` separado e `DialogConfirm` com borda puzzle, texturas e estados dourados, prontos para Claude Design

**Independent Test**: CardTile mostra borda puzzle `radius 16`, badge `xN` gold `goldGlow`, estrela fav gold; EmptyState com ilustração puzzle + CTA gold; QuantityModal abre com timeline GSAP e valida `quantity>=1`; PriceBadge `R$ X (US$ Y)` gold; sem cores fora de `tokens.ts`.

- [ ] T027 [P] [US4] Estilizar `CardTile` em `app/src/components/CardTile.tsx` aplicando `tokens.colors` + `tokens.radius.puzzle` chanfro, `tokens.shadows.card`, badge `xN` com `tokens.colors.gold` + `goldGlow`, estrela `isFavorite` toggle com `gsap.to(star,{scale:1.2, rotate:15, duration:0.2, yoyo:true, repeat:1})` e `imageLocalPath` prioritário fallback mantido (FR-012)
- [ ] T028 [P] [US4] Estilizar `PriceBadge` em `app/src/components/PriceBadge.tsx` usando `tokens.typography` + `tokens.colors.gold` para `R$ X (US$ Y)` via `Intl.NumberFormat pt-BR` (FR-015), aviso `price=null` com `tokens.colors.warning` e stale warning `exchangeRateDate`
- [ ] T029 [P] [US4] Estilizar `EmptyState` em `app/src/components/EmptyState.tsx` com ilustração puzzle, CTA primário `tokens.colors.gold` background + `ink` text, `gsap.from(emptyRef,{scale:0.95, autoAlpha:0, duration:0.4, ease:"back.out(1.2)"})`
- [ ] T030 [US4] Implementar `QuantityModal` separado em `app/src/components/QuantityModal.tsx` com props `{visible, code, name, quantity, onSave, onRemove, onClose}`, UI stepper `− / +` + input, validação idêntica a `FR-010` (`quantity >=1` com `ValidationError "Quantidade deve ser pelo menos 1 (use Remover para excluir)"`) e ações `Cancelar` ghost + `Salvar` gold + `Remover` danger, estilizado com `tokens.radius.puzzle` + `shadows.card` + watermark, animação open `gsap.timeline().fromTo(backdrop,{autoAlpha:0},{autoAlpha:1,duration:0.2}).fromTo(modal,{yPercent:30, autoAlpha:0},{yPercent:0, autoAlpha:1, duration:0.35, ease:"power3.out"},"-=0.1")` e close `timeline.reverse()` (animation-contracts.md), `useGSAP` com `scope` + `contextSafe`, `isReduced` zera duration
- [ ] T030b [US4] Estilizar `FavoriteCarousel` completo em `app/src/components/FavoriteCarousel.tsx` aplicando `tokens.radius.puzzle` borda, `shadows.goldGlow` em fav ativa, `tokens.colors.sand` texto, além do stagger já em US3 (G1 gap)
- [ ] T030c [US4] Estilizar `CardDetailScreen` completo em `app/src/screens/CardDetailScreen.tsx` com layout Millenium (header gold, fundo ink + watermark, `PriceBadge` audit `priceAtAcquisitionUSD` + `currentPrice` + `exchangeRateUsed`), botão `Editar quantidade` gold, consumindo `tokens`
- [ ] T031 [US4] Integrar `QuantityModal` em `app/src/screens/CardDetailScreen.tsx` adicionando botão `Editar quantidade` que abre modal, `onSave` chama `collectionRepo.updateQuantity(code, quantity)` + `collectionStore` update, `onRemove` chama `DialogConfirm`, mantendo audit `priceAtAcquisitionUSD` exibido
- [ ] T032 [P] [US4] Estilizar `DialogConfirm` em `app/src/components/DialogConfirm.tsx` (ou `Alert` custom) com backdrop `autoAlpha` gsap, borda puzzle, botões gold/danger
- [ ] T033 [P] [US4] Integration test para QuantityModal em `app/tests/integration/quantityModal.test.tsx` cobrindo abre com `gsap.timeline` chamado, stepper `−/+` anima `scale:0.92`, `quantity=0` rejeita com ValidationError, `Salvar` persiste e fecha via `reverse()`, `reduceMotion` zera duration

**Checkpoint**: At this point, User Stories 1–4 should all work independently — sistema visual Millenium completo

---

## Phase 7: User Story 5 - Performance & Acessibilidade (Priority: P2)

**Goal**: Garantir 60fps, sem layout thrashing, respeito `prefers-reduced-motion`, e otimização para `FlashList` 500 itens

**Independent Test**: Nenhuma animação usa `width/height/top/left`; só `x/y/scale/rotation/autoAlpha`; `will-change: transform` nos cards que animam; `Home` 500 itens sem freeze >200ms; `prefers-reduced-motion` desativa animações mantendo estado final; `ScrollTrigger` só em web se usado.

- [ ] T034 [P] [US5] Auditar performance GSAP em `app/src/screens/HomeScreen.tsx`, `app/src/components/FavoriteCarousel.tsx`, `app/src/screens/ValoresScreen.tsx` garantindo só `transform`/`autoAlpha`, `will-change: transform` CSS web nos `.card-tile/.fav-item` (gsap-performance SKILL.md:26), `stagger` em vez de N `gsap.to`, e `gsap.quickTo` se houver follower; verificar estático que `specs/002-yugioh-gsap-styling/contracts/animation-contracts.md` não contém `width|height|top|left` (G2)
- [ ] T035 [P] [US5] Verificar `gsap.matchMedia` global em `app/src/theme/ThemeProvider.tsx` registrando `reduceMotion: "(prefers-reduced-motion: reduce)"` e `gsap.defaults({duration: reduceMotion?0:0.6})` + teste manual DevTools emulate; adicionar unit test que `gsap.matchMedia().add` é chamado com `reduceMotion`
- [ ] T036 [P] [US5] (MOVED to Foundational T007b) — reservado; nesta fase apenas validar que `useAnimatedGSAP.ts` já existe e é usado em `HomeScreen/ValoresScreen/NovaCartaScreen` como fallback nativo (FR-S03) — sem recriar arquivo
- [ ] T037 [US5] Performance harness para 500 itens em `app/tests/integration/homePerformance.test.ts` estendendo seed 500 de `001` e asserindo `Home` com GSAP stagger sem jank >200ms, `computeTotals` <100ms, e `FlashList` 60fps alvo
- [ ] T037b [US5] Unit test estático anti-layout em `app/tests/unit/gsapPerformance.test.ts` verificando que `animation-contracts.md` e `src/` não animam `width/height/top/left` (rg grep deve retornar 0) e que `will-change: transform` está presente nos cards que animam (G2)

**Checkpoint**: At this point, User Stories 1–5 should all work independently — estilização performática e acessível

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Finalização, validação quickstart e prompt para Claude Design

- [ ] T038 [P] Executar validação `specs/002-yugioh-gsap-styling/quickstart.md` em `app/` com `npm install && npx tsc --noEmit && npx expo start --web --clear` e verificar cenários 1–8 (tema, TabBar, Home stagger, Valores count-up, NovaCarta flip, Modal timeline, reduced-motion, performance)
- [ ] T039 [P] Gerar `specs/002-yugioh-gsap-styling/prompt-claude-design.md` com bloco copiável contendo `tokens.ts` + `animation-contracts.md` + checklist assets Millenium para alimentar Claude Design (system design manual)
- [ ] T040 [P] Documentar dual driver em `app/README.md` e `specs/002-yugioh-gsap-styling/quickstart.md` nota "GSAP pleno em web, mirror reanimated em nativo"
- [ ] T041 [P] Code cleanup em `app/src/theme/`, `app/src/components/`, `app/src/screens/` garantindo sem cor hardcoded fora de `tokens.ts` (FR-S01) — verificar via `rg --grep "#[0-9a-fA-F]{6}" app/src --not tokens.ts` deve retornar 0 — e `gsap.context` cleanup (`ctx.revert()`) em todos os `useGSAP`
- [ ] T042 [P] Atualizar `specs/002-yugioh-gsap-styling/tasks.md` marcando completude e `git add` dos novos arquivos para revisão

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories (tokens + provider + reducedMotion)
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed) or sequentially P1 → P2
  - US1 (Tema) must complete before US2–US4 for token consumption, but US2 TabBar can start right after T005–T006
  - US3 (Animações) depends on US1 tokens + US2 TabBar scope pattern
  - US4 (Componentes) can parallelize with US3 (different files)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1) Tema Global**: Can start after Foundational - No dependencies on other stories; delivers `ThemeProvider` + backgrounds
- **US2 (P1) TabBar Custom**: Can start after Foundational (T005–T006) - Depends on tokens but independently testable with mock `navigation`
- **US3 (P1) Animações por Tela**: Can start after Foundational + US1 - Depends on tokens; testable via `useGSAP` mocks
- **US4 (P1) Componentes Estilizados**: Can start after Foundational + US1 - `QuantityModal` additive; depends on tokens + animation contracts
- **US5 (P2) Performance**: Can start after US3 + US4 - Auditoria que requer animações existentes

### Within Each User Story

- Tests (if marked) BEFORE implementation where TDD requested (T017 before T019)
- Tokens/ThemeProvider before screens that consume them
- `CustomTabBar` before `AppNavigator` integration
- `useGSAP` with `scope` + `contextSafe` before callbacks
- Core implementation before integration tests

### Parallel Opportunities

- All Setup [P] tasks (T003, T004) can run in parallel
- Foundational [P] (T010) can parallelize with T005–T009 after provider
- US1 screens (T012–T015) are different files → can run in parallel after US1 start
- US3 anims (T022–T025) different files → can run in parallel
- US4 components (T027–T029, T032) different files → can run in parallel
- US5 audits (T034–T036) can run in parallel
- Polish (T038–T042) can run in parallel (different files/docs)

---

## Parallel Example: User Story 3 (Animações)

```bash
# Launch all anims for US3 together (different files, no deps):
Task: "Implementar Home fav stagger em app/src/components/FavoriteCarousel.tsx" (T022)
Task: "Implementar Home grid stagger em app/src/screens/HomeScreen.tsx" (T023)
Task: "Implementar Valores count-up em app/src/screens/ValoresScreen.tsx" (T024)
Task: "Implementar NovaCarta flip preview em app/src/screens/NovaCartaScreen.tsx" (T025)
```

## Parallel Example: User Story 4 (Componentes)

```bash
# Launch all styled components together:
Task: "Estilizar CardTile em app/src/components/CardTile.tsx" (T027)
Task: "Estilizar PriceBadge em app/src/components/PriceBadge.tsx" (T028)
Task: "Estilizar EmptyState em app/src/components/EmptyState.tsx" (T029)
Task: "Estilizar DialogConfirm em app/src/components/DialogConfirm.tsx" (T032)
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only — Tema + TabBar)

1. Complete Phase 1: Setup (T001–T004) — install gsap/@gsap/react
2. Complete Phase 2: Foundational (T005–T010) — tokens + provider + reducedMotion
3. Complete Phase 3: US1 — Tema Global (T011–T016) → **STOP and VALIDATE** via `app/tests/unit/theme.test.ts`
4. Complete Phase 4: US2 — TabBar Custom (T017–T021) → **STOP and VALIDATE** via `customTabBar` integration + manual `expo start --web`
5. Deploy/demo MVP estilização (tema + TabBar Millenium)

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Deploy/Demo (fundo ink + gold)
3. Add US2 → Deploy/Demo (TabBar Millenium)
4. Add US3 → Deploy/Demo (animações Home/Valores/NovaCarta)
5. Add US4 → Deploy/Demo (QuantityModal separado + componentes)
6. Add US5 → Deploy/Demo (auditoria 60fps + reduced-motion)
7. Polish → prompt Claude Design + docs

### Parallel Team Strategy

With multiple developers (after Foundational):

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 Tema + US3 Animações Home/Valores
   - Developer B: US2 TabBar Custom + US3 NovaCarta
   - Developer C: US4 QuantityModal + componentes + US5 Performance
3. Stories complete and integrate independently; `app/src/theme/tokens.ts` single owner, `CustomTabBar` single owner

---

## Notes

- [P] tasks = different files, no dependencies — safe to parallelize
- [Story] label maps task to specific user story for traceability (US1–US5)
- Each user story independently completable and testable — seed `collection_items` directly for isolated tests where needed, but visual tests mock GSAP
- Verify GSAP only animates `transform`/`autoAlpha` (gsap-performance SKILL.md:15) and respects `prefers-reduced-motion`
- Commit after each task or logical group; push per story phase
- Stop at any checkpoint to validate story independently via `specs/002-yugioh-gsap-styling/quickstart.md`
- Constitution compliance: I (valuation intact), II (normalizeCode + cardApi multi-estratégia intact), III (3 tabs preserved), IV (local-first, single new domain `theme/`), V (tests + observability + 500 perf)
- Data-model constraints quoted verbatim: `colors {ink:"#0f172a", gold:"#D4A017", sand:"#F5E6C8"}`, `radius {puzzle:16}`, `AnimationSpec {duration, ease:"power3.out", stagger:{amount:0.3}}`, `quantity >=1` com `ValidationError "Quantidade deve ser pelo menos 1 (use Remover para excluir)"`, `prefers-reduced-motion: reduce` → `duration:0`
