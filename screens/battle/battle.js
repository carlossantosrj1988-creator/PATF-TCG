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

  let _onVitoria        = null;
  let _aguardando       = false;  // evita double-fire no turno do inimigo
  let _estadoPainel     = 'etapa1'; // 'etapa1' | 'habilidades'
  let _passarConfirmando = false;

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

    const inimigo = INIMIGOS_TUTORIAL[etapaIdx] ?? INIMIGOS_TUTORIAL[0];

    // PLAYER_STATE.personagens usa poolId como id e naipe em português ('ouro', 'copas'…)
    // Converte para o formato do battle: id = poolId, naipe = símbolo (♦ ♥ ♣ ♠)
    const personagens = PLAYER_STATE.personagens.map(p => {
      const sim = _NAIPE_SIM[p.naipe] ?? _NAIPE_SIM[p.naipeAtivo] ?? null;
      return { ...p, id: p.poolId, naipe: sim, naipeAtivo: sim };
    });

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

    // ── Esquerda: turno + deck do jogador ──
    const esq = document.createElement('div');
    esq.className = 'battle-topbar-esq';
    esq.innerHTML = `
      <span class="topbar-turno">TURNO ${turno}</span>
      <span class="topbar-deck">🂠 ${jogador0?.baralho.length ?? 0}</span>
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

    const mao = combatente?.mao ?? [];
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
