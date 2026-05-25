// screens/tutorial/tutorial.js

const TUTORIAL = (() => {

  // ── Intro em passos (Momento 1) ───────────────────────────────────────────

  const INTRO_PASSOS = [
    {
      tag:    'SURVIVOR',
      titulo: 'Você está no Survivor.',
      texto:  `Aqui o jogo é de verdade. Batalhas em sequência, cada uma mais difícil que a anterior. Se todos os seus personagens caírem e não houver como recuperá-los, é Game Over — e eles não voltam. Esse é o peso do modo. Aprenda a respeitar ele.`,
    },
    {
      tag:    'SUA TELA',
      titulo: 'O que você está vendo',
      texto:  `À esquerda estão seus <strong>3 personagens</strong> com as barras de HP atuais. O HP que sair de uma batalha é o HP que entra na próxima — cuide bem deles.<br><br>À direita: o botão de <strong>Status</strong>, onde você evolui seus personagens, e <strong>Equipamentos</strong>, onde você gerencia seus itens.<br><br>No centro: o <strong>mapa de etapas</strong> — sua rota até o fim.`,
    },
    {
      tag:    'AS ETAPAS',
      titulo: 'Como funciona',
      texto:  `Este tutorial tem <strong>5 etapas</strong>. No meio do caminho há um <strong>Mini Boss</strong> — mais resistente, mais perigoso. Ao vencê-lo, você escolhe: recuperar o HP completo de um personagem, ou reviver um que caiu.<br><br>A última etapa é o <strong>Boss</strong>. Diferente de tudo que vem antes.`,
    },
    {
      tag:    'RECOMPENSAS',
      titulo: 'O que você ganha. O que você perde.',
      texto:  `Cada vitória rende <strong>pontos</strong> e pode dropar <strong>equipamentos</strong>. Pontos não gastos e itens não equipados ficam guardados na sua conta — mesmo que você perca tudo.<br><br>Mas se chegar o Game Over: seus personagens somem. Os equipamentos e relíquias que estavam neles, também.<br><br>Jogue como se cada personagem importasse. Porque importa.`,
    },
  ];

  // ── Configuração das 5 etapas ─────────────────────────────────────────────

  const ETAPAS = [
    {
      id: 1,
      label: 'ETAPA 1',
      pontos: 20,
      popupEntrada: null,
      popupRecompensa: {
        pontos: 20,
        titulo: 'VITÓRIA',
        desc: `Você ganhou <strong>1 ponto para cada personagem vivo</strong> e teve chance de dropar um equipamento.<br><br>
Você pode repetir batalhas já vencidas para farmar — mas repetições rendem apenas <strong>1 ponto</strong> por run. O progresso real vem de avançar.<br><br>
Pontos são usados para desbloquear habilidades e passivas no <strong>Atlas</strong> — a árvore de evolução dos seus personagens. Vá ao Status agora.`,
        indicador: '▶ ABRA O STATUS',
        btn: 'IR AO STATUS',
        acaoBtn: 'status',
      },
    },
    {
      id: 2,
      label: 'ETAPA 2',
      pontos: 20,
      popupEntrada: null,
      popupRecompensa: {
        pontos: 20,
        titulo: 'ETAPA 2 CONCLUÍDA',
        desc: `Mais <strong>20 pontos</strong> conquistados. Continue avançando.`,
        indicador: '▶ PRÓXIMA ETAPA',
        btn: 'CONTINUAR',
        acaoBtn: 'mapa',
      },
    },
    {
      id: 3,
      label: 'MINI BOSS',
      pontos: 30,
      popupEntrada: {
        tag:    'ATENÇÃO',
        titulo: 'Mini Boss',
        texto:  `Este não é um inimigo comum. O <strong>Mini Boss</strong> é mais resistente e mais imprevisível.<br><br>
Ao vencê-lo, você terá uma escolha: <strong>recuperar o HP completo</strong> de um personagem vivo, ou <strong>reviver</strong> um personagem que caiu — com HP completo.<br><br>
Escolha com cuidado. Não há opção errada — há a opção certa pra sua situação.`,
        indicador: '▶ ENTRAR NA BATALHA',
        btn: 'ENTENDIDO',
      },
      popupRecompensa: {
        pontos: 30,
        titulo: 'MINI BOSS DERROTADO',
        desc: `Bom trabalho. Escolha sua recompensa e siga em frente.`,
        indicador: '',
        btn: 'CONTINUAR',
        acaoBtn: 'mapa',
      },
    },
    {
      id: 4,
      label: 'ETAPA 4',
      pontos: 20,
      popupEntrada: null,
      popupRecompensa: {
        pontos: 20,
        titulo: 'ETAPA 4 CONCLUÍDA',
        desc: `Mais <strong>20 pontos</strong>. O Boss está próximo.`,
        indicador: '▶ ÚLTIMA ETAPA',
        btn: 'CONTINUAR',
        acaoBtn: 'mapa',
      },
    },
    {
      id: 5,
      label: 'BOSS',
      pontos: 50,
      popupEntrada: {
        tag:    'BOSS',
        titulo: 'O Boss',
        texto:  `Você chegou ao <strong>Boss</strong>.<br><br>
Ele não segue as mesmas regras. Tem mecânicas próprias, padrões imprevisíveis. A primeira vitória sobre ele rende <strong>pontos adicionais</strong>.<br><br>
Bosses não dropam equipamentos. Eles dropam <strong>relíquias</strong> — itens únicos que só aquele Boss carrega.`,
        indicador: '▶ ENTRAR NA BATALHA',
        btn: 'ENTENDIDO',
      },
      popupRecompensa: {
        pontos: 50,
        titulo: 'TUTORIAL CONCLUÍDO!',
        desc: `Você completou o tutorial e conhece as regras do jogo. O Survivor real aguarda — mais longo, mais difícil, sem mão na roda.<br><br>Boa sorte.`,
        indicador: '',
        btn: 'IR PARA O JOGO',
        acaoBtn: 'fim',
      },
    },
  ];

  // ── Estado interno ────────────────────────────────────────────────────────

  let etapaAtual        = 0; // índice 0-4
  let etapasConcluidas  = [];
  let aguardandoStatus  = false;

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    etapaAtual       = 0;
    etapasConcluidas = [];
    aguardandoStatus = false;

    TUTORIAL_MAP.init();

    if (!document.getElementById('screen-tutorial')) {
      const el = document.createElement('div');
      el.id = 'screen-tutorial';
      document.getElementById('game-container').appendChild(el);
    }

    renderTela();
    mostrarIntroTutorial();
  }

  // ── Intro em passos ───────────────────────────────────────────────────────

  function mostrarIntroTutorial() {
    const screen = document.getElementById('screen-tutorial');
    let passo = 0;

    function renderPasso() {
      const anterior = document.getElementById('tutorial-intro');
      if (anterior) anterior.remove();

      const dados  = INTRO_PASSOS[passo];
      const total  = INTRO_PASSOS.length;
      const ultimo = passo === total - 1;

      const overlay = document.createElement('div');
      overlay.id = 'tutorial-intro';
      overlay.innerHTML = `
        <div id="tutorial-intro-overlay"></div>
        <div id="tutorial-intro-box">
          <div id="tutorial-intro-step">${passo + 1} / ${total}</div>
          <div id="tutorial-intro-tag">${dados.tag}</div>
          <div id="tutorial-intro-titulo">${dados.titulo}</div>
          <div id="tutorial-intro-texto">${dados.texto}</div>
          <button id="tutorial-intro-btn">${ultimo ? 'ENTENDIDO — CLIQUE NA ETAPA 1 ▶' : 'PRÓXIMO →'}</button>
        </div>
      `;

      screen.appendChild(overlay);

      overlay.querySelector('#tutorial-intro-btn').addEventListener('click', () => {
        if (ultimo) {
          overlay.remove();
        } else {
          passo++;
          renderPasso();
        }
      });
    }

    renderPasso();
  }

  // ── Render da tela principal ──────────────────────────────────────────────

  function renderTela() {
    const screen = document.getElementById('screen-tutorial');
    screen.style.display = 'block';
    screen.innerHTML = '';

    // Fundo
    const bg = document.createElement('div');
    bg.id = 'tutorial-bg';
    screen.appendChild(bg);

    // Topbar
    screen.appendChild(criarTopbar());

    // Personagens (esquerda)
    screen.appendChild(criarPainelChars());

    // Botões (direita)
    screen.appendChild(criarPainelActions());

    // Mapa central
    screen.appendChild(criarMapa());
  }

  // ── Topbar ────────────────────────────────────────────────────────────────

  function criarTopbar() {
    const bar = document.createElement('div');
    bar.id = 'tutorial-topbar';
    bar.innerHTML = `
      <div id="tutorial-topbar-titulo">📋 TUTORIAL</div>
      <div id="tutorial-topbar-pontos">
        <span class="topbar-coin">🪙</span>
        <span id="tutorial-pontos-valor">${PLAYER_STATE.pontos}</span>
      </div>
    `;
    return bar;
  }

  function atualizarPontos() {
    const el = document.getElementById('tutorial-pontos-valor');
    if (el) el.textContent = PLAYER_STATE.pontos;
  }

  // ── Painel de personagens ─────────────────────────────────────────────────

  function criarPainelChars() {
    const painel = document.createElement('div');
    painel.id = 'tutorial-chars';

    PLAYER_STATE.personagens.forEach(p => {
      const hpMax  = p.pvs;
      const hpAtual = TUTORIAL_MAP.state.hp[p.poolId]?.cur ?? p.hpAtual ?? hpMax;
      const pct    = Math.max(0, Math.min(100, (hpAtual / hpMax) * 100));

      const sprHtml = (typeof CHAR_SPRITE !== 'undefined')
        ? CHAR_SPRITE.imgHTML(p.poolId, { h: 44 })
        : '?';
      painel.innerHTML += `
        <div class="tutorial-char-card">
          <div class="tutorial-char-top">
            <div class="tutorial-char-avatar">${sprHtml}</div>
            <div class="tutorial-char-nome">${p.nome}</div>
          </div>
          <div class="tutorial-char-hp-bar">
            <div class="tutorial-char-hp-fill" style="width:${pct}%"></div>
          </div>
          <div class="tutorial-char-hp-texto">${hpAtual} / ${hpMax} HP</div>
        </div>
      `;
    });

    return painel;
  }

  // ── Painel de ações ───────────────────────────────────────────────────────

  function criarPainelActions() {
    const painel = document.createElement('div');
    painel.id = 'tutorial-actions';
    painel.innerHTML = `
      <button class="tutorial-action-btn" id="btn-tutorial-status">⚔ STATUS</button>
      <button class="tutorial-action-btn" id="btn-tutorial-equipamentos">🎒 EQUIPAMENTOS</button>
      <button class="tutorial-action-btn" id="btn-tutorial-desistir">🏳 DESISTIR</button>
    `;

    painel.querySelector('#btn-tutorial-status').addEventListener('click', abrirStatus);
    painel.querySelector('#btn-tutorial-equipamentos').addEventListener('click', () => {});
    painel.querySelector('#btn-tutorial-desistir').addEventListener('click', confirmarDesistir);

    return painel;
  }

  // ── Mapa de etapas ────────────────────────────────────────────────────────

  function criarMapa() {
    const mapa = document.createElement('div');
    mapa.id = 'tutorial-mapa';

    // Renderiza de cima para baixo: etapa 5 → etapa 1
    const ordem = [4, 3, 2, 1, 0];

    ordem.forEach((idx, i) => {
      const etapa = ETAPAS[idx];
      const concluida = etapasConcluidas.includes(idx);
      const ativa     = idx === etapaAtual && !aguardandoStatus;
      const bloqueada = !concluida && !ativa;
      const lado      = idx % 2 === 0 ? 'direita' : 'esquerda';

      // Conector acima (exceto no primeiro)
      if (i > 0) {
        const conector = document.createElement('div');
        conector.className = 'mapa-conector' + (concluida ? ' ativa' : '');
        mapa.appendChild(conector);
      }

      // Nó
      const noWrapper = document.createElement('div');
      noWrapper.className = 'mapa-etapa-linha';

      const no = document.createElement('div');
      no.className = 'mapa-no';
      no.dataset.lado = lado;

      const estadoClasse = concluida ? 'concluida' : ativa ? 'ativa' : 'bloqueada';
      const icone        = concluida ? '✓' : ativa ? '▶' : idx + 1;

      no.innerHTML = `
        <div class="mapa-no-circulo ${estadoClasse}" data-idx="${idx}">
          ${icone}
          <span class="mapa-no-label">${etapa.label}</span>
        </div>
      `;

      if (ativa) {
        no.querySelector('.mapa-no-circulo').addEventListener('click', () => entrarEtapa(idx));
      }

      noWrapper.appendChild(no);
      mapa.appendChild(noWrapper);
    });

    return mapa;
  }

  // ── Entrar em uma etapa ───────────────────────────────────────────────────

  function entrarEtapa(idx) {
    const iniciar = () => TUTORIAL_MAP.entrarEtapa(
      idx,
      ETAPAS[idx].pontos,
      (pts) => concluirEtapa(idx, pts),
    );

    if (ETAPAS[idx].popupEntrada) {
      mostrarPopup(ETAPAS[idx].popupEntrada, iniciar);
    } else {
      iniciar();
    }
  }

  // ── Placeholder de batalha ────────────────────────────────────────────────

  function mostrarBatalhaPlaceholder(idx) {
    const screen = document.getElementById('screen-tutorial');

    const ph = document.createElement('div');
    ph.id = 'tutorial-batalha-placeholder';
    ph.innerHTML = `
      <div class="batalha-ph-titulo">⚔ BATALHA — ${ETAPAS[idx].label}</div>
      <div class="batalha-ph-desc">ENGINE DE COMBATE</div>
      <div class="batalha-ph-sub">[ A ser construído ]</div>
      <button class="batalha-ph-btn" id="btn-simular-vitoria">SIMULAR VITÓRIA ▶</button>
    `;

    screen.appendChild(ph);

    ph.querySelector('#btn-simular-vitoria').addEventListener('click', () => {
      ph.remove();
      concluirEtapa(idx);
    });
  }

  // ── Concluir etapa ────────────────────────────────────────────────────────

  function concluirEtapa(idx, pontosGanhos) {
    etapasConcluidas.push(idx);

    PLAYER_STATE.pontos += pontosGanhos;
    salvarEstado();

    renderTela();

    const popupData = { ...ETAPAS[idx].popupRecompensa, pontos: pontosGanhos };
    mostrarRecompensa(popupData);
  }

  // ── Popup de entrada ──────────────────────────────────────────────────────

  function mostrarPopup(dados, onClose) {
    if (!dados) return;

    const screen = document.getElementById('screen-tutorial');

    const popup = document.createElement('div');
    popup.id = 'tutorial-popup';
    popup.innerHTML = `
      <div id="tutorial-popup-overlay"></div>
      <div id="tutorial-popup-box">
        <div id="tutorial-popup-tag">${dados.tag || ''}</div>
        <div id="tutorial-popup-titulo">${dados.titulo}</div>
        <div id="tutorial-popup-texto">${dados.texto}</div>
        ${dados.indicador ? `<div id="tutorial-popup-indicador">▶ ${dados.indicador}</div>` : ''}
        <button id="tutorial-popup-btn">${dados.btn}</button>
      </div>
    `;

    screen.appendChild(popup);

    popup.querySelector('#tutorial-popup-btn').addEventListener('click', () => {
      popup.remove();
      if (onClose) onClose();
    });
  }

  // ── Popup de recompensa ───────────────────────────────────────────────────

  function mostrarRecompensa(dados) {
    const screen = document.getElementById('screen-tutorial');

    const popup = document.createElement('div');
    popup.id = 'tutorial-recompensa';
    popup.innerHTML = `
      <div id="tutorial-recompensa-overlay"></div>
      <div id="tutorial-recompensa-box">
        <div class="recompensa-icone">🪙</div>
        <div class="recompensa-titulo">${dados.titulo}</div>
        <div class="recompensa-pontos">+${dados.pontos} PTS</div>
        <div class="recompensa-desc">${dados.desc}</div>
        <button class="recompensa-btn" id="btn-recompensa-ok">${dados.btn}</button>
      </div>
    `;

    screen.appendChild(popup);
    atualizarPontos();

    popup.querySelector('#btn-recompensa-ok').addEventListener('click', () => {
      popup.remove();

      if (dados.acaoBtn === 'status') {
        aguardandoStatus = true;
        renderTela();
        abrirStatus();
      } else if (dados.acaoBtn === 'fim') {
        finalizarTutorial();
      } else {
        // 'mapa' ou undefined — avança etapa e redesenha
        etapaAtual++;
        aguardandoStatus = false;
        renderTela();
      }
    });
  }

  // ── Abertura da tela de Status ────────────────────────────────────────────

  function abrirStatus() {
    window.aoVoltarDoStatus = () => {
      if (aguardandoStatus) {
        aguardandoStatus = false;
        etapaAtual++;
        renderTela();
        mostrarMomento3();
      }
    };
    if (typeof STATUS !== 'undefined') STATUS.init({ tutorial: true });
    window.irParaTela('screen-status');
  }

  function mostrarMomento3() {
    mostrarPopup({
      tag:    '',
      titulo: 'Seu personagem está mais forte.',
      texto:  'Agora siga em frente.',
      btn:    'CONTINUAR →',
    });
  }

  // ── Confirmar desistir ────────────────────────────────────────────────────

  function confirmarDesistir() {
    const screen = document.getElementById('screen-tutorial');

    const popup = document.createElement('div');
    popup.id = 'tutorial-popup';
    popup.innerHTML = `
      <div id="tutorial-popup-overlay"></div>
      <div id="tutorial-popup-box">
        <div id="tutorial-popup-tag">ATENÇÃO</div>
        <div id="tutorial-popup-titulo">Desistir do tutorial?</div>
        <div id="tutorial-popup-texto">Seu progresso atual será perdido.</div>
        <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:8px;">
          <button class="btn-cancelar" id="btn-desistir-nao" style="padding:9px 20px;border-radius:8px;border:1px solid #444;background:transparent;color:#888;font-size:0.8rem;cursor:pointer;font-family:sans-serif;">CANCELAR</button>
          <button id="tutorial-popup-btn" style="background:#cc4444;">DESISTIR</button>
        </div>
      </div>
    `;

    screen.appendChild(popup);

    popup.querySelector('#btn-desistir-nao').addEventListener('click', () => popup.remove());
    popup.querySelector('#tutorial-popup-btn').addEventListener('click', () => {
      popup.remove();
      screen.style.display = 'none';
      window.irParaTela('start-screen');
    });
  }

  // ── Finalizar tutorial ────────────────────────────────────────────────────

  function finalizarTutorial() {
    // Reseta HP de todos os personagens — entram no Survivor com HP cheio
    for (const p of PLAYER_STATE.personagens) {
      const entry = TUTORIAL_MAP.state.hp[p.poolId];
      p.hpAtual = entry ? entry.max : p.pvs;
    }
    salvarEstado();

    const screen = document.getElementById('screen-tutorial');
    screen.style.display = 'none';
    // Por ora volta para start — quando tela principal existir, trocar aqui
    window.irParaTela('start-screen');
  }

  // ── API pública ───────────────────────────────────────────────────────────

  return { init };

})();
