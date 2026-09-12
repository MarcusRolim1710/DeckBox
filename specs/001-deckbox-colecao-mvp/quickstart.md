# Quickstart: DeckBox MVP — Validação End-to-End

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Data Model**: [data-model.md](./data-model.md)

Este guia valida que o MVP atende aos critérios de sucesso sem incluir código de implementação completo. Use-o como checklist manual + comandos de teste.

## Pré-requisitos

- Node 20+, pnpm ou npm, Expo CLI (`npm i -g expo-cli` ou `npx expo`)
- Simulador iOS ou emulador Android, ou device físico com Expo Go
- Acesso à internet para `YGOPRODeck` e `AwesomeAPI` (fallback offline testado)
- Repositório clonado na branch `001-deckbox-colecao-mvp`

## Setup

```bash
# 1. Instalar
npm install

# 2. Inicializar DB (migrations criam collection_items + exchange_rates)
npx expo prebuild --clean   # apenas se usar expo-sqlite nativo
npx expo start

# 3. Rodar testes
npm test                    # unit (valuation, validators, formatters)
npm run test:contract       # ygo + exchange com fixtures gravadas
npm run test:integration    # repo + imageCache + offline
```

## Cenários de Validação (manuais, rastreáveis a SC/US)

### 1. Cadastro por código — SC-001/SC-002 (US1)

1. Abrir `Nova Carta`, digitar ` LOB-001 ` (com espaços e minúsculas) → deve normalizar e buscar
2. Ver preview com imagem, nome e preço `R$ X (US$ Y)` → Confirmar
3. **Esperado**: item aparece em Home (grid) com imagem do cache em ≤3s, `quantity=1`, `isFavorite=false`; `priceAtAcquisitionUSD` gravado; `currentPriceBRL` derivado da taxa do dia
4. Repetir cadastro do mesmo código → badge muda para `x2`, `priceAtAcquisitionUSD` permanece, `currentPriceUSD` atualiza se diferente

### 2. Código inexistente — SC-005 (US1)

1. Nova Carta → `XXX-999` → Confirmar
2. **Esperado**: mensagem `Código não encontrado` em ≤2s, nenhum registro criado, botão Tentar novamente visível

### 3. Preço ausente — FR-002/FR-008

1. Mockar ou usar código sabidamente sem `cardmarket_price` (ver `contracts/ygoprodeck-api.yaml`)
2. Confirmar cadastro
3. **Esperado**: item salvo com `Preço indisponível — não entra na soma`, Valores exclui da soma e mostra `1 carta sem preço`

### 4. Home — carrossel + grid — SC-004 (US2)

1. Popular 10 cartas, marcar 3 como favoritas (estrela no tile)
2. **Esperado**: carrossel com 3 itens (horizontal), grid com 10 tiles (imagem+nome+badge); coleção vazia mostra `EmptyState` com CTA `Adicionar primeira carta`
3. Rolar grid com 50/200 itens → sem jank >200ms (FlashList)

### 5. Favoritas — SC-006 (US4)

1. No grid, tocar estrela de carta não favorita
2. **Esperado**: carrossel ganha 1 item em ≤1s; desfavoritar remove do carrossel mas mantém no grid; persistir após fechar/reabrir app

### 6. Quantidade e remoção — SC-007 (US5)

1. Detalhe da carta → editar `quantity` 1→3 → salvar
2. **Esperado**: badge `x3`, Valores recalcula em ≤500ms
3. Tentar `quantity=0` → erro `Quantidade deve ser pelo menos 1`
4. Remover → diálogo `Remover [nome]?` → confirmar → item some de grid/carrossel e total recalcula

### 7. Valores — dual BRL/USD — SC-003/SC-009 (US3)

1. Criar coleção: 3 cartas (USD 5×1, USD 10×1 c/ `currentPriceBRL=51,20`, carta sem preço ×2)
2. Abrir Valores
3. **Esperado**: `Total: R$ 89,60 (US$ 17,50)` + breakdown linha a linha (`código | nome | qtd | unit BRL (USD) | subtotal`); carta sem preço listada separada com contador; usuário consegue explicar origem do total (auditoria com `priceAtAcquisitionUSD`, `exchangeRateUsed`, `lastPriceSyncAt` ao expandir)

### 8. Offline — SC-008/SC-010

1. Com coleção populada e imagens em cache, ativar modo avião, fechar e reabrir app
2. **Esperado**: Home e Valores navegam com dados e imagens do cache, sem requisição; Nova Carta → `Sem conexão` com Tentar novamente; taxa de câmbio stale exibe aviso `Cotação de DD/MM` mas mantém último total BRL

### 9. Performance — 500 itens

1. Script de seed `npm run seed:500` (se disponível) ou importar fixture
2. **Esperado**: Home abre sem congelamento, scroll fluido, valoração instantânea (<100ms para `computeTotals`)

## Validação de Contratos

```bash
# YGOPRODeck
npm run test:contract -- ygoprodeck
# deve passar: success_cardmarket_price, not_found, missing_price, malformed_response

# Câmbio
npm run test:contract -- exchange
# deve passar: awesomeapi_success, exchangerate_fallback, offline_fallback
```

## Critério de Done

- Todos os 9 cenários acima passam manualmente
- `npm test` + `test:contract` + `test:integration` verdes
- `computeTotals` puro com 100% dos casos (inclui null e quantity) coberto
- Sem `[NEEDS CLARIFICATION]` na spec; checklist 16/16

## Próximo comando

Após validar quickstart: `/speckit.tasks` para gerar `tasks.md` (Phase 2).
