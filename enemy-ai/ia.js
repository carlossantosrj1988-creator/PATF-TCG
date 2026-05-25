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

  // Decide o que o inimigo vai fazer. Retorna { hab, cartaIdx, alvos } ou null.
  // Não EXECUTA — a execução é orquestrada por quem chama (battle.js),
  // porque pode precisar pausar para a tela de defesa antes de resolver.
  function decidir(combatente) {
    if (!combatente || combatente.hp <= 0) return null;

    // Extrai o id base (remove prefixo 'inimigo_' e sufixo α/β/γ)
    const idCompleto = (combatente.id || '').replace(/^inimigo_/, '');
    const idBase     = idCompleto.replace(/_[abcαβγ]$/, '');

    const script = _registry.get(idCompleto) || _registry.get(idBase) || _scriptDefault;
    return script(combatente, COMBAT.estado, helpers);
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

  // ══════════════════════════════════════════════════════════════════════════
  // SCRIPTS DO TUTORIAL
  // ══════════════════════════════════════════════════════════════════════════

  // Carta numérica pela ordem (asc = mais baixa, desc = mais alta).
  function _cartaNumerica(mao, ordem) {
    const lista = (mao || [])
      .map((carta, i) => ({ i, v: DECK.valorDano(carta), carta }))
      .filter(x => x.carta.tipo === 'numerica')
      .sort((a, b) => ordem === 'desc' ? b.v - a.v : a.v - b.v);
    return lista.length > 0 ? lista[0].i : null;
  }

  // goblin_fanatico — alvo aleatório, carta numérica mais baixa; passa se não tiver
  registrar('goblin_fanatico', (c, estado, h) => {
    const alvo = h.inimigoAleatorio(c);
    if (!alvo) return null;
    const hab = h.habilidadeDisponivel(c);
    if (!hab) return null;
    const cartaIdx = _cartaNumerica(c.mao, 'asc');
    if (cartaIdx === null) return null;
    return { hab, cartaIdx, alvos: [alvo] };
  });

  // Coordenação dos lobos: segundo lobo repete o alvo do primeiro
  let _loboUltimoAlvo = null;

  // lobo_matilha — carta numérica aleatória; lobos se coordenam no alvo
  registrar('lobo_matilha', (c, estado, h) => {
    const hab = h.habilidadeDisponivel(c);
    if (!hab) return null;
    const normais = (c.mao || [])
      .map((carta, i) => ({ i, carta }))
      .filter(x => x.carta.tipo === 'numerica');
    if (normais.length === 0) return null;
    let alvo;
    if (_loboUltimoAlvo && _loboUltimoAlvo.hp > 0) {
      alvo = _loboUltimoAlvo;
      _loboUltimoAlvo = null;
    } else {
      alvo = h.inimigoAleatorio(c);
      _loboUltimoAlvo = alvo;
    }
    if (!alvo) return null;
    const cartaIdx = normais[Math.floor(Math.random() * normais.length)].i;
    return { hab, cartaIdx, alvos: [alvo] };
  });

  // casulo_butter — sem habilidade; passiva esporos_casulo reage ao dano
  registrar('casulo_butter', () => null);

  // butter_venenoso — ciclo: sono (0) → veneno (1) → passa (2)
  registrar('butter_venenoso', (c, estado, h) => {
    const ciclo = (c._butterCiclo ?? 0) % 3;
    c._butterCiclo = (c._butterCiclo ?? 0) + 1;
    if (ciclo === 2) return null;
    const habId = ciclo === 0 ? 'enemy:butter_sono' : 'enemy:butter_veneno';
    const hab = (c.habilidades || []).find(x => x && x._id === habId);
    if (!hab) return null;
    const cartaIdx = h.cartaAleatoria(c);
    if (cartaIdx === null) return null;
    const alvos = estado.combatentes.filter(x => x.lado !== c.lado && x.hp > 0);
    return alvos.length > 0 ? { hab, cartaIdx, alvos } : null;
  });

  // prisoner_demon — ciclo: pancada (0) → pancada (1) → salto (2)
  // Pancada: 50% de usar Rei; salto: carta mais alta disponível
  registrar('prisoner_demon', (c, estado, h) => {
    const ciclo = (c._demonCiclo ?? 0) % 3;
    c._demonCiclo = (c._demonCiclo ?? 0) + 1;
    const habPancada = (c.habilidades || []).find(x => x && x._id === 'enemy:demon_pancada');
    const habSalto   = (c.habilidades || []).find(x => x && x._id === 'enemy:demon_salto');
    if (ciclo < 2) {
      const alvo = h.inimigoAleatorio(c);
      if (!alvo || !habPancada) return null;
      const reiIdx = (c.mao || []).findIndex(carta => carta.valor === 'K');
      let cartaIdx;
      if (reiIdx >= 0 && Math.random() < 0.5) {
        cartaIdx = reiIdx;
      } else {
        cartaIdx = _cartaNumerica(c.mao, 'asc') ?? h.cartaValorMedio(c);
      }
      if (cartaIdx === null) return null;
      return { hab: habPancada, cartaIdx, alvos: [alvo] };
    } else {
      const alvos = estado.combatentes.filter(x => x.lado !== c.lado && x.hp > 0);
      if (!alvos.length || !habSalto) return null;
      const cartaIdx = _cartaNumerica(c.mao, 'desc') ?? h.cartaMaisAlta(c);
      if (cartaIdx === null) return null;
      return { hab: habSalto, cartaIdx, alvos };
    }
  });

  return { registrar, decidir, helpers };

})();
