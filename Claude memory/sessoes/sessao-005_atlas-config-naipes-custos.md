# Sessão 005 — Atlas: configuração, naipes e custos progressivos

**Data:** 2026-05-12

---

## Estado de Entrada

- Canvas do Atlas com erro visual: skills de H1/H2/H3/P se intercalavam na mesma linha horizontal/vertical (sobreposição de nós)
- Passivas sem distinção visual das habilidades
- Popups sem legibilidade adequada
- `ATLAS_NAIPES` sem bônus de atributo definidos, vivendo dentro de `status.js`
- Custos fixos por nó (sem progressão)

---

## O Que Fizemos

### Fix visual do Atlas
- Skills agora crescem na direção T1→categoria (normalizada) em vez do eixo perpendicular fixo
- Resultado: leque diagonal real, sem sobreposição entre galhos H1/H2/H3/P

### Passivas distintas no canvas
- Nó de passiva: 40px, roxa (#8866ff), borda sólida
- Distingue visualmente de habilidades (30px, cor do naipe, borda dashed)

### Popup dos nós — mais legível
- Badge de categoria (H1 — BÁSICA / H2 — INTERMEDIÁRIA / H3 — AVANÇADA / PASSIVA) à esquerda
- Badge de custo em dourado à direita
- Descrição com fonte maior (0.8rem), separada por linhas finas
- Hover com scale nos nós de categoria

### naipes/naipes.js — primeiro arquivo de código da pasta naipes
- `NAIPES_DATA` com label, cor, vantagem, desvantagem, bonuses[] e direções do atlas
- Bônus fixos permanentes ao definir o naipe:
  - ♥ Copas → +2 DEF
  - ♠ Espadas → +2 ATQ
  - ♦ Ouro → +1 INC +1 DEF
  - ♣ Paus → +1 INC +1 ATQ
- `status.js` removeu `ATLAS_NAIPES` local e passa a usar `NAIPES_DATA` global
- `index.html` carrega `naipes/naipes.js` antes de `status.js`

### Custo progressivo por categoria
- `CUSTO_PROGRESSIVO` em `status.js`:
  - H1: 2 → 4 → 8 → 16 → 32
  - H2: 3 → 6 → 12 → 24 → 48
  - H3: 5 → 10 → 20 → 40 → 80
  - P: 15 → 30 → 60
- `custoProximaCompra(no, personagem)` conta comprados da mesma categoria e retorna custo correto
- Popup de nó exibe custo dinâmico real
- Popup de categoria exibe progressão completa (ex: `2 → 4 → 8 → 16 → 32 PT`)

### Popups de categoria (H1/H2/H3/P) clicáveis
- Nós de categoria ganham clique e popup descritivo
- H1: habilidades básicas, sem recarga, disponíveis todo turno
- H2: intermediárias, mais versáteis, costumam ter recarga
- H3: especiais, mais fortes, recarga pesada, bloqueadas no 1º turno
- P: passivas, funcionam automaticamente sem ativação

### UX do Atlas
- Scroll do canvas não reseta após compra — mantém posição onde o jogador está
- Auto-scroll para T1 só ocorre na abertura da tela, troca de personagem e escolha de naipe
- Botão COMPRAR desabilitado (cinza, cursor not-allowed) quando pontos insuficientes
- Popup T1 limpo: descreve o que o tier libera (habilidades + passivas), sem valores, aponta para os nós de categoria

---

## Decisões Tomadas

- Bônus de naipe são permanentes e somados direto nos atributos do personagem (painel mostra total)
- T1 vem incluído ao escolher o naipe — sem custo adicional de tier
- T2 segue modelo PoE: custa pontos para liberar e concede bônus de atributo (implementar no futuro)
- Custo progressivo é global por personagem — quanto mais habilidades da mesma categoria compra, mais cara fica a próxima (incentiva diversificação de build)
- Naipes: segunda liberação custa entre 100-200 PT e só desbloqueia após primeira fase do Survivor (a definir)
- Tela de Status considerada concluída para esta fase — pronta para receber habilidades reais

---

## Próxima Sessão (006)

- Montar a jogabilidade completa do jogo em MDs no repositório
- Documentar as regras e mecânicas de forma escrita completa: como um turno funciona, cálculo de dano/defesa, cartas, mecânicas de naipe em combate, como skills e passivas entram em batalha
- Esses documentos servem de referência antes de qualquer implementação de engine
- O desenvolvimento por screens continua em paralelo

---

## Arquivos Tocados

**Criados**
- `naipes/naipes.js` — NAIPES_DATA com todos os dados dos 4 naipes
- `Claude memory/sessoes/sessao-005_atlas-config-naipes-custos.md` — este arquivo

**Modificados**
- `screens/status/status.js` — fix visual leque, passivas distintas, popups melhores, custo progressivo, scroll fixo, botão desabilitado, popup T1 limpo, uso de NAIPES_DATA
- `screens/status/status.css` — estilos passiva, popup legível, botão disabled, hover categoria
- `index.html` — adiciona naipes/naipes.js na ordem de carga
