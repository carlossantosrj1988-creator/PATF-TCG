# PATF TCG — IA dos Inimigos (Layer 2)

*Documento de design — definido na sessão 013*

Define como a IA dos inimigos decide o que fazer no combate. Os dados dos inimigos vivem em `enemy-ai/monstros.js`; o runtime que toma as decisões vive em `enemy-ai/ia.js`.

---

## Princípio

A IA do PATF TCG opera em dois níveis:

**Layer 1 — Conhecimento universal (herda do motor)**
A IA conhece as regras do jogo: cálculo de dano, iniciativa, naipes, valor das cartas, ciclo de rodada, cooldowns. Não precisa ser ensinada — sabe porque o motor sabe.

**Layer 2 — Comportamento próprio (scriptado)**
*Como* a IA decide é definido pelo designer. Cada inimigo (ou grupo de inimigos com a mesma base) tem um script que recebe o estado do combate e devolve uma decisão: qual habilidade usar, qual carta gastar, em quem mirar.

> **Resumo:** a IA entende as regras, mas segue o que a gente manda dentro delas.

---

## Arquitetura

| Arquivo | O que faz |
|---|---|
| `enemy-ai/monstros.js` | Dados de todos os inimigos PvE (mob, miniboss, boss) — nome, naipe, stats, skills, passivas |
| `enemy-ai/ia.js` | Runtime: registry de scripts por id de inimigo, script default, dispatcher (`IA.executar`), helpers |

O motor (`combat.js`/`battle.js`) chama `IA.executar(combatente)` no turno do inimigo. O dispatcher:

1. Lê o id do inimigo (e tenta o id base sem sufixo α/β/γ)
2. Acha o script registrado, ou cai no **script default**
3. Roda o script — recebe `(combatente, estado, helpers)`, retorna `{ hab, cartaIdx, alvos }` ou `null`
4. Se decidiu agir: chama `COMBAT.resolverAcao` (mesmo motor de uso de habilidade do jogador)
5. Se retornou null: passa a rodada

---

## Como registrar um script

```js
// Exemplo — Vespa foca no mais fraco
IA.registrar('vespa', (combatente, estado, h) => {
  const alvo = h.inimigoMaisFraco(combatente);
  if (!alvo) return null;
  return {
    hab:      combatente.habilidades[0],  // Ferroada Venenosa
    cartaIdx: h.cartaValorMedio(combatente),
    alvos:    [alvo],
  };
});
```

A variante `vespa_a`, `vespa_b`, `vespa_c` compartilha o script base `'vespa'` (o dispatcher tira o sufixo α/β/γ antes de procurar).

---

## Script default

Quando um inimigo não tem script próprio registrado, ele usa o default:

- Pega a **primeira habilidade disponível** (fora de cooldown)
- Escolhe a **carta de valor médio** da mão
- Mira conforme o alvo da habilidade — em alvo único, sorteia um inimigo vivo

Não é inteligente, mas é **funcional**: qualquer inimigo recém-adicionado já é jogável básico sem trabalho de design imediato. O script personalizado entra quando o designer quer dar caráter próprio.

---

## Helpers expostos

| Helper | O que retorna |
|---|---|
| `aliados(c)` | combatentes do mesmo lado vivos (exceto o próprio) |
| `inimigos(c)` | combatentes do lado oposto vivos |
| `inimigoAleatorio(c)` | um inimigo vivo, sorteado |
| `inimigoMaisFraco(c)` | inimigo com menos HP atual |
| `inimigoMaisForte(c)` | inimigo com mais HP atual |
| `habilidadeDisponivel(c)` | primeira habilidade fora de cooldown |
| `cartaAleatoria(c)` | índice de carta aleatória da mão |
| `cartaValorMedio(c)` | índice da carta de valor mediano |
| `cartaMaisAlta(c)` | índice da carta de maior valor |

A lista cresce conforme os scripts pedirem.

---

## O que ainda não está implementado

- **Comportamentos especiais de boss** (spawn de crias, mudança de fase, fala) — dados estão em `monstros.js`, lógica fica para quando o sistema de eventos suportar
- **Decisão sob pressão** (escolher carta de defesa quando atacado) — depende da Fase D (tela de defesa)
- **Passivas dos inimigos** (`veneno_reacao`, `furia_polar`, etc.) — referenciadas em `monstros.js`, registradas em `engine/passivas.js` quando a Layer 2 de cada uma for definida

---

*Próximo passo: registrar scripts personalizados para os inimigos mais característicos (boss, miniboss, mobs de identidade forte como Vespa-veneno e Elfo-hemorragia).*
