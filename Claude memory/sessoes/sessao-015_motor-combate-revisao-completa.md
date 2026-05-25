# Sessão 015 — Revisão completa do motor de combate

**Data:** 2026-05-25
**Branch:** `claude/session-015-VD9dC`

---

## O que foi feito

### 1. Popup de status em tempo real

Popup ao clicar em qualquer personagem no campo mostra:
- HP atual / PVS máximo
- Stats (ATQ / DEF / INC)
- Habilidades equipadas com cooldown
- Passivas slotadas com descrição
- Efeitos ativos com duração, valor e descrição do catálogo
- Flags de estado (acúmulo, cargas de energia)

---

### 2. Contra-ataques e ataques conjuntos com animação

Antes: contra-ataques disparavam silenciosamente dentro de `resolverAcao`.

Agora: enfileirados em `BATTLE_STATE.contraAtaquesPendentes` e processados por `_processarContraAtaques()` em battle.js com float + animação de ataque, entre o dano principal e `_finalizarTurno`.

---

### 3. Arquitetura de naipes como identificadores

Decisão de design confirmada: naipe é só um identificador. O que ele faz são buffs/debuffs no sistema de efeitos.

| Vantagem | Efeito |
|---|---|
| ♥ interage com ♣ | `hearts_adv` — ATQ/DEF ×2 por 2 turnos |
| ♣ recebe ataque de ♦ | `clubs_furtivo` — furtivo 2t + contra-ataque |
| ♦ ↔ ♠ | `rodada_extra` — efeito instantâneo (`duracao: null`) |
| ♠ → ♥ | `danoMult = 2` — crítico pré-defesa |

Guarda `ativaVantagem`: vantagens só ativam se `causouDano > 0` OU `hab.efeitoPuro`.

clubs_furtivo movido para verificação standalone fora do guard de naipe — funciona contra qualquer atacante, não só ♦.

---

### 4. Crítico Alto (esp_h1_2) corrigido

Antes: `modificar_poder` dobrava o poder bruto (pré-defesa).

Agora: `modificar_dano_final` multiplica o dano líquido pós-defesa (`ev.multiplicador = 2`). Hook `modificar_dano_final` adicionado em `resolverAcao` após `etapa3_resolucaoDano`.

---

### 5. rodada_extra e acao_rapida como efeitos instantâneos

`_rodadaExtraPending` e `_acaoDuplicadaPending` (flags soltas) substituídos por efeitos com `duracao: null`:

```js
{ tipo: 'rodada_extra', duracao: null }
{ tipo: 'acao_rapida',  duracao: null }
```

Aparecem no popup e na barra de ícones automaticamente. Consumidos por código.

---

### 6. Ícones canvas para acao_rapida e rodada_extra

Ícones circulares gerados via canvas com símbolo centralizado:

| Estado | acao_rapida | rodada_extra |
|---|---|---|
| Disponível (verde) | 🟢⚡ | 🟢✨ |
| Bloqueado (vermelho) | 🔴⚡ | 🔴✨ |
| Sem ícone | limpo, pode receber | limpo, pode receber |

Gerados uma vez por `_iconeExtraUrl()` e cacheados. Aparecem na barra de efeitos do slot do campo.

---

### 7. Sistema de bloqueio de extras por turno

Um slot único de turno extra por turno — não é 1 de cada, é 1 no total.

- `c.acaoExtra = true` — lock unificado
- `c._acaoRapidaGasta = true` — rastro visual vermelho de ação rápida
- `c._rodadaExtraGasta = true` — rastro visual vermelho de rodada extra
- Ambos resetam em `_iniciarNovoTurno` (virada de turno, não de rodada)
- Bloqueio aplicado em: `_aplicarVantagemNaipe`, `esp_p2`, `our_p2`

---

### 8. Fix ordem DoT → deduzirEfeitos

Ordem corrigida em `iniciarRodada`:

**Antes:** `_deduzirEfeitos` → `_aplicarDoT` (bug: podia expirar o efeito antes do dano)

**Agora:** `_aplicarDoT` → `_deduzirEfeitos` (queimadura de 2t queima 2 vezes antes de expirar)

---

### 9. Etapas do combate documentadas e corrigidas

