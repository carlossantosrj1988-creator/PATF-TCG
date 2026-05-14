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

  // Gradiente e borda por naipe — aplicados inline nos slots do campo e na topbar
  const GRAD_NAIPE = {
    '♥': { bg: 'linear-gradient(160deg, #4a0808, #180303)', borda: '#6b000055' },
    '♣': { bg: 'linear-gradient(160deg, #083a08, #030f03)', borda: '#1a5c1a55' },
    '♦': { bg: 'linear-gradient(160deg, #3a2800, #120e00)', borda: '#7a5c0055' },
    '♠': { bg: 'linear-gradient(160deg, #080e28, #030510)', borda: '#1a2a4a55' },
  };
  const GRAD_NEUTRO = { bg: 'linear-gradient(160deg, #1e1e2e, #0d0d18)', borda: '#ffffff18' };

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

  let _onVitoria         = null;
  let _aguardando        = false;  // evita double-fire no turno do inimigo
  let _estadoPainel      = 'etapa1'; // 'etapa1' | 'habilidades'
  let _passarConfirmando = false;
  let _etapaAtual        = 0;  // índice da etapa atual (usado para detectar boss)

  // ══════════════════════════════════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════════════════════════════════

  // Mapa de naipe (chave em português, igual NAIPES_DATA) → símbolo
  const _NAIPE_SIM = { ouro: '♦', copas: '♥', espadas: '♠', paus: '♣' };

  function init(etapaIdx, onVitoria) {
    _onVitoria         = onVitoria;
    _aguardando        = false;
    _estadoPainel      = 'etapa1';
    _passarConfirmando = false;
    _etapaAtual        = etapaIdx;

    const inimigo = INIMIGOS_TUTORIAL[etapaIdx] ?? INIMIGOS_TUTORIAL[0];

    const personagens = PLAYER_STATE.personagens.map(p => {
      const sim = _NAIPE_SIM[p.naipe] ?? _NAIPE_SIM[p.naipeAtivo] ?? null;
      return { ...p, id: p.poolId, naipe: sim, naipeAtivo: sim };
    });

    COMBAT.init(personagens, [inimigo]);
    _distribuirMao(10);
    _telaIniciativa(); // jogador escolhe cartas antes da batalha começar
  }

  function _distribuirMao(n) {
    // Time jogador: mão compartilhada
    const estado = COMBAT.estado;
    const { cartas, resto } = DECK.comprar(estado.baralhoJogador, n);
    estado.maoJogador     = cartas;
    estado.baralhoJogador = resto;

    // Inimigos: cada um compra individualmente
    for (const c of estado.combatentes.filter(x => x.lado === 'inimigo')) {
      const { cartas: ci, resto: ri } = DECK.comprar(c.baralho, n);
      c.mao     = ci;
      c.baralho = ri;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INICIATIVA — fase de seleção → revelação → combate
  // ══════════════════════════════════════════════════════════════════════════

  const _COR_INI = { '♥': '#e06060', '♣': '#5ac880', '♦': '#e8c050', '♠': '#7aade8' };

  // Tela de seleção: char rows no topo + mão compartilhada embaixo.
  function _telaIniciativa() {
    let screen = document.getElementById('screen-battle');
    if (!screen) {
      screen = document.createElement('div');
      screen.id = 'screen-battle';
      document.getElementById('game-container').appendChild(screen);
    }
    screen.innerHTML = '';
    screen.style.display = 'block';

    const estado    = COMBAT.estado;
    const jogadores = estado.combatentes.filter(c => c.lado === 'jogador');
    const maoShared = estado.maoJogador; // mão compartilhada do time

    // picks: charId → { idx (na maoShared), carta, btnEl }
    const picks = {};
    // carta selecionada no momento
    let selected = null;

    const tela = document.createElement('div');
    tela.id = 'battle-ini-tela';

    // ── Header ──
    const header = document.createElement('div');
    header.id = 'battle-ini-header';
    header.innerHTML = `
      <div class="battle-ini-titulo">⚔ ESCOLHA DE INICIATIVA</div>
      <div class="battle-ini-sub">Selecione uma carta e toque no personagem para atribuir</div>
    `;
    tela.appendChild(header);

    // ── Linhas de personagens ──
    const charsDiv = document.createElement('div');
    charsDiv.id = 'battle-ini-chars';

    for (const c of jogadores) {
      const cor = _COR_INI[c.naipe] ?? '#888';
      const { bg, borda } = GRAD_NAIPE[c.naipe] ?? GRAD_NEUTRO;
      const row = document.createElement('div');
      row.className = 'battle-ini-char-row';
      row.dataset.charId = c.id;
      row.style.color = cor; // alimenta o ::before colorido
      row.innerHTML = `
        <div class="bic-card" style="background:${bg}; border-color:${borda};">
          <span class="bic-card-naipe" style="color:${cor}">${c.naipe ?? '?'}</span>
          <span class="bic-card-nome">${c.nome}</span>
        </div>
        <span class="bic-inc">INC +${c.inc}</span>
        <div class="bic-slot vazio">— escolha uma carta —</div>
      `;

      row.addEventListener('click', () => {
        const slotEl = row.querySelector('.bic-slot');
        if (selected) {
          // Libera carta anterior deste char (se havia)
          if (picks[c.id]) {
            picks[c.id].btnEl.classList.remove('usada');
          }
          // Atribui carta selecionada
          picks[c.id] = { idx: selected.idx, carta: selected.carta, btnEl: selected.btnEl };
          selected.btnEl.classList.add('usada');
          selected.btnEl.classList.remove('selecionada');

          const corCarta  = _COR_INI[selected.carta.naipe] ?? '#c9a84c';
          const naipeAtrib = selected.carta.naipe ?? '★';
          slotEl.className = 'bic-slot atribuida';
          slotEl.innerHTML = `
            <span style="color:${corCarta}">${naipeAtrib}</span>
            <strong>${selected.carta.valor}</strong>
          `;

          selected = null;
          _atualizarConfirmar();
        } else if (picks[c.id]) {
          // Libera carta deste char de volta à mão
          picks[c.id].btnEl.classList.remove('usada');
          delete picks[c.id];
          slotEl.className = 'bic-slot vazio';
          slotEl.textContent = '— escolha uma carta —';
          _atualizarConfirmar();
        }
      });

      charsDiv.appendChild(row);
    }
    tela.appendChild(charsDiv);

    // ── Mão compartilhada ──
    const maoDiv = document.createElement('div');
    maoDiv.id = 'battle-ini-mao';

    maoShared.forEach((carta, idx) => {
      const cor   = _COR_INI[carta.naipe] ?? '#c9a84c';
      const naipe = carta.naipe ?? '★';
      const btn = document.createElement('button');
      btn.className = 'battle-ini-carta';
      btn.dataset.idx = idx;
      btn.innerHTML = `
        <span class="ini-carta-naipe-top" style="color:${cor}">${naipe}</span>
        <span class="ini-carta-val">${carta.valor}</span>
      `;

      btn.addEventListener('click', () => {
        if (btn.classList.contains('usada')) return;
        if (selected?.btnEl === btn) {
          btn.classList.remove('selecionada');
          selected = null;
          return;
        }
        if (selected) selected.btnEl.classList.remove('selecionada');
        selected = { idx, carta, btnEl: btn };
        btn.classList.add('selecionada');
      });

      maoDiv.appendChild(btn);
    });
    tela.appendChild(maoDiv);

    // ── Botão confirmar ──
    const btnConfirmar = document.createElement('button');
    btnConfirmar.id          = 'battle-ini-btn-confirmar';
    btnConfirmar.textContent = 'CONFIRMAR INICIATIVA →';
    btnConfirmar.disabled    = true;
    btnConfirmar.addEventListener('click', () => {
      if (Object.keys(picks).length < jogadores.length) return;
      tela.remove();
      _confirmarIniciativa(picks);
    });
    tela.appendChild(btnConfirmar);

    screen.appendChild(tela);

    function _atualizarConfirmar() {
      const prontos = Object.keys(picks).length >= jogadores.length;
      btnConfirmar.disabled = !prontos;
      btnConfirmar.classList.toggle('pronto', prontos);
    }
  }

  // Aplica picks do jogador, auto-aloca inimigo, calcula ordem e revela.
  function _confirmarIniciativa(picks) {
    const alocadas = new Map();
    const estado   = COMBAT.estado;

    // Remove cartas escolhidas da mão compartilhada (índices decrescentes para não deslocar)
    const idxsRemover = Object.values(picks).map(p => p.idx).sort((a, b) => b - a);
    for (const idx of idxsRemover) {
      estado.maoJogador.splice(idx, 1);
    }
    for (const [charId, pick] of Object.entries(picks)) {
      alocadas.set(charId, pick.carta);
    }

    // Inimigo normal: carta de menor valor. Boss (etapa 5): carta de maior valor.
    const ehBoss = _etapaAtual >= 4;
    for (const c of estado.combatentes.filter(x => x.lado === 'inimigo')) {
      if (!c.mao.length) continue;
      let melhorIdx = 0;
      c.mao.forEach((carta, i) => {
        const v = DECK.valorIniciativa(carta);
        const vB = DECK.valorIniciativa(c.mao[melhorIdx]);
        if (ehBoss ? v > vB : v < vB) melhorIdx = i;
      });
      const cartaIni = c.mao[melhorIdx];
      c.mao = c.mao.filter((_, i) => i !== melhorIdx);
      alocadas.set(c.id, cartaIni);
    }

    COMBAT.calcularIniciativa(alocadas);
    _revelarOrdem();
  }

  // Overlay com a ordem final — cada entrada aparece em sequência; clique ou timeout avança.
  function _revelarOrdem() {
    const screen = document.getElementById('screen-battle');
    const ordem  = COMBAT.estado.ordem;

    const overlay = document.createElement('div');
    overlay.id = 'battle-ini-revelar';
    overlay.innerHTML = `
      <div id="battle-ini-rev-bg"></div>
      <div id="battle-ini-rev-content">
        <div id="battle-ini-rev-titulo">ORDEM DE INICIATIVA</div>
        <div id="battle-ini-rev-lista"></div>
        <div id="battle-ini-rev-hint">toque para avançar</div>
      </div>
    `;
    screen.appendChild(overlay);

    const lista = overlay.querySelector('#battle-ini-rev-lista');

    ordem.forEach((c, i) => {
      setTimeout(() => {
        const cor   = _COR_INI[c.naipe] ?? '#888';
        const total = c.cartaIniciativa ? DECK.valorIniciativa(c.cartaIniciativa) + c.inc : c.inc;

        const entrada = document.createElement('div');
        entrada.className = 'battle-ini-rev-entrada' + (c.lado === 'inimigo' ? ' inimigo' : '');
        entrada.innerHTML = `
          <span class="rev-pos">#${i + 1}</span>
          <span class="rev-naipe" style="color:${cor}">${c.naipe ?? '?'}</span>
          <span class="rev-nome">${c.nome}</span>
          <span class="rev-carta">${c.cartaIniciativa?.label ?? '—'}</span>
          <span class="rev-score">${total}</span>
        `;
        lista.appendChild(entrada);
      }, 180 + i * 320);
    });

    const avançar = () => { overlay.remove(); _renderizar(); };
    const timer   = setTimeout(avançar, 180 + ordem.length * 320 + 1600);
    overlay.addEventListener('click', () => { clearTimeout(timer); avançar(); });
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
    _estadoPainel      = 'etapa1';
    _passarConfirmando = false;

    screen.appendChild(_criarTopbar());
    screen.appendChild(_criarCampo());
    screen.appendChild(_criarPainel());
    screen.appendChild(_criarBtnDebug());

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
    const bar    = document.createElement('div');
    bar.id = 'battle-topbar';

    const estado = COMBAT.estado;
    const turno  = Math.max(1, estado.turno);
    const jogador0 = estado.combatentes.find(c => c.lado === 'jogador');
    const inimigo0 = estado.combatentes.find(c => c.lado === 'inimigo');

    // ── Esquerda: turno + deck compartilhado do jogador ──
    const esq = document.createElement('div');
    esq.className = 'battle-topbar-esq';
    esq.innerHTML = `
      <span class="topbar-turno">TURNO ${turno}</span>
      <span class="topbar-deck">🂠 ${estado.baralhoJogador.length}</span>
    `;

    // ── Centro: fila de iniciativa circular ──
    const centro = document.createElement('div');
    centro.className = 'battle-topbar-centro';

    const inner = document.createElement('div');
    inner.className = 'battle-ini-inner';

    const idx    = estado.indiceAtual;
    const ordem  = estado.ordem;
    const feitos  = ordem.slice(0, idx);
    const fila    = ordem.slice(idx); // fila[0] = ativo

    // Fila (ativo + próximos)
    fila.forEach((c, i) => {
      const estado_ = i === 0 ? 'ativo' : 'proximo';
      inner.appendChild(_criarIniSlot(c, estado_, idx + i + 1));
    });

    // Separador
    if (feitos.length > 0 && fila.length > 0) {
      const sep = document.createElement('div');
      sep.className = 'ini-separator';
      inner.appendChild(sep);
    }

    // Feitos (invertidos — mais recente perto do separador)
    [...feitos].reverse().forEach((c, i) => {
      inner.appendChild(_criarIniSlot(c, 'feito', idx - i));
    });

    centro.appendChild(inner);

    // ── Direita: deck do inimigo ──
    const dir = document.createElement('div');
    dir.className = 'battle-topbar-dir';
    dir.innerHTML = `
      <span class="topbar-deck-label">INIMIGO</span>
      <span class="topbar-deck-ini">🂠 ${inimigo0?.baralho.length ?? 0}</span>
    `;

    bar.appendChild(esq);
    bar.appendChild(centro);
    bar.appendChild(dir);
    return bar;
  }

  function _criarIniSlot(c, estado_, pos) {
    const corNaipe = {
      '♥': '#e06060', '♣': '#5ac880', '♦': '#e8c050', '♠': '#7aade8',
    }[c.naipe] ?? '#c9a84c';

    const slot = document.createElement('div');
    slot.className = `battle-ini-slot ${estado_}`;
    slot.dataset.lado = c.lado;
    slot.innerHTML = `
      <div class="ini-avatar">
        <span class="ini-naipe" style="color:${corNaipe}">${c.naipe ?? '?'}</span>
        <span class="ini-pos">${pos}</span>
      </div>
    `;
    return slot;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CAMPO
  // ══════════════════════════════════════════════════════════════════════════

  // Coordenadas JRPG (estilo MAA): posição absoluta em % do campo.
  // Mais ao fundo (top menor) = escala menor (efeito de profundidade).
  const JRPG_POS = {
    jogador: [
      { left: '24%', top: '25%', scale: 0.82 },
      { left: '16%', top: '55%', scale: 0.92 },
      { left: '28%', top: '82%', scale: 1.00 },
    ],
    inimigo: [
      { left: '76%', top: '25%', scale: 0.82 },
      { left: '84%', top: '55%', scale: 0.92 },
      { left: '72%', top: '82%', scale: 1.00 },
    ],
  };

  function _criarCampo() {
    const campo = document.createElement('div');
    campo.id = 'battle-field';

    // Glow central animado
    const glow = document.createElement('div');
    glow.className = 'battle-field-glow';
    campo.appendChild(glow);

    const esq = document.createElement('div');
    esq.id = 'battle-field-left';
    esq.className = 'battle-field-lado';

    const dir = document.createElement('div');
    dir.id = 'battle-field-right';
    dir.className = 'battle-field-lado';

    // Índices separados por lado para mapear para JRPG_POS
    let iJogador = 0, iInimigo = 0;
    for (const c of COMBAT.estado.combatentes) {
      const isAtivo = COMBAT.combatenteAtual()?.id === c.id;
      const idx     = c.lado === 'jogador' ? iJogador++ : iInimigo++;
      const slot    = _criarCharSlot(c, idx, isAtivo);
      if (c.lado === 'jogador') esq.appendChild(slot);
      else                      dir.appendChild(slot);
    }

    campo.appendChild(esq);
    campo.appendChild(dir);
    return campo;
  }

  function _criarCharSlot(c, idx, isAtivo) {
    const { bg } = GRAD_NAIPE[c.naipe] ?? GRAD_NEUTRO;
    const hpPct  = Math.max(0, Math.min(100, (c.hp / c.pvs) * 100));

    // Cor do naipe para o símbolo
    const corNaipe = {
      '♥': '#e06060', '♣': '#5ac880', '♦': '#e8c050', '♠': '#7aade8',
    }[c.naipe] ?? '#c9a84c';

    // Posição JRPG
    const pos   = (JRPG_POS[c.lado] ?? JRPG_POS.inimigo)[idx]
               ?? (JRPG_POS[c.lado] ?? JRPG_POS.inimigo).at(-1);
    const scale = pos.scale;

    const slot = document.createElement('div');
    slot.className = 'battle-char-slot' + (isAtivo ? ' ativo' : '');
    slot.dataset.id   = c.id;
    slot.dataset.lado = c.lado;
    slot.style.left      = pos.left;
    slot.style.top       = pos.top;
    slot.style.zIndex    = idx + 1;
    slot.style.transform = `translate(-50%, -50%) scale(${scale})`;

    slot.innerHTML = `
      <div class="battle-char-grad" style="background:${bg};">
        <span class="battle-char-naipe" style="color:${corNaipe}">${c.naipe ?? '?'}</span>
        <div class="battle-char-nome">${c.nome}</div>
      </div>
      <div class="battle-char-hp-row">
        <div class="battle-char-hp-bar">
          <div class="battle-char-hp-fill" style="width:${hpPct}%"></div>
        </div>
        <div class="battle-char-hp-txt">${c.hp}/${c.pvs}</div>
      </div>
    `;
    return slot;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAINEL
  // ══════════════════════════════════════════════════════════════════════════

  // Re-renderiza só o painel (sem recriar o campo e topbar).
  function _renderizarPainel() {
    const screen = document.getElementById('screen-battle');
    if (!screen) return;
    const velho = document.getElementById('battle-panel');
    if (velho) velho.remove();
    screen.appendChild(_criarPainel());
  }

  function _criarPainel() {
    const painel = document.createElement('div');
    painel.id = 'battle-panel';

    const atual = COMBAT.combatenteAtual();

    // ── Turno do inimigo ──
    if (!atual || atual.lado === 'inimigo') {
      painel.innerHTML = `
        <div class="battle-inimigo-turno">
          <div class="battle-inimigo-turno-titulo">⚔ TURNO DO INIMIGO</div>
          <div class="battle-inimigo-turno-sub">${atual?.nome ?? ''} está agindo...</div>
        </div>
      `;
      return painel;
    }

    // ── Etapa 1: dois botões grandes (50/50) ──
    if (_estadoPainel === 'etapa1') {
      const btnHab = document.createElement('button');
      btnHab.id        = 'battle-btn-habilidades';
      btnHab.className = 'battle-panel-btn-grande';
      btnHab.textContent = '⚔ HABILIDADES';
      btnHab.addEventListener('click', () => {
        _estadoPainel = 'habilidades';
        _renderizarPainel();
      });

      const btnPassar = document.createElement('button');
      btnPassar.id        = 'battle-btn-passar';
      btnPassar.className = 'battle-panel-btn-grande';
      btnPassar.textContent = '⏭ PASSAR A RODADA';
      btnPassar.addEventListener('click', () => _handlePassar(btnPassar));

      painel.appendChild(btnHab);
      painel.appendChild(btnPassar);
      return painel;
    }

    // ── Etapa 2: habilidades (esq) + cartas (dir) ──
    painel.appendChild(_criarPainelHabs(atual));
    painel.appendChild(_criarPainelCartas(atual));
    return painel;
  }

  // ── Painel esquerdo de habilidades ──
  function _criarPainelHabs(combatente) {
    const div = document.createElement('div');
    div.id = 'battle-panel-habs';

    const habs = combatente.habilidades ?? [null, null, null];
    habs.forEach((hab, i) => {
      const btn = document.createElement('button');
      btn.className = 'battle-btn-hab' + (!hab ? ' vazio' : '');
      btn.textContent = hab ? hab.nome : `— SLOT ${i + 1} VAZIO —`;
      // Seleção de habilidade: fluxo de carta + alvo — sessão futura
      div.appendChild(btn);
    });

    const voltar = document.createElement('button');
    voltar.className   = 'battle-btn-voltar';
    voltar.textContent = '← VOLTAR';
    voltar.addEventListener('click', () => {
      _estadoPainel = 'etapa1';
      _renderizarPainel();
    });
    div.appendChild(voltar);

    return div;
  }

  // ── Painel direito de cartas ──
  function _criarPainelCartas(combatente) {
    const div = document.createElement('div');
    div.id = 'battle-panel-cartas';

    // Jogadores usam a mão compartilhada do time
    const mao = combatente?.lado === 'jogador' ? COMBAT.estado.maoJogador : (combatente?.mao ?? []);
    if (mao.length > 0) {
      mao.forEach(carta => {
        const el = document.createElement('div');
        el.className    = 'battle-carta';
        el.dataset.naipe = carta.naipe ?? '';
        el.innerHTML    = `<span class="carta-valor">${carta.label}</span>`;
        div.appendChild(el);
      });
    } else {
      div.innerHTML = `<div class="battle-mao-vazia">—</div>`;
    }

    return div;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TURNO
  // ══════════════════════════════════════════════════════════════════════════

  // Confirmação no próprio botão: 1º clique muda visual, 2º clique executa.
  function _handlePassar(btn) {
    if (!_passarConfirmando) {
      _passarConfirmando = true;
      btn.textContent = '⏭ CONFIRMAR?';
      btn.classList.add('confirmando');
      // Auto-cancela em 3s se não houver 2º clique
      setTimeout(() => {
        if (_passarConfirmando) {
          _passarConfirmando = false;
          btn.textContent = '⏭ PASSAR A RODADA';
          btn.classList.remove('confirmando');
        }
      }, 3000);
    } else {
      _passarConfirmando = false;
      _passarRodada();
    }
  }

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

  function _criarBtnDebug() {
    const btn = document.createElement('button');
    btn.id          = 'battle-btn-debug-vencer';
    btn.textContent = '[ vencer ]';
    btn.addEventListener('click', _vencer);
    return btn;
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
