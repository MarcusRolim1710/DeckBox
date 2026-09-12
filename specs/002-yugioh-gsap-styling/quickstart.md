# Quickstart — Validação Estilização GSAP (002)

## Pré-requisitos
```bash
cd app
npm install
npm install gsap@^3.12.5 @gsap/react@^2.1.1
npx expo start --web --clear   # GSAP DOM pleno
# nativo:
npx expo start --clear
```

## Cenários de Validação

### 1) Tema global
- Abrir Home/Valores/NovaCarta → fundo `ink #0f172a` + watermark hieróglifo 5% + headers gold. Sem cor hardcoded fora de `src/theme/tokens.ts`.

### 2) TabBar custom
- Ver 3 ícones Millenium (album/coins/plus), ativo com preenchimento + sublinhado gold; tocar troca com `scale 1.08 back.out` + glow ≤300ms.

### 3) Home GSAP
- Carregar 3 favoritas → stagger `y 20 → 0` 0.5s. Grid 10 itens stagger 0.04. Sem jank.

### 4) Valores count-up
- `Valores` com 3 cartas → `totalBRL` faz count-up 0.8s `power2.out` com `R$ X` pt-BR; rows entram com `x -12`.

### 5) Nova Carta flip
- Buscar `LOB-001` → preview entra com `scale 0.9→1 rotationY 8→0 back.out`.

### 6) QuantityModal timeline
- `CardDetail → Editar quantidade` abre modal com backdrop fade + `yPercent 30→0`; fechar faz `reverse()`; stepper `- / +` anima `scale 0.92`.

### 7) Reduced motion
- Ativar `prefers-reduced-motion: reduce` (DevTools Rendering → Emulate) → todas as durations viram 0, conteúdo já no estado final sem animação.

### 8) Performance
- Sem animar `width/height/top/left`; só `x/y/scale/rotation/autoAlpha`. `FlashList` 500 itens sem freeze >200ms.

## Comandos de Teste
```bash
npx tsc --noEmit
npm test -- --testPathPattern="customTabBar|quantityModal"
```
