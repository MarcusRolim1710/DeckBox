# Feature Specification: Estilização Gráfica Yu-Gi-Oh! + GSAP (Millenium Puzzle)

**Branch**: `002-yugioh-gsap-styling` | **Date**: 2026-09-12 | **Depends on**: `001-deckbox-colecao-mvp` (MVP funcional)
**Status**: Draft | **Skill**: `gsap-core`, `gsap-react`, `gsap-timeline`, `gsap-performance`, `gsap-scrolltrigger`

## Objetivo
Transformar o MVP funcional (3 abas + stack já em `app/src/navigation/AppNavigator.tsx:10`) em uma experiência **Yu-Gi-Oh! Millenium Puzzle** com estilização gráfica completa e animações GSAP — mantendo 100% dos FRs/SCs de `001` (valoração, offline, regex `^[A-Z0-9]+-[A-Z0-9-]+$`).

## Tema Escolhido — Millenium Puzzle
- **Paleta Ink/Gold/Sand** fixa: `ink #0f172a` (fundo), `slate #1e293b`, `gold #D4A017` (primária), `goldMuted #9A7B2E`, `sand #F5E6C8` (texto claro), `warning #b45309`, `success #16a34a`.
- **Texturas**: hieróglifo watermark 5% opacity no fundo das telas, borda chanfrada puzzle-piece nos cards/modais.
- **Tipografia**: Display serif para títulos (Valores total, headers), Sans para body pt-BR (já via `formatters.ts`).

## Decisões de Arquitetura Tomadas (do usuário)
1. **System Design será gerado pelo Claude Design** a partir deste PRD/spec — PRD deve ser prompt-ready com tokens e inventário.
2. **TabBar Custom** com tema Millenium (substituir `Tab.Navigator screenOptions` padrão em `AppNavigator.tsx:25`).
3. **Edição de quantidade em Modal separado** (não inline no `CardDetailScreen.tsx`).

## User Stories de Estilização

### US1 — Tema Global e Tokens (P1)
Como dev/designer, quero tokens centralizados (cores, radius, sombras, tipografia) para que o Claude Design gere o System Design consistente.
- **Critérios**: `app/src/theme/tokens.ts` exporta `colors, radius, spacing, typography, shadows`; `app/src/theme/ThemeProvider.tsx` injeta via contexto; `AppNavigator` consome tokens para header/tabBar.

### US2 — TabBar Custom Millenium (P1)
Como colecionador, vejo uma barra com 3 ícones puzzle dourados, estado ativo preenchido + sublinhado gold, que substitui a TabBar padrão.
- **Critérios**: componente `app/src/components/CustomTabBar.tsx` com props `{state,navigation}`; animação GSAP no `onTabPress` (scale + gold glow); respeita `gsap.matchMedia("(prefers-reduced-motion: reduce)")` zera duração.

### US3 — Animações GSAP por Tela (P1)
- **Home**: `FavoriteCarousel` stagger entrance `gsap.from(".fav-item", {y:20, autoAlpha:0, stagger:0.08})`, grid `FlashList` stagger por linha.
- **Valores**: count-up dos totais BRL/USD via `gsap.to` com `onUpdate` formatando `Intl.NumberFormat pt-BR`, barras de breakdown com `scaleX` stagger.
- **Nova Carta**: input focus gold glow, preview `CardTile` com `fromTo scale 0.9→1 + rotationY 8→0` (efeito virar carta), botão `Buscar` com `back.out(1.7)`.
- **CardDetail + QuantityModal**: modal abre com `gsap.fromTo(modal, {yPercent:30, autoAlpha:0}, {yPercent:0, autoAlpha:1, ease:"power3.out"})`, backdrop fade, close reverse timeline.

### US4 — Componentes Estilizados Millenium (P1)
`CardTile`, `PriceBadge`, `EmptyState`, `QuantityModal`, `DialogConfirm` com borda puzzle, texturas e estados dourados.

### US5 — Performance & Acessibilidade (P2)
Animações só em `transform`/`autoAlpha`, `will-change: transform` nos cards, `gsap.quickTo` se houver follower, `ScrollTrigger` apenas em web; `prefers-reduced-motion` desativa ou zera duration.

## Requisitos Funcionais (estilização)
- FR-S01: Tokens centralizados em `app/src/theme/` e consumidos por todos os componentes; sem cores hardcoded fora de `tokens.ts`.
- FR-S02: TabBar custom implementado e testável com animação GSAP, sem quebrar `FR-014` (exatamente 3 destinos).
- FR-S03: `gsap` + `@gsap/react` instalados; animações via `useGSAP` com `scope` e `ctx.revert()` no cleanup; compatível com `expo start --web` (GSAP DOM) e fallback `reanimated` para nativo se necessário (documentar).
- FR-S04: Modal de quantidade separado `app/src/components/QuantityModal.tsx` com stepper `− / +`, validação idêntica a `FR-010` de `001` (`quantity >=1` com `ValidationError "Quantidade deve ser pelo menos 1 (use Remover para excluir)"`) e ações `Cancelar/Salvar/Remover`.
- FR-S05: Todas as animações respeitam `prefers-reduced-motion: reduce` (duração 0 ou skip).
- FR-S06: Performance orçamento mantido: Home 500 itens sem jank, animações 60fps, `FlashList` + `expo-image` preservados.

## Success Criteria
- SC-S01: TabBar custom renderiza 3 ícones Millenium, troca de aba anima em ≤300ms e é testável via `CustomTabBar.test.tsx`.
- SC-S02: Home/Valores/NovaCarta/Modal animam com GSAP sem layout thrashing (só transform/autoAlpha) e passam `gsap.matchMedia` reduce-motion manual.
- SC-S03: `QuantityModal` abre/fecha com timeline GSAP reversível e valida `quantity >=1`.

## Constitution Guardrails (NON-NEGOTIABLE)

Esta feature **NÃO pode** violar:
- **FR-014**: exatamente 3 destinos `Home | Valores | NovaCarta` — TabBar custom é só visual, não pode adicionar/renomear rota.
- **FR-020 / FR-021**: persistência 100% local no aparelho (SQLite + FileSystem), single-user sem login — sem backend/cloud.
- **Constituição I/V**: `SUM(price*BRL*quantity)` com `priceAtAcquisition` imutável + testes valoração; estilização só anima exibição.
- `validators.ts` `^[A-Z0-9]+-[A-Z0-9-]+$` com strip `yugioh_` + `cardApi` multi-estratégia `cardsets.php` permanecem intocados.

## Fora de Escopo
- Backend/cloud, novos destinos de navegação, mudanças em `CollectionItem` schema.

## Contexto Técnico
- **Stack**: Expo SDK 57 (bump herdado de `001` pós upgrade SDK 52→57: TS ~6.0, RN 0.86), `react-native-reanimated 4.5.1` já instalado, `@shopify/flash-list 2.0.2`.
- **Novo (single source)**: `gsap ^3.12.5` + `@gsap/react ^2.1.1` (DOM/web); para nativo manter `reanimated` como driver e espelhar timelines GSAP onde DOM não existe — documentado em `research.md`.
- **Performance**: `gsap-performance` skill (transform, will-change, stagger, quickTo).
