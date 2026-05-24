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
      id:              `${lado}_${origem.id ?? 'unk'}${idExtra !== '' ? '_' + idExtra : ''}`,
      nome:            origem.nome ?? origem.label ?? '???',
      poolId:          origem.poolId ?? null,  // arquétipo de origem (para sincronizar HP)
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
    // Compra apenas 1 carta por turno para a mão compartilhada do time jogador.
    // Cartas extras vêm de: passar a rodada, Ás, ou outros efeitos específicos.
    if (jogadoresVivos > 0) _comprarCarta({ lado: 'jogador' }, 1);

    _log('turno', `Turno ${BATTLE_STATE.turno} iniciado`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RODADA (ciclo de 5 etapas)
  // ══════════════════════════════════════════════════════════════════════════

  // Combatente atual na ordem de iniciativa.
  function combatenteAtual() {
    return BATTLE_STATE.ordem[BATTLE_STATE.indiceAtual] ?? null;
  }

  // Início da Rodada — once-per-round. NÃO repete em rodada extra / ação rápida.
  // Deduz cooldowns + duração de buffs/debuffs (filtra expirados) e aplica DoT.
  // Idempotente: marca _turnoIniciado para evitar chamada dupla.
  function iniciarRodada(combatente) {
    if (!combatente || combatente._turnoIniciado) return;
    combatente._turnoIniciado = true;
    _deduzirEfeitos(combatente);
    _aplicarDoT(combatente);
  }

  // Etapa 1 — Verificações Pré-Ação. Re-roda em rodada extra / ação rápida.
  //   1.a tick passivas (gatilho 'tick_passivas') → recalcularStats
  //   1.b verificação de perda de rodada (Congelado, Atordoado — 50% chance)
  // Retorna { podeAgir, motivo? }.
  function rodarEtapa1(combatente) {
    if (!combatente) return { podeAgir: false };
    PASSIVAS.disparar('tick_passivas', combatente);
    PASSIVAS.recalcularStats(combatente);
    const stunned = combatente.efeitos.find(e =>
      (e.tipo === 'frozen' || e.tipo === 'stun') && e.duracao > 0
    );
    if (stunned && Math.random() < 0.5) {
      return { podeAgir: false, motivo: stunned.tipo };
    }
    return { podeAgir: true };
  }

  // Etapa 1 (legado) — Verificações pré-ação básicas (perda de rodada por efeito).
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
    for (const hab of (combatente.habilidades ?? [])) {
      if (hab && hab._id) EFEITOS_HABILIDADES.disparar(hab, 'ao_passar_rodada', combatente, {});
    }
    _log('acao', `${combatente.nome} passou a rodada e comprou 1 carta`);
  }

  // Etapa 3 — Resolução de dano.
  // atacante/alvo: combatentes; poder: number; carta: objeto; ehEfeitoPuro: bool
  // defesaCarta: carta usada na defesa (null = DEF base)
  // Retorna { danoReal, efeitosSatisfeitos }
  function etapa3_resolucaoDano(atacante, alvo, poder, cartaAtaque, ehEfeitoPuro, defesaCarta, ignoraArmadura = false, danoMult = 1) {
    const danoBruto = DAMAGE.calcularDano(atacante, alvo, poder, cartaAtaque, ehEfeitoPuro);
    const dano      = danoMult !== 1 ? Math.floor(danoBruto * danoMult) : danoBruto;
    const defesa    = ignoraArmadura ? 0 : DAMAGE.calcularDefesa(alvo, defesaCarta);
    const danoReal  = DAMAGE.resolverDano(dano, defesa);

    if (danoReal > 0) {
      alvo.hp = Math.max(0, alvo.hp - danoReal);
      PASSIVAS.recalcularStats(alvo);   // passivas baseadas em HP reavaliam
      _log('dano', `${atacante.nome} causou ${danoReal} de dano em ${alvo.nome}`, { dano, defesa, danoReal });

      // Nocauteado: dispara eventos nos aliados do nocauteado e no atacante
      if (alvo.hp <= 0) {
        for (const c of BATTLE_STATE.combatentes) {
          if (c.lado === alvo.lado && c !== alvo && _estaVivo(c)) {
            PASSIVAS.disparar('aliado_nocauteado', c, { nocauteado: alvo });
          }
        }
        if (atacante.lado !== alvo.lado) {
          PASSIVAS.disparar('ao_nocautear_inimigo', atacante, { nocauteado: alvo });
        }
      }
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
    let alvosEfetivos = alvos;

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
    const poderes = _parsePoder(poderEfetivo);

    // clubs_furtivo: skill Normal do Paus vira Furtiva enquanto o efeito estiver ativo
    const acaoEfetiva = (!hab.efeitoPuro && hab.acao === 'N'
      && atacante.efeitos.some(e => e.tipo === 'clubs_furtivo' && e.duracao > 0))
      ? 'F' : (hab.acao ?? 'N');

    // Encantado: 50% redireciona ataque único não-Furtivo para aliado do atacante
    if (hab.alvo === 'unico' && acaoEfetiva !== 'F') {
      const encEf = atacante.efeitos.find(e => e.tipo === 'encantado' && e.duracao > 0);
      if (encEf && Math.random() < 0.5) {
        const aliados = BATTLE_STATE.combatentes.filter(c =>
          c.lado === atacante.lado && c !== atacante && _estaVivo(c)
        );
        if (aliados.length > 0) {
          alvosEfetivos = [aliados[Math.floor(Math.random() * aliados.length)]];
          _log('efeito', `${atacante.nome} (Encantado) atacou aliado ${alvosEfetivos[0].nome}`);
        }
      }
    }

    // Estática: habilidade Elétrica → 5 dano puro em portadores de Estática
    if (_ehEletrico(hab.tipo)) {
      for (const c of BATTLE_STATE.combatentes) {
        if (c.efeitos.some(e => e.tipo === 'estatica' && e.duracao > 0)) {
          c.hp = Math.max(0, c.hp - 5);
          PASSIVAS.recalcularStats(c);
          _log('efeito', `${c.nome} sofreu 5 de dano de Estática`);
        }
      }
    }

    // 4. Resolve por alvo
    for (const alvo of alvosEfetivos) {
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

      // Imagem Espelhada: 50% de esquiva para ataque único não-Furtivo; consome o efeito
      if (hab.alvo === 'unico' && acaoEfetiva !== 'F') {
        const imagem = alvoReal.efeitos.find(e => e.tipo === 'imagem_espelhada');
        if (imagem && Math.random() < 0.5) {
          alvoReal.efeitos = alvoReal.efeitos.filter(e => e !== imagem);
          _log('efeito', `${alvoReal.nome} esquivou com Imagem Espelhada`);
          continue;
        }
      }

      // Modificador de poder por efeito da habilidade (ex: Urso Polar, Crítico Alto)
      // poderBase exposto no evento para handlers multiplicativos (ex: Atropelar, Golpe de Abate)
      const evPoder = { alvo: alvoReal, bonusPoder: 0, poderBase: poderes[0] };
      EFEITOS_HABILIDADES.disparar(hab, 'modificar_poder', atacante, evPoder);
      let poderFinal = poderes[0] + evPoder.bonusPoder;

      // Amaciado: alvo marcado recebe poder dobrado de habilidades de Corte.
      if (_ehCorte(hab.tipo)
          && alvoReal.efeitos.some(e => e.tipo === 'amaciado' && e.duracao > 0)) {
        poderFinal *= 2;
      }

      // Carta de defesa — vem do mapa, indexada pelo id do alvo ORIGINAL
      // (pré-intercepto). Mapa carrega o OBJETO da carta — splice por
      // referência evita bug de índices quando múltiplos alvos defendem.
      let defesaCarta = null;
      const defesaRef = defesasPorAlvo ? defesasPorAlvo[alvo.id] : null;
      // Armadura Derretida impede uso de carta de defesa
      const temDerretar = alvoReal.efeitos.some(e => e.tipo === 'derretar_armadura' && e.duracao > 0);
      if (defesaRef && !temDerretar) {
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

      // ♠ Espadas → ♥ Copas: dano bruto dobrado (não se aplica em Furtivo)
      const danoMult = (!hab.efeitoPuro && acaoEfetiva !== 'F' && acaoEfetiva !== 'R'
        && atacante.naipe === '♠' && alvoReal.naipe === '♥') ? 2 : 1;

      // Dano (com defesa, se houver carta; ignoraArmadura quando sinalizado pelo handler)
      const resultado = etapa3_resolucaoDano(atacante, alvoReal, poderFinal, carta, hab.efeitoPuro, defesaCarta, evPoder.ignoraArmadura ?? false, danoMult);

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

        // Linker: aplica efeitos nomeados das tags da habilidade no alvo.
        // (Apenas quando causou dano — game-design 02 §3.3.)
        if (Array.isArray(hab.tags) && hab.tags.length > 0
            && typeof EFEITOS !== 'undefined' && EFEITOS.aplicar) {
          for (const tag of hab.tags) {
            EFEITOS.aplicar(tag, alvoReal, atacante);
          }
        }

        // Redemoinho: aliados do alvo com estado ativo disparam contra-ataque simples.
        // ATQ + poder (1) vs DEF do inimigo, sem carta. 50% só o agressor / 50% todos.
        const redemoinheiros = BATTLE_STATE.combatentes.filter(c =>
          c.lado === alvoReal.lado && _estaVivo(c) &&
          c.efeitos.some(e => e.tipo === 'redemoinho_ativo' && e.duracao > 0)
        );
        for (const rd of redemoinheiros) {
          const alvosContra = Math.random() < 0.5
            ? [atacante]
            : BATTLE_STATE.combatentes.filter(c => c.lado === atacante.lado && _estaVivo(c));
          for (const ac of alvosContra) {
            const danoContra   = (rd.atq ?? 0) + 1;
            const defContra    = ac.def ?? 0;
            const realContra   = Math.max(0, danoContra - defContra);
            if (realContra > 0) {
              ac.hp = Math.max(0, ac.hp - realContra);
              PASSIVAS.recalcularStats(ac);
              _log('dano', `${rd.nome} (Redemoinho) contra-atacou ${ac.nome} por ${realContra}`);
            }
          }
        }
      }

      // Passes adicionais: poder múltiplo (ex: '1/1' → segundo golpe sem efeitos extras)
      for (let pi = 1; pi < poderes.length; pi++) {
        if (alvoReal.hp <= 0) break;
        const r2 = etapa3_resolucaoDano(atacante, alvoReal, poderes[pi], carta, hab.efeitoPuro, null);
        if (r2.causouDano) {
          PASSIVAS.disparar('ao_causar_dano', atacante, { alvo: alvoReal, ...r2 });
          PASSIVAS.disparar('ao_sofrer_dano', alvoReal, { atacante, ...r2 });
        }
      }

      // Efeitos pós-dano de vantagem de naipe
      if (!hab.efeitoPuro && acaoEfetiva !== 'F' && acaoEfetiva !== 'R'
          && atacante.naipe && alvoReal.naipe) {
        _aplicarVantagemNaipe(atacante, alvoReal);
      }

      // Ataque em conjunto: aliados do atacante com essa capacidade entram junto
      if (alvoReal.hp > 0) {
        for (const aliado of BATTLE_STATE.combatentes) {
          if (aliado.lado !== atacante.lado || aliado === atacante || !_estaVivo(aliado)) continue;
          const ev = { alvo: alvoReal, atacantePrincipal: atacante, ataqueConjunto: false };
          PASSIVAS.disparar('ao_aliado_atacar', aliado, ev);
          if (ev.ataqueConjunto) _executarContraAtaque(aliado, alvoReal);
        }
      }
    }

    return { ok: true };
  }

  // Aplica efeitos de vantagem de naipe APÓS o dano (exceto ♠→♥ que já entrou no danoMult).
  function _aplicarVantagemNaipe(atacante, alvo) {
    // ♥↔♣: Copas ganha ATQ/DEF ×2 por 2 turnos ao interagir com Paus
    if (atacante.naipe === '♥' && alvo.naipe === '♣') _renovarHeartsAdv(atacante);
    if (atacante.naipe === '♣' && alvo.naipe === '♥') _renovarHeartsAdv(alvo);

    // ♦→♠: Ouros atacante ganha rodada extra
    if (atacante.naipe === '♦' && alvo.naipe === '♠' && !atacante._rodadaExtraPending) {
      atacante._rodadaExtraPending = true;
      _log('naipe', `${atacante.nome} (♦→♠) ganhou rodada extra`);
    }

    // ♠→♦: Ouros defensor ganha rodada extra
    if (atacante.naipe === '♠' && alvo.naipe === '♦' && alvo.hp > 0 && !alvo._rodadaExtraPending) {
      alvo._rodadaExtraPending = true;
      _log('naipe', `${alvo.nome} (♦ reage a ♠) ganhou rodada extra`);
    }

    // ♦→♣: Paus ganha Furtivo 2t + contra-ataca com 1ª habilidade de dano
    if (atacante.naipe === '♦' && alvo.naipe === '♣' && alvo.hp > 0) {
      const existFurtivo = alvo.efeitos.find(e => e.tipo === 'clubs_furtivo');
      if (existFurtivo) {
        existFurtivo.duracao = 2;
      } else {
        alvo.efeitos.push({ tipo: 'clubs_furtivo', duracao: 2, duracaoOriginal: 2 });
      }
      _log('naipe', `${alvo.nome} (♣) ficou Furtivo por 2 turnos`);
      _executarContraAtaque(alvo, atacante);
    }

    // ♣ com Furtivo ativo: contra-ataca qualquer atacante não-♦
    if (alvo.naipe === '♣' && atacante.naipe !== '♦' && alvo.hp > 0) {
      const furtivo = alvo.efeitos.find(e => e.tipo === 'clubs_furtivo' && e.duracao > 0);
      if (furtivo) _executarContraAtaque(alvo, atacante);
    }
  }

  // Executa contra-ataque com a 1ª habilidade de dano do contra-atacante.
  // Fórmula: ATQ atual + poder vs DEF atual do alvo. Sem carta, sem tela de defesa.
  // Aplica tags da habilidade e dispara passivas — o valor do contra-ataque está nos efeitos.
  function _executarContraAtaque(contraAtacante, alvo) {
    if (!contraAtacante || !alvo || alvo.hp <= 0) return;
    const hab = (contraAtacante.habilidades ?? []).find(h => h && !h.efeitoPuro);
    if (!hab) return;

    const poder      = typeof hab.poder === 'number' ? hab.poder : 0;
    const danoContra = Math.max(0, contraAtacante.atq + poder - alvo.def);

    const causouDano = danoContra > 0;

    if (causouDano) {
      alvo.hp = Math.max(0, alvo.hp - danoContra);
      PASSIVAS.recalcularStats(alvo);
      _log('dano', `${contraAtacante.nome} (contra-ataque: ${hab.nome}) → ${alvo.nome}: ${danoContra} dano`);
    }

    // Efeitos puro: aplica sem precisar de dano.
    // Habilidade de dano: só aplica efeitos se causou pelo menos 1 de dano.
    const aplicaEfeitos = hab.efeitoPuro || causouDano;
    if (aplicaEfeitos && Array.isArray(hab.tags) && hab.tags.length > 0 && typeof EFEITOS !== 'undefined') {
      for (const tag of hab.tags) EFEITOS.aplicar(tag, alvo, contraAtacante);
    }

    if (causouDano) {
      PASSIVAS.disparar('ao_causar_dano', contraAtacante, { alvo, danoReal: danoContra, causouDano });
      PASSIVAS.disparar('ao_sofrer_dano', alvo, { atacante: contraAtacante, danoReal: danoContra, causouDano });
    }
  }

  // Aplica ou renova hearts_adv no personagem Copas.
  function _renovarHeartsAdv(copasChar) {
    const existing = copasChar.efeitos.find(e => e.tipo === 'hearts_adv');
    if (existing) {
      existing.duracao = 2;
    } else {
      copasChar.efeitos.push({ tipo: 'hearts_adv', duracao: 2, duracaoOriginal: 2 });
    }
    PASSIVAS.recalcularStats(copasChar);
    _log('naipe', `${copasChar.nome} (♥ vs ♣) ATQ/DEF ×2 por 2 turnos`);
  }

  // Helper: parse poder simples ou múltiplo ('1/1' → [1,1]; 3 → [3]).
  function _parsePoder(valor) {
    if (typeof valor === 'string' && valor.includes('/')) {
      return valor.split('/').map(Number).filter(n => !isNaN(n));
    }
    const n = Number(valor ?? 0);
    return [isNaN(n) ? 0 : n];
  }

  // Helper: identifica habilidades de "Corte" pelo texto do tipo.
  // Faz substring match porque temos "Cortante" (antigo) e "Corte e Contusão" (novo).
  function _ehCorte(tipo) {
    if (!tipo || typeof tipo !== 'string') return false;
    const t = tipo.toLowerCase();
    return t.includes('corte') || t.includes('cortante');
  }

  // Helper: identifica habilidades Elétricas pelo tipo.
  function _ehEletrico(tipo) {
    if (!tipo || typeof tipo !== 'string') return false;
    return tipo.toLowerCase().includes('elétr');
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
  // Limpa _turnoIniciado pra próxima rodada poder rodar iniciarRodada de novo.
  function etapa5_fimRodada(combatente) {
    for (const efeito of combatente.efeitos) {
      if (efeito.gatilho === 'fim_rodada') {
        _aplicarEfeito(combatente, efeito);
      }
    }
    if (combatente) combatente._turnoIniciado = false;
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
      if (e.duracao !== null && e.duracao > 0) e.duracao -= 1;
    }
    // Limpa efeitos expirados (duracao === null = permanente até consumo manual)
    combatente.efeitos = combatente.efeitos.filter(e => e.duracao === null || e.duracao > 0);

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
  const MAX_MAO_JOGADOR = 10;

  function _comprarCarta(combatente, n) {
    if (combatente.lado === 'jogador') {
      if (BATTLE_STATE.baralhoJogador.length < n) {
        BATTLE_STATE.baralhoJogadorEsgotado = true;
      }
      const { cartas, resto } = DECK.comprar(BATTLE_STATE.baralhoJogador, n);
      BATTLE_STATE.maoJogador     = BATTLE_STATE.maoJogador.concat(cartas);
      BATTLE_STATE.baralhoJogador = resto;

      // Descarte automático: mão não pode passar de 10 cartas
      if (BATTLE_STATE.maoJogador.length > MAX_MAO_JOGADOR) {
        BATTLE_STATE.descarteJogador = BATTLE_STATE.descarteJogador.concat(
          BATTLE_STATE.maoJogador.splice(MAX_MAO_JOGADOR)
        );
      }
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
    rodarEtapa1,
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
