# Sessão 011 — Plano: Tutorial como mini-Survivor

**Data:** 2026-05-14

---

## Conceito

O tutorial é um Survivor de 5 etapas — mesma arquitetura, escopo menor.
Tudo que construirmos aqui é a fundação do Survivor completo.

---

## Mapeamento do Survivor (referencia/index_v2_87.html)

### Estado persistente (`_survState`)
```javascript
{
  phase: 1,                  // tier atual
  stage: 1,                  // etapa atual (1-10 no original, 1-5 no tutorial)
  team: [],                  // IDs dos personagens
  hp: { id: { cur, max } },  // HP salvo de cada personagem
  completedStages: [],
  completedBosses: []
}
```

### Nós do mapa
| Tipo       | Tamanho | Visual                              | Quando                  |
|------------|---------|-------------------------------------|-------------------------|
| normal     | 52px    | círculo com número                  | etapas comuns           |
| current    | 58px    | glow pulsando                       | etapa atual             |
| completed  | 52px    | opacity 0.5 + ✓ verde               | etapas concluídas       |
| locked     | 52px    | opacity 0.25 + borda tracejada      | etapas futuras          |
| recovery   | 52px    | borda dupla + 💚 canto sup-dir      | etapa de recuperação    |
| boss       | 64px    | borda mais grossa + 👑              | boss final              |
| boss atual | 70px    | boss + glow pulsando                | boss é a etapa atual    |

### Path layout
- `flex-direction: column-reverse` — etapa 1 embaixo, boss em cima
- Linha vertical central como guia visual
- Nós alternam esquerda/direita (ímpar→row, par→row-reverse)
- Linha de conexão entre nós

### HP bars do mapa
- Uma barra por personagem (naipe colorido + nome + barra)
- Cores: `>60%` → verde `#5ac880`, `>30%` → amarelo `#d0a040`, `≤30%` → vermelho `#d04050`

### Tela de transição (antes da batalha)
- Mostra: "ETAPA X/5" + label do tipo
- Time inimigo com cards (naipe + nome por personagem)
- Countdown 3 → 2 → 1 → inicia batalha
- Fundo atmosférico

### Pós-batalha
- HP de cada personagem salvo no estado
- Mortos: `hp.cur = 0`, excluídos das próximas batalhas
- Vitória em etapa de recuperação: cura 100% HP de todos os vivos OU revive 1 personagem morto (escolha do jogador)
- Vitória no Boss: tutorial concluído

---

## Adaptação para o Tutorial (5 etapas)

```
ETAPA 1 — normal      → Goblin   ♣  (INIMIGOS_TUTORIAL[0])
ETAPA 2 — normal      → Orc      ♠  (INIMIGOS_TUTORIAL[1])
ETAPA 3 — recuperação → Bruxa    ♥  (INIMIGOS_TUTORIAL[2]) + cura 40% após vitória
ETAPA 4 — normal      → Cavaleiro♦  (INIMIGOS_TUTORIAL[3])
ETAPA 5 — boss        → Dragão   ♠  (INIMIGOS_TUTORIAL[4]) + tela de conclusão
```

---

## Fluxo de telas

```
[TUTORIAL init]
      ↓
[MAPA DO TUTORIAL]          ← tela principal entre batalhas
  - HP bars dos 3 personagens
  - Path de 5 nós
  - Clique no nó atual → transição
      ↓
[TELA DE TRANSIÇÃO]         ← "vem aí" (2-3s)
  - Label da etapa
  - Time inimigo com cards
  - Countdown 3→2→1
      ↓
[BATALHA]                   ← battle.js existente
  - HP começa do estado salvo
      ↓
[RESULTADO]                 ← vitória ou derrota
  - Vitória: salva HP → volta ao mapa (próxima etapa desbloqueada)
  - Recuperação: popup de escolha → CURAR TODOS (100% HP) ou REVIVER (1 personagem morto)
  - Boss: tela de conclusão do tutorial
  - Derrota: volta ao mapa (etapa não avança, HP como ficou)
```

---

## Arquivos a criar/modificar

### Novos
- `screens/tutorial/tutorial-map.css` — mapa, nós, HP bars, transição
- `screens/tutorial/tutorial-map.js` — estado, renderMap, enterBattle, afterBattle

### Modificados
- `screens/tutorial/tutorial.js` — integrar chamada ao mapa ao entrar em etapa
- `screens/tutorial/tutorial.css` — ajustes mínimos se necessário
- `index.html` — adicionar tutorial-map.css e tutorial-map.js

---

## Estado do tutorial (`TUTORIAL_STATE`)

```javascript
{
  etapa:    1,           // 1-5
  hp: {                  // HP persistido por personagem (poolId como chave)
    vigor:     { cur: 120, max: 120 },
    ofensivo:  { cur: 100, max: 100 },
    agil:      { cur: 100, max: 100 },
  },
  etapasConcluidas: [],  // [1, 2, ...]
  concluido: false
}
```

---

## O que NÃO muda

- `battle.js` / `battle.css` — tela de batalha intacta
- `engine/` — deck, damage, combat intactos
- `chars/chars.js` — pool de personagens intacto
- Topbar de 52px, campo JRPG, painel de ação — intactos

---

## Próxima sessão (012) — Implementação

Ordem de construção:
1. `TUTORIAL_STATE` — estado persistente entre etapas
2. `tutorial-map.css` — layout do mapa (path + nós + HP bars)
3. `tutorial-map.js` — renderMap(), enterBattle(), afterBattle()
4. Tela de transição — countdown + time inimigo
5. Integração com `battle.js` — HP persistido na entrada
6. Cura na etapa 3, conclusão na etapa 5
