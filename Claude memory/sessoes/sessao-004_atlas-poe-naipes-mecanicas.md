# Sessão 004 — Atlas PoE-style + Mecânicas de Naipe + Fricção de Teste

**Data:** 2026-05-11
**Status:** ⚠️ NÃO CONCLUÍDA — canvas da árvore ainda com erros visuais a resolver

---

## Estado de Entrada

- Status tinha árvore básica de 12 nós sem seleção de naipe, sem categorias.
- Cada sessão de teste exigia selecionar 3 personagens do zero — alto desgaste.
- Nenhuma documentação de mecânicas de naipe existia.

---

## O Que Fizemos

### 1. Fricção de teste eliminada

- `carregarEstado()` chamado ao clicar TESTE em `index.html`: se `PLAYER_STATE.personagens.length >= 3`, pula direto para o tutorial sem passar pela seleção.
- Botão **↺ RESETAR TIME** adicionado em Opções > Testes: chama `limparEstado()`, fecha o painel, redireciona para `start-screen`.
- Botão **+ 20 PONTOS DE TESTE** adicionado em Opções > Testes: adiciona pontos diretamente ao `PLAYER_STATE.pontos` para testar compras sem depender de recompensas.

### 2. Slot de naipe no painel esquerdo do Status

- Slot visual com cor do naipe ativo (label + cor de borda + background tinted).
- Desenhado para suportar 2 naipes no futuro (slot único por ora, mas a estrutura `naipeAtivo` / `naipeSecundario` já existe nos dados).

### 3. Documento de mecânicas de naipe

- Criado `naipes/naipes-mecanicas.md` antes de escrever qualquer código de engine.
- Ciclo de vantagem: ♥ → ♣ → ♦ → ♠ → ♥ (A→B significa A vence B).
- ♥ Copas: ATQ e DEF atuais ×2 por 2 turnos, gatilho = interação de dano com ♣, renovável.
- ♠ Espadas: dano final ×2 quando alvo é ♥, por hit, incluindo AoE (cada alvo ♥ calcula individualmente).
- ♦ Ouro: rodada extra ao interagir com ♠ — mecânica parcial, depende da engine de turnos.
- ♣ Paus: contra-ataca com H1 + carta opcional ao receber dano de ♦, ganha Furtivo por 2 rodadas; Furtivo expande contra-ataque para qualquer atacante mas só renova com ♦.

### 4. Atlas redesenhado em fases

**Dados (Etapa A)**
- `ATLAS_NAIPES` expandido com `vantagem`, `desvantagem`, `bonusCampo`, `bonusValor`. Posições cardinais adicionadas.
- `ATLAS_NOS` expandido para **72 nós** (18 por naipe: H1×5, H2×5, H3×5, Passivas×3).
- `CUSTO_NAIPE = 1` para desbloquear o naipe via Atlas.

**Seletor de naipe (Etapa B)**
- Cruz SVG com linhas do centro para os 4 ícones cardinais + nó ✦ central não-clicável.
- Clicar num naipe abre popup com vantagem/desvantagem e botão DEFINIR NAIPE.
- `comprarNaipe()` seta `p.naipe` e `p.naipeAtivo`, aplica bônus se houver, persiste e re-renderiza.

**Grid 4 colunas (Etapa C — descartada)**
- Implementada como tentativa mas rejeitada pelo usuário: "a tela muda, não é PoE".

**Reescrita PoE-style**
- Canvas unificado 2000×2000, centro em (1000,1000).
- `ATLAS_NAIPES` ganhou `mainDir` e `perpDir` (vetores de direção cardinal).
- A cruz permanece sempre visível. Ao comprar naipe, galhos crescem do ícone em direção cardinal.
- `gerarNosArvore(naipeId)`: T1 no tronco → 4 ramos categorias (H1/H2/H3/P) se abrem perpendicular → skills se espalham para fora (afastando do centro) → T2 único no tronco principal com linha pontilhada.
- Scroll automático centraliza no T1 ao selecionar naipe; drag-to-scroll para explorar.
- Naipes inativos: opacidade 0.22.

**T2 placeholder**
- Um único nó T2 apagado no tronco principal (370px além do T1), conectado por linha pontilhada `stroke-dasharray`.
- Indica que a árvore pode crescer, mas não é clicável.

### 5. Bugs corrigidos

- Ícones de naipe muito distantes na cruz → posições ajustadas para 200px do centro.
- Seleção de naipe impossível com 0 pontos → botão de pontos de teste adicionado.
- Tela de status em branco → `return { nos, linhas }` duplicado em `gerarNosArvore` quebrava a sintaxe do arquivo inteiro.

---

## ⚠️ Pendente — Início Obrigatório da Sessão 005

**O canvas da árvore ainda apresenta erros visuais** — o layout com galhos perpendiculares e T2 no tronco foi implementado mas não validado visualmente pelo usuário antes do encerramento da sessão. A sessão 005 começa resolvendo isso.

---

## Próxima Sessão (005)

1. **Resolver erros visuais do canvas da árvore** — validar layout PoE com galhos laterais e T2 no tronco.
2. Criar `habilidades/` e `passivas/` com conteúdo real (id, nome, descrição, efeito, custo, categoria, naipe).
3. Wire descrições reais nos popups de nó.
4. Começar engine de mecânicas de naipe (♥ Copas e ♠ Espadas são os mais simples e diretos).

---

## Arquivos Tocados

**Criados**
- `naipes/naipes-mecanicas.md`
- `Claude memory/sessoes/sessao-004_atlas-poe-naipes-mecanicas.md` — este arquivo

**Modificados**
- `index.html` — lógica de pulo direto ao tutorial + botões RESETAR TIME e PONTOS DE TESTE
- `screens/status/status.js` — reescrita completa do Atlas (ATLAS_NAIPES com vetores, gerarNosArvore, renderAtlas PoE-style, abrirPopupT1, abrirPopupNaipe, comprarNaipe, initScroll)
- `screens/status/status.css` — remove classes arvore-*, adiciona atlas-no-t1/cat/skill/t2, atlas-naipe-circulo.ativo

---

*Sessão encerrada sem conclusão do canvas — retomar na sessão 005.*
