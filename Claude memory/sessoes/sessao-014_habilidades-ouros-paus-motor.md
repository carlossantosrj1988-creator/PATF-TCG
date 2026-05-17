# Sessão 014 — Auditoria e implementação de ♦ Ouros e ♣ Paus + motor completo

**Data:** 2026-05-17
**Branch:** `claude/start-exercise-014-31Fzu`

---

## O que foi feito

### 1. Implementação de ♠ Espadas T1 (início da sessão)

Commits: `909bddc` + `7a27456`

Habilidades registradas em `engine/habilidades.js`:

| Id | Nome | Slot | Origem |
|---|---|---|---|
| esp_h1_1 | Golpe Tático | H1 | ex-Golpe Tático (Vance ♠) |
| esp_h1_2 | Golpe de Abate | H1 | ex-Soco Metálico (Kael Vorn ♠) |
| esp_h1_3 | Empalar | H1 | ex-Lança Infernal (Lorien ♠) |
| esp_h1_4 | Marca do Atirador | H1 | ex-Flecha Imperial (Lorien ♠) |
| esp_h1_5 | Corte Metamorphosis | H1 | ex-Machado do Poder (Varok ♠) |
| esp_h2_1 | Mãos Flamejantes | H2 | ex-Punho Incendiário (Vance ♠) |
| esp_h2_2 | Redemoinho | H2 | ex-Ataque de Fúria (Kael Vorn ♠) |
| esp_h3_1 | Atropelar | H3 | ex-Investida Unicórnio (Lorien ♠) |
| esp_p1 | Resiliência | P | ex-Instinto Furioso (Kael Vorn ♠) |
| esp_p2 | Novo Level | P | ex-Grande Estrela (Lorien ♠) |
| esp_p3 | Gladiador | P | ex-Gladiadora (Lorien ♠) |

Efeito novo: `enfraquecido` (−50% ATQ base) no catálogo e runtime.

Handlers em `efeitos-habilidades.js`: Golpe Amplo (buff_def ao causar dano), Ódio (acumula +4/dano sofrido), Urso Polar (+3 poder por debuff no alvo), Golpe de Abate (crítico 50%), Corte Metamorphosis (cura 2 ao causar dano), Redemoinho (ativa contra-ataque), Atropelar (×2/×4 por Exposto/Enfraquecido).

Passivas em `passivas.js`: esp_p1 (Resiliência — cura 20% ao aliado nocauteado), esp_p2 (Novo Level — carta extra + rodada extra ao nocautear), esp_p3 (Gladiador — +2 ATQ +2 DEF abaixo de 20% HP).

Eventos adicionados em `combat.js`: `aliado_nocauteado`, `ao_nocautear_inimigo` (em `etapa3_resolucaoDano`), contra-ataque Redemoinho (em `resolverAcao`), `poderBase` exposto no evento de poder.

T2 arquivados: Descarga Elétrica, Corte Preciso, Soco Brutal, Espírito do Gorila, Espírito de Combate, Chamado da Tropa, Patrulheiro de Combate (Varok).

---

### 2. Auditoria de ♦ Ouros — um por um

Processo: cada habilidade do jogo antigo foi revisada — nome original, personagem, posição — e decidida nova identidade, slot e mecânica.

| Id | Nome | Slot | Decisão |
|---|---|---|---|
| our_h1_1 | Barragem | H1 | Acúmulo de 3 cargas ao passar rodada; cada uso gasta 1 carga → ação extra separada de rodada extra e ação rápida |
| our_h1_2 | Feixe de Plasma | H1 | Ignora armadura; turno nao; cargas migradas para passiva our_p1 |
| our_h2_1 | Feixe Congelante | H2 | Aplica Congelado; turno nao |
| our_h2_2 | Bomba Ácida | H2 | Aplica Armadura Derretida; turno nao |
| our_h2_3 | Bomba Radiação | H2 | Aplica Radiação (empilhável até 4×); turno nao |
| our_h2_4 | Máscara de Faces | H2 | Alterna Feliz (+1 ATQ aliados) / Triste (−1 ATQ inimigos); turno nao |
| our_h2_5 | Punhais Penetrantes | H2 | Poder '1/1' (dois golpes) |
| our_h3_1 | Elixir da Cura | H3 | Cura aliados em ATQ+1 em vez de dano; turno nao |
| our_p1 | Concentração de Energia | P | Ao passar rodada: +1 carga + 1 dano puro a todos inimigos; ao usar habilidade: gasta cargas para +poder; 5 cargas = muda alvo para todos |
| our_p2 | Ação Duplicada | P | 50% de ação Rápida extra após ação principal |

T2: Azar ou Sorte, Espírito do Grifo, Grande Gênio, Patrulheiro de Combate (Elowen).
Removidos (não existem mais): Arco do Poder, Disparo Élfico, Engenharia Avançada, Gravity Suit.

---

### 3. Auditoria de ♣ Paus — um por um

