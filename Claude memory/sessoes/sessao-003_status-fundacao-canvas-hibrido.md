# Sessão 003 — Tela de Status (fundação) + Canvas Híbrido + ⚙ Semi-Universal

**Data:** 2026-05-11

---

## Estado de Entrada

- Tela de Status existia apenas como placeholder de texto dentro do `screen-tutorial` (função `abrirStatus` em `tutorial.js`) — explicava o Atlas com texto, sem árvore, sem slots.
- Canvas era 1280×720 fixo. Renderer usava `Math.max(scaleX, scaleY)` — em celulares com aspect ratio mais largo que 16:9 (19.5:9, 20:9 etc), o canvas transbordava verticalmente e a topbar de qualquer tela ficava parcialmente fora da viewport.
- Botão ⚙ vivia no `<body>` do `index.html` como `position: fixed` — universal de verdade, mas não escalava com o canvas e ficava num plano diferente do jogo.
- `PLAYER_STATE.personagens` já existia em `chars/chars.js` com `nome`, `poolId`, `atq`, `def`, `inc`, `pvs`. Não tinha ainda campos de árvore (`atlasComprados`), nem slots equipados (`habilidades`, `passivas`).
- Fluxo de trabalho herdado da sessão 002: "Chat mastiga prompt → Carlos cola no Code". Nesta sessão evoluímos para conversa direta dentro do próprio Claude Code.

---

## O Que Fizemos

### Tela de Status — construída em 3 etapas

**Etapa A — Estrutura base** (`51ca7e6`)
- Criados `screens/status/status.css` e `screens/status/status.js`.
- Módulo `STATUS = (() => { ... })()` com `init()` público.
- `STATUS.init()` consolida a inicialização de estado: garante `atlasComprados`, `habilidades` (3 nulls) e `passivas` (2 nulls) em cada `PLAYER_STATE.personagens[i]`.
- Topbar com botão "← VOLTAR", título "⚔ STATUS" e contador de PONTOS.
- 3 abas (uma por personagem) com `trocarChar(i)` ligado no clique.
- Painel esquerdo (220px): avatar placeholder, nome, pool, atributos (ATQ/DEF/INC/PVS), slot de EQUIPAMENTO e slot de RELÍQUIA.
- Painel direito (200px): 3 slots de habilidade + 2 slots de passiva (placeholders).
- Área central com `#status-atlas-canvas` (800×800) e drag-to-scroll via mouse events.
- `screen-status` registrado em `irParaTela` do `index.html`; `abrirStatus()` do tutorial agora redireciona pra cá (a renderização de placeholder antiga foi totalmente removida).
- Callback `window.aoVoltarDoStatus` preserva a lógica de avanço de etapa do tutorial quando o jogador volta do Status.

**Etapa B — Árvore Atlas** (`0ae242c`)
- Adicionados ao módulo STATUS: `ATLAS_NAIPES` (4 cardinais: espadas/copas/ouro/paus), `ATLAS_NOS` (centro + 12 nós — 1 atributo, 1 habilidade, 1 passiva por naipe) e `ATLAS_CONEXOES` (pai → filho).
- Cada nó de habilidade ganha campo `categoria: 1` para roteamento futuro de slots (todos são H1 por enquanto).
- `renderAtlas()` desenha um SVG 800×800 com as linhas de conexão e divs absolutos para os nós, colorindo conexões ativadas pela cor do naipe.
- Estado de cada nó: `comprado` / `disponivel` (filho de um nó já comprado) / `bloqueado` (cinza, sem clique).
- `comprarNo()` debita `PLAYER_STATE.pontos`, persiste via `salvarEstado()`, atualiza o contador da topbar e re-renderiza a árvore. Sem pontos → shake animation no contador.
- `renderAtlas()` chamado ao final de `renderTela()` e `trocarChar()` — cada personagem tem sua própria árvore.

**Etapa C — Popups de habilidade/passiva** (`8027ab5`)
- `renderPainelDir()` reescrito: lê `habilidades[]` e `passivas[]` do personagem ativo, mostra o nome + naipe colorido do item equipado ou "HAB N" / "VAZIO" para slots vazios.
- Clicar num **slot vazio** abre `abrirPopupSlot(tipo, slotIdx)` listando apenas nós comprados do tipo correto, com filtro por categoria nos slots de habilidade (slot 0 → cat 1, slot 1 → cat 2, slot 2 → cat 3). Itens já equipados em qualquer slot são removidos da lista.
- Clicar num **slot ocupado** abre `abrirPopupDetalhe(tipo, slotIdx, no)` mostrando ícone, nome, naipe + botão **REMOVER** que libera o slot.
- Ambos popups usam o mesmo overlay `#status-popup-overlay` (z-index 50), persistem via `salvarEstado()` e re-renderizam só o painel direito.

### Polimento da tela Status

- Painel esquerdo ganhou `padding-top: 24px` (avatar respira do topo).
- Painel direito ganhou `justify-content: center` (slots centralizam verticalmente já que são poucos).
- Topbar reorganizada: PONTOS foi pra junto do título no canto esquerdo, deixando a extremidade direita inteira livre para o ⚙.

### Renderer — modelo híbrido

