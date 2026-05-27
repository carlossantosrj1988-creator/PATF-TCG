# Sessão 017 — Battle Debug + Bordas Neon

**Data:** 2026-05-27
**Branch:** `claude/017-session-qVeyI`

---

## Estado de entrada

Jogo funcionando. Sessão focada em debug visual da tela de batalha e início do sistema de bordas neon.

---

## O que foi feito

### 1. Correções na tela de batalha

**Ícones de efeito (buff/debuff):**
- Movidos para fora do `.sprite-mode` (que tem `transform: scale + transform-origin: bottom center`)
- Agora são filhos diretos do `.battle-char-slot` — posicionados corretamente acima do sprite
- Fix em `_criarCharSlot` no `battle.js`

**Contador de turnos:**
- `estadoVazio()` em `combat.js` iniciava `turno: 0` — topbar mostrava "TURNO 1" o tempo todo
- Corrigido para `turno: 1` — primeiro ciclo completo avança para "TURNO 2" com banner correto

**Botões debug [vencer]/[perder]:**
- Estavam em `left: 12px` e `left: 78px` — o jogador clicava neles sem querer ao usar habilidades
- Movidos para `right: 78px` e `right: 12px` em `battle.css`

**Log de combate:**
- Estava com `pointer-events: none` — invisível para clique
- Agora clicável: abre popup centralizado com histórico completo da batalha (até 40 entradas)
- Scrollável, com cores por tipo (atk/dmg/cura/turno/info)
- Função `_mostrarLogPopup()` adicionada em `battle.js`

---

### 2. Sistema de bordas neon — aprendizado e reversão

#### O que foi planejado (correto)

Sistema de bordas vivas estilo **Marvel Snap** emoldurando `#battle-topbar` e `#battle-panel`.

**3 camadas independentes:**
- **Borda física (CSS)** — `border` + `box-shadow` + `@keyframes` no elemento
- **Canvas de neon** — cores animadas correndo ao longo da borda
- **Quadradinhos decorativos** — nos 4 cantos, parados no repouso, giram quando IA ativa

**IA de estados (9 definidos):**

| Estado | Comportamento |
|--------|--------------|
| `repouso` | Borda azul estática, espiral lenta, cantos parados |
| `inimigo` | Borda vermelha estática, espiral lenta, cantos parados |
| `sirene` | Azul/vermelho alternando, borda pulsa mais grossa, cantos giram |
| `defesa` | Igual sirene — alerta de escolha de defesa |
| `troca_turno` | Pisca pisca dourado estilo natal |
| `dano_fraco` | Shake leve, cores neon suaves, cantos giram lento |
| `dano_medio` | Shake médio, ondulação snake, ponto horário, cantos giram |
| `dano_forte` | Shake forte, ondulação rápida, ponto horário acelerado, cantos rápidos |
| `dano_lendario` | Bordas se unem, cobrinha percorre os 4 lados do game-container, cantos giram louco |

**Quadradinhos dos cantos:**
- Tamanho de ícone, um em cada canto da borda
- Normalmente parados — só giram quando IA ativa qualquer animação
- Intensidade do giro acompanha intensidade da animação
- No lendário: alguns giram enquanto cobrinha passa

**Referência visual: Marvel Snap**
- Bordas pagas do Marvel Snap — especialmente as de neon
- Neon real = **bloom externo** (linha grossa, alpha baixo) + **glow médio** + **core colorido** + **centro branco**
- Sem `filter: blur()` — muito pesado; usar múltiplas camadas de stroke com alpha decrescente
- Espiral estilo **poste de barbearia** em todos os estados animados
- Cores que **fluem** pela borda, não apenas piscam

**Técnica CSS para borda física:**
```css
/* Borda que ondula — CSS move o ELEMENTO, não o canvas */
@keyframes bfx-ondula-top {
  0%,100%{ transform: skewX(0deg) scaleY(1) }
  25%    { transform: skewX(4deg) scaleY(1.2) }
  75%    { transform: skewX(-4deg) scaleY(0.85) }
}
/* Sirene — pulso de espessura */
@keyframes bfx-sirene {
  0%,49% { border-color: #0044ff; box-shadow: 0 0 14px #0044ff... }
  50%,100%{ border-color: #ff0022; box-shadow: 0 0 14px #ff0022... }
}
/* Pisca natal — troca de turno */
@keyframes bfx-pisca {
  0%,49%{ opacity: 1 } 50%,100%{ opacity: 0.15 }
}
```

