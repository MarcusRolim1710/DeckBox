# Feature Specification: DeckBox — Álbum Digital e Valoração de Coleção Yu-Gi-Oh

**Feature Branch**: `001-deckbox-colecao-mvp`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "Briefing DeckBox — aplicativo tipo fichário/álbum digital para colecionadores de Yu-Gi-Oh com 3 telas (Home, Valores, Nova Carta). Home com carrossel de favoritas e grid do álbum completo. Nova Carta via código único (ex.: LOB-001) consultando API externa (YGOPRODeck) retornando imagem, nome e preço. Valores com somatória automática do valor total da coleção como diferencial principal. Modelo de dados com código, nome, imagem, preço, quantidade, favorita e data de adição. Escopo MVP definido; pontos em aberto sobre API, moeda, duplicatas, favoritas, filtros, edição/remoção, autenticação e plataforma."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar nova carta pelo código (Priority: P1)

Colecionador possui uma carta física e quer adicioná-la à coleção digital informando apenas o código impresso na carta (ex.: `LOB-001`). O sistema consulta a API, exibe os dados retornados para confirmação e salva na coleção.

**Why this priority**: É a única porta de entrada de dados do MVP. Sem ela não há coleção, álbum ou valoração. Valida o princípio de Identidade Verificada por API (Constituição II).

**Independent Test**: Pode ser testado isoladamente simulando entrada de código, mockando resposta da API e verificando persistência do item com `code`, `name`, `imageUrl`, `priceAtAcquisition`/`currentPrice`, `quantity=1` e `addedAt`.

**Acceptance Scenarios**:

1. **Given** coleção vazia, **When** usuário informa código `LOB-001` válido e confirma, **Then** sistema exibe imagem, nome e preço retornados pela API e salva um novo item na coleção com quantidade 1.
2. **Given** código já existente na coleção com quantidade 2, **When** usuário cadastra o mesmo código novamente e confirma sem alterar quantidade, **Then** sistema incrementa `quantity` para 3, não cria novo tile duplicado e mantém `priceAtAcquisition` original e atualiza `currentPrice` se diferente.
3. **Given** código inexistente na API (ex.: `XXX-999`), **When** usuário tenta cadastrar, **Then** sistema exibe mensagem de erro clara "Código não encontrado" e não cria registro.
4. **Given** API retorna dados sem preço, **When** usuário confirma cadastro, **Then** sistema salva item com `price=null`, exibe aviso "Preço indisponível — não entra na soma" e permite edição futura.
5. **Given** usuário informa código com variações de caixa/espaço (ex.: ` lob-001 `), **When** envia, **Then** sistema normaliza (trim + upper-case) e consulta corretamente.

---

### User Story 2 - Visualizar álbum e carrossel de favoritas na Home (Priority: P1)

Colecionador abre o app para folhear sua coleção como um fichário. No topo vê suas favoritas em carrossel horizontal; abaixo vê todas as cartas em grid.

**Why this priority**: Entrega a metáfora central de álbum (Constituição III). É a tela de maior tempo de uso e valida a proposta "fichário digital".

**Independent Test**: Popular coleção com 10 cartas (3 favoritas) e verificar renderização do carrossel (3 itens, rolagem horizontal) e do grid (10 tiles com imagem + badge de quantidade).

**Acceptance Scenarios**:

1. **Given** coleção com 5 cartas sendo 2 favoritas, **When** usuário acessa Home, **Then** carrossel exibe 2 cartas favoritas com imagem em destaque e grid exibe 5 tiles.
2. **Given** coleção vazia, **When** usuário acessa Home, **Then** sistema exibe estado vazio com CTA "Adicionar primeira carta" que leva para Nova Carta (não mostra carrossel/grid vazios).
3. **Given** coleção com 50 cartas, **When** usuário rola o grid, **Then** todas as imagens permanecem legíveis e a rolagem é fluida (sem travamentos perceptíveis).
4. **Given** carta com `quantity=3`, **When** exibida no grid, **Then** tile mostra badge `x3` sobre a imagem e nome abaixo; carrossel também reflete favorita com mesmo badge se aplicável.

---

### User Story 3 - Consultar valor total da coleção (Priority: P1)

Colecionador quer saber quanto vale sua coleção hoje. Acessa a tela Valores e vê a somatória automática baseada nos preços vindos da API.

**Why this priority**: É o gancho principal/diferencial do produto (Constituição I). Sem valoração confiável o app perde seu motivo de existir.

