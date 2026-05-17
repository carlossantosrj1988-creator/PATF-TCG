# Sessão 013 — Sistema de habilidades, efeitos e Copas completo

**Data:** 2026-05-17
**Branch:** `claude/start-session-008-G8Aeo`

---

## Estado de entrada

A sessão 012 entregou: ciclo de turno/iniciativa, baralho compartilhado e tela visual da batalha. Sessão 013 começou da revisão da batalha e foi pra construção do sistema de habilidades inteiro.

---

## O que foi feito

### 1. Catálogo e processo de criação de habilidades

- `game-design/06_catalogo-habilidades-passivas.md` — todas as 54 habilidades + 28 passivas do jogo antigo, com poder/tipo/alvo/recarga/efeito completos
- `game-design/07_criacao-de-habilidades.md` — schema, estética de nomes (MTG/Hearthstone parody), dois fluxos de criação (catálogo vs do zero), conceito de basicas universais

### 2. Engine de habilidades — `engine/habilidades.js`

- `BASICOS` (4 arquétipos, um por CHAR_POOL — slot H1 nasce equipado)
- `HABILIDADES_DATA` — Copas H1, H2, H3 completas (9 habilidades)
- `PASSIVAS_DATA` — 3 passivas de Copas
- `PENDENTE_T2` — Tier 2 parqueado (Espada do Poder, SKAAAAR, Roupas Encantadas, Espírito da Salamandra, Emboscada Florestal, 2 passivas Patrulheiro)
- Lookups: `getBasico`, `getHabilidade`, `getPassiva`, `resolverHabilidade`

### 3. Sistema de passivas — `engine/passivas.js`

- Registry + dispatcher (gatilho → fn)
- `recalcularStats(c)` reseta para base, soma buff/debuff de c.efeitos, dispara `recalc_stats`
- Implementadas: cop_p1 (Acúmulo), cop_p2 (Defender os Fracos), cop_p3 (Sou Invencível)

### 4. Sistema de efeitos intrínsecos — `engine/efeitos-habilidades.js`

- Runtime de comportamento PER-habilidade (não nomeado)
- Implementados: cop_h1_2 (Golpe Amplo +1 DEF), cop_h3_1 (Ódio marker), cop_h3_2 (Espírito do Urso Polar +3 por debuff do alvo)

### 5. Sistema de efeitos nomeados — catálogo + motor

- `game-design/09_efeitos.md` — arquitetura, slot map do ciclo, Início vs Etapa 1
- `engine/efeitos-catalogo.js` — **EFEITOS_DATA** (id → nome, categoria, descricao)
- `engine/efeitos.js` — motor (registrar, aplicar, get, destacar + tooltip)
- `engine/efeitos.css` — destaque clicável dourado + tooltip global
- 4 efeitos cadastrados: Amaciado, Exposto, Queimadura, Resfriamento
- Linker: habilidades declaram `tags`, combat.js chama EFEITOS.aplicar por tag quando há dano real

### 6. IA dos monstros — Fase F

- `game-design/08_ia-monstros.md` — Layer 1 (universal) / Layer 2 (script por monstro)
- `enemy-ai/monstros.js` — SKILLS registry (17 skills) + DATA (23 monstros indexados por id)
- `enemy-ai/ia.js` — `IA.decidir(c)` retorna decisão (não executa); helpers de seleção; script default (1ª hab disponível + alvo aleatório por hab.alvo)

### 7. Refinos no combat.js

- `iniciarRodada(c)` — Início only (deduce + DoT), idempotente via `_turnoIniciado`
- `rodarEtapa1(c)` — tick_passivas + recalc + stun check (re-roda em rodada extra)
- `etapa5_fimRodada` — limpa `_turnoIniciado`
- `resolverAcao` — orquestra uso end-to-end: consome carta, ao_usar, modificadores de poder, defesa per alvo, etapa3, gatilhos ao_causar/ao_sofrer, linker de tags
- Defesa per-alvo via mapa de **referências** (não índices) pra área
- `verificarFimDeBatalha` cobre baralho esgotado (derrota jogador / morte inimigo)