**Técnica canvas para neon (sem blur):**
```javascript
// 3 layers manuais — substitui filter:blur
ctx.strokeStyle = cor;
ctx.lineWidth   = lw * 2.5;  ctx.globalAlpha = 0.15; // bloom
ctx.stroke();
ctx.lineWidth   = lw * 0.8;  ctx.globalAlpha = 1.0;  // core
ctx.stroke();
ctx.strokeStyle = '#ffffff';
ctx.lineWidth   = lw * 0.25; ctx.globalAlpha = 0.65; // branco
ctx.stroke();
```

**Cobrinha lendária no perímetro:**
```javascript
// Posição no perímetro do retângulo (sentido horário)
function perimPos(t01, w, h) {
  const p = 2 * (w + h);
  const d = ((t01 % 1) + 1) % 1 * p;
  if (d < w)         return { x: d,           y: 0 };  // topo →
  if (d < w + h)     return { x: w,            y: d - w }; // dir ↓
  if (d < 2*w + h)   return { x: w-(d-w-h),    y: h }; // base ←
  return              { x: 0, y: h-(d-2*w-h) }; // esq ↑
}
// 30 steps, speed 0.007, rastro 0.22 — fluido sem lag
```

#### O que foi feito de errado

Tentamos aplicar `border`, `overflow: visible`, canvas e cantos diretamente nos elementos estruturais:
- `#battle-topbar` — `position: absolute; top: 0; height: 52px`
- `#battle-panel` — `position: absolute; bottom: 0; height: 180px`

**Resultado:** layout quebrou. O `#battle-panel` deslocou, conteúdo apareceu no lugar errado, tela cortada no dispositivo.

**Analogia:** tentamos pregar o quadro decorativo diretamente na janela — e quebramos a janela.

#### A regra aprendida

> **Nunca tocar nos elementos estruturais do game-container.**
> O container é uma parede. Topbar e painel são janelas na parede. A borda é um quadro que a gente pendura NA FRENTE — sem tocar na janela, sem tocar na parede.

#### Reversão

Todos os commits de border-fx foram revertidos via `git revert`. O jogo voltou ao estado do commit `ad5fa59` com as 4 correções de battle debug intactas.

---

## Próxima sessão — 018

### Foco: reimplementar border-fx com arquitetura correta

**Arquitetura obrigatória:**
```
#screen-battle
  ├── #battle-topbar        ← NÃO TOCAR
  ├── #battle-field         ← NÃO TOCAR
  ├── #battle-panel         ← NÃO TOCAR
  ├── #bfx-overlay-top      ← elemento irmão independente
  │     ├── canvas (neon)
  │     └── .bfx-canto ×4
  └── #bfx-overlay-bot      ← elemento irmão independente
        ├── canvas (neon)
        └── .bfx-canto ×4
```

**Posicionamento dos overlays:**
```css
#bfx-overlay-top {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 52px;          /* igual ao topbar */
  pointer-events: none;
  z-index: 500;
  overflow: visible;
}
#bfx-overlay-bot {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 180px;         /* igual ao painel */
  pointer-events: none;
  z-index: 500;
  overflow: visible;
}
```

**Os overlays são irmãos — não filhos — do topbar e painel.**
CSS `border` e animações físicas vão nos overlays, nunca nos elementos reais.
Canvas de neon dentro dos overlays, não nos elementos de jogo.

**Sequência de implementação na 018:**
1. Criar `engine/border-fx.js` com os overlays independentes
2. `BORDER_FX.init()` cria os overlays e os anexa ao `#screen-battle`
3. `BORDER_FX.atualizar()` apenas sincroniza estado — não toca no DOM dos elementos de jogo
4. Testar estado `repouso` e `inimigo` primeiro
5. Depois adicionar estados de dano um por vez
6. Por último o lendário (cobrinha no `#game-container`)
7. Botões de preview no menu de opções → aba TESTES

---

## Commits desta sessão

- `ad5fa59` — fix(battle): icons overlay, turn counter, debug buttons, log popup
- `39e0c9e` — revert: remover todo o sistema border-fx (estado limpo para 018)
