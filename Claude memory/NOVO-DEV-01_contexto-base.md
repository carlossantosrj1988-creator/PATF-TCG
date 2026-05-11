# NOVO-DEV-01 — Contexto Base
*Codinome de projeto: PATF (nome final a definir)*

---

## O Que É Este Documento
Memória base do novo projeto. Sempre que Carlos mencionar PATF-DEV-01 em conversa nova, retomar a partir daqui. **Este arquivo deve ser anexado no início de cada nova conversa.**

---

## O Projeto

Card game mobile, browser-based, HTML/JS com Firebase.
**Objetivo:** Jogo funcionando, jogável, completo.

### Conceito
- 4 classes fixas representadas por naipes: ♥ ♣ ♦ ♠
- Cada classe tem habilidades organizadas em 3 camadas (básica + 2 mais fortes)
- Jogador monta loadout de habilidades antes da batalha
- Profundidade de build ao estilo Path of Exile
- Base de regras: `CardGame_Regras_v1_2.docx`

---

## Arquitetura do Repositório

```
cenario/
chars/
enemy-ai/
engine/
firebase/
music/
screens/
  battle/
    combat-fx.css
    field.css
    screen-fx.css
    slot-boss.css
    slot.css
    survivor-bg.css
    topbar.css
  charpanel/
  select/
  survivor-map/
sprites/
Index.html
README.md
```

**Index.html** é o ponto central. Carrega todos os módulos via `<link>` e `<script>` na ordem correta de dependência.

---

## Regras de Construção

### Princípios
- **Do zero** — nenhum arquivo herdado do projeto anterior
- **Etapa por etapa** — cada entrega é testável isoladamente
- **Nome do arquivo = sua função** — sem misturar responsabilidades
- **CSS separado por responsabilidade** — cada arquivo cuida do seu escopo
- **CSS calculado contra container híbrido — altura 720px fixa, largura dinâmica (min 1280px, expande conforme aspect ratio do device)**. Y livre em pixels; X só por ancoragem (`left:0`/`right:0`) ou centralização (`left:50% + translateX(-50%)`). Detalhes em `PATF-DEV-01_instrucoes.md` → "Regra de Interface"
- **Nada entra no Index antes de estar pronto e testado**
- **Ampliar arquitetura conforme necessidade** — se surgir novo escopo, cria nova pasta/arquivo

### Fluxo de Trabalho
1. Carlos manda os arquivos do GitHub no início de cada sessão
2. Definem juntos o plano da etapa
3. Claude apresenta relatório do que vai fazer
4. Carlos aprova ("ok" / "executa" / "pode ir")
5. Claude constrói, valida e entrega **arquivo para baixar**
6. Carlos substitui o arquivo antigo pelo novo no repositório
7. Refatorações (remoções, trocas pontuais) → Carlos faz manualmente no GitHub após colocar o arquivo novo
8. Carlos testa
9. Avança para próxima etapa

### Regras Absolutas
- Antes de qualquer implementação → apresentar relatório do que vai ser feito
- Só executar após aprovação do Carlos
- Nunca truncar código — o que começa termina
- Nunca inventar lógica que não foi definida
- Nunca refatorar sem ordem explícita do Carlos
- Toda busca em arquivo existente → sempre via `grep -n`
- `view` só após `grep -n` já ter localizado o bloco

### Entrega de Código
- Claude entrega **sempre como arquivo para baixar** — nunca inline no chat
- Carlos substitui o arquivo antigo pelo novo no repositório
- Refatorações → Carlos faz manualmente no GitHub
- Carlos manda prints para orientação e validação

### Peso de Conversa
- Claude monitora o peso da conversa
- Se conversa estiver pesada antes de construir arquivo longo → avisa Carlos antes de começar
- Nunca começar a construir sem contexto suficiente para terminar

---

## Regras Base do Jogo

*(extraído de CardGame_Regras_v1_2.docx)*

**Atributos:** ATQ · DEF · INC · PVS

**Baralho:** 54 cartas (36 numéricas + 18 especiais: J/Q/K/A/★)

**Iniciativa:** carta revelada + INC = ordem de ação

**Dano:** ATQ + PODER + valor da carta

**Defesa:** DEF + carta opcional

**Especialidade:** carta do mesmo naipe do personagem → valor dobrado

**Vantagens de naipe (ciclo):**
♥ → ♣ → ♦ → ♠ → ♥

**Cartas especiais:**
- J (Valete) — Esquiva
- Q (Dama) — Remove penalidades
- K (Rei) — +50% dano/cura/defesa
- A (Ás) — Compra 1 carta
- ★ (Coringa) — Rodada extra

**Tags de habilidade:** PODER · TIPO · ALVO · TURNO · RECARGA · AÇÃO (N/R/F)

---

## Modificadores de Pedido

| Modificador | Ação |
|---|---|
| `grep -n` | Varredura completa |
| `direto:` | Sem introdução |
| `técnico:` | Termos de código |
| `objetivo:` | Resposta curta |
| `resumo:` | Condensado |
| `completo:` | Sem cortar nada |
| `contexto:` | Linhas ao redor |
| `lista:` | Formato lista |

---

## Progresso