**Independent Test**: Criar coleção com 3 cartas (preços 10, 20, 30 e quantidades 1,2,1) e verificar que Valores exibe total 80 (10*1 + 20*2 + 30*1) com breakdown itemizado.

**Acceptance Scenarios**:

1. **Given** coleção com 3 cartas com `currentPrice` 5, 10 e 15 e quantidades 1,1,2, **When** usuário abre Valores, **Then** total exibido é 45 com lista detalhando cada carta (nome, código, qtd, preço unitário, subtotal).
2. **Given** uma carta com `price=null`, **When** usuário abre Valores, **Then** total exclui essa carta da soma, exibe contador "1 carta sem preço" e aviso explicativo, sem considerar valor zero silenciosamente.
3. **Given** coleção vazia, **When** usuário abre Valores, **Then** total é 0 com mensagem "Sua coleção ainda não tem valor — adicione cartas".
4. **Given** `currentPrice` atualizado via ressincronização da API, **When** usuário volta em Valores, **Then** total reflete novo preço mantendo `priceAtAcquisition` inalterado para auditoria (detalhe visível ao expandir item).

---

### User Story 4 - Gerenciar cartas favoritas (Priority: P2)

Colecionador quer destacar suas cartas mais queridas para vê-las sempre no topo.

**Why this priority**: Dá vida ao carrossel e personaliza o álbum. Depende de US1 e US2 mas agrega valor emocional.

**Independent Test**: Marcar/desmarcar favorita a partir do grid e da tela de detalhe, verificando que o carrossel atualiza imediatamente.

**Acceptance Scenarios**:

1. **Given** carta não favorita no grid, **When** usuário toca no ícone de estrela no tile, **Then** `isFavorite` alterna para true e carta aparece no carrossel em até 1 segundo sem recarregar a página.
2. **Given** carta favorita no carrossel, **When** usuário desfavorita, **Then** ela sai do carrossel mas permanece no grid.
3. **Given** nenhuma favorita, **When** Home é carregada, **Then** carrossel exibe estado vazio discreto "Nenhuma favorita ainda — toque na estrela para destacar" sem quebrar layout.

---

### User Story 5 - Gerenciar quantidade e remover cartas (Priority: P2)

Colecionador comprou mais cópias da mesma carta ou vendeu/trocou e precisa ajustar ou remover.

**Why this priority**: Resolve o ponto em aberto de duplicatas e mantém coleção fiel à realidade física. Sem isso o valor total fica incorreto.

**Independent Test**: Editar quantidade de 1 para 3 e remover uma carta, verificando atualização do grid, carrossel e total em Valores.

**Acceptance Scenarios**:

1. **Given** carta com `quantity=1`, **When** usuário edita para `quantity=3` (via detalhe da carta ou controle no grid), **Then** sistema persiste novo valor, grid atualiza badge para `x3` e Valores recalcula subtotal.
2. **Given** usuário tenta definir quantidade 0 ou negativa, **When** confirma, **Then** sistema rejeita com mensagem "Quantidade deve ser pelo menos 1 (use Remover para excluir)".
3. **Given** usuário escolhe remover carta, **When** confirma em diálogo "Remover [nome] da coleção?", **Then** item é excluído, grid/carrossel atualizam e total em Valores é recalculado.

---

### User Story 6 - Buscar e filtrar a vibe futura (fora do MVP, mas preparatória) (Priority: P3)

Colecionador com centenas de cartas quer encontrar rápido. MVP não exige filtros, mas a arquitetura não pode impedir.

**Why this priority**: P3 porque briefing lista como ponto em aberto e Constituição III diz que filtros são aditivos. Documenta expectativa sem bloquear MVP.

**Independent Test**: Verificar que mesmo sem UI de filtro, modelo suporta busca por `name`/`code` e que Home mantém ordenação padrão estável (por `addedAt` desc ou alfabética, a definir em plan).

**Acceptance Scenarios**:

1. **Given** coleção com 100 cartas, **When** caso filtro futuro seja implementado, **Then** busca por substring do nome retorna em <500ms e grid mantém ordenação padrão quando filtro é limpo.

---

### Edge Cases

