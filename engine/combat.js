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
    return {
      id:              `${lado}_${origem.id ?? idExtra}`,
      nome:            origem.nome ?? origem.label ?? '???',
      lado,
      naipe:           origem.naipeAtivo ?? origem.naipe ?? null,
      atq:             origem.atq,
      def:             origem.def,
      inc:             origem.inc,
      pvs:             origem.pvs,
      hp:              origem.hpAtual ?? origem.pvs,
      habilidades:     origem.habilidades ? [...origem.habilidades] : [],
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
  // Deduz cooldowns/buffs/debuffs em 1 e aplica DoT.
  function iniciarRodada(combatente) {
    _deduzirEfeitos(combatente);
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
      _log('dano', `${atacante.nome} causou ${danoReal} de dano em ${alvo.nome}`, { dano, defesa, danoReal });
    }

    return {
      danoReal,
      causouDano: danoReal > 0,  // gatilho para efeitos condicionais
    };
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
    for (const e of combatente.efeitos) {
      if (e.tipo === 'dot' && e.gatilho === 'inicio_rodada') {
        combatente.hp = Math.max(0, combatente.hp - e.valor);
        _log('dot', `${combatente.nome} sofreu ${e.valor} de DoT`);
      }
    }
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
    etapa4_acaoExtra,
    etapa5_fimRodada,
    avancarCombatente,

    // Efeitos
    adicionarEfeito,
    verificarFimDeBatalha,
  };

})();
