# Sessão 010 — Análise do jogo antigo + layout JRPG no campo

**Data:** 2026-05-14

---

## Referências Visuais Extraídas (index_v2_87.html)

### Paleta geral
```css
--bg:  #090b0f   /* fundo principal */
--bg2: #0f1218   /* fundo secundário */
--bg3: #161b26   /* painéis e cards */
--gold:  #c9a84c
--gold2: #e8c96a
--hearts:   #e06060
--spades:   #7aade8
--clubs:    #5ac880
--diamonds: #e8c050
```
Fonts: **Cinzel** (títulos, labels) + **Crimson Pro** (texto)

---

### Campo de batalha — cenário

**Fundo do field:**
```css
background: linear-gradient(180deg,
  #04060e 0%, #070c1a 28%, #0c1428 52%, #111828 68%, #0d111f 82%, #080b14 100%
);
```

**Atmosfera (camadas via ::before/::after e elementos JS):**
- **Estrelas**: `radial-gradient` de 1-1.5px em posições fixas, animação `jrpg-twinkle` 5s
- **Névoa rasteira**: `linear-gradient` transparente → `rgba(4,6,14,0.75)` nos 38% inferiores
- **Glow central**: `radial-gradient(ellipse 55% 40% at 50% 68%, rgba(50,80,160,0.13))`, animação `jrpg-breathe` 4s
- **Grid perspectiva no chão**: `repeating-linear-gradient` azulado nos 35% inferiores

---

### Posicionamento dos slots — JRPG (coordenadas absolutas)

Sistema estilo **Marvel Avengers Alliance**: slots com `position: absolute`, âncora `left/top` em %, `transform: translate(-50%, -50%)` para pivot central.

```javascript
const JRPG_SLOTS = {
  player: [
    { left: '24%', top: '22%', scale: 0.85 },  // atrás
    { left: '16%', top: '52%', scale: 0.93 },  // meio
    { left: '28%', top: '82%', scale: 1.00 },  // frente
  ],
  enemy: [
    { left: '76%', top: '22%', scale: 0.85 },
    { left: '84%', top: '52%', scale: 0.93 },
    { left: '72%', top: '82%', scale: 1.00 },
  ],
};
```

Efeito de profundidade: personagens mais ao fundo (top menor) = escala menor.
Boss: `{ left: '80%', top: '50%', scale: 1.1 }` (1 centralizado, 100×130px)

---

### Card do personagem

**Tamanho normal:** 60×90px — adaptamos para **70×100px** (um pouco maior que o original)
**Tamanho boss:** 100×130px (mantido)

**Fundo do card:**
```css
background: linear-gradient(165deg,
  rgba(255,255,255,0.07) 0%,
  rgba(20,28,50,0.60)   55%,
  rgba(0,0,0,0.50)      100%
);
border: 2px solid rgba(255,255,255,0.09);
border-radius: 10px;
```

**Sombra elíptica abaixo** (::after):
```css
background: radial-gradient(ellipse 80% 100% at 50% 0%,
  rgba(0,0,0,0.55) 0%, transparent 100%
);
```

**Nome:** `position: absolute; bottom: 0; left: 0; right: 0;` com gradiente escuro de baixo para cima — aparece dentro do card.

**Naipe como "arte":** `font-size: clamp(30px, 8vw, 56px)`, `filter: drop-shadow(0 3px 12px currentColor)` com cor do naipe.

---

### Slot ativo (turno atual)

```css
border-color: rgba(201,168,76,0.7);
box-shadow:   0 0 16px rgba(201,168,76,0.35), inset 0 0 10px rgba(201,168,76,0.08);
/* avatar */
filter: drop-shadow(0 0 8px rgba(201,168,76,0.55));
/* animação */
animation: cr-ready-bob 2s ease-in-out infinite; /* translateY(0 → -6px) */
```

---

### Topbar

- **Grid**: `1fr auto 72px` (turno esq, baralhos centro, restart dir)
- **Altura**: 36px (vs nossos 52px — mantemos 52px)
- **Fonte**: Cinzel, 11px, `var(--gold)`

---

## O Que Implementamos (Sessão 010)

### Layout JRPG no campo
- `#battle-field` sem flex — `position: relative; overflow: hidden`
- `.battle-field-lado` vira wrapper absoluto invisível (inset 0)
- Slots recebem `position: absolute; transform: translate(-50%, -50%)`
- JS: `_posicionarSlots()` aplica JRPG_SLOTS por índice de combatente por lado
- Card reduzido para 70×100px, nome dentro do card (gradiente escuro)
- Naipe colorido com `filter: drop-shadow`

### Atmosfera do campo
- `#battle-field::before` — estrelas (radial-gradient dots, opacidade pulsante)
- `#battle-field::after` — névoa rasteira (35% inferior)
- `.battle-field-center-glow` — elemento JS adicionado ao campo (glow central animado)

---

## O Que NÃO Muda
- Layout topbar (52px)
- Layout painel (180px)
- Lógica de turno, iniciativa, combate
- `GRAD_NAIPE` — gradientes por naipe (mantidos, aplicados no card)

---

## Próxima Sessão (011)

- Animação de turno ativo: bob + borda dourada no slot
- Habilidades: começar a lógica de seleção de alvo
- Barra de HP colorida por % (verde → amarelo → vermelho)

---

## Arquivos Tocados

**Modificados (sessão 010)**
- `screens/battle/battle.css` — layout JRPG, atmosfera, card redesenhado
- `screens/battle/battle.js` — `_posicionarSlots()`, card redimensionado, nome no card
- `Claude memory/sessoes/sessao-010_assets-jogo-antigo.md` — este arquivo
