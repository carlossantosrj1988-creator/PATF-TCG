# PATF TCG — Sistema de Efeitos

*Documento de design — definido na sessão 013*

Os efeitos são o **core mecânico** do PATF TCG. Sem eles, o jogo seria um simples bate-e-volta de cartas. Cada passiva, buff, debuff, marca, escudo ou condição é um efeito que impõe uma regra sobre o combate.

Este documento mapeia a arquitetura: onde mora cada coisa, qual é o slot no ciclo de rodada em que ela age, e como adicionar um efeito novo.

---

## Princípio

**Tudo que muda o estado do combate é um efeito.** As "categorias" de UI/data (passiva, buff nomeado, marca, escudo, etc.) são fachadas — todas compartilham a mesma estrutura interna: um id, um gatilho, uma função que executa.

## Arquitetura — três módulos espelhados

| Módulo | Responsabilidade | Indexado por |
|---|---|---|
| `engine/passivas.js` | Comportamento das passivas dos personagens | id de passiva (ex: `cop_p1`) |
| `engine/efeitos-habilidades.js` | Efeitos intrínsecos de habilidades específicas | id da habilidade (ex: `cop_h1_2`) |
| `engine/efeitos.js` | Buffs/debuffs **nomeados** que habilidades aplicam | id do efeito (ex: `'exposto'`) |

Os três têm o mesmo padrão: `registrar(id, def)` + `disparar(...)`/`aplicar(...)`. O motor (`combat.js`) chama os três nos pontos certos do ciclo.

Onde cada um age:

- **passivas** → disparam em gatilhos por evento (`tick_passivas`, `ao_causar_dano`, `aliado_atacado`, `recalc_stats`, ...)
- **efeitos-habilidades** → disparam pela habilidade que está sendo usada (`ao_usar`, `modificar_poder`, `ao_causar_dano`)
- **efeitos** → aplicados quando uma habilidade com `tags:[...]` causa dano; manifestam-se via entradas em `c.efeitos` que os outros módulos leem

---

## Mapa do ciclo de rodada — qual efeito vive em qual slot

```
INÍCIO DA RODADA       once-per-round
  ↓ deduce duração de buffs/debuffs + cooldowns, filtra expirados
  ↓ aplica DoT (Queimadura, Sangramento, Radiação, Estática, Resfriamento, Veneno)

ETAPA 1 — Verificações Pré-Ação    re-roda em rodada extra / ação rápida
  1.a ↓ tick_passivas (passivas auto: Acúmulo, Carregar, Aura, etc.) + recalc
  1.b ↓ stun check (Congelado/Atordoado — 50% chance de perder turno)

ETAPA 2 — Combate     ação do personagem
  ↓ intercept (Defender os Fracos, Patrulheiro Líder, Parede Restrição,
              Voss Protetor Instintivo, Roupa Azul) via gatilho aliado_atacado

ETAPA 3 — Resolução de Dano
  ↓ modificadores de poder (Amaciado → +100% Corte, Análise Tech → especialidade
                            universal, Hearts Adv → ATQ/DEF ×2, Espadas vs Copas ×2)
  ↓ defesa (J Valete esquiva, Derreter Armadura bloqueia carta, Escudo absorve)
  ↓ aplicação de tag → EFEITOS.aplicar(tag) (Exposto, Queimadura, Resfriamento, etc.)
  ↓ ao_causar_dano (efeito intrínseco do atacante + passivas: Veneno-reação, Fúria Polar)
  ↓ ao_sofrer_dano (passivas do alvo: Sou Invencível recalc, Espírito de Combate)

ETAPA 4 — Ação Rápida / Rodada Extra
  ↓ se ★ ou skill rápida: volta pra Etapa 1 (NÃO Início — DoT não tica de novo)

ETAPA 5 — Fim de Turno
  ↓ efeitos com gatilho fim_rodada (regen Roupa Verde, etc.)
  ↓ avança pro próximo combatente
```

