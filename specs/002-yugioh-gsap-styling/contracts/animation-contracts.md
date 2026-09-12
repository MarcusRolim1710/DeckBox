# Animation Contracts (GSAP)

## TabBar Custom — `app/src/components/CustomTabBar.tsx`
- **Targets**: `.tab-item`, `.tab-indicator`
- **On mount**: `gsap.from(".tab-item", {y:10, autoAlpha:0, stagger:0.06, duration:0.4, ease:"power2.out"})`
- **On tab press** (contextSafe): `gsap.timeline().to(active, {scale:1.08, duration:0.15, ease:"back.out(1.7)"}).to(active, {scale:1, duration:0.2})` + gold glow `boxShadow`
- **Cleanup**: `useGSAP` auto `ctx.revert()`; `matchMedia reduceMotion` → duration 0

## Home — `FavoriteCarousel` + `HomeScreen`
- **Fav stagger**: `gsap.from(".fav-item", {y:20, autoAlpha:0, duration:0.5, ease:"power3.out", stagger:{amount:0.3, from:"start"}})` com `immediateRender:true`
- **Grid**: `gsap.from(".card-tile", {scale:0.9, autoAlpha:0, stagger:0.04, ease:"power2.out"})` após `FlashList` render

## Valores — `ValoresScreen`
- **Count-up**: `gsap.to(countObj, {val: totalBRL, duration:0.8, ease:"power2.out", onUpdate: ()=> text = formatBRL(countObj.val)})` para BRL e USD paralelos; **trigger** `propChange totalBRL` com `from: previousTotal` (não de 0) e `duration: isReduced?0:0.8` (A1)
- **Breakdown**: `gsap.from(".breakdown-row", {x:-12, autoAlpha:0, stagger:0.05})`

## Nova Carta — `NovaCartaScreen`
- **Input focus**: `gsap.to(input, {boxShadow: shadows.goldGlow, duration:0.2})`
- **Preview flip**: `gsap.fromTo(preview, {scale:0.9, rotationY:8, autoAlpha:0}, {scale:1, rotationY:0, autoAlpha:1, duration:0.45, ease:"back.out(1.2)"})`

## QuantityModal — `QuantityModal.tsx`
- **Open**: `gsap.timeline().fromTo(backdrop,{autoAlpha:0},{autoAlpha:1,duration:0.2}).fromTo(modal,{yPercent:30, autoAlpha:0},{yPercent:0, autoAlpha:1, duration:0.35, ease:"power3.out"},"-=0.1")`
- **Close**: `timeline.reverse()` + `onReverseComplete -> onClose()`
- **Stepper**: `gsap.to(button,{scale:0.92, yoyo:true, repeat:1, duration:0.12})` no `onPress`

## Globais
- `gsap.defaults({duration:0.6, ease:"power2.out"})` em `ThemeProvider`
- `gsap.matchMedia().add({reduceMotion:"(prefers-reduced-motion: reduce)"}, (ctx)=>{ if(ctx.conditions.reduceMotion) gsap.defaults({duration:0}) })`
- Só `transform`/`autoAlpha`; **proibido** `width|height|top|left`; `will-change: transform` nos `.card-tile/.fav-item` (web) + `useAnimatedStyle` mirror no nativo (G2)
- **prompt-claude-design**: bloco copiável contendo `tokens.ts` + este contrato será gerado em `specs/002-yugioh-gsap-styling/prompt-claude-design.md` (T039) para System Design manual (A2)
