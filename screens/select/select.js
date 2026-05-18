// screens/select/select.js

const SELECT = (() => {

  // ── Descrições ────────────────────────────────────────────────────────────

  const DESCRICOES = {
    vigor:     'Alto PVS — ideal para absorver dano e durar mais.',
    ofensivo:  'Alto ATQ — causa mais dano por turno.',
    defensivo: 'Alto DEF — reduz o dano recebido consistentemente.',
    agil:      'Alto INC — age antes dos outros, controla o ritmo.',
  };

  // ── Estado interno ────────────────────────────────────────────────────────

  let rodada              = 0;
  let selecionado         = null;
  let personagensMontados = [];

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    if (!document.getElementById('screen-select')) {
      const el = document.createElement('div');
      el.id = 'screen-select';
      document.getElementById('game-container').appendChild(el);
    }

    rodada              = 0;
    selecionado         = null;
    personagensMontados = [];

    render();
  }

  // ── Render principal ──────────────────────────────────────────────────────

  // ── Introdução por passos ─────────────────────────────────────────────────

  const INTRO_PASSOS = [
    {
      titulo: 'Bem-vindo ao PATF TCG',
      texto:  'Este não é um jogo de um personagem. Você monta um <strong>time de 3</strong> — todos entram em campo ao mesmo tempo. Cada um age, cada um pode morrer.',
    },
    {
      titulo: 'Conheça os 4',
      texto:  'Há 4 tipos disponíveis. O que os diferencia é o <strong>atributo mais forte</strong> de cada um: um é mais resistente, outro ataca mais, outro age mais rápido, outro aguenta mais dano. Escolha conforme sua estratégia.',
    },
    {
      titulo: 'Monte seu time',
      texto:  'Você vai escolher <strong>3 personagens</strong>, um por vez. Para cada um, você dá um nome. Não existe combinação certa ou errada — pode escolher o mesmo tipo as 3 vezes se quiser.',
    },
  ];

  function mostrarIntroducao() {
    const screen = document.getElementById('screen-select');
    let passo = 0;

    function renderPasso() {
      const anterior = document.getElementById('select-intro');
      if (anterior) anterior.remove();

      const dados   = INTRO_PASSOS[passo];
      const total   = INTRO_PASSOS.length;
      const ultimo  = passo === total - 1;

      const overlay = document.createElement('div');
      overlay.id = 'select-intro';
      overlay.innerHTML = `
        <div id="select-intro-overlay"></div>
        <div id="select-intro-box">
          <div id="select-intro-step">${passo + 1} / ${total}</div>
          <div id="select-intro-titulo">${dados.titulo}</div>
          <div id="select-intro-texto">${dados.texto}</div>
          <button id="select-intro-btn">${ultimo ? 'ENTENDIDO ▶' : 'PRÓXIMO →'}</button>
        </div>
      `;

      screen.appendChild(overlay);

      overlay.querySelector('#select-intro-btn').addEventListener('click', () => {
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

  // ── Render principal ──────────────────────────────────────────────────────

  function render() {
    const screen = document.getElementById('screen-select');
    screen.style.display = 'flex';

    screen.innerHTML = `

      <!-- ── Header ── -->
      <div class="select-header">
        <div class="select-header-titulo">SELEÇÃO DE PERSONAGENS</div>
        <div class="select-header-desc">Monte seu time de 3. Cada personagem pode ser nomeado e customizado depois via Atlas.</div>
      </div>

      <!-- ── Indicador de etapa ── -->
      <div class="select-etapas">
        ${[0,1,2].map(i => `
          <div class="etapa-item ${i < rodada ? 'concluida' : i === rodada ? 'ativa' : ''}">
            <div class="etapa-numero">${i < rodada ? '✓' : i + 1}</div>
            <div class="etapa-label">${i < rodada && personagensMontados[i] ? personagensMontados[i].nome : 'Personagem ' + (i + 1)}</div>
          </div>
        `).join('')}
      </div>

      <!-- ── Pool de 4 cards ── -->
      <div class="select-pool" id="select-pool"></div>

      <!-- ── Card central ── -->
      <div class="select-card-central vazio" id="select-card-central">
        <div class="card-simbolo">?</div>
        <div class="card-descricao">Selecione um personagem acima</div>
      </div>

      <!-- ── Área inferior ── -->
      <div class="select-bottom">
        <div class="select-nome-label">Nome do personagem</div>
        <input
          class="select-nome-input"
          id="select-nome"
          type="text"
          maxlength="16"
          placeholder="Digite um nome..."
          disabled
        />
        <div class="select-botoes">
          <button class="btn-cancelar" id="btn-cancelar" disabled>Cancelar</button>
          <button class="btn-confirmar" id="btn-confirmar" disabled>Confirmar</button>
        </div>
      </div>

    `;

    renderPool();
    bindEventos();

    if (rodada === 0 && personagensMontados.length === 0) {
      mostrarIntroducao();
    }
  }

  // ── Render pool ───────────────────────────────────────────────────────────

  function renderPool() {
    const pool = document.getElementById('select-pool');
    pool.innerHTML = '';

    CHAR_POOL.forEach(char => {
      const card = document.createElement('div');
      card.className = 'pool-card' + (selecionado === char.id ? ' selecionado' : '');
      card.dataset.id = char.id;
      card.innerHTML = `<span style="font-size:0.65rem;color:#ccc;text-align:center;line-height:1.2">${char.label}</span>`;
      card.addEventListener('click', () => selecionarChar(char.id));
      pool.appendChild(card);
    });
  }

  // ── Render card central ───────────────────────────────────────────────────

  function renderCardCentral(char) {
    const central = document.getElementById('select-card-central');
    central.classList.remove('vazio');
    central.innerHTML = `
      <div class="card-simbolo">?</div>
      <div class="card-stats">
        <div>ATQ</div><div><span>${char.atq}</span></div>
        <div>DEF</div><div><span>${char.def}</span></div>
        <div>INC</div><div><span>${char.inc}</span></div>
        <div>PVS</div><div><span>${char.pvs}</span></div>
      </div>
      <div class="card-descricao">${DESCRICOES[char.id]}</div>
    `;
  }

  // ── Seleção ───────────────────────────────────────────────────────────────

  function selecionarChar(id) {
    selecionado = id;
    const char = CHAR_POOL.find(c => c.id === id);

    renderPool();
    renderCardCentral(char);

    const nomeInput = document.getElementById('select-nome');
    nomeInput.disabled = false;
    nomeInput.value = '';
    nomeInput.focus();

    document.getElementById('btn-cancelar').disabled = false;
    atualizarConfirmar();
  }

  function atualizarConfirmar() {
    const nome = document.getElementById('select-nome');
    const btn  = document.getElementById('btn-confirmar');
    if (nome && btn) {
      btn.disabled = selecionado === null || nome.value.trim().length === 0;
    }
  }

  function cancelar() {
    selecionado = null;
    render();
  }

  // ── Confirmação — abre painel de certeza ──────────────────────────────────

  function confirmar() {
    const nome = document.getElementById('select-nome').value.trim();
    if (!selecionado || !nome) return;

    const char = CHAR_POOL.find(c => c.id === selecionado);

    abrirPainelConfirmacao(char, nome);
  }

  function abrirPainelConfirmacao(char, nome) {
    const anterior = document.getElementById('painel-confirmacao');
    if (anterior) anterior.remove();

    const painel = document.createElement('div');
    painel.id = 'painel-confirmacao';
    painel.innerHTML = `
      <div class="painel-overlay"></div>
      <div class="painel-box">
        <div class="painel-titulo">Confirmar personagem?</div>
        <div class="painel-card">
          <div class="painel-simbolo">?</div>
          <div class="painel-info">
            <div class="painel-nome">${nome}</div>
            <div class="painel-tipo">${char.label}</div>
            <div class="painel-stats">ATQ ${char.atq} · DEF ${char.def} · INC ${char.inc} · PVS ${char.pvs}</div>
          </div>
        </div>
        <div class="painel-aviso">Esta escolha pode ser ajustada depois.</div>
        <div class="painel-botoes">
          <button class="btn-cancelar" id="painel-voltar">Voltar</button>
          <button class="btn-confirmar" id="painel-ok">Confirmar</button>
        </div>
      </div>
    `;

    document.getElementById('screen-select').appendChild(painel);

    document.getElementById('painel-voltar').addEventListener('click', () => {
      painel.remove();
    });

    document.getElementById('painel-ok').addEventListener('click', () => {
      painel.remove();
      registrarPersonagem(char, nome);
    });
  }

  // ── Registrar e avançar ───────────────────────────────────────────────────

  function registrarPersonagem(char, nome) {
    const personagem = criarPersonagem(char.id, nome);
    personagensMontados.push(personagem);

    if (rodada < 2) {
      rodada++;
      selecionado = null;
      render();
    } else {
      finalizar();
    }
  }

  // ── Finalizar — salva estado e passa para o tutorial ──────────────────────

  function finalizar() {
    PLAYER_STATE.personagens = personagensMontados;
    salvarEstado();

    // Esconde a tela de seleção e inicia o tutorial
    document.getElementById('screen-select').style.display = 'none';
    window.onSelecaoConcluida();
  }

  // ── Bind de eventos ───────────────────────────────────────────────────────

  function bindEventos() {
    document.getElementById('select-nome')
      .addEventListener('input', atualizarConfirmar);

    document.getElementById('btn-cancelar')
      .addEventListener('click', cancelar);

    document.getElementById('btn-confirmar')
      .addEventListener('click', confirmar);
  }

  return { init };

})();