- Código com caracteres especiais ou sem hífen (ex.: `LOB001`, `lob 001`) — sistema normaliza ou exibe erro de formato inválido antes de chamar API?
- API fora do ar / timeout / rate limit — exibir estado de erro com retry, não travar Nova Carta; coleção existente continua navegável com últimos preços conhecidos.
- API retorna múltiplas artes/variações para mesmo código — escolher primeira imagem/preço ou expor seletor? (assumido: primeira entrada).
- Imagem da carta falha ao carregar (URL quebrada) — exibir placeholder com nome/código e permitir retry.
- Preço retorna como string com símbolo (`$12.34`) ou em formatos diferentes (cardmarket vs tcgplayer) — normalizar para número e moeda explícita.
- Quantidade muito alta (ex.: 99 cópias) — badge não quebrar layout; subtotal suporta valores altos sem overflow.
- Coleção muito grande (500+ cartas) — grid deve permanecer responsivo; ausência de virtualização não pode congelar UI.
- Duplicata rápida (toque duplo em Confirmar) — idempotência: não criar dois incrementos.
- Data de adição em fusos diferentes — armazenar ISO-8601 UTC, exibir em `pt-BR`.
- Conversão de moeda se habilitada — taxa desatualizada ou API de câmbio fora do ar: manter valor em USD com aviso em vez de exibir BRL incorreto.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistema MUST permitir cadastro de carta informando apenas o código canônico no formato `SET-NUMBER` (ex.: `LOB-001`), com normalização (trim, upper-case) antes da consulta.
- **FR-002**: Sistema MUST consultar a API externa de cartas (padrão: YGOPRODeck) ao confirmar código e hidratar `name`, `imageUrl` e `price` a partir da resposta; sem entrada manual desses campos no MVP exceto fallback speccado para código não encontrado.
- **FR-003**: Sistema MUST exibir dados retornados (imagem obrigatória, nome, preço e moeda) para confirmação antes de persistir; usuário MUST confirmar explicitamente para salvar.
- **FR-004**: Sistema MUST persistir para cada item da coleção: `code` (chave única), `name`, `imageUrl` (URL remota), `imageLocalPath` (caminho do cache local no aparelho, nullable até download), `priceAtAcquisitionUSD` (number|null, imutável), `currentPriceUSD` (number|null, mutável), `currentPriceBRL` (number|null, derivado via taxa), `exchangeRateUsed` (number|null + `exchangeRateDate` ISO-8601), `quantity` (inteiro ≥1), `isFavorite` (boolean), `addedAt` (ISO-8601), `lastPriceSyncAt` (ISO-8601|null).
- **FR-005**: Sistema MUST tratar duplicata por `code` incrementando `quantity` (estratégia padrão: um tile por código com badge `xN`), nunca criando registro duplicado silencioso; comportamento alternativo (um tile por cópia) só com exceção speccada.
- **FR-006**: Sistema MUST exibir Home com duas seções: carrossel horizontal de favoritas (imagem em destaque) e grid do álbum com todas as cartas (ao menos imagem + nome + badge de quantidade); coleção vazia MUST exibir empty state com CTA para Nova Carta.
- **FR-007**: Sistema MUST permitir alternar `isFavorite` em no máximo 2 toques/cliques (ícone de estrela no tile do grid e/ou na tela de detalhe) e refletir no carrossel imediatamente.
- **FR-008**: Sistema MUST calcular e exibir em Valores dois totais para itens com preço disponível: `totalBRL = SUM(currentPriceBRL * quantity)` como valor principal e `totalUSD = SUM(currentPriceUSD * quantity)` como referência secundária, ambos com breakdown itemizado (código, nome, qtd, preço unit. BRL/USD, subtotal BRL/USD); itens com `price=null` MUST ser excluídos da soma com aviso e contador "X cartas sem preço".
- **FR-009**: Sistema MUST manter `priceAtAcquisitionUSD` imutável após criação e permitir atualização de `currentPriceUSD`/`currentPriceBRL` via ressincronização (API de cartas + API de câmbio); total em Valores MUST refletir `currentPriceBRL`/`currentPriceUSD` correntes, mas detalhe do item MUST expor `priceAtAcquisitionUSD`, `currentPriceUSD`, `currentPriceBRL`, `exchangeRateUsed` e `lastPriceSyncAt` para auditoria.
- **FR-010**: Sistema MUST permitir edição de `quantity` (≥1) e remoção de item com diálogo de confirmação; tentativa de quantidade inválida MUST ser rejeitada com mensagem.
- **FR-011**: Sistema MUST lidar com código não encontrado na API exibindo erro "Código não encontrado" sem criar registro parcial; fallback de cadastro manual só se especificado.
- **FR-012**: Sistema MUST exigir `imageUrl` resolvível para persistência e baixar a imagem para armazenamento local no aparelho (`imageLocalPath` via sistema de arquivos/cache nativo); exibição em Home/Carrossel MUST priorizar `imageLocalPath` com fallback para `imageUrl` remota; falha de ambas MUST mostrar placeholder com nome/código e não quebrar grid/carrossel, com opção de retry de download.
- **FR-013**: Sistema MUST exibir mensagens de erro observáveis e testáveis para: formato de código inválido, API fora do ar/timeout, preço ausente e imagem ausente; falhas de rede MUST oferecer retry e manter coleção legível offline com últimos preços conhecidos.
- **FR-014**: Sistema MUST prover navegação principal com exatamente 3 destinos: `Home`, `Valores`, `Nova Carta` (adição/remoção de item no menu requer emenda constitucional ou exceção justificada).
- **FR-015**: Sistema MUST formatar valores monetários com localidade `pt-BR` exibindo BRL como `R$ 12,34` e USD como `US$ 12.34` lado a lado quando aplicável (ex.: `R$ 61,70 (US$ 12,34)`); moeda MUST ser armazenada explicitamente e conversão MUST usar arredondamento bancário para 2 casas decimais.
- **FR-016**: Sistema MUST manter operação de leitura (Home e Valores) disponível offline após primeiro carregamento, usando persistência local (SQLite + cache de imagens em disco) sem necessidade de rede; Nova Carta requer rede para consulta à API.
- **FR-017**: Sistema MUST garantir idempotência no cadastro (toque duplo não duplica incremento) e performance de grid responsiva (sem congelamento perceptível) para coleções de até 500 cartas no MVP.
- **FR-018**: Sistema MUST registrar `addedAt` em UTC ISO-8601 e exibir em fuso local do usuário.
- **FR-019**: Sistema MUST implementar validação de `code` antes de chamar API (não vazio, padrão `^[A-Z0-9]+-[0-9]+$` após normalização) com feedback imediato.
- **FR-020**: Sistema MUST ser entregue como aplicativo mobile nativo (React Native com Expo como padrão, Flutter como alternativa aceitável a definir em plan), com persistência 100% local no aparelho, sem backend obrigatório no MVP. Metadados em SQLite (ou equivalente nativo) e imagens em armazenamento local do aparelho (sistema de arquivos/cache).
- **FR-021**: Sistema MUST operar em modo single-user local sem login/autenticação no MVP; toda a coleção pertence ao dispositivo atual, sem isolamento por usuário e sem sincronização em nuvem. Dados não podem ser transmitidos a terceiros exceto a consulta à API de cartas (apenas o código).
- **FR-022**: Sistema MUST armazenar preços em USD como retornado pela API e exibir valores em BRL convertido + USD original (opção C). Conversão usa taxa de câmbio USD→BRL diária obtida de API de câmbio; `priceAtAcquisitionUSD` e `currentPriceUSD` são fonte da verdade, `currentPriceBRL` é derivado (`USD * taxa`). Valores exibe total principal em BRL e total secundário em USD, com breakdown bilíngue por item e sinalização quando taxa estiver desatualizada/fallback.
- **FR-023**: Sistema MUST armazenar imagens das cartas localmente no aparelho (cache em disco com chave por `code`), baixar no cadastro e priorizar `imageLocalPath` offline; quando online, deve validar/atualizar cache se `imageUrl` divergir; cache local não pode ser apagado implicitamente sem ação do usuário exceto política de limpeza por espaço a definir em plan.

