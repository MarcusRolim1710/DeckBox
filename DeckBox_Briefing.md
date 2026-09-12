# Briefing do App — DeckBox

## 1. Visão Geral
**Nome:** DeckBox
**Conceito:** Aplicativo tipo "fichário/álbum digital" para colecionadores de cartas de Yu-Gi-Oh. Permite catalogar, visualizar e acompanhar o valor total da coleção pessoal do usuário.

**Problema que resolve:** Colecionadores costumam ter muitas cartas físicas e não têm controle claro de quais possuem, quantas têm de cada uma, nem quanto vale a coleção no total.

**Diferencial (gancho principal):** Somatória automática do valor da coleção — o usuário vê quanto vale tudo que ele tem, atualizado a partir de uma API de preços.

---

## 2. Estrutura de Navegação

Menu principal com 3 itens:

| Item do menu | Função |
|---|---|
| **Home** | Tela inicial — visão geral da coleção |
| **Valores** | Tela dedicada ao valor total e financeiro da coleção |
| **Nova Carta** | Fluxo de cadastro de uma nova carta na coleção |

---

## 3. Tela: Home

Composta por duas seções:

### 3.1 Carrossel de Favoritas
- Exibe as cartas marcadas como favoritas pelo usuário.
- Rolagem horizontal, com imagem da carta em destaque.
- *Ponto em aberto:* como o usuário marca uma carta como favorita? (ex.: ícone de estrela/coração no card, dentro do álbum ou na tela de detalhe da carta)

### 3.2 Álbum (Grid de Cartas)
- Abaixo do carrossel, exibe **todas** as cartas da coleção em formato de grade (grid).
- Cada célula do grid mostra ao menos a imagem da carta.
- *Pontos em aberto:*
  - O grid mostra só a imagem ou também nome/preço resumido?
  - Existe filtro/busca (por nome, raridade, tipo, valor)?
  - Cartas repetidas (mesma carta, múltiplas cópias) aparecem uma vez com contador, ou uma vez por cópia?

---

## 4. Tela: Nova Carta

Fluxo de adição de carta à coleção:

1. Usuário informa o **código único da carta** (formato padrão do Yu-Gi-Oh: código do set/temporada + número sequencial, ex.: `LOB-001`).
2. O app consulta uma **API de cartas de Yu-Gi-Oh** com esse código.
3. A API retorna os dados da carta, principalmente:
   - **Imagem** (principal, obrigatória)
   - **Nome**
   - **Preço**
4. Esses dados são exibidos para confirmação e salvos na coleção do usuário.

**Observação técnica (para alinharmos depois):** existem APIs públicas de cartas de Yu-Gi-Oh (ex.: YGOPRODeck) que fornecem esse tipo de dado, incluindo preços de mercado. Precisamos decidir qual API usar e validar se ela cobre todos os códigos de set que você precisa.

*Pontos em aberto:*
- O que acontece se o código não for encontrado na API? (mensagem de erro, cadastro manual?)
- É possível cadastrar quantidade (ex.: "tenho 3 cópias dessa carta")?
- É possível editar/remover uma carta depois de cadastrada?
- O preço vem em qual moeda? (a maioria das APIs retorna em USD — precisa converter para BRL?)

---

## 5. Tela: Valores

- Foco: mostrar o **valor total da coleção**, somando o preço de todas as cartas cadastradas.
- Esse é o "chamativo" do app — a proposta de valor central.
- *Pontos em aberto:*
  - Mostrar só o total geral, ou também abrir por categorias (ex.: top 10 cartas mais valiosas, valor médio por carta, evolução do valor ao longo do tempo)?
  - O valor é o preço somado como veio da API no momento do cadastro (fixo), ou atualizado dinamicamente sempre que o preço de mercado mudar?
  - Exibir gráfico de evolução do valor da coleção?

---

## 6. Modelo de Dados (rascunho conceitual, sem código)

Cada **carta na coleção do usuário** provavelmente precisa guardar:
- Código único (set + sequência)
- Nome
- Imagem (URL ou referência)
- Preço (no momento do cadastro e/ou atualizado)
- Quantidade de cópias
- Favorita (sim/não)
- Data de adição à coleção

---

## 7. Resumo do Escopo Atual (MVP proposto)

✅ Definido até agora:
- Nome do app: DeckBox
- Menu: Home, Valores, Nova Carta
- Home: carrossel de favoritas + grid com álbum completo
- Nova Carta: cadastro via código único + consulta a API (imagem, nome, preço)
- Valores: soma total da coleção como funcionalidade-chave

🔲 Ainda precisa ser definido (próximas rodadas de brainstorm):
- Qual API de cartas será usada
- Regras de moeda/conversão de preço
- Comportamento com cartas duplicadas
- Como marcar/gerenciar favoritas
- Filtros e busca no álbum
- Edição/remoção de cartas
- Se haverá login/multiusuário ou é uso local/individual
- Plataforma (mobile, web, ambos)

---

*Este documento é vivo — pode ser atualizado conforme novas ideias forem trazidas nas próximas rodadas de brainstorm.*