### 8. Tela de batalha — fluxo completo

- Painel etapa1: 3 botões (HABILIDADES / ESPECIAIS / PASSAR)
- Fluxo habilidade: sel_habilidade → sel_carta → sel_alvo
- Fluxo especial: sel_especial → sel_alvo_especial (J/Q/K/A/★ com handlers próprios)
- Tela de defesa: single + área (queue per alvo, cartas reservadas grayed)
- Ficha técnica de habilidade com descrição (efeitos clicáveis via destacar)
- **Status popup live** ao clicar no slot do personagem — cabeçalho com naipe, vantagens/desvantagens, stats coloridos (up/down), HP bar, seções HABILIDADES/PASSIVAS/EFEITOS ATIVOS, re-renderiza a cada mudança

### 9. Damage / J = esquiva total

- `calcularDefesa` retorna Infinity se carta.valor === 'J'

---

## Decisões de arquitetura

- **Início vs Etapa 1** — Início é once-per-round (deduce + DoT). Etapa 1 re-roda em rodada extra/ação rápida (tick passivas + recalc + stun). Por isso passivas ficam na 1, não no Início
- **Stats base imutáveis** — atqBase/defBase/incBase são fixos; recalcularStats sempre reseta e re-aplica
- **3 módulos de efeitos separados** — passivas (passivas.js), intrínsecos de habilidade (efeitos-habilidades.js), nomeados (efeitos.js). Carlos preferiu separação por papel a unificação
- **Catálogo separado do motor** — efeitos seguem o mesmo padrão de habilidades: DATA puro em arquivo próprio, comportamento no motor. Fluxo pra criar efeito novo: adiciona no catálogo, registra aplicar, tagueia na habilidade
- **Tags são late-binding** — habilidade declara `tags:['exposto']`, registry resolve por nome em runtime. Adicionar conteúdo novo não exige refator
- **Layer 1/Layer 2 da IA** — todo monstro herda Layer 1 (regras universais); cada um pode ter Layer 2 com script personalizado

---

## Estado do ciclo de combate ao final

| Etapa | Status |
|---|---|
| Início | ✅ pronto (deduce + DoT, idempotente) |
| Etapa 1 | ✅ pronto (tick passivas + recalc + stun) |
| Etapa 2 | ✅ pronto (habilidade/especial/passar) |
| Etapa 3 | ✅ pronto (naipe + defesa + gatilhos + linker de tags) |
| Etapa 4 | ⚠️ engine existe; nenhum conteúdo dispara ainda |
| Etapa 5 | ⚠️ engine existe; `_aplicarEfeito` vazio (ponto de extensão) |

Esqueleto inteiro montado. Mecânicas pendentes (cura, escudo, ação extra, _aplicarEfeito de fim de rodada, naipe ativo vs secundário, spawn de boss, IA personalizada) só ganham vida quando o conteúdo que as usa for implementado — vão entrando junto com as habilidades dos outros naipes.

---

## Próxima sessão — foco

**Implementar todas as habilidades e passivas dos naipes restantes** (Paus, Ouro, Espadas) seguindo o fluxo já consolidado:

1. Para cada habilidade — entrada em `HABILIDADES_DATA` (catálogo) → registrar comportamento intrínseco em `efeitos-habilidades.js` se necessário → declarar `tags` se aplica efeito nomeado
2. Para cada efeito novo — entrada em `EFEITOS_DATA` → registrar `aplicar` em `efeitos.js`
3. Para cada passiva nova — entrada em `PASSIVAS_DATA` → registrar com gatilho em `passivas.js`

Mecânicas auxiliares (cura, escudo, ação extra, etc.) entram conforme aparecem nas habilidades implementadas.
