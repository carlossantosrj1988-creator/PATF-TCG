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
  // VISUAL POR NAIPE
  // ══════════════════════════════════════════════════════════════════════════

  // Gradiente e borda por naipe — aplicados inline nos slots do campo e na topbar
  const GRAD_NAIPE = {
    '♥': { bg: 'linear-gradient(160deg, #4a0808, #180303)', borda: '#6b000055' },
    '♣': { bg: 'linear-gradient(160deg, #083a08, #030f03)', borda: '#1a5c1a55' },
    '♦': { bg: 'linear-gradient(160deg, #3a2800, #120e00)', borda: '#7a5c0055' },
    '♠': { bg: 'linear-gradient(160deg, #080e28, #030510)', borda: '#1a2a4a55' },
  };
  const GRAD_NEUTRO = { bg: 'linear-gradient(160deg, #1e1e2e, #0d0d18)', borda: '#ffffff18' };

  // ══════════════════════════════════════════════════════════════════════════
  // ESTADO
  // ══════════════════════════════════════════════════════════════════════════

  let _onVitoria         = null;
  let _onDerrota         = null;
  let _pontos            = 0;   // pontos da etapa — exibido na tela de fim
  let _aguardando        = false;  // evita double-fire no turno do inimigo
  // Estado do painel — máquina de estados do fluxo de uso de habilidade:
  // 'etapa1' → 'sel_habilidade' → 'sel_carta' → 'sel_alvo' (ou auto-resolve)
  let _estadoPainel      = 'etapa1';
  let _passarConfirmando = false;
  let _etapaAtual        = 0;  // índice da etapa atual (usado para detectar boss)
  let _habSel            = null;  // habilidade selecionada no fluxo de uso
  let _cartaSel          = null;  // carta selecionada
  let _cartaSelIdx       = -1;    // índice da carta na mão (pra remover via combat.js)
  let _defesaPendente    = null;  // { atacante, decisao, alvoPlayer, dano, onResolve }
  let _defesaSel         = null;  // { tipo: 'passar' | 'carta', idx? } — dupla confirmação
  let _especialPendente  = null;  // { carta, idx } — carta especial em uso (ex: Q aguardando alvo)
  let _statusPopupChar   = null;  // personagem sendo mostrado no popup de status (live update)
  let _isTutorial        = false; // batalha do tutorial — exibe popups explicativos
  let _tutorialIniVisto  = false; // tutorial de iniciativa já foi mostrado
  let _tutorialBatVisto  = false; // tutorial de batalha já foi mostrado

  // ══════════════════════════════════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════════════════════════════════

  // Mapa de naipe (chave em português, igual NAIPES_DATA) → símbolo
  const _NAIPE_SIM = { ouro: '♦', copas: '♥', espadas: '♠', paus: '♣' };

  // opts: { etapaIdx, pontos, inimigos: [resolvedMonster, ...], onVitoria, onDerrota, tutorial }
  function init(opts = {}) {
    _onVitoria         = opts.onVitoria ?? null;
    _onDerrota         = opts.onDerrota ?? null;
    _pontos            = opts.pontos    ?? 0;
    _aguardando        = false;
    _estadoPainel      = 'etapa1';
    _passarConfirmando = false;
    _etapaAtual        = opts.etapaIdx ?? 0;
    _habSel            = null;
    _cartaSel          = null;
    _cartaSelIdx       = -1;
    _defesaPendente    = null;
    _defesaSel         = null;
    _especialPendente  = null;
    _statusPopupChar   = null;
    _isTutorial        = opts.tutorial  ?? false;
    _tutorialIniVisto  = false;
    _tutorialBatVisto  = false;

    const inimigos = opts.inimigos ?? [];

    const personagens = PLAYER_STATE.personagens.map((p, i) => {
      const sim = _NAIPE_SIM[p.naipe] ?? _NAIPE_SIM[p.naipeAtivo] ?? null;
      return { ...p, id: `${p.poolId}_${i}`, naipe: sim, naipeAtivo: sim };
    });

    COMBAT.init(personagens, inimigos);
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
  // TUTORIAL DA BATALHA — popups explicativos na primeira batalha do tutorial
  // ══════════════════════════════════════════════════════════════════════════

  const _TUTORIAL_INI = [
    {
      titulo: 'A mão do time',
      texto:  'Ao iniciar a batalha, são compradas <strong>10 cartas</strong> do deck — essa é a mão compartilhada do seu time. Cada carta tem um valor que vai influenciar a ordem de ação e o poder de ataque.',
    },
    {
      titulo: 'Bônus de naipe',
      texto:  'Cada carta tem um naipe: ♥ ♣ ♦ ♠. Se a carta usada no ataque tiver o <strong>mesmo naipe do personagem</strong>, o valor dela é <strong>dobrado</strong>. Usar as cartas certas nos personagens certos faz diferença.',
    },
    {
      titulo: 'Distribuição de cartas',
      texto:  'Clique em uma carta da mão — ela ficará selecionada. Depois clique no personagem que vai usá-la. Você decide quem recebe qual carta, sem restrição.',
    },
    {
      titulo: 'Confirmar',
      texto:  'Repita para cada personagem. Quando estiver satisfeito, confirme. A ordem de ação é calculada pela carta escolhida somada à iniciativa de cada personagem — quem tiver o maior valor age primeiro.',
    },
  ];

  const _TUTORIAL_BAT = [
    {
      titulo: 'O painel de combate',
      texto:  'À esquerda: dois botões — <strong>Habilidades</strong> para atacar e <strong>Passar</strong> para encerrar o turno. À direita: sua mão está <strong>sempre visível</strong>. Você enxerga todas as suas cartas antes de decidir qualquer coisa.',
    },
    {
      titulo: 'Deck e mão',
      texto:  'O número de cartas no <strong>deck</strong> (🂠) e na <strong>mão</strong> (✋) aparecem na topbar. O limite da mão é <strong>10 cartas</strong> — se passar disso, as excedentes são descartadas automaticamente antes de comprar novas.',
    },
    {
      titulo: 'Turno',
      texto:  'O contador de turno mostra em qual rodada a batalha está. Quanto mais turnos passam, mais os efeitos acumulam — fique de olho.',
    },
    {
      titulo: 'Ordem de iniciativa',
      texto:  'A barra central mostra a sequência de ação de todos os combatentes. Você sempre sabe quem age a seguir — use isso a seu favor.',
    },
    {
      titulo: 'Personagem no campo',
      texto:  'Clique em qualquer personagem no campo para abrir o status completo: habilidades equipadas, passivas ativas, buffs e debuffs em tempo real. Tudo atualizado a cada turno.',
    },
    {
      titulo: 'Tags e ícones',
      texto:  'Nas descrições de habilidades você verá termos destacados como <strong>Queimadura</strong>, <strong>Exposto</strong>, <strong>Enfraquecido</strong>. Clique neles para ver o que fazem. Quando um personagem estiver sob efeito, o ícone aparecerá no slot — clique para ver o efeito e sua duração.',
    },
    {
      titulo: 'Cartas especiais',
      texto:  'Cartas especiais ficam visíveis na mão o tempo todo e podem ser usadas a qualquer momento — <strong>exceto após escolher uma habilidade</strong>, quando só cartas normais são aceitas para potencializá-la.<br><br><strong>Q — Dama:</strong> Remove penalidades de um aliado.<br><strong>K — Rei:</strong> +50% de poder no próximo ataque.<br><strong>A — Ás:</strong> Compra 1 carta extra do deck.<br><strong>★ — Coringa:</strong> Concede uma rodada extra.<br><br><strong>J — Valete:</strong> Aparece na mão mas está reservado para a fase defensiva. Quando o inimigo atacar, clique no Valete para <strong>esquivar</strong> do ataque.',
    },
  ];

  function _mostrarTutorialSequencial(passos, onFim) {
    const screen = document.getElementById('screen-battle');
    let passo = 0;

    function renderPasso() {
      const anterior = document.getElementById('battle-tutorial-overlay');
      if (anterior) anterior.remove();

      const dados  = passos[passo];
      const total  = passos.length;
      const ultimo = passo === total - 1;

      const el = document.createElement('div');
      el.id = 'battle-tutorial-overlay';
      el.innerHTML = `
        <div id="battle-tut-bg"></div>
        <div id="battle-tut-box">
          <div id="battle-tut-step">${passo + 1} / ${total}</div>
          <div id="battle-tut-titulo">${dados.titulo}</div>
          <div id="battle-tut-texto">${dados.texto}</div>
          <button id="battle-tut-btn">${ultimo ? 'ENTENDIDO ▶' : 'PRÓXIMO →'}</button>
        </div>
      `;
      screen.appendChild(el);

      el.querySelector('#battle-tut-btn').addEventListener('click', () => {
        if (ultimo) {
          el.remove();
          if (onFim) onFim();
        } else {
          passo++;
          renderPasso();
        }
      });
    }

    renderPasso();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INICIATIVA — fase de seleção → revelação → combate
  // ══════════════════════════════════════════════════════════════════════════

  const _COR_INI = { '♥': '#e06060', '♣': '#5ac880', '♦': '#e8c050', '♠': '#7aade8' };

  // Tela de seleção: clicar na carta auto-atribui ao primeiro char sem carta.
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
    const maoShared = estado.maoJogador;

    // picks: charId → { idx, carta }
    const picks = {};

    const tela = document.createElement('div');
    tela.id = 'battle-ini-tela';

    // ── Header ──
    const header = document.createElement('div');
    header.id = 'battle-ini-header';
    header.innerHTML = `
      <div class="battle-ini-titulo">⚔ ESCOLHA DE INICIATIVA</div>
      <div class="battle-ini-sub">Clique em uma carta — ela vai para o próximo personagem sem carta</div>
    `;
    tela.appendChild(header);

    // ── Linhas de personagens ──
    const charsDiv = document.createElement('div');
    charsDiv.id = 'battle-ini-chars';
    tela.appendChild(charsDiv);

    // ── Mão compartilhada ──
    const maoDiv = document.createElement('div');
    maoDiv.id = 'battle-ini-mao';
    tela.appendChild(maoDiv);

    // ── Contador de progresso ──
    const lblProgresso = document.createElement('div');
    lblProgresso.id = 'battle-ini-progresso';
    tela.appendChild(lblProgresso);

    // ── Botão confirmar ──
    const btnConfirmar = document.createElement('button');
    btnConfirmar.id          = 'battle-ini-btn-confirmar';
    btnConfirmar.textContent = 'CONFIRMAR INICIATIVA →';
    btnConfirmar.addEventListener('click', () => {
      if (Object.keys(picks).length < jogadores.length) {
        btnConfirmar.classList.add('shake');
        setTimeout(() => btnConfirmar.classList.remove('shake'), 500);
        return;
      }
      tela.remove();
      _confirmarIniciativa(picks);
    });
    tela.appendChild(btnConfirmar);

    screen.appendChild(tela);

    // ── Render helpers ──
    function _renderChars() {
      charsDiv.innerHTML = '';
      for (const c of jogadores) {
        const cor          = _COR_INI[c.naipe] ?? '#888';
        const { bg, borda } = GRAD_NAIPE[c.naipe] ?? GRAD_NEUTRO;
        const pick         = picks[c.id];

        const row = document.createElement('div');
        row.className   = 'battle-ini-char-row' + (pick ? ' com-carta' : '');
        row.dataset.charId = c.id;

        if (pick) {
          const corCarta  = _COR_INI[pick.carta.naipe] ?? '#c9a84c';
          const cartaNaipe = pick.carta.naipe ?? '★';
          const cartaVal   = DECK.valorIniciativa(pick.carta);
          const total      = cartaVal + c.inc;
          row.innerHTML = `
            <div class="bic-card" style="background:${bg}; border-color:${borda};">
              <span class="bic-card-naipe" style="color:${cor}">${c.naipe ?? '?'}</span>
              <span class="bic-card-nome">${c.nome}</span>
            </div>
            <span class="bic-inc">INC +${c.inc}</span>
            <div class="bic-slot atribuida">
              <span class="bic-formula">
                <span style="color:${corCarta}">${pick.carta.valor}${cartaNaipe}</span>
                <span class="bic-formula-plus">(+${c.inc})</span>
                = <strong>${total}</strong>
              </span>
              <button class="bic-limpar">✕</button>
            </div>
          `;
          row.querySelector('.bic-limpar').addEventListener('click', e => {
            e.stopPropagation();
            delete picks[c.id];
            _renderChars();
            _renderCards();
            _atualizarConfirmar();
          });
        } else {
          row.innerHTML = `
            <div class="bic-card" style="background:${bg}; border-color:${borda};">
              <span class="bic-card-naipe" style="color:${cor}">${c.naipe ?? '?'}</span>
              <span class="bic-card-nome">${c.nome}</span>
            </div>
            <span class="bic-inc">INC +${c.inc}</span>
            <div class="bic-slot vazio">— escolha uma carta —</div>
          `;
        }
        charsDiv.appendChild(row);
      }
    }

    function _renderCards() {
      maoDiv.innerHTML = '';
      const usados = new Set(Object.values(picks).map(p => p.idx));
      maoShared.forEach((carta, idx) => {
        const cor   = _COR_INI[carta.naipe] ?? '#c9a84c';
        const naipe = carta.naipe ?? '★';
        const used  = usados.has(idx);
        const btn   = document.createElement('button');
        btn.className    = 'battle-ini-carta' + (used ? ' usada' : '');
        btn.dataset.idx  = idx;
        btn.innerHTML    = `
          <span class="ini-carta-naipe-top" style="color:${cor}">${naipe}</span>
          <span class="ini-carta-val">${carta.valor}</span>
        `;
        if (!used) {
          btn.addEventListener('click', () => {
            // Remove atribuição anterior desta carta, se houver
            for (const [cid, p] of Object.entries(picks)) {
              if (p.idx === idx) { delete picks[cid]; break; }
            }
            // Atribui ao primeiro char sem carta
            const semCarta = jogadores.find(c => picks[c.id] === undefined);
            if (!semCarta) return;
            picks[semCarta.id] = { idx, carta };
            _renderChars();
            _renderCards();
            _atualizarConfirmar();
          });
        }
        maoDiv.appendChild(btn);
      });
    }

    function _atualizarConfirmar() {
      const feitos  = Object.keys(picks).length;
      const prontos = feitos >= jogadores.length;
      btnConfirmar.classList.toggle('pronto', prontos);
      lblProgresso.textContent = `${feitos} / ${jogadores.length} personagens`;
      lblProgresso.classList.toggle('pronto', prontos);
    }

    _renderChars();
    _renderCards();
    _atualizarConfirmar();

    if (_isTutorial && !_tutorialIniVisto) {
      _tutorialIniVisto = true;
      _mostrarTutorialSequencial(_TUTORIAL_INI, null);
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

    // Boss pega carta de maior valor; demais (mob/miniboss) pegam a menor.
    for (const c of estado.combatentes.filter(x => x.lado === 'inimigo')) {
      if (!c.mao.length) continue;
      const ehBoss = c.tipo === 'boss';
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

  // Cinemática de iniciativa — sequência completa: verificação → rattle → ordem definida.
  async function _revelarOrdem() {
    const screen = document.getElementById('screen-battle');
    const estado = COMBAT.estado;
    const ordem  = estado.ordem;

    const overlay = document.createElement('div');
    overlay.id = 'battle-ini-revelar';
    overlay.innerHTML = `
      <div id="battle-ini-rev-bg"></div>
      <div id="battle-ini-rev-content">
        <div id="battle-ini-rev-titulo"></div>
        <div id="battle-ini-rev-lista"></div>
        <div id="battle-ini-rev-divider"></div>
      </div>
    `;
    screen.appendChild(overlay);

    const titleEl = overlay.querySelector('#battle-ini-rev-titulo');
    const lista   = overlay.querySelector('#battle-ini-rev-lista');
    const divider = overlay.querySelector('#battle-ini-rev-divider');

    const _delay = ms => new Promise(r => setTimeout(r, ms));

    // ── Fase 1: VERIFICANDO COMBATENTES ──
    titleEl.textContent = 'VERIFICANDO COMBATENTES...';
    titleEl.classList.add('show');
    await _delay(600);

    // Jogadores primeiro, depois inimigos
    const todos = [
      ...estado.combatentes.filter(c => c.lado === 'jogador'),
      ...estado.combatentes.filter(c => c.lado === 'inimigo'),
    ];
    const rowEls = {}; // charId → DOM row

    for (const c of todos) {
      const cor      = _COR_INI[c.naipe] ?? '#888';
      const ladoCls  = c.lado === 'jogador' ? 'jogador' : 'inimigo';
      const row      = document.createElement('div');
      row.className  = `battle-cine-row ${ladoCls}`;
      row.id         = `cine-row-${c.id}`;
      row.innerHTML  = `
        <span class="cine-row-suit" style="color:${cor}">${c.naipe ?? '?'}</span>
        <span class="cine-row-name">${c.nome.toUpperCase()}</span>
        <span class="cine-row-right" id="cine-score-${c.id}">—</span>
      `;
      lista.appendChild(row);
      rowEls[c.id] = row;

      await _delay(50);
      row.classList.add('show');
      await _delay(200);

      const scoreEl = document.getElementById(`cine-score-${c.id}`);
      if (scoreEl) { scoreEl.textContent = '✔'; scoreEl.className = 'cine-row-right confirm'; }
      await _delay(60);
    }

    await _delay(300);

    // ── Fase 2: ROLANDO INICIATIVA ──
    titleEl.classList.remove('show');
    await _delay(250);
    titleEl.textContent = 'ROLANDO INICIATIVA...';
    titleEl.classList.add('show');
    await _delay(400);

    for (const c of todos) {
      const entry   = ordem.find(e => e.id === c.id);
      if (!entry) continue;
      const scoreEl = document.getElementById(`cine-score-${c.id}`);
      if (!scoreEl) continue;

      scoreEl.className = 'cine-row-right roll';
      for (let i = 0; i < 5; i++) {
        scoreEl.textContent = Math.floor(Math.random() * 20) + 1;
        await _delay(55);
      }
      const total = entry.cartaIniciativa
        ? DECK.valorIniciativa(entry.cartaIniciativa) + entry.inc
        : entry.inc;
      scoreEl.textContent = total;
      await _delay(90);
    }

    await _delay(450);

    // ── Fase 3: Re-ordenar linhas + badges ──
    ordem.forEach((entry, rank) => {
      const rowEl = rowEls[entry.id];
      if (!rowEl) return;
      lista.appendChild(rowEl);

      if (rank === 0) {
        const scoreEl = document.getElementById(`cine-score-${entry.id}`);
        if (scoreEl) scoreEl.className = 'cine-row-right first';
        rowEl.style.borderColor = '#c9a84c';
        rowEl.style.background  = 'rgba(201,168,76,0.07)';
      }

      const badge = document.createElement('span');
      badge.className   = 'cine-order-badge';
      badge.textContent = '#' + (rank + 1);
      rowEl.appendChild(badge);
      setTimeout(() => badge.classList.add('show'), 100 * rank);
    });

    await _delay(250);
    divider.classList.add('show');

    // ── Fase 4: ORDEM DE TURNO DEFINIDA ──
    titleEl.classList.remove('show');
    await _delay(280);
    titleEl.textContent   = 'ORDEM DE TURNO DEFINIDA';
    titleEl.style.animation = 'cine-pulse-gold 2s infinite';
    titleEl.classList.add('show');
    await _delay(1400);

    // Fade out
    overlay.style.transition = 'opacity 0.5s ease';
    overlay.style.opacity    = '0';
    await _delay(500);
    overlay.remove();

    const primeiro = COMBAT.combatenteAtual();
    if (primeiro) _iniciarTurno(primeiro);
    _renderizar();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  function _renderizar() {
    // Fim de batalha tem prioridade sobre tudo
    let resultado = COMBAT.verificarFimDeBatalha();
    if (resultado) { _fimDeBatalha(resultado); return; }

    if (_isTutorial && !_tutorialBatVisto) {
      _tutorialBatVisto = true;
      _mostrarTutorialSequencial(_TUTORIAL_BAT, null);
    }

    // Pula combatentes que morreram no meio do turno — corpo não tem rodada.
    // Se pular pra um novo vivo, inicia o turno dele (iniciarRodada é idempotente).
    let atual = COMBAT.combatenteAtual();
    let pulou = false;
    while (atual && atual.hp <= 0) {
      COMBAT.avancarCombatente();
      pulou = true;
      resultado = COMBAT.verificarFimDeBatalha();
      if (resultado) { _fimDeBatalha(resultado); return; }
      atual = COMBAT.combatenteAtual();
    }
    if (pulou && atual) _iniciarTurno(atual);

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
    screen.appendChild(_criarBtnDebug());

    // Se o turno atual é do inimigo, agenda a ação automática
    if (atual && atual.lado === 'inimigo' && !_aguardando) {
      _aguardando = true;
      setTimeout(_turnoInimigo, 900);
    }

    // Live-update do popup de status, se estiver aberto
    if (_statusPopupChar) _mostrarStatusPersonagem(_statusPopupChar);
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

    // ── Esquerda: turno + deck + mão do jogador ──
    const esq = document.createElement('div');
    esq.className = 'battle-topbar-esq';
    esq.innerHTML = `
      <span class="topbar-turno">TURNO ${turno}</span>
      <span class="topbar-deck">🂠 ${estado.baralhoJogador.length}</span>
      <span class="topbar-mao">✋ ${estado.maoJogador.length}</span>
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
    const hpCor  = hpPct > 60 ? '#55cc88' : hpPct > 30 ? '#e8c050' : '#cc5555';

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

    // Indicador up/down nos stats: comparar atual vs base imutável
    const atqCls = c.atq > (c.atqBase ?? c.atq) ? 'up' : c.atq < (c.atqBase ?? c.atq) ? 'down' : '';
    const defCls = c.def > (c.defBase ?? c.def) ? 'up' : c.def < (c.defBase ?? c.def) ? 'down' : '';

    slot.innerHTML = `
      <div class="battle-char-grad" style="background:${bg};">
        <span class="battle-char-naipe" style="color:${corNaipe}">${c.naipe ?? '?'}</span>
        <div class="battle-char-nome">${c.nome}</div>
      </div>
      <div class="battle-char-hp-row">
        <div class="battle-char-hp-bar">
          <div class="battle-char-hp-fill" style="width:${hpPct}%;background:${hpCor}"></div>
        </div>
        <div class="battle-char-hp-txt">${c.hp}/${c.pvs}</div>
      </div>
      <div class="battle-char-stats">
        <div class="bcs-item"><span class="bcs-l">ATQ</span><span class="bcs-v ${atqCls}">${c.atq}</span></div>
        <div class="bcs-item"><span class="bcs-l">DEF</span><span class="bcs-v ${defCls}">${c.def}</span></div>
        <div class="bcs-item"><span class="bcs-l">HP</span><span class="bcs-v">${c.hp}</span></div>
      </div>
    `;

    // Clicável como alvo quando o fluxo está em 'sel_alvo' (habilidade alvo único)
    if (_estadoPainel === 'sel_alvo' && _habSel) {
      const atacante = COMBAT.combatenteAtual();
      if (_alvoValido(c, _habSel, atacante)) {
        slot.classList.add('selecionavel');
        slot.addEventListener('click', () => _executarAcao([c]));
      }
    }
    // Clicável como aliado quando carta especial Q (Dama) está aguardando alvo
    else if (_estadoPainel === 'sel_alvo_especial' && _especialPendente?.carta?.valor === 'Q') {
      const atacante = COMBAT.combatenteAtual();
      if (c.lado === atacante.lado && c.hp > 0) {
        slot.classList.add('selecionavel');
        slot.addEventListener('click', () => _resolverDama(c));
      }
    }
    // Fora de seleção: clique abre popup de status do personagem (informativo).
    else {
      slot.style.cursor = 'pointer';
      slot.addEventListener('click', () => _mostrarStatusPersonagem(c));
    }

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

    // ── Defesa pendente: interrompe o fluxo normal ──
    if (_defesaPendente) {
      painel.appendChild(_criarPainelDefesaEsq());
      painel.appendChild(_criarPainelDefesaDir());
      return painel;
    }

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

    // ── Etapa 1: esq=HABILIDADES+PASSAR, dir=mão completa (especiais clicáveis) ──
    if (_estadoPainel === 'etapa1') {
      painel.appendChild(_criarPainelBotoesEtapa1());
      painel.appendChild(_criarPainelSelEspecial(atual));
      return painel;
    }

    // ── Sel especial: mão da carta (só especiais clicáveis; J grayed — defesa-only) ──
    if (_estadoPainel === 'sel_especial') {
      painel.appendChild(_criarPainelInfoEspecial());
      painel.appendChild(_criarPainelSelEspecial(atual));
      return painel;
    }

    // ── Sel alvo especial: aguarda clique num aliado (Q remove debuff) ──
    if (_estadoPainel === 'sel_alvo_especial') {
      painel.appendChild(_criarPainelResumoEspecial());
      painel.appendChild(_criarPainelInfo('Toque num aliado.'));
      return painel;
    }

    // ── Sel habilidade: lista habilidades (esq) + mão completa (dir, especiais clicáveis) ──
    if (_estadoPainel === 'sel_habilidade') {
      painel.appendChild(_criarPainelSelHab(atual));
      painel.appendChild(_criarPainelSelEspecial(atual));
      return painel;
    }

    // ── Sel carta: ficha da habilidade (esq) + só cartas normais clicáveis (dir) ──
    if (_estadoPainel === 'sel_carta') {
      painel.appendChild(_criarPainelHabDetalhe(_habSel));
      painel.appendChild(_criarPainelMaoNormais(atual));
      return painel;
    }

    // ── Sel alvo: resumo da seleção + aguarda clique num personagem do campo ──
    if (_estadoPainel === 'sel_alvo') {
      painel.appendChild(_criarPainelResumo(_habSel, _cartaSel));
      painel.appendChild(_criarPainelInfo('Toque num alvo no campo.'));
      return painel;
    }

    return painel;
  }

  // ── Painel esquerdo de etapa1: HABILIDADES + PASSAR ──
  function _criarPainelBotoesEtapa1() {
    const div = document.createElement('div');
    div.id = 'battle-panel-habs';

    const btnHab = document.createElement('button');
    btnHab.id        = 'battle-btn-habilidades';
    btnHab.className = 'battle-btn-hab';
    btnHab.textContent = '⚔  HABILIDADES';
    btnHab.addEventListener('click', () => {
      _estadoPainel = 'sel_habilidade';
      _renderizar();
    });

    const btnPassar = document.createElement('button');
    btnPassar.id        = 'battle-btn-passar';
    btnPassar.className = 'battle-btn-hab';
    btnPassar.style.color       = '#8899aa';
    btnPassar.style.borderColor = '#ffffff12';
    btnPassar.textContent = '⏭  PASSAR';
    btnPassar.addEventListener('click', () => _handlePassar(btnPassar));

    div.appendChild(btnHab);
    div.appendChild(btnPassar);
    return div;
  }

  // ── Painel esquerdo: lista das habilidades equipadas (selecionável) ──
  function _criarPainelSelHab(combatente) {
    const div = document.createElement('div');
    div.id = 'battle-panel-habs';

    const habs = combatente.habilidades ?? [null, null, null];
    habs.forEach((hab, i) => {
      const btn = document.createElement('button');
      btn.className = 'battle-btn-hab' + (!hab ? ' vazio' : '');
      if (hab) {
        const cd = combatente.cooldowns[hab._id] ?? 0;
        btn.textContent = cd > 0 ? `${hab.nome} (${cd})` : hab.nome;
        if (cd > 0) {
          btn.disabled = true;
          btn.classList.add('em-recarga');
        } else {
          btn.addEventListener('click', () => {
            _habSel = hab;
            _estadoPainel = 'sel_carta';
            _renderizar();
          });
        }
      } else {
        btn.textContent = `— SLOT ${i + 1} VAZIO —`;
        btn.disabled = true;
      }
      div.appendChild(btn);
    });

    const voltar = document.createElement('button');
    voltar.className   = 'battle-btn-voltar';
    voltar.textContent = '← VOLTAR';
    voltar.addEventListener('click', () => {
      _estadoPainel = 'etapa1';
      _renderizar();
    });
    div.appendChild(voltar);

    return div;
  }

  // ── Painel direito: mão de cartas (clicável ou somente visual) ──
  function _criarPainelMaoView(combatente, clicavel) {
    const div = document.createElement('div');
    div.id = 'battle-panel-cartas';

    const mao = combatente.lado === 'jogador' ? COMBAT.estado.maoJogador : (combatente.mao ?? []);
    if (!mao || mao.length === 0) {
      div.innerHTML = `<div class="battle-mao-vazia">—</div>`;
      return div;
    }

    mao.forEach((carta, i) => {
      const el = document.createElement('button');
      el.className = 'battle-carta' + (clicavel ? '' : ' nao-clicavel');
      el.dataset.naipe = carta.naipe ?? '';
      el.innerHTML = `<span class="carta-valor">${carta.label}</span>`;
      if (clicavel) {
        el.addEventListener('click', () => {
          _cartaSel    = carta;
          _cartaSelIdx = i;
          const alvosAuto = _calcularAlvosAuto(_habSel, combatente);
          if (alvosAuto) {
            _executarAcao(alvosAuto);
          } else {
            _estadoPainel = 'sel_alvo';
            _renderizar();
          }
        });
      } else {
        el.disabled = true;
      }
      div.appendChild(el);
    });

    return div;
  }

  // ── Painel direito (sel_carta): só cartas normais clicáveis; especiais/J grayed ──
  function _criarPainelMaoNormais(combatente) {
    const div = document.createElement('div');
    div.id = 'battle-panel-cartas';

    const mao = combatente.lado === 'jogador' ? COMBAT.estado.maoJogador : (combatente.mao ?? []);
    if (!mao || mao.length === 0) {
      div.innerHTML = `<div class="battle-mao-vazia">—</div>`;
      return div;
    }

    mao.forEach((carta, i) => {
      const ehEspecial = carta.tipo === 'especial' || carta.tipo === 'coringa' || carta.valor === 'J';
      const el = document.createElement('button');
      el.className = 'battle-carta' + (ehEspecial ? ' nao-clicavel' : '');
      el.dataset.naipe = carta.naipe ?? '';
      el.innerHTML = `<span class="carta-valor">${carta.label}</span>`;
      if (ehEspecial) {
        el.disabled = true;
      } else {
        el.addEventListener('click', () => {
          _cartaSel    = carta;
          _cartaSelIdx = i;
          const alvosAuto = _calcularAlvosAuto(_habSel, combatente);
          if (alvosAuto) {
            _executarAcao(alvosAuto);
          } else {
            _estadoPainel = 'sel_alvo';
            _renderizar();
          }
        });
      }
      div.appendChild(el);
    });

    return div;
  }

  // ── Painel esquerdo: ficha completa da habilidade selecionada + ← VOLTAR ──
  function _criarPainelHabDetalhe(hab) {
    const div = document.createElement('div');
    div.id = 'battle-panel-habs';
    div.classList.add('detalhe');

    const ALVO_LABEL = { unico: 'Único', inimigos: 'Inimigos', aliados: 'Aliados', self: 'Si próprio', todos: 'Todos' };
    const ACAO_LABEL = { N: 'Normal', R: 'Rápida', F: 'Furtiva', L: 'Lenta' };

    const poderTxt = hab.efeitoPuro ? 'EFEITO' : (hab.poder ?? 0);
    const alvoTxt  = ALVO_LABEL[hab.alvo] || hab.alvo || '—';
    const acaoTxt  = ACAO_LABEL[hab.acao] || hab.acao || '—';
    const recTxt   = hab.recarga ?? 0;
    const turnoTxt = hab.turno === 'nao' ? 'NÃO' : 'SIM';

    div.innerHTML = `
      <div class="battle-hab-detalhe-nome">${hab.nome}</div>
      <div class="battle-hab-detalhe-ficha">
        <span><b>PODER</b> ${poderTxt}</span>
        <span><b>TIPO</b> ${hab.tipo || '—'}</span>
        <span><b>ALVO</b> ${alvoTxt}</span>
        <span><b>TURNO</b> ${turnoTxt}</span>
        <span><b>RECARGA</b> ${recTxt}</span>
        <span><b>AÇÃO</b> ${acaoTxt}</span>
      </div>
      <div class="battle-hab-detalhe-desc">${EFEITOS.destacar(hab.descricao || '—')}</div>
    `;

    const voltar = document.createElement('button');
    voltar.className   = 'battle-btn-voltar';
    voltar.textContent = '← VOLTAR';
    voltar.addEventListener('click', () => {
      _habSel       = null;
      _estadoPainel = 'sel_habilidade';
      _renderizar();
    });
    div.appendChild(voltar);

    return div;
  }

  // ── Painel esquerdo modo resumo: habilidade (+ carta) + ← VOLTAR ──
  function _criarPainelResumo(hab, carta) {
    const div = document.createElement('div');
    div.id = 'battle-panel-habs';

    const linhaHab = document.createElement('div');
    linhaHab.className = 'battle-resumo-linha';
    linhaHab.innerHTML = `<span class="battle-resumo-l">HABILIDADE</span><span class="battle-resumo-v">${hab.nome}</span>`;
    div.appendChild(linhaHab);

    if (carta) {
      const corCarta = _COR_INI[carta.naipe] ?? '#c9a84c';
      const linhaCarta = document.createElement('div');
      linhaCarta.className = 'battle-resumo-linha';
      linhaCarta.innerHTML = `<span class="battle-resumo-l">CARTA</span><span class="battle-resumo-v" style="color:${corCarta}">${carta.label}</span>`;
      div.appendChild(linhaCarta);
    }

    const voltar = document.createElement('button');
    voltar.className   = 'battle-btn-voltar';
    voltar.textContent = '← VOLTAR';
    voltar.addEventListener('click', () => {
      // Resumo é usado só em sel_alvo — volta pra sel_carta liberando a carta
      _cartaSel     = null;
      _cartaSelIdx  = -1;
      _estadoPainel = 'sel_carta';
      _renderizar();
    });
    div.appendChild(voltar);

    return div;
  }

  // ── Painel direito modo info: texto centrado (ex: "Toque num alvo") ──
  function _criarPainelInfo(texto) {
    const div = document.createElement('div');
    div.id = 'battle-panel-cartas';
    div.innerHTML = `<div class="battle-mao-vazia">${texto}</div>`;
    return div;
  }

  // ── Especial esquerda (sel_especial): texto de orientação + ← VOLTAR ──
  function _criarPainelInfoEspecial() {
    const div = document.createElement('div');
    div.id = 'battle-panel-habs';
    div.classList.add('detalhe');

    div.innerHTML = `
      <div class="battle-defesa-titulo" style="color:#c9a84c;">✦ CARTA ESPECIAL</div>
      <div class="battle-defesa-info">
        Escolha uma carta especial pra usar.<br>
        <span style="color:#888;font-size:9px;">J fica pra defesa.</span>
      </div>
    `;

    const voltar = document.createElement('button');
    voltar.className   = 'battle-btn-voltar';
    voltar.textContent = '← VOLTAR';
    voltar.addEventListener('click', () => {
      _estadoPainel = 'etapa1';
      _renderizar();
    });
    div.appendChild(voltar);

    return div;
  }

  // ── Especial direita: cartas da mão — só Q/K/A/★ clicáveis (J é defesa-only) ──
  function _criarPainelSelEspecial(combatente) {
    const div = document.createElement('div');
    div.id = 'battle-panel-cartas';

    const mao = COMBAT.estado.maoJogador;
    if (!mao || mao.length === 0) {
      div.innerHTML = `<div class="battle-mao-vazia">Mão vazia.</div>`;
      return div;
    }

    mao.forEach((carta, i) => {
      const ehJ        = carta.valor === 'J';
      const ehEspecial = carta.tipo === 'especial' || carta.tipo === 'coringa';
      const clicavel   = ehEspecial && !ehJ;

      const el = document.createElement('button');
      el.className = 'battle-carta' + (clicavel ? '' : ' nao-clicavel');
      el.dataset.naipe = carta.naipe ?? '';
      el.innerHTML = `<span class="carta-valor">${carta.label}</span>`;
      if (clicavel) {
        el.addEventListener('click', () => _usarEspecial(carta, i));
      } else {
        el.disabled = true;
      }
      div.appendChild(el);
    });

    return div;
  }

  // ── Especial esquerda (sel_alvo_especial): resumo da carta + ← VOLTAR ──
  function _criarPainelResumoEspecial() {
    const div = document.createElement('div');
    div.id = 'battle-panel-habs';
    div.classList.add('detalhe');

    const c = _especialPendente?.carta;
    const corCarta = _COR_INI[c?.naipe] ?? '#c9a84c';

    div.innerHTML = `
      <div class="battle-defesa-titulo" style="color:#c9a84c;">✦ CARTA ESPECIAL</div>
      <div class="battle-defesa-info">
        Usando <strong style="color:${corCarta}">${c?.label ?? '?'}</strong>
      </div>
    `;

    const voltar = document.createElement('button');
    voltar.className   = 'battle-btn-voltar';
    voltar.textContent = '← VOLTAR';
    voltar.addEventListener('click', () => {
      _especialPendente = null;
      _estadoPainel = 'sel_especial';
      _renderizar();
    });
    div.appendChild(voltar);

    return div;
  }

  // ── Defesa esquerda: atacante + alvo atual + dano + PASSAR (dupla confirmação) ──
  function _criarPainelDefesaEsq() {
    const div = document.createElement('div');
    div.id = 'battle-panel-habs';
    div.classList.add('detalhe');

    const { atacante, alvoAtual, dano, total, fila } = _defesaPendente;
    const corAt = _COR_INI[atacante.naipe] ?? '#cc7777';

    // Conta posição atual na fila (1-based). fila.length é o que SOBRA depois
    // do atual ter sido tirado, então: posicao = total - fila.length.
    const tituloSufixo = total > 1 ? ` ${total - fila.length}/${total}` : '';

    div.innerHTML = `
      <div class="battle-defesa-titulo">⚠ DEFENDER${tituloSufixo}</div>
      <div class="battle-defesa-info">
        <span style="color:${corAt}">${atacante.nome}</span>
        ataca <strong>${alvoAtual.nome}</strong>
      </div>
      <div class="battle-defesa-dano">Causará <strong>${dano}</strong> de dano</div>
    `;

    const passarSel = _defesaSel && _defesaSel.tipo === 'passar';
    const btnPassar = document.createElement('button');
    btnPassar.id        = 'battle-btn-passar';
    btnPassar.className = 'battle-defesa-passar' + (passarSel ? ' confirmando' : '');
    btnPassar.textContent = passarSel ? '⏭ CONFIRMAR PASSAR' : '⏭ PASSAR (sem defesa)';
    btnPassar.addEventListener('click', () => _selecionarDefesa({ tipo: 'passar' }));
    div.appendChild(btnPassar);

    return div;
  }

  // ── Defesa direita: cartas da mão (clica → seleciona → clica de novo → confirma) ──
  // J = esquiva total (clicável). Outros especiais (Q/K/A/★) = sem efeito defensivo (grayed).
  // Cartas já reservadas por jogadores anteriores na mesma área ficam grayed.
  function _criarPainelDefesaDir() {
    const div = document.createElement('div');
    div.id = 'battle-panel-cartas';

    const mao = COMBAT.estado.maoJogador;
    if (!mao || mao.length === 0) {
      div.innerHTML = `<div class="battle-mao-vazia">Sem cartas — clica em PASSAR</div>`;
      return div;
    }

    const reservadas = new Set(
      Object.values(_defesaPendente.defesasColetadas).filter(c => c)
    );

    mao.forEach((carta, i) => {
      const sel         = _defesaSel && _defesaSel.tipo === 'carta' && _defesaSel.idx === i;
      const reservada   = reservadas.has(carta);
      const ehJ         = carta.valor === 'J';
      // Outros especiais (Q/K/A/★) não têm efeito defensivo — ficam grayed
      const ehOutroEsp  = !ehJ && DECK.ehEspecial(carta);
      const bloqueada   = reservada || ehOutroEsp;

      const el = document.createElement('button');
      el.className = 'battle-carta'
        + (sel      ? ' selecionada' : '')
        + (bloqueada ? ' nao-clicavel' : '');
      el.dataset.naipe = carta.naipe ?? '';

      // Label especial para J (esquiva) e outros especiais (sem efeito)
      const extraLabel = ehJ
        ? `<span class="carta-def-label esquiva">ESQUIVA</span>`
        : ehOutroEsp
          ? `<span class="carta-def-label sem-efeito">SEM EFEITO</span>`
          : '';

      el.innerHTML = `<span class="carta-valor">${carta.label}</span>${extraLabel}`;

      if (bloqueada) {
        el.disabled = true;
      } else {
        el.addEventListener('click', () => _selecionarDefesa({ tipo: 'carta', idx: i }));
      }
      div.appendChild(el);
    });

    return div;
  }

  // ── Cálculo de alvos / executor ───────────────────────────────────────────

  // Retorna array de alvos quando a habilidade tem alvo automático,
  // ou null quando precisa de clique no campo.
  function _calcularAlvosAuto(hab, atacante) {
    const estado = COMBAT.estado;
    switch (hab.alvo) {
      case 'inimigos':
        return estado.combatentes.filter(c => c.lado !== atacante.lado && c.hp > 0);
      case 'aliados':
        return estado.combatentes.filter(c => c.lado === atacante.lado && c.hp > 0);
      case 'self':
        return [atacante];
      case 'todos':
        return estado.combatentes.filter(c => c.hp > 0);
      case 'unico':
      default:
        return null;
    }
  }

  // Para alvo 'unico' (clicável), atacante quer um inimigo vivo.
  function _alvoValido(c, hab, atacante) {
    if (!c || c.hp <= 0) return false;
    if (hab.alvo === 'unico') return c.lado !== atacante.lado;
    return false;
  }

  function _executarAcao(alvos) {
    const atacante = COMBAT.combatenteAtual();
    if (!atacante || !_habSel) return;
    COMBAT.resolverAcao(atacante, _habSel, _cartaSelIdx, alvos);
    _finalizarTurno(atacante);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CARTAS ESPECIAIS — Q/K/A/★ usadas como ação própria do jogador
  // ══════════════════════════════════════════════════════════════════════════

  // Tira a carta da mão compartilhada e manda pro descarte.
  function _consumirEspecialDaMao(idx) {
    const mao = COMBAT.estado.maoJogador;
    const carta = mao.splice(idx, 1)[0];
    if (carta) COMBAT.estado.descarteJogador.push(carta);
    return carta;
  }

  // Dispatcher: identifica a especial e roteia. Q vai pra alvo; resto resolve.
  // K/A/Q/★ são INSTANTÂNEAS — não consomem o turno. Pode usar quantas quiser.
  function _usarEspecial(carta, idx) {
    const c = COMBAT.combatenteAtual();
    if (!c) return;

    if (carta.valor === 'Q') {
      // Q precisa de alvo aliado — vai pra sel_alvo_especial, consome depois
      _especialPendente = { carta, idx };
      _estadoPainel = 'sel_alvo_especial';
      _renderizar();
      return;
    }

    // K, A, ★ resolvem como ação rápida (sem avançar turno)
    _consumirEspecialDaMao(idx);
    if (carta.valor === 'K') {
      // Rei: +10 de bônus no próximo ataque (valor fixo do efeito do Rei)
      c.efeitos.push({ tipo: 'rei_atq_bonus', valor: 10, duracao: 1 });
    } else if (carta.valor === 'A') {
      // Ás: compra 1 carta do baralho compartilhado
      COMBAT.comprarCarta(c, 1);
    } else if (carta.valor === '★') {
      // Coringa: injeta rodada extra na fila imediatamente após a posição atual
      const estado = COMBAT.estado;
      estado.ordem.splice(estado.indiceAtual + 1, 0, c);
    }

    // Instantânea: volta pra etapa1 sem avançar turno
    _estadoPainel      = 'etapa1';
    _habSel            = null;
    _cartaSel          = null;
    _cartaSelIdx       = -1;
    _especialPendente  = null;
    _passarConfirmando = false;
    _renderizar();
  }

  // Q — Dama: remove TODOS os efeitos negativos do aliado escolhido (instantânea).
  // Chamado quando o jogador clica num aliado em sel_alvo_especial.
  function _resolverDama(alvoAliado) {
    const c = COMBAT.combatenteAtual();
    if (!c || !_especialPendente) return;
    _consumirEspecialDaMao(_especialPendente.idx);

    // Remove todos os efeitos negativos do aliado
    const _NEGATIVOS = new Set(['dot', 'frozen', 'stun', 'amaciado', 'encantado',
      'derretar_armadura', 'estatica', 'imagem_espelhada']);
    alvoAliado.efeitos = (alvoAliado.efeitos ?? []).filter(e =>
      !e.tipo.startsWith('debuff_') && !_NEGATIVOS.has(e.tipo)
    );
    PASSIVAS.recalcularStats(alvoAliado);

    _especialPendente = null;

    // Instantânea: volta pra etapa1 sem avançar turno
    _estadoPainel      = 'etapa1';
    _habSel            = null;
    _cartaSel          = null;
    _cartaSelIdx       = -1;
    _passarConfirmando = false;
    _renderizar();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STATUS POPUP — clica no personagem em batalha para inspeção informativa
  // ══════════════════════════════════════════════════════════════════════════

  // Ciclo de vantagem de naipe (espelha damage.js / naipes-mecanicas)
  const _NAIPE_VENCE = { '♥': '♣', '♣': '♦', '♦': '♠', '♠': '♥' };
  const _NAIPE_PERDE = { '♥': '♠', '♣': '♥', '♦': '♣', '♠': '♦' };
  const _NAIPE_NOME  = { '♥': '♥ Copas', '♣': '♣ Paus', '♦': '♦ Ouro', '♠': '♠ Espadas' };

  // Rótulo humano de um efeito ativo (usa nome do registry quando possível)
  function _efeitoLabel(e) {
    if (e._origem && typeof EFEITOS !== 'undefined') {
      const ef = EFEITOS.get(e._origem);
      if (ef && ef.nome) return ef.nome;
    }
    const map = {
      dot:            'Dano por turno',
      buff_atq:       '+ATQ',  debuff_atq: '−ATQ',
      buff_def:       '+DEF',  debuff_def: '−DEF',
      frozen:         'Congelado',
      stun:           'Atordoado',
      amaciado:       'Amaciado',
      odio_bonus:     'Ódio',
      rei_atq_bonus:  'Bônus de Rei',
    };
    return map[e.tipo] || e.tipo;
  }

  function _classeEfeito(e) {
    if (e.tipo.startsWith('buff'))   return 'buff';
    if (e.tipo.startsWith('debuff')) return 'debuff';
    if (e.tipo === 'dot' || e.tipo === 'frozen' || e.tipo === 'stun') return 'debuff';
    return 'neutro';
  }

  // Renderiza (ou re-renderiza) o popup de status pro combatente c.
  // Re-chamado em _renderizar se _statusPopupChar estiver setado (live update).
  function _mostrarStatusPersonagem(c) {
    _statusPopupChar = c;
    const existente = document.getElementById('battle-status-popup');
    if (existente) existente.remove();

    const screen = document.getElementById('screen-battle');
    if (!screen || !c) return;

    const corNaipe  = _COR_INI[c.naipe] ?? '#c9a84c';
    const naipeLbl  = _NAIPE_NOME[c.naipe] ?? '— sem naipe';
    const venceN    = c.naipe ? _NAIPE_VENCE[c.naipe] : null;
    const perdeN    = c.naipe ? _NAIPE_PERDE[c.naipe] : null;

    const atqCls = c.atq > (c.atqBase ?? c.atq) ? 'up' : c.atq < (c.atqBase ?? c.atq) ? 'down' : '';
    const defCls = c.def > (c.defBase ?? c.def) ? 'up' : c.def < (c.defBase ?? c.def) ? 'down' : '';
    const incCls = c.inc > (c.incBase ?? c.inc) ? 'up' : c.inc < (c.incBase ?? c.inc) ? 'down' : '';

    const hpPct = Math.max(0, Math.min(100, (c.hp / c.pvs) * 100));
    const hpCor = hpPct > 60 ? '#55cc88' : hpPct > 30 ? '#e8c050' : '#cc5555';

    // Habilidades slotadas
    const habsHtml = (c.habilidades || []).map((h, i) => {
      if (!h) return `<div class="bsp-skill vazio">— slot ${i + 1} vazio —</div>`;
      const cd = c.cooldowns[h._id] ?? 0;
      const tag = cd > 0 ? ` <span class="bsp-skill-cd">recarga ${cd}</span>` : '';
      return `
        <div class="bsp-skill">
          <div class="bsp-skill-nome">${h.nome}${tag}</div>
          <div class="bsp-skill-desc">${EFEITOS.destacar(h.descricao || '—')}</div>
        </div>`;
    }).join('');

    // Passivas slotadas
    const passivasHtml = (c.passivas || []).map((pid, i) => {
      if (!pid) return `<div class="bsp-passiva vazio">— slot ${i + 1} vazio —</div>`;
      const p = HABILIDADES.getPassiva(pid);
      return `
        <div class="bsp-passiva">
          <div class="bsp-passiva-nome">${p.nome}</div>
          <div class="bsp-passiva-desc">${EFEITOS.destacar(p.descricao || '—')}</div>
        </div>`;
    }).join('');

    // Efeitos ativos
    const efeitosAtivos = (c.efeitos || []).filter(e => (e.duracao ?? 0) > 0);
    const efeitosHtml = efeitosAtivos.length === 0
      ? '<div class="bsp-empty">Sem efeitos ativos.</div>'
      : efeitosAtivos.map(e => `
          <div class="bsp-efeito ${_classeEfeito(e)}">
            <span class="bsp-efeito-nome">${_efeitoLabel(e)}</span>
            <span class="bsp-efeito-dur">${e.duracao}t</span>
          </div>
        `).join('');

    const popup = document.createElement('div');
    popup.id = 'battle-status-popup';
    popup.innerHTML = `
      <div id="battle-status-overlay"></div>
      <div id="battle-status-box">
        <button class="bsp-fechar" aria-label="Fechar">×</button>
        <div class="bsp-cabecalho">
          <span class="bsp-naipe" style="color:${corNaipe}">${c.naipe ?? '?'}</span>
          <div class="bsp-cab-nome">
            <div class="bsp-nome">${c.nome}</div>
            <div class="bsp-naipe-label" style="color:${corNaipe}aa">${naipeLbl}</div>
          </div>
        </div>
        ${venceN ? `
          <div class="bsp-vantagens">
            <div class="bsp-vant"><span class="bsp-tag-vant">VANTAGEM</span> contra <strong style="color:${_COR_INI[venceN] ?? '#888'}">${venceN}</strong></div>
            <div class="bsp-desv"><span class="bsp-tag-desv">DESVANTAGEM</span> contra <strong style="color:${_COR_INI[perdeN] ?? '#888'}">${perdeN}</strong></div>
          </div>` : ''}
        <div class="bsp-stats">
          <div class="bsp-stat"><span class="bsp-stat-l">ATQ</span><span class="bsp-stat-v ${atqCls}">${c.atq}</span></div>
          <div class="bsp-stat"><span class="bsp-stat-l">DEF</span><span class="bsp-stat-v ${defCls}">${c.def}</span></div>
          <div class="bsp-stat"><span class="bsp-stat-l">INC</span><span class="bsp-stat-v ${incCls}">${c.inc}</span></div>
        </div>
        <div class="bsp-hp">
          <div class="bsp-hp-bar"><div class="bsp-hp-fill" style="width:${hpPct}%;background:${hpCor}"></div></div>
          <div class="bsp-hp-txt">${c.hp} / ${c.pvs}</div>
        </div>
        <div class="bsp-secao">
          <div class="bsp-secao-titulo">HABILIDADES</div>
          ${habsHtml || '<div class="bsp-empty">Sem habilidades equipadas.</div>'}
        </div>
        <div class="bsp-secao">
          <div class="bsp-secao-titulo">PASSIVAS</div>
          ${passivasHtml || '<div class="bsp-empty">Sem passivas equipadas.</div>'}
        </div>
        <div class="bsp-secao">
          <div class="bsp-secao-titulo">EFEITOS ATIVOS</div>
          <div class="bsp-efeitos-lista">${efeitosHtml}</div>
        </div>
      </div>
    `;

    screen.appendChild(popup);

    const fechar = () => { popup.remove(); _statusPopupChar = null; };
    popup.querySelector('.bsp-fechar').addEventListener('click', fechar);
    popup.querySelector('#battle-status-overlay').addEventListener('click', fechar);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INICIAR / FINALIZAR TURNO
  // ══════════════════════════════════════════════════════════════════════════

  // Inicia o turno de um combatente: Início (deduce + DoT, once) + Etapa 1
  // (tick passivas + recalc + stun check). iniciarRodada é idempotente
  // (não dispara duas vezes pro mesmo turno).
  function _iniciarTurno(c) {
    if (!c || c.hp <= 0) return;
    COMBAT.iniciarRodada(c);
    COMBAT.rodarEtapa1(c);
    // (Se podeAgir for false por stun, ainda assim deixamos o turno seguir;
    // o resto da lógica de pular ação fica pra A.2 quando Congelado/Atordoado
    // existirem como efeitos registrados.)
  }

  // Finaliza o turno: roda etapa5 (fim de rodada), avança combatente e renderiza.
  function _finalizarTurno(c) {
    COMBAT.etapa5_fimRodada(c);
    COMBAT.avancarCombatente();
    const proximo = COMBAT.combatenteAtual();
    if (proximo) _iniciarTurno(proximo);
    _aguardando        = false;
    _estadoPainel      = 'etapa1';
    _habSel            = null;
    _cartaSel          = null;
    _cartaSelIdx       = -1;
    _especialPendente  = null;
    _passarConfirmando = false;
    _renderizar();
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
          btn.textContent = '⏭  PASSAR';
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
    // iniciarRodada já foi chamado em _iniciarTurno quando o turno começou.
    COMBAT.passarRodada(c);
    _finalizarTurno(c);
  }

  function _criarBtnDebug() {
    const frag = document.createDocumentFragment();

    const vencer = document.createElement('button');
    vencer.id          = 'battle-btn-debug-vencer';
    vencer.textContent = '[ vencer ]';
    vencer.addEventListener('click', _vencer);
    frag.appendChild(vencer);

    const perder = document.createElement('button');
    perder.id          = 'battle-btn-debug-perder';
    perder.textContent = '[ perder ]';
    perder.addEventListener('click', () => _fimDeBatalha('derrota'));
    frag.appendChild(perder);

    return frag;
  }

  // Turno do inimigo: IA decide; se for ataque de dano em jogador (alvo único),
  // mostra a tela de defesa antes de resolver. Outros casos resolvem direto.
  // iniciarRodada já foi chamado em _iniciarTurno quando o turno começou.
  function _turnoInimigo() {
    const c = COMBAT.combatenteAtual();
    if (!c || c.lado !== 'inimigo') {
      _aguardando = false;
      return;
    }

    const decisao = IA.decidir(c);
    if (!decisao || !decisao.hab) {
      COMBAT.passarRodada(c);
      _finalizarTurno(c);
      return;
    }

    // Tela de defesa pra qualquer ataque de dano que atinja jogador(es).
    // Área dispara defesa por alvo, em sequência (cada um escolhe).
    const alvosPlayer = decisao.alvos.filter(a => a.lado === 'jogador' && a.hp > 0);
    const ehAtaqueComDefesa = !decisao.hab.efeitoPuro && alvosPlayer.length > 0;

    if (ehAtaqueComDefesa) {
      _iniciarDefesa(c, decisao, alvosPlayer);
    } else {
      COMBAT.resolverAcao(c, decisao.hab, decisao.cartaIdx, decisao.alvos);
      _finalizarTurno(c);
    }
  }

  // Configura a tela de defesa: vira uma fila de alvos jogador (1 ou mais).
  // Cada confirmação avança pro próximo. Quando a fila esvazia, resolve.
  function _iniciarDefesa(atacante, decisao, alvosPlayer) {
    _defesaPendente = {
      atacante, decisao,
      fila:              [...alvosPlayer],  // alvos restantes pra defender
      total:             alvosPlayer.length,
      alvoAtual:         null,
      dano:              0,
      defesasColetadas:  {},                // alvoId → cartaObj ou null
    };
    _avancarFilaDefesa();
  }

  // Tira o próximo alvo da fila e prepara a tela. Quando fila vazia, resolve.
  function _avancarFilaDefesa() {
    if (!_defesaPendente) return;
    if (_defesaPendente.fila.length === 0) {
      const { atacante, decisao, defesasColetadas } = _defesaPendente;
      // Limpa antes — defesasPorAlvo vazio vira null
      const defesas = Object.keys(defesasColetadas).length > 0 ? defesasColetadas : null;
      _defesaPendente = null;
      _defesaSel      = null;
      COMBAT.resolverAcao(atacante, decisao.hab, decisao.cartaIdx, decisao.alvos, defesas);
      _finalizarTurno(atacante);
      return;
    }

    _defesaPendente.alvoAtual = _defesaPendente.fila.shift();

    // Recalcula dano potencial pro alvo atual
    const cartaAtaque = (_defesaPendente.atacante.lado === 'jogador'
      ? COMBAT.estado.maoJogador
      : _defesaPendente.atacante.mao)[_defesaPendente.decisao.cartaIdx];
    _defesaPendente.dano = DAMAGE.calcularDano(
      _defesaPendente.atacante,
      _defesaPendente.alvoAtual,
      _defesaPendente.decisao.hab.poder ?? 0,
      cartaAtaque,
      _defesaPendente.decisao.hab.efeitoPuro,
    );

    _defesaSel = null;
    _renderizar();
  }

  // Processa um clique no painel de defesa — dupla confirmação.
  function _selecionarDefesa(novaSel) {
    if (!_defesaPendente || !_defesaPendente.alvoAtual) return;
    const igual = _defesaSel
      && _defesaSel.tipo === novaSel.tipo
      && _defesaSel.idx === novaSel.idx;
    if (igual) {
      // Confirma — registra escolha (objeto da carta, não índice — splice
      // por referência em resolverAcao evita bug com múltiplos alvos)
      const cartaObj = novaSel.tipo === 'carta'
        ? COMBAT.estado.maoJogador[novaSel.idx]
        : null;
      _defesaPendente.defesasColetadas[_defesaPendente.alvoAtual.id] = cartaObj;
      _avancarFilaDefesa();
    } else {
      _defesaSel = novaSel;
      _renderizar();
    }
  }

  // Botão de debug — atalho direto para a tela de vitória.
  function _vencer() {
    _fimDeBatalha('vitoria');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FIM DE BATALHA — tela de resultado (vitória / derrota)
  // ══════════════════════════════════════════════════════════════════════════

  function _fimDeBatalha(resultado) {
    const screen = document.getElementById('screen-battle');
    if (!screen) return;
    screen.innerHTML = '';
    screen.style.display = 'block';

    const ehVitoria = resultado === 'vitoria';
    const jogadores = COMBAT.estado.combatentes.filter(c => c.lado === 'jogador');

    const cards = jogadores.map(c => {
      const cor    = _COR_INI[c.naipe] ?? '#888';
      const { bg } = GRAD_NAIPE[c.naipe] ?? GRAD_NEUTRO;
      const vivo   = c.hp > 0;
      const hpPct  = Math.max(0, Math.min(100, (c.hp / c.pvs) * 100));
      return `
        <div class="battle-fim-char${vivo ? '' : ' morto'}">
          <div class="battle-fim-char-card" style="background:${bg};">
            <span class="battle-fim-char-naipe" style="color:${cor}">${c.naipe ?? '?'}</span>
            <span class="battle-fim-char-nome">${c.nome}</span>
          </div>
          <div class="battle-fim-char-hp-bar">
            <div class="battle-fim-char-hp-fill" style="width:${hpPct}%"></div>
          </div>
          <div class="battle-fim-char-hp-txt">${vivo ? `${c.hp}/${c.pvs}` : 'CAÍDO'}</div>
        </div>`;
    }).join('');

    const overlay = document.createElement('div');
    overlay.id = 'battle-fim';
    overlay.className = ehVitoria ? 'vitoria' : 'derrota';
    overlay.innerHTML = `
      <div id="battle-fim-bg"></div>
      <div id="battle-fim-content">
        <div id="battle-fim-titulo">${ehVitoria ? '⚔ VITÓRIA' : '💀 DERROTA'}</div>
        <div id="battle-fim-chars">${cards}</div>
        ${ehVitoria
          ? `<div id="battle-fim-pontos">+${_pontos} PTS</div>`
          : `<div id="battle-fim-sub">Seu time foi derrotado.</div>`}
        <button id="battle-fim-btn">${ehVitoria ? 'CONTINUAR →' : '← VOLTAR AO MAPA'}</button>
      </div>
    `;
    screen.appendChild(overlay);

    overlay.querySelector('#battle-fim-btn').addEventListener('click', () => {
      screen.style.display = 'none';
      screen.innerHTML = '';

      // Sincroniza HP de volta pro PLAYER_STATE
      if (typeof sincronizarHpPosBatalha === 'function') {
        sincronizarHpPosBatalha(COMBAT.estado.combatentes);
      }

      // Verifica game over: todos os personagens com hpAtual = 0
      const todosCalidos = PLAYER_STATE.personagens.length > 0 &&
        PLAYER_STATE.personagens.every(p => p.hpAtual <= 0);

      if (todosCalidos) {
        if (typeof gameOver === 'function') gameOver();
        window.irParaTela('screen-gameover');
        if (typeof GAMEOVER !== 'undefined') GAMEOVER.init();
        return;
      }

      if (ehVitoria) { if (_onVitoria) _onVitoria(); }
      else           { if (_onDerrota) _onDerrota(); }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // API PÚBLICA
  // ══════════════════════════════════════════════════════════════════════════

  return { init };

})();
