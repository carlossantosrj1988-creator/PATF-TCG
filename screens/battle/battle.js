// screens/battle/battle.js
// Tela de batalha — esqueleto funcional: layout, iniciativa, turno básico.
// Depende de: engine/deck.js, engine/damage.js, engine/combat.js, chars/chars.js
//
// Seções:
//   INIMIGOS DE TESTE   — templates placeholder por etapa do tutorial
//   ESTADO              — variáveis privadas da tela
//   INIT                — init(), distribuição de mão, alocação de iniciativa
//   RENDER              — _renderizar()
//   TOPBAR              — _criarTopbar()
//   CAMPO               — _criarCampo(), _criarCharSlot()
//   PAINEL              — _criarPainel()
//   TURNO               — _passarRodada(), _turnoInimigo(), _vencer()
//   API PÚBLICA

const BATTLE = (() => {

  // ══════════════════════════════════════════════════════════════════════════
  // INIMIGOS DE TESTE
  // ══════════════════════════════════════════════════════════════════════════
  //
  // Arquivo definitivo de monstros vem em sessão futura (enemy-ai/monstros.js).
  // Por enquanto cada etapa do tutorial tem um inimigo placeholder.

  const INIMIGOS_TUTORIAL = [
    { id: 'goblin',    label: 'Goblin',    naipe: '♣', atq: 4, def: 2, inc: 2, pvs: 40  },
    { id: 'orc',       label: 'Orc',       naipe: '♠', atq: 5, def: 3, inc: 1, pvs: 60  },
    { id: 'bruxa',     label: 'Bruxa',     naipe: '♥', atq: 6, def: 2, inc: 3, pvs: 50  },
    { id: 'cavaleiro', label: 'Cavaleiro', naipe: '♦', atq: 5, def: 4, inc: 2, pvs: 70  },
    { id: 'dragao',    label: 'Dragão',    naipe: '♠', atq: 8, def: 5, inc: 3, pvs: 100 },
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // ESTADO
  // ══════════════════════════════════════════════════════════════════════════

  let _onVitoria   = null;
  let _aguardando  = false; // evita cliques duplos enquanto espera turno inimigo

  // ══════════════════════════════════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════════════════════════════════

  function init(etapaIdx, onVitoria) {
    _onVitoria  = onVitoria;
    _aguardando = false;

    const inimigo = INIMIGOS_TUTORIAL[etapaIdx] ?? INIMIGOS_TUTORIAL[0];

    // PLAYER_STATE.personagens usa poolId como id — criarCombatente precisa de .id
    const personagens = PLAYER_STATE.personagens.map(p => ({ ...p, id: p.poolId }));

    COMBAT.init(personagens, [inimigo]);
    _distribuirMao(10);
    _alocarIniciativaAuto();
    _renderizar();
  }

  // Cada combatente compra n cartas do próprio baralho.
  function _distribuirMao(n) {
    for (const c of COMBAT.estado.combatentes) {
      const { cartas, resto } = DECK.comprar(c.baralho, n);
      c.mao    = cartas;
      c.baralho = resto;
    }
  }

  // Usa a primeira carta da mão de cada combatente como carta de iniciativa.
  // A carta é removida da mão — combatentes ficam com n-1 cartas.
  function _alocarIniciativaAuto() {
    const alocadas = new Map();
    for (const c of COMBAT.estado.combatentes) {
      if (c.mao.length === 0) continue;
      const [cartaIni, ...restaMao] = c.mao;
      c.mao = restaMao;
      alocadas.set(c.id, cartaIni);
    }
    COMBAT.calcularIniciativa(alocadas);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  function _renderizar() {
    let screen = document.getElementById('screen-battle');
    if (!screen) {
      screen = document.createElement('div');
      screen.id = 'screen-battle';
      document.getElementById('game-container').appendChild(screen);
    }
    screen.innerHTML = '';
    screen.style.display = 'block';

    screen.appendChild(_criarTopbar());
    screen.appendChild(_criarCampo());
    screen.appendChild(_criarPainel());

    // Se o turno atual é do inimigo, agenda a ação automática
    const atual = COMBAT.combatenteAtual();
    if (atual && atual.lado === 'inimigo' && !_aguardando) {
      _aguardando = true;
      setTimeout(_turnoInimigo, 900);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TOPBAR
  // ══════════════════════════════════════════════════════════════════════════

  function _criarTopbar() {
    const bar = document.createElement('div');
    bar.id = 'battle-topbar';

    const estado = COMBAT.estado;
    estado.ordem.forEach((c, i) => {
      const ativo   = (i === estado.indiceAtual);
      const valIni  = c.cartaIniciativa
        ? DECK.valorIniciativa(c.cartaIniciativa) + c.inc
        : c.inc;

      const slot = document.createElement('div');
      slot.className = 'battle-ini-slot' + (ativo ? ' ativo' : '');
      slot.dataset.lado = c.lado;
      slot.innerHTML = `
        <div class="ini-naipe">${c.naipe ?? '?'}</div>
        <div class="ini-nome">${c.nome.substring(0, 7)}</div>
        <div class="ini-valor">${valIni}</div>
      `;
      bar.appendChild(slot);
    });

    return bar;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CAMPO
  // ══════════════════════════════════════════════════════════════════════════

  function _criarCampo() {
    const campo = document.createElement('div');
    campo.id = 'battle-field';

    const esq = document.createElement('div');
    esq.id = 'battle-field-left';
    esq.className = 'battle-field-lado';

    const div = document.createElement('div');
    div.id = 'battle-field-divisor';

    const dir = document.createElement('div');
    dir.id = 'battle-field-right';
    dir.className = 'battle-field-lado';

    for (const c of COMBAT.estado.combatentes) {
      const slot = _criarCharSlot(c);
      if (c.lado === 'jogador') esq.appendChild(slot);
      else                      dir.appendChild(slot);
    }

    campo.appendChild(esq);
    campo.appendChild(div);
    campo.appendChild(dir);
    return campo;
  }

  function _criarCharSlot(c) {
    const hpPct = Math.max(0, Math.min(100, (c.hp / c.pvs) * 100));

    const slot = document.createElement('div');
    slot.className = 'battle-char-slot';
    slot.dataset.id   = c.id;
    slot.dataset.lado = c.lado;
    slot.innerHTML = `
      <div class="battle-char-grad">
        <span class="battle-char-naipe">${c.naipe ?? '?'}</span>
      </div>
      <div class="battle-char-nome">${c.nome}</div>
      <div class="battle-char-hp-bar">
        <div class="battle-char-hp-fill" style="width:${hpPct}%"></div>
      </div>
      <div class="battle-char-hp-txt">${c.hp} / ${c.pvs}</div>
    `;
    return slot;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAINEL
  // ══════════════════════════════════════════════════════════════════════════

  function _criarPainel() {
    const painel = document.createElement('div');
    painel.id = 'battle-panel';

    const atual = COMBAT.combatenteAtual();
    const ehJogador = atual?.lado === 'jogador';

    // ── Lado esquerdo ──
    const esq = document.createElement('div');
    esq.id = 'battle-panel-left';

    if (ehJogador) {
      esq.innerHTML = `
        <button class="battle-btn-acao" id="battle-btn-habilidades">⚔ HABILIDADES</button>
        <button class="battle-btn-acao" id="battle-btn-passar">⏭ PASSAR A RODADA</button>
        <button class="battle-btn-debug" id="battle-btn-vencer">[ VENCER — DEBUG ]</button>
      `;
      esq.querySelector('#battle-btn-passar').addEventListener('click', _passarRodada);
      esq.querySelector('#battle-btn-vencer').addEventListener('click', _vencer);
      // Habilidades: a implementar em sessão futura
      esq.querySelector('#battle-btn-habilidades').addEventListener('click', () => {});
    } else {
      // Turno do inimigo — painel informativo
      esq.innerHTML = `
        <div class="battle-inimigo-turno">
          <div class="battle-inimigo-turno-titulo">⚔ TURNO DO INIMIGO</div>
          <div class="battle-inimigo-turno-sub">${atual?.nome ?? ''} está agindo...</div>
        </div>
        <button class="battle-btn-debug" id="battle-btn-vencer">[ VENCER — DEBUG ]</button>
      `;
      esq.querySelector('#battle-btn-vencer').addEventListener('click', _vencer);
    }

    // ── Separador ──
    const sep = document.createElement('div');
    sep.id = 'battle-panel-sep';

    // ── Lado direito — cartas da mão ──
    const dir = document.createElement('div');
    dir.id = 'battle-panel-right';

    const mao = (ehJogador && atual) ? atual.mao : [];
    if (mao.length > 0) {
      mao.forEach(carta => {
        const el = document.createElement('div');
        el.className = 'battle-carta';
        el.dataset.naipe = carta.naipe ?? '';
        el.innerHTML = `<span class="carta-valor">${carta.label}</span>`;
        dir.appendChild(el);
      });
    } else {
      dir.innerHTML = `<div class="battle-mao-vazia">—</div>`;
    }

    painel.appendChild(esq);
    painel.appendChild(sep);
    painel.appendChild(dir);
    return painel;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TURNO
  // ══════════════════════════════════════════════════════════════════════════

  function _passarRodada() {
    const c = COMBAT.combatenteAtual();
    if (!c || c.lado !== 'jogador') return;

    COMBAT.iniciarRodada(c);
    COMBAT.passarRodada(c);
    COMBAT.etapa5_fimRodada(c);
    COMBAT.avancarCombatente();
    _aguardando = false;
    _renderizar();
  }

  // Inimigo passa a rodada automaticamente (IA real vem em sessão futura).
  function _turnoInimigo() {
    const c = COMBAT.combatenteAtual();
    if (!c || c.lado !== 'inimigo') {
      _aguardando = false;
      return;
    }
    COMBAT.iniciarRodada(c);
    COMBAT.passarRodada(c);
    COMBAT.etapa5_fimRodada(c);
    COMBAT.avancarCombatente();
    _aguardando = false;
    _renderizar();
  }

  function _vencer() {
    const screen = document.getElementById('screen-battle');
    if (screen) screen.style.display = 'none';
    if (_onVitoria) _onVitoria();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // API PÚBLICA
  // ══════════════════════════════════════════════════════════════════════════

  return { init };

})();