**Por que essa separação Início vs Etapa 1?** Rodada extra e Ação Rápida re-rodam a Etapa 1 mas não o Início. Assim:
- ✅ Passivas re-disparam (você ganha nova carga do Sam, nova chance de revivir do Xamã)
- ✅ Stun re-rola (você pode escapar do Congelado dessa vez)
- ❌ DoT não tica de novo (você não toma 20 de Queimadura por usar ★)
- ❌ Cooldown não conta de novo

---

## Como o linker funciona — `tags` na habilidade

Uma habilidade declara em `tags` os efeitos nomeados que aplica. Exemplo:

```js
cop_h2_1: {
  nome: 'Avanço Escudo', ...
  tags: ['exposto'],
  descricao: 'Aplica Exposto.',
}
```

Quando o jogador usa Avanço Escudo, `resolverAcao` (em `combat.js`) executa a sequência normal: dano, gatilhos. **Se o dano realmente landed** (`causouDano: true`), o linker percorre `hab.tags` e chama `EFEITOS.aplicar(tag, alvo, atacante)` para cada uma. O efeito empilha a entrada em `alvo.efeitos`.

**Por que só com dano landed?** Per `game-design/02` §3.3: efeitos que dependem de "causou dano" como gatilho só disparam se houver dano real após a defesa. Habilidades de efeito puro (sem dano) podem aplicar via outros caminhos.

---

## Schema de um efeito

```js
EFEITOS.registrar('exposto', {
  categoria: 'debuff_stat',
  descricao: 'DEF base do alvo reduzida em 50% por 2 turnos.',
  aplicar(alvo, atacante, opts) {
    // Push entradas em alvo.efeitos com tipo/valor/duracao certos.
    // Renovar duração se já existe.
  },
});
```

A função `aplicar` empilha entradas em `alvo.efeitos` no formato que os outros módulos esperam:

- `{tipo:'dot', valor:N, gatilho:'inicio_rodada', duracao:T}` — DoT (lido por `_aplicarDoT`)
- `{tipo:'debuff_def', valor:N, duracao:T}` — reduz DEF (lido por `recalcularStats`)
- `{tipo:'buff_atq', valor:N, duracao:T}` — aumenta ATQ (idem)
- `{tipo:'frozen' | 'stun', duracao:T}` — 50% de perder turno (lido por `rodarEtapa1`)
- `{tipo:'amaciado' | <marca>, duracao:T}` — marca lida por código específico

Para o "renovar se já existe", usar o campo `_origem` como chave. Mesmo `_origem` = mesma instância renovada.

---

## Como adicionar um efeito novo

1. Identifique o gatilho no ciclo — pelo mapa acima
2. Em `engine/efeitos.js`, chame `EFEITOS.registrar('nome', { aplicar(alvo) { ... } })`
3. Use os tipos canônicos (`dot`, `debuff_atq`, etc.) que os módulos existentes já leem — sem precisar tocar em `combat.js` na maioria dos casos
4. Para um efeito com lógica única (ex: Amaciado que dobra poder de Corte): adicione o check no slot certo (no caso, em `resolverAcao` perto do cálculo de poder)
5. Habilidades que aplicam esse efeito ganham `tags: ['nome']`

---

## O que está implementado (A.1)

| Efeito | Categoria | Aplicado por |
|---|---|---|
| Amaciado | marca | Golpe Pesado |
| Exposto | debuff stat (DEF -50%) | Avanço Escudo |
| Queimadura | DoT + debuff DEF | Corte Flamejante |
| Resfriamento | DoT + debuff ATQ | Pancada Glacial |

**Próximas sub-fases:**
- A.2 — outros efeitos nomeados (Sangramento, Veneno, Radiação, Atordoado, Congelado, Lento, Marcado, Encantado, Escudo, Imagem Espelhada, Fortalecido, etc.)
- A.3 — passivas dos monstros (7 ids referenciados em `monstros.js`)
- A.4 — passivas de personagens dos outros naipes (♣ Paus, ♦ Ouro, ♠ Espadas + neutros)

---

*Próximo: A.2 — preencher o registry de efeitos nomeados com os ~16 que faltam do catálogo antigo.*
