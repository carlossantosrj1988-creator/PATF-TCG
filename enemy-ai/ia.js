// enemy-ai/ia.js
// Runtime da IA dos inimigos — Layer 2 do design.
// A IA entende as regras universais (Layer 1, herda do motor), mas as
// DECISÕES dela são scripts registrados aqui, um por inimigo.
//
// Quando o motor chama IA.executar(combatente), o dispatcher:
//   1. Acha o script registrado para o id daquele inimigo (ou o default)
//   2. Roda o script, que retorna { hab, cartaIdx, alvos } ou null
//   3. Se retornou decisão, chama COMBAT.resolverAcao
//   4. Se retornou null (sem ação possível), passa a rodada
//
// Cada script recebe (combatente, estado, helpers) e devolve a decisão.
// Helpers expostos ao final do arquivo cobrem as decisões mais comuns
// (alvo aleatório, alvo mais fraco, carta de valor médio, etc.).

const IA = (() => {

  const _registry = new Map();  // monstroId → fn(combatente, estado, helpers)

  // ══════════════════════════════════════════════════════════════════════════
  // API
  // ══════════════════════════════════════════════════════════════════════════

  function registrar(id, fn) {
    _registry.set(id, fn);
  }

  // Executa o turno do inimigo. Lê o script, decide, age (ou passa).
  function executar(combatente) {
    if (!combatente || combatente.hp <= 0) {
      COMBAT.passarRodada(combatente);
      return;
    }

    // Extrai o id base (remove prefixo 'inimigo_' e sufixo _a/_b/_c)
    const idCompleto = (combatente.id || '').replace(/^inimigo_/, '');
    const idBase     = idCompleto.replace(/_[abcαβγ]$/, '');

    const script = _registry.get(idCompleto) || _registry.get(idBase) || _scriptDefault;
    const decisao = script(combatente, COMBAT.estado, helpers);

    if (decisao && decisao.hab) {
      COMBAT.resolverAcao(combatente, decisao.hab, decisao.cartaIdx ?? -1, decisao.alvos || []);
    } else {
      COMBAT.passarRodada(combatente);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS — usados pelos scripts e pelo default
  // ══════════════════════════════════════════════════════════════════════════

  const helpers = {

    // Retorna combatentes vivos do mesmo lado, exceto o próprio.
    aliados(c) {
      return COMBAT.estado.combatentes.filter(x => x.lado === c.lado && x !== c && x.hp > 0);
    },

    // Retorna combatentes vivos do lado oposto.
    inimigos(c) {
      return COMBAT.estado.combatentes.filter(x => x.lado !== c.lado && x.hp > 0);
    },

    // Um inimigo vivo, sorteado.
    inimigoAleatorio(c) {
      const ins = helpers.inimigos(c);
      return ins.length > 0 ? ins[Math.floor(Math.random() * ins.length)] : null;
    },

    // Inimigo com menos HP atual (foco em finalizar).
    inimigoMaisFraco(c) {
      const ins = helpers.inimigos(c);
      return ins.length > 0 ? ins.reduce((a, b) => a.hp < b.hp ? a : b) : null;
    },

    // Inimigo com mais HP (foco em sustain damage).
    inimigoMaisForte(c) {
      const ins = helpers.inimigos(c);
      return ins.length > 0 ? ins.reduce((a, b) => a.hp > b.hp ? a : b) : null;
    },

    // Primeira habilidade fora de cooldown e com slot ocupado.
    habilidadeDisponivel(c) {
      return (c.habilidades || []).find(h => h && (c.cooldowns[h._id] ?? 0) === 0);
    },

    // Índice de carta aleatória da mão. Null se mão vazia.
    cartaAleatoria(c) {
      const mao = c.mao || [];
      if (mao.length === 0) return null;
      return Math.floor(Math.random() * mao.length);
    },

    // Índice da carta de valor mediano da mão.
    cartaValorMedio(c) {
      const mao = c.mao || [];
      if (mao.length === 0) return null;
      const sorted = mao
        .map((carta, i) => ({ i, v: DECK.valorDano(carta) }))
        .sort((a, b) => a.v - b.v);
      return sorted[Math.floor(sorted.length / 2)].i;
    },

    // Índice da carta de maior valor — pra finalizar.
    cartaMaisAlta(c) {
      const mao = c.mao || [];
      if (mao.length === 0) return null;
      let melhor = 0, melhorV = -1;
      mao.forEach((carta, i) => {
        const v = DECK.valorDano(carta);
        if (v > melhorV) { melhor = i; melhorV = v; }
      });
      return melhor;
    },
  };

  // ══════════════════════════════════════════════════════════════════════════
  // SCRIPT DEFAULT — usado quando o inimigo não tem script próprio
  // ══════════════════════════════════════════════════════════════════════════
  //
  // Comportamento mínimo, mas funcional:
  //   - pega primeira habilidade disponível (fora de cooldown)
  //   - escolhe carta de valor médio da mão
  //   - mira conforme o alvo da habilidade (inimigo aleatório no caso 'unico')
  //
  // Garante que todo inimigo é jogável básico desde os dados — refinamento
  // por inimigo entra via IA.registrar(id, fn).

  function _scriptDefault(c) {
    const hab = helpers.habilidadeDisponivel(c);
    if (!hab) return null;

    const cartaIdx = helpers.cartaValorMedio(c);
    if (cartaIdx === null) return null;

    let alvos;
    switch (hab.alvo) {
      case 'unico': {
        const alvo = helpers.inimigoAleatorio(c);
        if (!alvo) return null;
        alvos = [alvo];
        break;
      }
      case 'inimigos':
        alvos = helpers.inimigos(c);
        break;
      case 'self':
        alvos = [c];
        break;
      case 'aliados':
        alvos = helpers.aliados(c).concat(c);  // inclui o próprio nos aliados
        break;
      case 'todos':
        alvos = COMBAT.estado.combatentes.filter(x => x.hp > 0);
        break;
      default:
        alvos = helpers.inimigos(c);
    }
    if (!alvos || alvos.length === 0) return null;

    return { hab, cartaIdx, alvos };
  }

  return { registrar, executar, helpers };

})();