| Id | Nome | Slot | Decisão |
|---|---|---|---|
| pau_h1_1 | Disparo Dividido | H1 | Poder 2 |
| pau_h1_2 | Corte Preciso | H1 | Cortante direto |
| pau_h1_3 | Granada Explosiva | H1 | Atinge todos inimigos |
| pau_h1_4 | Atagas do Poder | H1 | Poder '1/1' (dois golpes) |
| pau_h2_1 | Controle Mental | H2 | Aplica Encantado (efeitoPuro) |
| pau_h2_2 | Golpe Estático | H2 | Aplica Estática (Elétrico) |
| pau_h3_1 | Prestidigitação | H3 | Aplica Imagem Espelhada em todos aliados |
| pau_p1 | Sorte Grande | P | 50% compra 1 carta extra por rodada |
| pau_p2 | Protetor Instintivo | P | 50%/25% intercepta ataques em aliados |
| pau_p3 | Inspirar Coragem | P | +1 ATQ +1 DEF a aliados vivos (buff por tick) |

T2: Disparo Pistola, Espírito do Guepardo, Chicote Paralisante, Instinto Reflexivo, Tiro Decisivo, Resgate dos Prisioneiros, Patrulheiro de Combate (Zarae).

---

### 4. Implementação completa em 6 arquivos

Commit: `94674cd`

**`engine/efeitos-catalogo.js`** — 6 novos efeitos:
- `derretar_armadura` (debuff_marca) — impede carta de defesa e Valete
- `radiacao` (debuff_dot) — 4 dano/turno, empilha até 4×
- `congelado` (debuff_ctrl) — 50% perda de turno (tipo stun)
- `estatica` (debuff_marca) — 5 dano antes de qualquer habilidade Elétrica
- `encantado` (debuff_ctrl) — 50% redireciona ataque único para aliado próprio
- `imagem_espelhada` (buff_marca) — 50% esquiva, consumida ao esquivar

**`engine/efeitos.js`** — aplicar() registrado para todos os 6 + fix `_renovarOuCriar` para `duracao: null`.

**`engine/habilidades.js`** — HABILIDADES_DATA + PASSIVAS_DATA + PENDENTE_T2 com todos os entries acima.

**`engine/efeitos-habilidades.js`** — handlers:
- `our_h1_1`: `ao_passar_rodada` (+1 carga), `ao_usar` (gasta carga → `_barragemAcaoExtra`)
- `our_h1_2`: `modificar_poder` → `ev.ignoraArmadura = true`
- `our_h2_4`: `ao_usar` → toggle masc_feliz/masc_triste com buff/debuff de ATQ
- `our_h3_1`: `ao_usar` → cura cada alvo em ATQ+1
- `pau_h2_1`: `ao_usar` → EFEITOS.aplicar('encantado', alvo)
- `pau_h3_1`: `ao_usar` → EFEITOS.aplicar('imagem_espelhada', cada aliado)

**`engine/passivas.js`** — handlers:
- `our_p1`: `ao_passar_rodada` → +1 carga + 1 dano puro a todos inimigos
- `our_p2`: `tick_passivas` → 50% `_acaoDuplicadaPending`
- `pau_p1`: `tick_passivas` → 50% comprar 1 carta
- `pau_p2`: `aliado_atacado` → 50%/25% interceptar
- `pau_p3`: `tick_passivas` → renova buff_atq/buff_def (duracao 2) em aliados

**`engine/combat.js`** — melhorias:
- `_parsePoder(valor)` — '1/1' → [1,1]; resolve múltiplos passes de dano
- `_ehEletrico(tipo)` — helper para Estática
- `_deduzirEfeitos` — preserva `duracao === null` (Imagem Espelhada permanente até consumo)
- `passarRodada` — despacha `ao_passar_rodada` às habilidades equipadas (além de passivas)
- `etapa3_resolucaoDano` — parâmetro `ignoraArmadura = false`; defesa = 0 quando ativo
- `resolverAcao`:
  - Encantado: 50% redireciona alvosEfetivos para aliado do atacante (pré-loop)
  - Estática: habilidade Elétrica → 5 dano puro em portadores antes do loop
  - Imagem Espelhada: 50% esquiva + consumo (pós-alvoReal, com `continue`)
  - Armadura Derretida: bloqueia extração de carta de defesa
  - `ignoraArmadura` passado para etapa3 via `evPoder.ignoraArmadura`
  - Passes extras (pi = 1..N−1) para poder múltiplo sem tags/intercept extras

---

## Decisões relevantes

| Decisão | Detalhe |
|---|---|
| Barragem independente de rodada extra | `_barragemAcaoExtra` separado de `_rodadaExtraPending`; pilha de ações preservada |
| `duracao: null` = permanente | Imagem Espelhada não expira por tempo; `_deduzirEfeitos` filtra só isso |
| Radiação não usa _renovarOuCriar | Empilha até 4 entradas individuais (stacking DoT) |
| pau_p3 usa tick_passivas | Evita modificar stats de terceiros diretamente no recalc (bug de cascata); usa efeitos buff_atq/buff_def que recalcularStats já lê |
| Concentração de Energia: cargas via passiva | Feixe de Plasma não gerencia cargas próprias; a passiva potencializa qualquer habilidade |

---

## Próxima sessão — foco

**Sessão 015 — Conceito do jogo e Firebase**

1. **Tela Principal** — hub central (Survivor / PvP / Status / Equipamentos), fio que liga todas as telas já construídas
2. **Loop do Survivor** — progresso de batalhas, recompensa de pontos, fluxo após batalha
3. **Primeiro Firebase** — ordem de implementação: init → Auth (Google) → Firestore (PLAYER_STATE)
4. Possivelmente: sistema de pontos + gasto no Atlas integrado ao fluxo real