### Etapas concluídas
- [x] Estrutura base do repositório PATF-TCG criada no GitHub
- [x] `index.html` com carregamento modular (renderer, home, start, scripts centrais)
- [x] `screens/renderer/renderer.js` — sistema de escala dinâmica com `BASE_W`/`BASE_H` configuráveis
- [x] `screens/home/home.js` — tela inicial funcional
- [x] `screens/home/home.css` — estilo da home + painel de opções completo
- [x] `screens/start/start.js` — segunda tela funcional
- [x] `screens/start/start.css` — estilo da tela start
- [x] Botão ⚙ fixo no canto superior direito (universal, definido no index)
- [x] Painel de opções — tela cheia, 3 abas: TELA / ÁUDIO / TESTES
- [x] Sistema de resolução funcional — 5 opções: 1280×720 / 480×854 / 720×1280 / 1080×1920 / 1920×1080
- [x] Lógica do painel de opções centralizada no index (JS) + CSS por tela
- [x] Navegação entre telas centralizada no index — `window.irParaTela()` universal
- [x] Cliques internos de cada tela ficam na própria tela — index só gerencia troca
- [x] Fullscreen robusto — botão "⛶ TELA CHEIA" reativa fullscreen; bloqueio portrait cobre tudo
- [x] Home e Start funcionando em conjunto ✅
- [x] `chars/chars.js` — pool dos 4 personagens, `criarPersonagem()`, `PLAYER_STATE`, salvar/carregar/limpar estado
- [x] `screens/select/select.js` — seleção de 3 personagens com nome, painel de confirmação, indicador de etapas, tela de resultado
- [x] `screens/select/select.css` — CSS calculado contra 1280×720, tudo cabe sem transbordar
- [x] Fluxo TESTE completo: Start → Seleção → Time montado ✅

### Foco atual
- Próxima tela após seleção — a definir

### Próximas etapas
- [ ] Definir e construir tela após seleção (tutorial ou tela principal)
- [ ] Construir screens restantes com base na formulação aprovada

---

## Histórico de Decisões

| Data | Decisão |
|---|---|
| 2026-05-06 | Projeto iniciado do zero — novo conceito, nova arquitetura |
| 2026-05-06 | Codinome mantido: PATF. Nome final a definir |
| 2026-05-06 | Arquitetura definida: espelha repositório `Cardgame-assets` |
| 2026-05-06 | Conceito: 4 classes por naipe, habilidades em 3 camadas, loadout selecionável |
| 2026-05-06 | Base de regras: CardGame_Regras_v1_2.docx |
| 2026-05-06 | Painel de opções: JS centralizado no index, CSS por tela, sem pasta options/ |
| 2026-05-06 | Sistema de resolução funcional via renderer.js com BASE_W/BASE_H configuráveis |
| 2026-05-06 | Foco definido: construir bases de todas as screens principais antes de qualquer outra etapa |
| 2026-05-07 | Navegação centralizada no index — `window.irParaTela()`, cliques internos ficam em cada tela |
| 2026-05-07 | Fullscreen movido para o index — botão de reativar + bloqueio portrait obrigatório |
| 2026-05-07 | Entrega de código sempre como arquivo para baixar — Carlos substitui no repositório |
| 2026-05-07 | Refatorações feitas manualmente pelo Carlos no GitHub após receber arquivo novo |
| 2026-05-07 | CSS calculado contra container base 1280×720px — regra válida para todas as telas |
| 2026-05-10 | Fluxo TESTE completo funcionando: Start → Seleção (3 rodadas) → Time montado |
| 2026-05-11 | Renderer migrado para `Math.min` (letterbox) — nada mais é cortado em telas wide |
| 2026-05-11 | `BASE_W` agora é dinâmico: `max(1280, round(720 × aspect_device))` — telas 19.5:9/20:9 preenchem sem bordas pretas |
| 2026-05-11 | Regra de Interface atualizada: BASE_H 720 fixa, BASE_W dinâmica. Y livre em px; X só por ancoragem (`left:0`/`right:0`) ou centralização proporcional |
| 2026-05-11 | Tela de Status construída em 3 etapas: estrutura base + árvore Atlas (SVG + 12 nós + comprarNo) + popups de seleção/detalhe das habilidades e passivas |
| 2026-05-11 | Slots de habilidade têm categoria fixa (slot 0=cat1, 1=cat2, 2=cat3); itens equipados somem da lista de seleção; slot ocupado abre popup de detalhe com botão REMOVER |
| 2026-05-11 | Estado por personagem: `atlasComprados[]`, `habilidades[null,null,null]`, `passivas[null,null]` — inicializados em `STATUS.init()` |
| 2026-05-11 | ⚙ engrenagem migrou do `<body>` para dentro do `#game-container` (criado em `renderer.js`) — semi-universal, escala com o canvas, ancorado no canto superior direito do canvas |
| 2026-05-11 | Topbars de 52px reservam `padding-right: 60px` para o ⚙; coin/contadores deslocam pra esquerda |
| 2026-05-11 | Fluxo de trabalho atualizado: conversa direta dentro do Claude Code é o padrão. Fluxo "Chat web mastigador" da sessão 002 vira referência opcional |

---

*Última atualização: 2026-05-11 — sessão 003 fechada: tela de Status (fundação), canvas híbrido, ⚙ semi-universal*