### Key Entities *(include if feature involves data)*

- **Carta (Card) — dado externo da API**: Representa a definição canônica da carta no mercado. Atributos: `code` (SET-NUMBER), `name`, `imageUrl`, `priceUSD` + `currency=USD`, variações de preço por mercado (ex.: cardmarket, tcgplayer) se disponíveis. Não é persistida diretamente; serve para hidratar o item da coleção.
- **Item da Coleção (CollectionItem)**: Representa a posse do usuário no aparelho. Atributos: `code` (PK), `name`, `imageUrl` (remota), `imageLocalPath` (string|null, cache em disco no aparelho), `priceAtAcquisitionUSD` (number|null, imutável), `currentPriceUSD` (number|null, mutável), `currentPriceBRL` (number|null, derivado), `exchangeRateUsed` (number|null), `exchangeRateDate` (ISO-8601|null), `quantity` (int ≥1), `isFavorite` (bool), `addedAt` (ISO-8601), `lastPriceSyncAt` (ISO-8601|null). Relacionamento: 1 Item ↔ 1 Carta (via code); 1 Coleção contém N Itens.
- **Coleção (Collection)**: Agregado lógico do usuário (sem entidade separada no MVP local, 100% no aparelho). Deriva de todos os `CollectionItem` persistidos. Atributos derivados: `totalItems` (distintos), `totalCopies` (soma quantities), `totalValueBRL` (SUM currentPriceBRL*quantity), `totalValueUSD` (SUM currentPriceUSD*quantity), `favoritesCount`, `itemsWithoutPrice`, `exchangeRateCurrent` (taxa vigente).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos cadastros de código válido resultam em item persistido com imagem visível em Home em até 3 segundos após confirmação (medido do toque Confirmar até tile no grid).
- **SC-002**: Usuários completam o fluxo Nova Carta (informar código → ver preview → confirmar) em até 30 segundos quando API responde normalmente; taxa de sucesso na primeira tentativa ≥90% para códigos válidos.
- **SC-003**: Tela Valores exibe totais corretos (validado contra cálculo manual `SUM(currentPriceBRL*quantity)` e `SUM(currentPriceUSD*quantity)`) para 100% das coleções testadas, incluindo casos com itens sem preço (excluídos com aviso) e com quantidade >1; ambos os totais (BRL principal, USD referência) visíveis.
- **SC-004**: Home renderiza carrossel de favoritas e grid do álbum sem erro para coleção vazia, com 10 itens e com 200 itens, carregando imagens do cache local quando disponível; rolagem do grid permanece com FPS perceptivelmente fluido (sem congelamento >200ms) em dispositivo alvo do MVP.
- **SC-005**: 100% dos códigos inexistentes resultam em mensagem "Código não encontrado" em até 2 segundos após resposta da API, sem criar registro fantasma.
- **SC-006**: Alternar favorita reflete no carrossel em até 1 segundo e persiste após recarregar o app (verificado por reabrir Home).
- **SC-007**: Edição de quantidade (ex.: 1→3) e remoção atualizam grid e total em Valores imediatamente (≤500ms) e de forma consistente entre as duas telas.
- **SC-008**: Com API indisponível (simulado), usuário ainda navega em Home e Valores com dados e imagens em cache local; Nova Carta exibe erro com opção Tentar novamente (cobertura de resiliência ≥95% dos testes de falha). Teste inclui modo avião após primeiro cache.
- **SC-010**: Imagens persistem localmente: após cadastrar carta com rede, desligar rede e reabrir app exibe imagem do cache em 100% dos casos sem nova requisição; falha de cache exibe `imageUrl` remota quando online.
- **SC-009**: 90% dos usuários testados relatam que entenderam o valor total da coleção e conseguem explicar de onde veio o número (breakdown itemizado) sem ajuda.