| Etapa | O que faz |
|---|---|
| 0 | `iniciarRodada`: aplica DoTs → deduz durações (1× por turno, idempotente) |
| 1 | `rodarEtapa1`: tick passivas → recalc stats → verifica stun/freeze |
| 2 | Jogador escolhe: usa habilidade ou passa a rodada (+1 carta) |
| 3 | `resolverAcao`: resolve dano, efeitos, vantagens de naipe, contra-ataques |
| 4 | `_verificarEtapa4`: se tem acao_rapida ou rodada_extra → consome → volta Etapa 1 |
| 5 | `_finalizarTurno`: rodada_extra externa → insere na fila; avança combatente |

---

### 10. Etapa 4 conectada

`_verificarEtapa4(c)` criado em battle.js. Chamado após contra-ataques em todos os fluxos:
- Jogador atacando
- Jogador passando
- IA atacando
- IA passando
- Defesa do jogador contra IA

Se efeito presente e `acaoExtra = false`: consome, re-roda Etapa 1, devolve controle (IA também via `setTimeout(_turnoInimigo)`).

**rodada_extra no próprio turno** (ex: esp_p2 ao nocautear) → Etapa 4 consome, Etapa 1 agora.

**rodada_extra ganho externamente** (ex: ♦ recebe de ♠) → `_finalizarTurno` escaneia todos os combatentes e insere na fila logo após posição atual.

---

### 11. Golpes múltiplos revisados

| Item | Antes | Agora |
|---|---|---|
| Defesa do defensor | Só no 1º hit | Vale para todos os hits |
| Tags (debuffs) | Só no 1º hit | Por hit que causar dano |
| Hits adicionais | Automáticos | Opcionais — jogador escolhe carta ou pula |
| Animação | Float único total | Float + shake por hit (`1º ATQ`, `2º ATQ`...) |

Novo estado `sel_carta_adicional`: aparece após selecionar alvo se habilidade for multi-hit. Mostra mão + botão PULAR para cada hit adicional.

`BATTLE_STATE.ultimosHits[]` armazena `{ alvoId, danoReal }` por hit para animação sequencial.

---

### 12. Coringa ★ integrado ao sistema de rodada_extra

Antes: injetava extra direto na fila, sem ícone, sem bloqueio.

Agora: empurra `{ tipo: 'rodada_extra', duracao: null }` no array de efeitos. Ícone 🟢✨ aparece. `_finalizarTurno` consome e injeta na fila. Bloqueado se `c.acaoExtra = true`.

---

## Decisões relevantes

| Decisão | Detalhe |
|---|---|
| Naipe = identificador | Naipe detecta, efeitos fazem o trabalho |
| 1 slot extra por turno | acao_rapida OU rodada_extra, não os dois |
| Etapa 0 é sagrada (1×) | DoT e duração não repetem em ação extra |
| Etapa 4 volta pra Etapa 1 | Não pra Etapa 0 — DoT não repete |
| rodada_extra externo vs próprio | Externo: fila via `_finalizarTurno`. Próprio: Etapa 4 inline |
| Crítico ♠→♥ = pré-defesa | `danoMult = 2` no danoBruto |
| Crítico Alto = pós-defesa | `modificar_dano_final` multiplica dano líquido |

---

## Arquivos modificados

- `engine/combat.js` — resolverAcao, iniciarRodada, _aplicarVantagemNaipe, etapa4_acaoExtra, estadoVazio, _iniciarNovoTurno
- `engine/passivas.js` — esp_p2, our_p2 com guard acaoExtra; ordem DoT
- `engine/efeitos-habilidades.js` — esp_h1_2 migrado para modificar_dano_final
- `engine/efeitos-catalogo.js` — rodada_extra, acao_rapida, critico, hearts_adv, clubs_furtivo
- `screens/battle/battle.js` — _verificarEtapa4, _processarContraAtaques, _efeitosIconsHtml (canvas), popup de status, sel_carta_adicional, _executarAcao multi-hit, Coringa ★
- `screens/battle/battle.css` — estilos popup, ícones canvas
- `index.html` — versão `?v=020`

---

## Próxima sessão — foco

**Sessão 016**

1. **Verificar tela de batalha funcionando** — testar fluxos: acao_rapida, rodada_extra, multi-hit, contra-ataques animados, ícones verdes/vermelhos
2. **Tela Principal (hub)** — Survivor / PvP / Status / Equipamentos
3. **Loop do Survivor** — progresso de batalhas, recompensas de pontos, fluxo após batalha
4. **Firebase** — init → Auth Google → Firestore (PLAYER_STATE)
