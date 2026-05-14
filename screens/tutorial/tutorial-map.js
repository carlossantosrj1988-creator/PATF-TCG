// screens/tutorial/tutorial-map.js
// Gerencia HP persistente entre etapas, tela de transição e popup de recuperação.
// Depende de: chars/chars.js (PLAYER_STATE), engine/combat.js (COMBAT), battle.js (BATTLE)

const TUTORIAL_MAP = (() => {

  // Tipo de cada etapa (índice 0-4, espelha ETAPAS em tutorial.js)
  const _CONFIG = [
    { tipo: 'normal',      rotulo: 'ETAPA 1 / 5', iniIdx: 0 },
    { tipo: 'normal',      rotulo: 'ETAPA 2 / 5', iniIdx: 1 },
    { tipo: 'recuperacao', rotulo: 'ETAPA 3 / 5', iniIdx: 2 },
    { tipo: 'normal',      rotulo: 'ETAPA 4 / 5', iniIdx: 3 },
    { tipo: 'boss',        rotulo: 'ETAPA 5 / 5', iniIdx: 4 },
  ];

  // Labels de inimigos — mesma ordem que INIMIGOS_TUTORIAL em battle.js
  const _INIMIGOS = [
    { label: 'Goblin',    naipe: '♣' },
    { label: 'Orc',       naipe: '♠' },
    { label: 'Bruxa',     naipe: '♥' },
    { label: 'Cavaleiro', naipe: '♦' },
    { label: 'Dragão',    naipe: '♠' },
  ];

  const _COR_NAIPE  = { '♥': '#e06060', '♣': '#5ac880', '♦': '#e8c050', '♠': '#7aade8' };
  const _NAIPE_SIM  = { ouro: '♦', copas: '♥', espadas: '♠', paus: '♣' };

  // ── Estado persistente entre batalhas ─────────────────────────────────────

  const TUTORIAL_STATE = {
    hp:       {},     // poolId → { cur, max }
    concluido: false,
  };

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    TUTORIAL_STATE.concluido = false;
    TUTORIAL_STATE.hp = {};
    for (const p of PLAYER_STATE.personagens) {
      TUTORIAL_STATE.hp[p.poolId] = { cur: p.pvs, max: p.pvs };
    }
  }

  // ── Entrar em etapa ───────────────────────────────────────────────────────

  function entrarEtapa(etapaIdx, onConcluida) {
    // Injeta HP salvo em cada personagem antes de passar para a batalha
    for (const p of PLAYER_STATE.personagens) {
      const salvo = TUTORIAL_STATE.hp[p.poolId];
      p.hpAtual = salvo ? salvo.cur : p.pvs;
    }

    _mostrarTransicao(etapaIdx, () => {
      BATTLE.init(etapaIdx, () => {
        _salvarHP();
        _afterBattle(etapaIdx, onConcluida);
      });
      // BATTLE.init() é síncrono — screen-battle já existe; aplica fade-in
      const bs = document.getElementById('screen-battle');
      if (bs) {
        bs.classList.add('battle-entering');
        setTimeout(() => bs.classList.remove('battle-entering'), 500);
      }
    });
  }

  // ── Salva HP atual do combate de volta para TUTORIAL_STATE ────────────────

  function _salvarHP() {
    for (const c of COMBAT.estado.combatentes) {
      if (c.lado !== 'jogador') continue;
      const poolId = c.id.replace('jogador_', '');
      if (TUTORIAL_STATE.hp[poolId]) {
        TUTORIAL_STATE.hp[poolId].cur = c.hp;
      }
    }
    // Sincroniza PLAYER_STATE para o painel de chars no mapa
    for (const p of PLAYER_STATE.personagens) {
      const salvo = TUTORIAL_STATE.hp[p.poolId];
      if (salvo) p.hpAtual = salvo.cur;
    }
  }

  // ── Pós-batalha ───────────────────────────────────────────────────────────

  function _afterBattle(etapaIdx, onConcluida) {
    const cfg = _CONFIG[etapaIdx];
    if (cfg.tipo === 'recuperacao') {
      _popupRecuperacao(onConcluida);
    } else {
      onConcluida();
    }
  }

  // ── Tela de transição: jogadores VS inimigo (fade-in → display → fade-out) ─

  function _mostrarTransicao(etapaIdx, onFim) {
    const cfg     = _CONFIG[etapaIdx];
    const inimigo = _INIMIGOS[cfg.iniIdx];
    const corIni  = _COR_NAIPE[inimigo.naipe] ?? '#aaa';

    const tipoLabel =
      cfg.tipo === 'boss'        ? '👑 BOSS FINAL' :
      cfg.tipo === 'recuperacao' ? '💚 ETAPA DE RECUPERAÇÃO' :
                                   '⚔ BATALHA';

    const screen = document.getElementById('screen-tutorial');

    const el = document.createElement('div');
    el.id = 'tmap-transicao';
    el.innerHTML = `
      <div id="tmap-trans-bg"></div>
      <div id="tmap-trans-content">
        <div id="tmap-trans-header">
          <span id="tmap-trans-rotulo">${cfg.rotulo}</span>
          <span id="tmap-trans-tipo">${tipoLabel}</span>
        </div>
        <div id="tmap-trans-arena">
          <div id="tmap-trans-time-jogador"></div>
          <div id="tmap-trans-vs">VS</div>
          <div id="tmap-trans-time-inimigo">
            <div class="tmap-trans-char-card inimigo">
              <span class="tmap-card-naipe" style="color:${corIni}">${inimigo.naipe}</span>
              <span class="tmap-card-nome">${inimigo.label}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Preenche cards dos personagens do jogador
    const timeDiv = el.querySelector('#tmap-trans-time-jogador');
    for (const p of PLAYER_STATE.personagens) {
      const sim    = _NAIPE_SIM[p.naipeAtivo] ?? _NAIPE_SIM[p.naipe] ?? null;
      const cor    = sim ? (_COR_NAIPE[sim] ?? '#888') : '#555';
      const hpMax  = TUTORIAL_STATE.hp[p.poolId]?.max ?? p.pvs;
      const hpCur  = TUTORIAL_STATE.hp[p.poolId]?.cur ?? p.pvs;
      const pct    = Math.max(0, Math.round((hpCur / hpMax) * 100));
      const hpCls  = pct > 60 ? 'verde' : pct > 30 ? 'amarelo' : 'vermelho';

      const card = document.createElement('div');
      card.className = 'tmap-trans-char-card';
      card.innerHTML = `
        <span class="tmap-card-naipe" style="color:${cor}">${sim ?? '?'}</span>
        <span class="tmap-card-nome">${p.nome}</span>
        <div class="tmap-card-hp-bar">
          <div class="tmap-card-hp-fill ${hpCls}" style="width:${pct}%"></div>
        </div>
      `;
      timeDiv.appendChild(card);
    }

    screen.appendChild(el);

    // Fade-out → remove → dispara onFim
    setTimeout(() => el.classList.add('tmap-fadeout'), 2200);
    setTimeout(() => { el.remove(); onFim(); }, 2700);
  }

  // ── Popup de recuperação ──────────────────────────────────────────────────

  function _popupRecuperacao(onOk) {
    const vivos  = PLAYER_STATE.personagens.filter(p => (TUTORIAL_STATE.hp[p.poolId]?.cur ?? p.pvs) > 0);
    const mortos = PLAYER_STATE.personagens.filter(p => (TUTORIAL_STATE.hp[p.poolId]?.cur ?? 0) === 0);

    const screen = document.getElementById('screen-tutorial');

    const popup = document.createElement('div');
    popup.id = 'tmap-popup-recuperacao';
    popup.innerHTML = `
      <div id="tmap-rec-overlay"></div>
      <div id="tmap-rec-box">
        <div class="tmap-rec-tag">💚 RECUPERAÇÃO</div>
        <div class="tmap-rec-titulo">ESCOLHA UMA OPÇÃO</div>
        <div class="tmap-rec-desc">Cure completamente um aliado vivo ou reviva um aliado caído.</div>
        <div id="tmap-rec-opcoes">
          <div class="tmap-rec-sec" id="tmap-curar-sec">
            <div class="tmap-rec-sec-titulo">💚 CURAR 1</div>
            <div class="tmap-rec-sec-sub">Aliado vivo → HP 100%</div>
            <div class="tmap-rec-chars" id="tmap-curar-chars"></div>
          </div>
          <div class="tmap-rec-sec ${mortos.length === 0 ? 'disabled' : ''}" id="tmap-reviver-sec">
            <div class="tmap-rec-sec-titulo">🔆 REVIVER 1</div>
            <div class="tmap-rec-sec-sub">${mortos.length === 0 ? 'Nenhum aliado caído' : 'Aliado caído → HP 100%'}</div>
            <div class="tmap-rec-chars" id="tmap-reviver-chars"></div>
          </div>
        </div>
      </div>
    `;

    screen.appendChild(popup);

    const curarDiv   = popup.querySelector('#tmap-curar-chars');
    const reviverDiv = popup.querySelector('#tmap-reviver-chars');

    for (const p of vivos) {
      const btn = document.createElement('button');
      btn.className = 'tmap-rec-char-btn curar';
      btn.textContent = p.nome;
      btn.addEventListener('click', () => {
        TUTORIAL_STATE.hp[p.poolId].cur = TUTORIAL_STATE.hp[p.poolId].max;
        p.hpAtual = TUTORIAL_STATE.hp[p.poolId].max;
        popup.remove();
        onOk();
      });
      curarDiv.appendChild(btn);
    }

    for (const p of mortos) {
      const btn = document.createElement('button');
      btn.className = 'tmap-rec-char-btn reviver';
      btn.textContent = p.nome;
      btn.addEventListener('click', () => {
        TUTORIAL_STATE.hp[p.poolId].cur = TUTORIAL_STATE.hp[p.poolId].max;
        p.hpAtual = TUTORIAL_STATE.hp[p.poolId].max;
        popup.remove();
        onOk();
      });
      reviverDiv.appendChild(btn);
    }
  }

  // ── API pública ───────────────────────────────────────────────────────────

  return {
    init,
    entrarEtapa,
    get state() { return TUTORIAL_STATE; },
  };

})();