## Assumptions

- API padrão é YGOPRODeck (`https://db.ygoprodeck.com/api/v7/cardinfo.php`) cobrindo códigos no formato `SET-NUMBER`; fallback para alternativa será speccado em `plan` se cobertura se mostrar insuficiente.
- Moeda da API é USD; MVP armazena em USD e exibe em BRL convertido + USD original (FR-022 opção C) com taxa USD→BRL diária (ex.: exchangerate.host, AwesomeAPI ou similar a definir em plan), arredondamento para 2 casas, fallback mantém USD com aviso "cotação indisponível".
- Persistência MVP é mobile nativo single-user local sem login (FR-020/FR-021 confirmados): metadados em SQLite no aparelho, imagens em cache local no sistema de arquivos do aparelho (expo-file-system / path_provider), sem backend.
- Imagens são baixadas no momento do cadastro e cacheadas por `code`; `imageLocalPath` é usado prioritariamente offline, `imageUrl` é fallback online e para ressincronização.
- Duplicatas: um tile por `code` com badge `xN` (decisão padrão para manter álbum legível); alternativa 1-tile-por-cópia descartada no MVP.
- Grid exibe por padrão imagem + nome + badge de quantidade; preço resumido no tile é opcional e fora do MVP inicial para não poluir o álbum.
- Favorita é toggle por ícone de estrela no tile e na tela de detalhe, acessível em ≤2 toques.
- Filtros/busca, top-10 mais valiosas, valor médio e gráficos de evolução são adiados para pós-MVP; arquitetura mantém ordenação padrão por `addedAt` desc.
- Valoração usa `currentPrice` dinâmico; se ressincronização falhar, mantém último valor conhecido e sinaliza "preço desatualizado".
- Quantidade padrão ao cadastrar é 1, com edição posterior; remoção requer confirmação.
- Textos e formatação monetária em `pt-BR`; datas exibidas no fuso local mas armazenadas em UTC ISO-8601.
- Coleção de referência para performance: até 500 cartas distintas no MVP sem paginação obrigatória; virtualização só se teste de carga indicar necessidade.
