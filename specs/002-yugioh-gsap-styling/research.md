# Research: Yu-Gi-Oh! Millenium Puzzle + GSAP

## R1: GSAP + Expo — nativo vs web

- **Decision**: Alvo primário GSAP = **Expo Web** (`npx expo start --web`) onde GSAP anima DOM diretamente via `gsap.to/from` + `@gsap/react useGSAP`. Para **iOS/Android nativo**, manter `react-native-reanimated 4.5.1` já instalado e **mapear** as mesmas timelines para `Animated`/`useAnimatedStyle` com mesmos `duration/ease/stagger` — animação é spec-single-source, driver dual.
- **Rationale**: GSAP core (`gsap-core` SKILL.md:18) requer DOM/CSSPlugin; RN não tem DOM. Tentar `gsap` no nativo falha silenciosamente ou exige `react-native` shim não oficial. Expo web já expõe DOM e é suportado por `app/package.json` script `web`.
- **Alternatives**: `gsap` puro no nativo com `transform` strings (rejeitado: sem DOM, bundle maior, sem `transformOrigin`), `react-native-gsap` não mantido (rejeitado), só `reanimated` sem GSAP (rejeitado: usuário pediu skill GSAP e GSAP tem timelines/matchMedia superiores).

## R2: @gsap/react + reanimated coexistência + matchMedia no RN

- **Decision**: Instalar `gsap ^3.12.5` + `@gsap/react ^2.1.1`. Uso padrão `gsap-react` SKILL.md:25 — `gsap.registerPlugin(useGSAP)` + `useGSAP(()=>{gsap.to(...)}, {scope: containerRef})`. Para `prefers-reduced-motion`, usar `gsap.matchMedia()` (`gsap-core` SKILL.md:207) com objeto `{reduceMotion:"(prefers-reduced-motion: reduce)"}` e `duration: reduceMotion?0:0.6`. No nativo, replicar via `useReducedMotion` hook que lê `AccessibilityInfo.isReduceMotionEnabled()` e zera `withTiming` duration.
- **Rationale**: `useGSAP` já faz cleanup automático (`ctx.revert()`), evita leaks (`gsap-react` SKILL.md:41-44). `matchMedia` reverte tweens automaticamente quando query deixa de casar.
- **Alternatives**: `useEffect + gsap.context()` manual (válido mas mais verboso, manter como fallback se `@gsap/react` não resolver), `react-native-media-query` (rejeitado: duplicado).

## R3: Padrão useGSAP com scope + contextSafe (TabBar/Modal)

- **Decision**: Cada componente animado expõe `containerRef` como `scope`. Callbacks fora do `useGSAP` (ex.: `onTabPress`, `onOpenModal`) usam `contextSafe` retornado por `useGSAP((ctx, contextSafe)=>{...})` (`gsap-react` SKILL.md:81) para evitar tweens órfãos após unmount. Cleanup via `return ()=>ctx.revert()` quando `useGSAP` não usado; com `useGSAP`, revert é automático.
- **Rationale**: Previne "updates on detached nodes" e leaks em navegação Tab/Stack.
- **Alternatives**: Seletores globais sem scope (rejeitado: vaza para outros componentes).

## R4: Performance em FlashList + GSAP

- **Decision**: Seguir `gsap-performance` SKILL.md:15 — animar só `x,y,scale,rotation,autoAlpha` (compositor), nunca `width/height/top/left`. Usar `stagger` em vez de N `gsap.to` separados. `will-change: transform` só nos cards que animam (CSS web) e `transform` GPU em nativo. `gsap.quickTo` para followers se houver. `ScrollTrigger` só no web (pin/scrub com `scrub:1`); no nativo, virtualização do `FlashList 2.0.2` já garante 60fps.
- **Alternatives**: Animar `height` do modal (rejeitado: layout thrashing), criar timeline por item (rejeitado: uso de memória).

## R5: Tema Millenium Puzzle — tokens

- **Decision**: Extrair tokens de referências Yu-Gi-Oh! Duel Monsters (Millenium Puzzle gold #D4A017, ink #0f172a como fundo de carta, sand #F5E6C8 texto). Hieróglifo watermark SVG 5% como `backgroundImage` no `ThemeProvider`.
- **Rationale**: Contraste alto, legibilidade, sem infringir marca (paleta inspirada, não assets oficiais).
- **Alternatives**: Tema azul KaibaCorp (rejeitado: menos icônico), tema Duel Disk cinza (rejeitado: frio).

## Conclusão Phase 0
Todos os NEEDS CLARIFICATION resolvidos. Pronto para Phase 1 (data-model + contracts + quickstart).
