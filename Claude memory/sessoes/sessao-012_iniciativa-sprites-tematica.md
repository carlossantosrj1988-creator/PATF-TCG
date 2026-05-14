# Sessão 012 — Iniciativa compartilhada, temática e pipeline de sprites

**Data:** 2026-05-14
**Branch:** `claude/bora-pro-007-2Utst`

---

## O que foi feito

### 1. Tutorial map (concluído em sessão anterior, commitado agora)
- `tutorial-map.js` + `tutorial-map.css` — HP persistente entre etapas, tela de transição (time jogador VS inimigo com fade-in/out), popup de recuperação após etapa 3 (CURAR 1 / REVIVER 1)
- `tutorial.js` e `index.html` atualizados para integrar o TUTORIAL_MAP

### 2. Arquitetura de baralho compartilhado — `engine/combat.js`
- `estadoVazio()` ganhou `baralhoJogador`, `maoJogador`, `descarteJogador`
- `criarCombatente()`: jogadores nascem com `baralho: []`; inimigos mantêm deck individual
- `init()`: cria `BATTLE_STATE.baralhoJogador` com deck embaralhado
- `avancarTurno()`: compra N cartas para mão compartilhada (N = jogadores vivos)
- `_comprarCarta()`: branch em `combatente.lado` — jogador usa pool compartilhado, inimigo usa o próprio

### 3. Tela de iniciativa redesenhada — `screens/battle/battle.js`
- `_distribuirMao()`: 10 cartas para `maoJogador` compartilhada; inimigos individualmente
- `_telaIniciativa()` reescrita: linhas de personagem no topo (mini card + INC + slot), mão compartilhada embaixo; clique na carta seleciona, clique no personagem atribui
- `_confirmarIniciativa()`: remove cartas da `maoJogador` por índice decrescente
- Topbar e painel de cartas usam `baralhoJogador.length` e `maoJogador`

### 4. Visual da tela de iniciativa — `screens/battle/battle.css`
- Mini cards verticais (64×88px): naipe colorido no topo + valor grande no centro
- Char rows com mini card de personagem (gradiente do naipe + símbolo + nome em overlay) — mesmo padrão visual do campo de batalha; futuro: recebe sprite do personagem
- max-width 820px, fontes e espaçamentos maiores
- Botão CONFIRMAR com gradiente dourado

---

## Temática do jogo — decisões de design

### Conceito central
**Vampire Survivors** como referência — jogo sério com temática de sátira e homenagem.
Pixel art 8-bit (estilo Mega Drive/SNES), personagens baseados em arquétipos reconhecíveis mas não cópias diretas.

### Sistema de cosplay por naipe
Cada personagem tem um sprite base + 4 cosplays (um por naipe):
- ♥ Copas → tanks/guerreiros pesados
- ♦ Ouros → mágicos/suporte
- ♠ Espadas → ninjas/assassinos
- ♣ Paus → selvagens/berserkers

Na seleção de personagem: ao escolher o naipe, o sprite muda para o cosplay correspondente.

### Escala de tamanho por personagem
Campo `escala` no CHAR_POOL — personagens grandes têm `scale` maior na engine:
- **Vigor** (Zangief-ish/Haggar-ish) — maior, escala ~1.3
- **Defensivo** (Amazona-ish) — médio, escala ~1.0
- **Ágil** (ainda sem referência definida) — menor, escala ~0.8

### Personagens definidos

#### Vigor — arquétipo tanque/wrestler
**Referência:** Haggar (Final Fight) — não cópia, só inspiração
**Visual:**
- Careca, bigode grosso anos 90, mandíbula quadrada
- Peito nu musculoso, ombros desproporcionais
- Suspensório fino em V, calça verde militar larga, cinto marrom grosso com fivela
- Postura wrestler: pernas abertas, joelhos dobrados, braços abertos/levantados, dedos abertos

**Animações definidas (11 frames):**

| Animação | Frames | Descrição |
|---|---|---|
| Idle base | 3 | Respiração — peito sobe/desce, ombros acompanham |
| Idle especial | 1 | Puxa o suspensório com um dedo e solta (Metal Slug style) |
| Dropkick | 3 | Agacha → no ar horizontal pernas estendidas → pousa |
| Tomando dano | 2 | Corpo vai pra trás (pés plantados) → volta |
| Morte | 2 | Joelhos dobram → cai de frente pesado |

**Tamanho do sprite:** 32×32px (pixel grosso real, 8-bit)

---

## Pipeline de sprites — conclusão

### Fluxo definido
1. **Leonardo AI** — gera a base com prompt otimizado (referência + detalhes físicos + cada pose nomeada + `--no` para evitar genérico)
2. **Photopea** — abre o sheet, corta cada frame, redimensiona para 32×32 com **Nearest Neighbor** (pixela automaticamente)
3. **Pixel Studio** (app mobile) — importa frame como camada de referência, redesenha em cima pixel a pixel, anima frame a frame na timeline

### Problema do Leonardo
- Não-determinístico: mesmo prompt, resultado diferente
- Limite de 2 gerações por dia no talo
- Gera pixel art "HD demais" — precisa downscale posterior
- Não respeita todas as poses pedidas, pula ou duplica frames

### Prompt template calibrado (Vigor)
```
8-bit retro pixel art sprite sheet, SNES style, limited color palette, no anti-aliasing, no gradients, hard pixel edges. Haggar-style wrestler, completely bald shaved head, thick 90s mustache, square jaw, bare disproportionately wide muscular chest, dark thin V-shaped suspenders, wide baggy military green pants, thick brown belt large buckle, heavy boots. Wide wrestler stance legs apart knees bent weight centered arms raised open fingers spread ready to grapple.

Grid layout 4x3, white background, clear spacing between frames, same character scale all frames, isolated poses, no repeated frames, no duplicate poses:
1.idle1-chest neutral arms raised 2.idle2-inhale chest expanded shoulders up 3.idle3-exhale chest deflated shoulders down 4.idle4-right hand pulls V-suspender snaps back 5.dropkick1-crouching low both knees bent 6.dropkick2-airborne horizontal both legs fully extended forward 7.dropkick3-landing both feet ground knees bent absorbing 8.damage1-full body leaning backward feet planted 9.damage2-recovering returning to stance 10.death1-both knees buckling collapsing 11.death2-facedown flat floor 12.victory-arms raised overhead

--no hair, blonde, 3d, realistic, photorealistic, blurry, anti-aliasing, gradients, merged frames, overlapping sprites, generic fighter, repeated poses, duplicate frames
```

### Resultado do Leonardo com esse prompt
- Careca + bigode: perfeito e consistente entre frames
- Suspensório V: respeitado em todos os frames
- Dropkick no ar: silhueta forte e legível
- Problemas: idle especial (suspensório) não apareceu, damage sumiu em favor da vitória

### Alternativas exploradas
- **Pixilart.com** — comunidade de pixel art, sem geração IA no plano gratuito. Útil para buscar referências
- **Pixel Studio** (app mobile) — editor de pixel art com timeline de animação, frames e camadas. Escolhido para animação
- **Aseprite** — desktop only, não viável no celular

---

## Próxima sessão — foco

1. **Revisão completa da batalha** — verificar regras, corrigir fluxo, fechar mecânicas pendentes
2. **Criação de habilidades** — implementar o sistema de habilidades dos personagens
3. **Teste do jogo completo** — rodar o tutorial do início ao fim com todas as mecânicas

Sprites ficam para quando o pipeline estiver mais rodado — não bloqueia o desenvolvimento do jogo.
