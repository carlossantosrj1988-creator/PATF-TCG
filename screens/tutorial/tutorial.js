// screens/tutorial/tutorial.js

const TUTORIAL = (() => {

  // ── Configuração das 5 etapas ─────────────────────────────────────────────

  const ETAPAS = [
    {
      id: 1,
      label: 'ETAPA 1',
      pontos: 20,
      popupEntrada: {
        tag: 'BEM-VINDO AO TUTORIAL',
        titulo: 'Como o PATF TCG funciona',
        texto: `Este é o mapa do Survivor. Aqui você vê as <strong>etapas</strong> que precisa completar.<br><br>
À esquerda estão seus <strong>3 personagens</strong> com suas barras de HP. O HP persiste entre as etapas — se um personagem sair ferido de uma batalha, ele entra na próxima com o mesmo HP.<br><br>
À direita você tem acesso ao <strong>Status</strong> (sua árvore de habilidades) e pode <strong>Desistir</strong> a qualquer momento.<br><br>
Clique na <strong>Etapa 1</strong> para começar sua primeira batalha.`,
        indicador: '▶ CLIQUE NA ETAPA 1 PARA COMEÇAR',
        btn: 'ENTENDIDO',
      },
      popupRecompensa: {
        pontos: 20,
        titulo: 'VITÓRIA!',
        desc: `Você completou sua primeira batalha e ganhou <strong>20 pontos</strong>.<br><br>
Pontos são a moeda do jogo. Você os usa para desbloquear habilidades e passivas na sua árvore de progressão.<br><br>
Agora vá até o <strong>STATUS</strong> para conhecer seu Atlas.`,
        indicador: '▶ CLIQUE EM STATUS',
        btn: 'VER STATUS',
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
        desc: `Mais <strong>20 pontos</strong> conquistados.<br><br>
Agora você tem pontos suficientes para comprar uma <strong>habilidade</strong> na sua árvore.<br><br>
As habilidades são organizadas em 3 camadas: <strong>H1</strong> (básicas), <strong>H2</strong> (utilidade) e <strong>H3</strong> (definidoras de build).<br><br>
Vá ao <strong>STATUS</strong> e compre sua primeira habilidade.`,
        indicador: '▶ COMPRE UMA HABILIDADE NO STATUS',
        btn: 'VER STATUS',
        acaoBtn: 'status',
      },
    },
    {
      id: 3,
      label: 'ETAPA 3',
      pontos: 20,
      popupEntrada: null,
      popupRecompensa: {
        pontos: 20,
        titulo: 'ETAPA 3 CONCLUÍDA',
        desc: `Mais <strong>20 pontos</strong>.<br><br>
Agora é hora de comprar uma <strong>Passiva</strong>. Passivas funcionam automaticamente — sem ativação. Você as encaixa nos <strong>2 slots de passiva</strong> do seu personagem.<br><br>
Vá ao STATUS e compre uma passiva.`,
        indicador: '▶ COMPRE UMA PASSIVA NO STATUS',
        btn: 'VER STATUS',
        acaoBtn: 'status',
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
        desc: `Mais <strong>20 pontos</strong>.<br><br>
Você está construindo seu time. Na tela de <strong>Equipamentos</strong> (em breve) você poderá equipar itens que potencializam seus personagens.<br><br>
Continue para a última etapa do tutorial.`,
        indicador: '▶ CLIQUE NA ETAPA 5',
        btn: 'CONTINUAR',
        acaoBtn: 'mapa',
      },
    },
    {
      id: 5,
      label: 'ETAPA 5',
      pontos: 30,
      popupEntrada: null,
      popupRecompensa: {
        pontos: 30,
        titulo: 'TUTORIAL CONCLUÍDO!',
        desc: `Parabéns. Você completou o tutorial e tem pelo menos um personagem em formação.<br><br>
Agora você está pronto para o <strong>Survivor</strong> — o modo principal do jogo, com 10 fases, um mini boss na fase 5 e um boss final na fase 10.<br><br>
Boa sorte.`,
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

    if (!document.getElementById('screen-tutorial')) {
      const el = document.createElement('div');
      el.id = 'screen-tutorial';
      document.getElementById('game-container').appendChild(el);
    }

    renderTela();
    mostrarPopup(ETAPAS[0].popupEntrada);
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
      const hpAtual = p.hpAtual ?? hpMax;
      const pct    = Math.max(0, Math.min(100, (hpAtual / hpMax) * 100));

      painel.innerHTML += `
        <div class="tutorial-char-card">
          <div class="tutorial-char-top">
            <div class="tutorial-char-avatar">?</div>
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
    mostrarBatalhaPlaceholder(idx);
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

  function concluirEtapa(idx) {
    etapasConcluidas.push(idx);

    const etapa = ETAPAS[idx];

    // Adiciona pontos
    PLAYER_STATE.pontos += etapa.pontos;
    salvarEstado();

    // Redesenha o mapa
    renderTela();

    // Mostra popup de recompensa
    mostrarRecompensa(etapa.popupRecompensa);
  }

  // ── Popup de entrada ──────────────────────────────────────────────────────

  function mostrarPopup(dados) {
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
        ${dados.indicador ? `<div id="tutorial-popup-indicador tutorial-highlight">▶ ${dados.indicador}</div>` : ''}
        <button id="tutorial-popup-btn">${dados.btn}</button>
      </div>
    `;

    screen.appendChild(popup);

    popup.querySelector('#tutorial-popup-btn').addEventListener('click', () => {
      popup.remove();
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

  // ── Placeholder de Status ─────────────────────────────────────────────────

  function abrirStatus() {
    const screen = document.getElementById('screen-tutorial');

    // Remove placeholder anterior se existir
    const anterior = document.getElementById('tutorial-status-placeholder');
    if (anterior) anterior.remove();

    const ph = document.createElement('div');
    ph.id = 'tutorial-status-placeholder';

    // Conteúdo do status varia conforme etapa
    let conteudo = '';

    if (etapaAtual === 0 && aguardandoStatus) {
      // Primeira visita ao status — explicação do Atlas e naipes
      conteudo = `
        <div style="font-size:0.65rem;color:#c9a84c;letter-spacing:4px;text-transform:uppercase;margin-bottom:8px;">ÁRVORE DE STATUS — ATLAS</div>
        <div style="font-size:1.1rem;font-weight:900;color:#fff;letter-spacing:4px;margin-bottom:20px;">ESCOLHA SEU NAIPE</div>
        <div style="font-size:0.78rem;color:#8899aa;max-width:420px;text-align:center;line-height:1.8;margin-bottom:24px;">
          O Atlas define a progressão do seu personagem.<br>
          Cada naipe tem seu foco e estilo de jogo:<br><br>
          <strong style="color:#e05555;">♥ Copas</strong> — Tank. Absorve dano, protege o time.<br>
          <strong style="color:#5599cc;">♠ Espadas</strong> — Ofensivo. Causa dano, pressiona o inimigo.<br>
          <strong style="color:#f0c030;">♦ Ouro</strong> — Utilidade. Controla o ritmo, cria oportunidades.<br>
          <strong style="color:#4caf50;">♣ Paus</strong> — Habilidoso. Combos e efeitos especiais.<br><br>
          Naipes têm vantagens e desvantagens entre si:<br>
          <strong>♥ → ♣ → ♦ → ♠ → ♥</strong>
        </div>
        <div style="font-size:0.65rem;color:#555;letter-spacing:2px;margin-bottom:20px;">[ ATLAS A SER CONSTRUÍDO ]</div>
        <button class="batalha-ph-btn" id="btn-fechar-status">VOLTAR AO MAPA</button>
      `;
    } else {
      // Visitas subsequentes
      conteudo = `
        <div style="font-size:0.65rem;color:#c9a84c;letter-spacing:4px;text-transform:uppercase;margin-bottom:8px;">ÁRVORE DE STATUS — ATLAS</div>
        <div style="font-size:1.1rem;font-weight:900;color:#fff;letter-spacing:4px;margin-bottom:20px;">SEU ATLAS</div>
        <div style="font-size:0.78rem;color:#8899aa;max-width:420px;text-align:center;line-height:1.8;margin-bottom:24px;">
          Aqui você compra <strong style="color:#c9a84c;">habilidades</strong> e <strong style="color:#c9a84c;">passivas</strong> com seus pontos.<br><br>
          <strong>Habilidades</strong> são ativadas durante o combate e ficam nos 3 slots de habilidade do personagem.<br><br>
          <strong>Passivas</strong> funcionam automaticamente, sem ativação. Ficam nos 2 slots de passiva.<br><br>
          <strong>Equipamentos</strong> potencializam ainda mais seus personagens. Em breve.
        </div>
        <div style="font-size:0.65rem;color:#555;letter-spacing:2px;margin-bottom:8px;">Pontos disponíveis: <strong style="color:#f0c030;">${PLAYER_STATE.pontos}</strong></div>
        <div style="font-size:0.65rem;color:#555;letter-spacing:2px;margin-bottom:20px;">[ ATLAS A SER CONSTRUÍDO ]</div>
        <button class="batalha-ph-btn" id="btn-fechar-status">VOLTAR AO MAPA</button>
      `;
    }

    ph.innerHTML = conteudo;
    screen.appendChild(ph);

    ph.querySelector('#btn-fechar-status').addEventListener('click', () => {
      ph.remove();

      if (aguardandoStatus) {
        // Após visita obrigatória ao status, avança a etapa
        aguardandoStatus = false;
        etapaAtual++;
        renderTela();
      }
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
    const screen = document.getElementById('screen-tutorial');
    screen.style.display = 'none';
    // Por ora volta para start — quando tela principal existir, trocar aqui
    window.irParaTela('start-screen');
  }

  // ── API pública ───────────────────────────────────────────────────────────

  return { init };

})();
