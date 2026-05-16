// engine/combat.js
// Estado da batalha, iniciativa e ciclo de rodada.
// Depende de: engine/deck.js (DECK), engine/damage.js (DAMAGE)
//
// Seções:
//   ESTADO DA BATALHA  — BATTLE_STATE e estrutura de combatente
//   INICIATIVA         — cálculo e ordenação
//   TURNO              — compra de carta, reset de flags por turno
//   RODADA             — as 5 etapas do ciclo de rodada
//   EFEITOS            — DoT, buffs/debuffs (contagem e aplicação)
//   API PÚBLICA        — o que é exposto

const COMBAT = (() => {

  // ══════════════════════════════════════════════════════════════════════════
  // ESTADO DA BATALHA
  // ══════════════════════════════════════════════════════════════════════════

  // Estrutura de referência de um combatente dentro do BATTLE_STATE.
  // Criado por criarCombatente() a partir de um personagem de PLAYER_STATE
  // ou de um template de inimigo.
  //
  // {
  //   id:             string único dentro da batalha
  //   nome:           string
  //   lado:           'jogador' | 'inimigo'
  //   naipe:          '♥'|'♣'|'♦'|'♠'|null
  //   atq:            number
  //   def:            number
  //   inc:            number
  //   pvs:            number  (valor máximo)
  //   hp:             number  (valor atual)
  //   habilidades:    []      (slots de habilidade — formato da tela de Status)
  //   passivas:       []      (slots de passiva)
  //   cooldowns:      {}      (habilidadeId → rodadas restantes)
  //   efeitos:        []      (efeitos ativos — ver estrutura abaixo)
  //   baralho:        []      (cartas não compradas)
  //   mao:            []      (cartas na mão)
  //   descarte:       []
  //   cartaIniciativa: null   (carta alocada na fase de iniciativa)
  //   acaoExtra:      false   (usou ação rápida/rodada extra neste turno?)
  //   perdeuRodada:   false   (efeito que impede de agir)
  // }
  //
  // Estrutura de um efeito ativo:
  // { id, tipo, valor, duracao, gatilho }
  //   tipo:    'dot'|'buff_atq'|'buff_def'|'debuff_atq'|'debuff_def'|'perda_rodada'|...
  //   valor:   número (dano de DoT, bônus de buff, etc.)
  //   duracao: número de rodadas restantes
  //   gatilho: 'inicio_rodada'|'fim_rodada' (quando aplica)

  let BATTLE_STATE = null;

  function estadoVazio() {
    return {
      turno:             0,
      fase:              null,
      ordem:             [],
      indiceAtual:       -1,
      combatentes:       [],
      log:               [],
      // Deck compartilhado do time jogador (todos os personagens compartilham)
      baralhoJogador:        [],
      maoJogador:            [],
      descarteJogador:       [],
      baralhoJogadorEsgotado: false,  // baralho do time acabou — condição de derrota
    };
  }

  function criarCombatente(origem, lado, idExtra = '') {
    const baralho = lado === 'inimigo' ? DECK.embaralhar(DECK.criarBaralho()) : [];
    const c = {
      id:              `${lado}_${origem.id ?? idExtra}`,
      nome:            origem.nome ?? origem.label ?? '???',
      lado,
      tipo:            origem.tipo ?? null,  // 'mob' | 'miniboss' | 'boss' | null (jogador)
      naipe:           origem.naipeAtivo ?? origem.naipe ?? null,
      // Stats base imutáveis + ativos (modificáveis por passivas/buffs).
      atqBase:         origem.atq,
      defBase:         origem.def,
      incBase:         origem.inc,
      atq:             origem.atq,
      def:             origem.def,
      inc:             origem.inc,
      pvs:             origem.pvs,
      hp:              origem.hpAtual ?? origem.pvs,
      // Slots resolvidos. Aceita string id (lookup HABILIDADES) ou objeto
      // já resolvido (vindo de MONSTROS.get pra inimigos).
      habilidades:     origem.habilidades
        ? origem.habilidades.map(s => {
            if (!s) return null;
            if (typeof s === 'string') {
              const d = HABILIDADES.resolverHabilidade(s);
              return d ? { ...d, _id: s } : null;
            }
            return { ...s };  // pré-resolvido, _id já setado
          })
        : [],
      passivas:        origem.passivas    ? [...origem.passivas]    : [],
      cooldowns:       {},
      efeitos:         [],
      baralho,
      mao:             [],
      descarte:        [],
      cartaIniciativa: null,
      acaoExtra:       false,
      perdeuRodada:    false,
    };
    PASSIVAS.recalcularStats(c);
    return c;
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  // personagens: array de 3 objetos de PLAYER_STATE
  // inimigos:    array de 1-3 objetos de template de inimigo
  function init(personagens, inimigos) {
    BATTLE_STATE = estadoVazio();

    for (const p of personagens) {
      BATTLE_STATE.combatentes.push(criarCombatente(p, 'jogador'));
    }
    for (let i = 0; i < inimigos.length; i++) {
      BATTLE_STATE.combatentes.push(criarCombatente(inimigos[i], 'inimigo', i));
    }

    // Baralho compartilhado do time jogador
    BATTLE_STATE.baralhoJogador = DECK.embaralhar(DECK.criarBaralho());

    BATTLE_STATE.fase = 'pre_combate';
    return BATTLE_STATE;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INICIATIVA
  // ══════════════════════════════════════════════════════════════════════════

  // cartasAlocadas: Map<combatente.id, carta>
  // Atribui cartaIniciativa a cada combatente e ordena BATTLE_STATE.ordem.
  function calcularIniciativa(cartasAlocadas) {
    for (const c of BATTLE_STATE.combatentes) {
      c.cartaIniciativa = cartasAlocadas.get(c.id) ?? null;
    }

    BATTLE_STATE.ordem = [...BATTLE_STATE.combatentes].sort((a, b) => {
      const ia = _valorIni(a);
      const ib = _valorIni(b);
      if (ia !== ib) return ib - ia;                              // maior vai primeiro

      const ca = a.cartaIniciativa ? DECK.valorIniciativa(a.cartaIniciativa) : 0;
      const cb = b.cartaIniciativa ? DECK.valorIniciativa(b.cartaIniciativa) : 0;
      if (ca !== cb) return cb - ca;                              // 1º desempate: carta

      if (a.inc !== b.inc) return b.inc - a.inc;                 // 2º desempate: INC

      return Math.random() < 0.5 ? -1 : 1;                      // 3º desempate: sorteio
    });

    BATTLE_STATE.indiceAtual = 0;
    BATTLE_STATE.fase = 'combate';
    _log('iniciativa', 'Ordem definida', { ordem: BATTLE_STATE.ordem.map(c => c.nome) });
  }

  function _valorIni(combatente) {
    if (!combatente.cartaIniciativa) return combatente.inc;
    return DECK.valorIniciativa(combatente.cartaIniciativa) + combatente.inc;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TURNO
  // ══════════════════════════════════════════════════════════════════════════

  // Chamado quando todos os combatentes da ordem agiram uma vez.
  function avancarTurno() {
    BATTLE_STATE.turno += 1;

    // Remove mortos da fila (iniciativa permanece a mesma, apenas filtra)
    BATTLE_STATE.ordem = BATTLE_STATE.ordem.filter(c => c.hp > 0);
    BATTLE_STATE.indiceAtual = 0;

    let jogadoresVivos = 0;
    for (const c of BATTLE_STATE.combatentes) {
      if (_estaVivo(c)) {
        if (c.lado === 'inimigo') _comprarCarta(c, 1);
        else jogadoresVivos++;
      }
      c.acaoExtra    = false;
      c.perdeuRodada = false;
    }
    // Compra 1 carta por jogador vivo para a mão compartilhada
    if (jogadoresVivos > 0) _comprarCarta({ lado: 'jogador' }, jogadoresVivos);

    _log('turno', `Turno ${BATTLE_STATE.turno} iniciado`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RODADA (ciclo de 5 etapas)
  // ══════════════════════════════════════════════════════════════════════════

  // Combatente atual na ordem de iniciativa.
  function combatenteAtual() {
    return BATTLE_STATE.ordem[BATTLE_STATE.indiceAtual] ?? null;
  }

  // Etapa 0 (Início da rodada) — roda antes das 5 etapas.
  // Deduz cooldowns/buffs/debuffs em 1, recalcula stats (refletindo
  // buffs que expiraram) e aplica DoT.
  function iniciarRodada(combatente) {
    _deduzirEfeitos(combatente);
    PASSIVAS.recalcularStats(combatente);
    _aplicarDoT(combatente);
  }

  // Etapa 1 — Verificações pré-ação.
  // Retorna { podeAgir: bool }.
  function etapa1_verificacoes(combatente) {
    combatente.perdeuRodada = combatente.efeitos.some(e => e.tipo === 'perda_rodada' && e.duracao > 0);
    return { podeAgir: !combatente.perdeuRodada };
  }

  // Etapa 2 — Passa a rodada (alternativa ao combate).
  // Compra 1 carta. Efeitos de "passar a rodada" resolvem na Etapa 5.
  function passarRodada(combatente) {
    _comprarCarta(combatente, 1);
    PASSIVAS.disparar('ao_passar_rodada', combatente);
    _log('acao', `${combatente.nome} passou a rodada e comprou 1 carta`);
  }

  // Etapa 3 — Resolução de dano.
  // atacante/alvo: combatentes; poder: number; carta: objeto; ehEfeitoPuro: bool
  // defesaCarta: carta usada na defesa (null = DEF base)
  // Retorna { danoReal, efeitosSatisfeitos }
  function etapa3_resolucaoDano(atacante, alvo, poder, cartaAtaque, ehEfeitoPuro, defesaCarta) {
    const dano   = DAMAGE.calcularDano(atacante, alvo, poder, cartaAtaque, ehEfeitoPuro);
    const defesa = DAMAGE.calcularDefesa(alvo, defesaCarta);
    const danoReal = DAMAGE.resolverDano(dano, defesa);

    if (danoReal > 0) {
      alvo.hp = Math.max(0, alvo.hp - danoReal);
      PASSIVAS.recalcularStats(alvo);   // passivas baseadas em HP reavaliam
      _log('dano', `${atacante.nome} causou ${danoReal} de dano em ${alvo.nome}`, { dano, defesa, danoReal });
    }

    return {
      danoReal,
      causouDano: danoReal > 0,  // gatilho para efeitos condicionais
    };
  }

  // ── Resolver ação (uso de habilidade) ──────────────────────────────────────
  // Orquestra um uso de habilidade end-to-end:
  //   1. Consome a carta da mão (jogador → maoJogador, inimigo → mao do c)
  //   2. Dispara efeito 'ao_usar' da habilidade
  //   3. Para cada alvo:
  //      a. Dispara 'aliado_atacado' nos aliados do alvo (pode redirecionar
  //         o defensor — ex: Defender os Fracos)
  //      b. Modifica poder via 'modificar_poder' (ex: Espírito do Urso Polar)
  //      c. Resolve dano via etapa3_resolucaoDano (com defesaCarta se houver)
  //      d. Se sofreu dano com 'odio_bonus' ativo, acumula +4 (Ódio)
  //      e. Dispara 'ao_causar_dano' (efeito intrínseco + passiva) e
  //         'ao_sofrer_dano' (passiva no alvo)
  // Não avança turno — quem chama (battle.js) faz etapa5 + avancarCombatente.
  //
  // defesasPorAlvo: { [alvo.id]: cartaIdx } — opcional. Quando presente,
  // consome a carta de defesa da mão do alvo e usa no cálculo de defesa.
  function resolverAcao(atacante, hab, cartaIdx, alvos, defesasPorAlvo = null) {
    if (!atacante || !hab || !Array.isArray(alvos) || alvos.length === 0) return null;

    // 1. Consome carta
    let carta;
    if (atacante.lado === 'jogador') {
      carta = BATTLE_STATE.maoJogador.splice(cartaIdx, 1)[0];
      if (carta) BATTLE_STATE.descarteJogador.push(carta);
    } else {
      carta = atacante.mao.splice(cartaIdx, 1)[0];
      if (carta) atacante.descarte.push(carta);
    }
    if (!carta) return null;

    // Aplica recarga (cd +1: a habilidade salta o turno atual e espera N rodadas)
    if (hab.recarga > 0 && hab._id) {
      atacante.cooldowns[hab._id] = hab.recarga + 1;
    }

    // 2. Efeito 'ao_usar' (ex: Ódio marca odio_bonus)
    EFEITOS_HABILIDADES.disparar(hab, 'ao_usar', atacante, { alvos, carta });

    // 3. Poder efetivo — gasta bônus acumulados (ex: Ódio, Rei)
    let poderEfetivo = hab.poder ?? 0;
    if (!hab.efeitoPuro) {
      const odio = atacante.efeitos.find(e => e.tipo === 'odio_bonus' && e.duracao > 0);
      if (odio && odio.valor > 0) {
        poderEfetivo += odio.valor;
        odio.valor = 0;
      }
      const rei = atacante.efeitos.find(e => e.tipo === 'rei_atq_bonus' && e.duracao > 0);
      if (rei) {
        poderEfetivo += rei.valor;
        rei.duracao = 0;          // consumido
      }
    }
    // Limpa efeitos expirados (rei_atq_bonus zerado, etc.)
    atacante.efeitos = atacante.efeitos.filter(e => !('duracao' in e) || e.duracao > 0);

    // 4. Resolve por alvo
    for (const alvo of alvos) {
      if (!alvo || alvo.hp <= 0) continue;

      // Defender os Fracos: aliados do alvo podem interceptar
      const evIntercept = {
        alvo: hab.alvo, acao: hab.acao,
        atacante, alvoOriginal: alvo, defensor: null,
      };
      for (const c of BATTLE_STATE.combatentes) {
        if (c.lado === alvo.lado && c !== alvo && _estaVivo(c)) {
          PASSIVAS.disparar('aliado_atacado', c, evIntercept);
        }
      }
      const alvoReal = evIntercept.defensor ?? alvo;

      // Modificador de poder por efeito da habilidade (ex: Urso Polar)
      const evPoder = { alvo: alvoReal, bonusPoder: 0 };
      EFEITOS_HABILIDADES.disparar(hab, 'modificar_poder', atacante, evPoder);
      const poderFinal = poderEfetivo + evPoder.bonusPoder;

      // Carta de defesa — vem do mapa, indexada pelo id do alvo ORIGINAL
      // (pré-intercepto). Mapa carrega o OBJETO da carta — splice por
      // referência evita bug de índices quando múltiplos alvos defendem.
      let defesaCarta = null;
      const defesaRef = defesasPorAlvo ? defesasPorAlvo[alvo.id] : null;
      if (defesaRef) {
        if (alvoReal.lado === 'jogador') {
          const idx = BATTLE_STATE.maoJogador.indexOf(defesaRef);
          if (idx >= 0) {
            defesaCarta = BATTLE_STATE.maoJogador.splice(idx, 1)[0];
            BATTLE_STATE.descarteJogador.push(defesaCarta);
          }
        } else {
          const idx = alvoReal.mao.indexOf(defesaRef);
          if (idx >= 0) {
            defesaCarta = alvoReal.mao.splice(idx, 1)[0];
            alvoReal.descarte.push(defesaCarta);
          }
        }
      }

      // Dano (com defesa, se houver carta)
      const resultado = etapa3_resolucaoDano(atacante, alvoReal, poderFinal, carta, hab.efeitoPuro, defesaCarta);

      // Acumula odio_bonus se o alvo estava em estado de Ódio ao sofrer dano
      if (resultado.causouDano) {
        const odioAlvo = alvoReal.efeitos.find(e => e.tipo === 'odio_bonus' && e.duracao > 0);
        if (odioAlvo) odioAlvo.valor += 4;
      }

      // Gatilhos: efeito intrínseco + passivas
      EFEITOS_HABILIDADES.disparar(hab, 'ao_causar_dano', atacante, { alvo: alvoReal, ...resultado });
      if (resultado.causouDano) {
        PASSIVAS.disparar('ao_causar_dano', atacante, { alvo: alvoReal, ...resultado });
        PASSIVAS.disparar('ao_sofrer_dano', alvoReal, { atacante, ...resultado });
      }
    }

    return { ok: true };
  }

  // Etapa 4 — Verifica se há ação extra (ação rápida ou rodada extra).
  // Retorna true se deve retornar para a Etapa 2.
  function etapa4_acaoExtra(combatente, temAcaoRapida, temRodadaExtra) {
    if (combatente.acaoExtra) return false;  // já usou neste turno
    if (temAcaoRapida || temRodadaExtra) {
      combatente.acaoExtra = true;
      _log('acao_extra', `${combatente.nome} ganhou ação extra`);
      return true;
    }
    return false;
  }

  // Etapa 5 — Fim da rodada. Efeitos de fim de turno resolvem aqui.
  function etapa5_fimRodada(combatente) {
    for (const efeito of combatente.efeitos) {
      if (efeito.gatilho === 'fim_rodada') {
        _aplicarEfeito(combatente, efeito);
      }
    }
    _log('fim_rodada', `Rodada de ${combatente.nome} encerrada`);
  }

  // Avança para o próximo combatente na ordem.
  // Retorna true se o turno fechou (todos agiram).
  function avancarCombatente() {
    BATTLE_STATE.indiceAtual += 1;
    if (BATTLE_STATE.indiceAtual >= BATTLE_STATE.ordem.length) {
      avancarTurno();
      return true; // turno fechou
    }
    return false;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EFEITOS
  // ══════════════════════════════════════════════════════════════════════════

  function _deduzirEfeitos(combatente) {
    for (const e of combatente.efeitos) {
      if (e.duracao > 0) e.duracao -= 1;
    }
    // Limpa efeitos expirados
    combatente.efeitos = combatente.efeitos.filter(e => e.duracao > 0);

    // Deduz cooldowns
    for (const hid in combatente.cooldowns) {
      if (combatente.cooldowns[hid] > 0) combatente.cooldowns[hid] -= 1;
    }
  }

  function _aplicarDoT(combatente) {
    let tickou = false;
    for (const e of combatente.efeitos) {
      if (e.tipo === 'dot' && e.gatilho === 'inicio_rodada') {
        combatente.hp = Math.max(0, combatente.hp - e.valor);
        tickou = true;
        _log('dot', `${combatente.nome} sofreu ${e.valor} de DoT`);
      }
    }
    if (tickou) PASSIVAS.recalcularStats(combatente);
  }

  function _aplicarEfeito(combatente, efeito) {
    // Ponto de extensão: cada tipo de efeito de fim de turno resolve aqui
    // quando as habilidades forem implementadas.
  }

  function adicionarEfeito(combatente, efeito) {
    combatente.efeitos.push({ ...efeito });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AUXILIARES
  // ══════════════════════════════════════════════════════════════════════════

  function _estaVivo(combatente) {
    return combatente.hp > 0;
  }

  // O baralho não recicla o descarte. Esgotá-lo é condição de fim de batalha:
  //   - time jogador sem cartas → derrota
  //   - inimigo sem cartas      → esse inimigo é derrotado na hora
  function _comprarCarta(combatente, n) {
    if (combatente.lado === 'jogador') {
      if (BATTLE_STATE.baralhoJogador.length < n) {
        BATTLE_STATE.baralhoJogadorEsgotado = true;
      }
      const { cartas, resto } = DECK.comprar(BATTLE_STATE.baralhoJogador, n);
      BATTLE_STATE.maoJogador     = BATTLE_STATE.maoJogador.concat(cartas);
      BATTLE_STATE.baralhoJogador = resto;
    } else {
      if (combatente.baralho.length < n) {
        combatente.hp = 0;
        _log('deck', `${combatente.nome} ficou sem cartas e foi derrotado`);
      }
      const { cartas, resto } = DECK.comprar(combatente.baralho, n);
      combatente.mao     = combatente.mao.concat(cartas);
      combatente.baralho = resto;
    }
  }

  // Wrapper público — usado por cartas especiais (ex: Ás compra 1 carta)
  function comprarCarta(combatente, n = 1) {
    _comprarCarta(combatente, n);
  }

  function _log(tipo, texto, dados = {}) {
    BATTLE_STATE.log.push({ tipo, texto, dados });
  }

  // Determina se a batalha terminou.
  //   'derrota'  — time todo morto OU baralho do time esgotado
  //   'vitoria'  — todos os inimigos derrotados (por morte ou por baralho esgotado)
  //   null       — batalha continua
  function verificarFimDeBatalha() {
    const jogadoresVivos = BATTLE_STATE.combatentes.filter(c => c.lado === 'jogador' && _estaVivo(c));
    const inimigosVivos  = BATTLE_STATE.combatentes.filter(c => c.lado === 'inimigo' && _estaVivo(c));
    if (jogadoresVivos.length === 0)        return 'derrota';
    if (BATTLE_STATE.baralhoJogadorEsgotado) return 'derrota';
    if (inimigosVivos.length  === 0)        return 'vitoria';
    return null;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // API PÚBLICA
  // ══════════════════════════════════════════════════════════════════════════

  return {
    // Setup
    init,
    get estado() { return BATTLE_STATE; },

    // Iniciativa
    calcularIniciativa,

    // Turno e rodada
    combatenteAtual,
    iniciarRodada,
    etapa1_verificacoes,
    passarRodada,
    etapa3_resolucaoDano,
    resolverAcao,
    etapa4_acaoExtra,
    etapa5_fimRodada,
    avancarCombatente,

    // Efeitos
    adicionarEfeito,
    verificarFimDeBatalha,

    // Helpers de mão (uso de cartas especiais)
    comprarCarta,
  };

})();
