# Data Model: Estilização Millenium + GSAP

## Entidade: ThemeTokens
Fonte da verdade de estilização. Não persiste em SQLite, é código.

```ts
export type ThemeColors = {
  ink: "#0f172a"; slate: "#1e293b"; gold: "#D4A017"; goldMuted: "#9A7B2E";
  sand: "#F5E6C8"; surface: "#ffffff"; warning: "#b45309"; success: "#16a34a";
  textPrimary: "#F5E6C8"; textSecondary: "#94a3b8";
};
export type ThemeRadius = { sm: 8; md: 12; puzzle: 16 };
export type ThemeSpacing = { xs:4; sm:8; md:12; lg:16; xl:24 };
export type ThemeTypography = {
  display: { fontFamily: "Cinzel", size: 22, weight: "700" }; // Valores total
  heading: { size: 16, weight: "700" };
  body: { size: 14, weight: "400" };
  mono: { size: 12, weight: "500" }; // code LOB-001
};
export type ThemeShadows = { card: "0 4px 12px rgba(0,0,0,0.4)"; goldGlow: "0 0 12px rgba(212,160,23,0.6)" };
export type ThemeWatermark = { asset: "hieroglyph-watermark.svg"; opacity: 0.05; blend: "overlay"; placement: "background"; contrastRequirement: "gold on ink >=4.5:1 AA" };
export type ThemeTokens = { colors: ThemeColors; radius: ThemeRadius; spacing: ThemeSpacing; typography: ThemeTypography; shadows: ThemeShadows; watermark: ThemeWatermark };
```

**Validação**: sem cor hardcoded fora de `tokens.ts` (lint rule futura).

## Entidade: AnimationSpec
Define timeline por componente; consumida por `useGSAP` (web) e mapeada para `reanimated` (nativo).

```ts
export type AnimationSpec = {
  id: "home-fav-stagger" | "valores-countup" | "nova-flip" | "tabbar-glow" | "modal-open";
  targets: string; // seletor com scope, ex.: ".fav-item"
  vars: { duration: number; ease: string; stagger?: number | {amount:number; from:string}; y?: number; scale?: number; rotationY?: number; autoAlpha?: number };
  trigger: "mount" | "onPress" | "propChange";
  reducedMotion: { duration: 0 } | { skip: true };
  cleanup: "ctx.revert()" | "kill()";
};
```

Exemplos:
- `home-fav-stagger`: `{targets:".fav-item", vars:{y:20, autoAlpha:0, duration:0.5, ease:"power3.out", stagger:{amount:0.3, from:"start"}}, trigger:"mount"}`
- `modal-open`: timeline `{from:{yPercent:30, autoAlpha:0}, to:{yPercent:0, autoAlpha:1, duration:0.35, ease:"power3.out"}, reverseOnClose:true}`

## Relacionamentos
- `ThemeTokens` 1—N `AnimationSpec` (cores usadas em tweens `backgroundColor`, `boxShadow`)
- `AnimationSpec` N—1 `Screen` (Home, Valores, NovaCarta, CardDetail/Modal, CustomTabBar)
- Sem FK em DB; tudo em memória.

## Regras
- `AnimationSpec` só anima `x/y/scale/rotation/autoAlpha` (gsap-performance); **proibido** `width|height|top|left` (G2).
- `prefers-reduced-motion` → `duration:0` (não skip total para manter estado final); `valores-countup` trigger `propChange` com `from: previousTotal` (A1).
- `useGSAP` sempre com `scope: containerRef` + `contextSafe` para callbacks.
- Watermark `hieroglyph-watermark.svg` `opacity:0.05` `overlay` `background` com contraste `gold on ink >=4.5:1` (U1).