- `Math.max` → **`Math.min`** (`d66a382`): o canvas 1280×720 sempre cabe inteiro na viewport. Em telas com aspect ratio diferente de 16:9 entram pequenas bordas pretas, mas nada é cortado. Resolveu o caso da topbar do Status que estava sumindo no topo em devices 19.5:9.
- **`BASE_W` dinâmico** (`27dea2a`): `BASE_W = max(1280, round(720 × aspect_do_device))`. Em celulares modernos (19.5:9, 20:9), o canvas vira ~1574/1600 × 720 e preenche a viewport sem barras pretas. `BASE_H` continua fixa em 720. Telas existentes ficam visualmente intactas porque todas usam ancoragem em `left:0`/`right:0`.

### ⚙ Engrenagem — semi-universal

- O `<div id="btn-options">⚙</div>` saiu do `<body>` do `index.html`.
- Agora é criado pelo `renderer.js` como filho do `#game-container` — escala junto com o canvas e fica ancorado no canto superior direito **do canvas**, não da viewport.
- CSS de `#btn-options` em `home.css`: `position: fixed` → `position: absolute`.
- `tutorial.css` ganhou `padding-right: 60px` na topbar (status já tinha desde a etapa A) — o coin 🪙 do tutorial desloca pra esquerda e o ⚙ fica sozinho no canto.
- Coin do tutorial reagrupado: removido `justify-content: space-between` da topbar, adicionado `gap: 16px` — coin fica colado no título "📋 TUTORIAL" do canto esquerdo.
- `#btn-options` desceu de `top: 16px` para `top: 11px` — alinha verticalmente com o centro das topbars de 52px (mesma linha do coin/título).
- Painel `#options-panel` continua no `<body>` como `fixed` — só o botão entrou no canvas; o painel que abre sempre fica em tamanho legível.

### Documentação atualizada (em commits separados)

- `Claude memory/PATF-DEV-01_instrucoes.md` → "Regra de Interface" reescrita para o canvas híbrido (Y livre em px, X só por ancoragem ou centralização proporcional); zona reservada do ⚙ documentada com a nova posição.
- `Claude memory/NOVO-DEV-01_contexto-base.md` → regra de construção atualizada + marcos de 2026-05-11.

---

## Decisões Tomadas

- **Canvas híbrido é a nova base:** `BASE_H = 720` fixa, `BASE_W` dinâmica (mínimo 1280, expande conforme aspect ratio do device). Renderer usa `Math.min` para letterbox seguro quando não houver match perfeito.
- **Regra de CSS para novas telas:** pixels livres no eixo Y; no eixo X só `left:0`/`right:0` com width fixo OU `left:50% + translateX(-50%)`. Nunca pixels X hardcoded centrais (como `left: 640px`) nem `width: 1280px` em container root.
- **⚙ é semi-universal:** 1 instância só, criada pelo renderer dentro do `#game-container`. Escala com o canvas. Telas que tenham conteúdo no canto direito reservam `padding-right: 60px` para não colidir.
- **Slots de habilidade têm categoria fixa:** slot 0 = cat 1, slot 1 = cat 2, slot 2 = cat 3. Cada nó do Atlas tem campo `categoria`. Slots 1 e 2 ficam vazios na base atual porque `ATLAS_NOS` só tem nós H1 (categoria 1).
- **Itens equipados somem da lista de seleção** — sem possibilidade de duplicar a mesma habilidade em vários slots.
- **Popup de detalhe + REMOVER** separado do popup de seleção: slot vazio abre o de seleção; slot ocupado abre o de detalhe.
- **Fluxo de trabalho atualizado:** conversa direta dentro do Claude Code é o novo modo padrão. O fluxo "Chat web mastiga prompt → Carlos cola no Code" da sessão 002 ainda é referência válida mas opcional.
- **Sessão 002 é história válida do projeto** e foi restaurada na branch dev (estava deletada por engano).

---

## Próxima Sessão

- **Sessão 004 — Status Parte 2: habilidades reais + expansão da árvore**
- Criar nova categoria de arquivos espelhando `chars/`: `habilidades/` e `passivas/` com detalhes organizados de cada uma (id, nome, descrição, efeito, custo, categoria, naipe).
- Expandir `ATLAS_NOS` com nós H2 e H3 (e mais passivas) — destravar slots 1 e 2 do painel direito.
- Refinar visualmente a árvore com mais detalhes.
- Provavelmente começar as primeiras engines (combate / efeitos das habilidades).
- Possíveis tópicos: como descrições aparecem no popup de detalhe; como o motor consome `habilidades`/`passivas` equipadas em combate.

---

## Arquivos Tocados

**Criados**
- `screens/status/status.css`
- `screens/status/status.js`
- `Claude memory/sessoes/sessao-003_status-fundacao-canvas-hibrido.md` — este arquivo

**Modificados**
- `screens/renderer/renderer.js` — Math.min + BASE_W dinâmica + cria #btn-options no game-container
- `screens/home/home.css` — `#btn-options` position absolute, top:11
- `screens/tutorial/tutorial.css` — padding-right:60px na topbar, gap:16px no lugar de space-between
- `screens/tutorial/tutorial.js` — `abrirStatus()` agora só redireciona para `screen-status`; placeholder antigo removido
- `index.html` — `<div id="btn-options">` removido do body; `screens/status/status.css` e `status.js` registrados; `screen-status` adicionado em `irParaTela`
- `Claude memory/PATF-DEV-01_instrucoes.md` — Regra de Interface reescrita; zona reservada do ⚙ atualizada
- `Claude memory/NOVO-DEV-01_contexto-base.md` — regra de construção + marcos de 2026-05-11

**Restaurado**
- `Claude memory/sessoes/sessao-002_claudecode-renderer-tutorial.md` — havia sido deletado por engano na branch dev; recolocado idêntico ao main

---

*Sessão fechada.*
