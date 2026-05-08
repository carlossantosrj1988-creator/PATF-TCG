// screens/select/select.js

const SELECT = (() => {

  // ── Dados internos ────────────────────────────────────────────────────────

  const DESCRICOES = {
    vigor:     'Alto PVS — ideal para absorver dano e durar mais.',
    ofensivo:  'Alto ATQ — causa mais dano por turno.',
    defensivo: 'Alto DEF — reduz o dano recebido consistentemente.',
    agil:      'Alto INC — age antes dos outros, controla o ritmo.',
  };

  let rodada        = 0;   // 0, 1, 2
  let selecionado   = null; // id do pool selecionado
  let personagensMontados = [];

  // ── Render ────────────────────────────────────────────────────────────────

  function render() {
    const screen = document.getElementById('screen-select');
    screen.innerHTML = `
      <div class="select-titulo">Escolha o personagem ${rodada + 1} de 3</div>

      <div class="select-pool" id="select-pool"></div>

      <div class="select-card-central vazio" id="select-card-central">
        <div class="card-simbolo">?</div>
        <div class="card-descricao">Selecione um personagem acima</div>
      </div>

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
  }

  function renderPool() {
    const pool = document.getElementById('select-pool');
    pool.innerHTML = '';

    CHAR_POOL.forEach(char => {
      const card = document.createElement('div');
      card.className = 'pool-card' + (selecionado === char.id ? ' selecionado' : '');
      card.dataset.id = char.id;
      card.textContent = '?';
      card.addEventListener('click', () => selecionarChar(char.id));
      pool.appendChild(card);
    });
  }

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

  // ── Lógica ────────────────────────────────────────────────────────────────

  function selecionarChar(id) {
    selecionado = id;
    const char = CHAR_POOL.find(c => c.id === id);

    renderPool();
    renderCardCentral(char);

    document.getElementById('select-nome').disabled = false;
    document.getElementById('select-nome').value = '';
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

  function confirmar() {
    const nome = document.getElementById('select-nome').value.trim();
    if (!selecionado || !nome) return;

    const personagem = criarPersonagem(selecionado, nome);
    personagensMontados.push(personagem);

    if (rodada < 2) {
      rodada++;
      selecionado = null;
      render();
    } else {
      finalizar();
    }
  }

  function finalizar() {
    PLAYER_STATE.personagens = personagensMontados;
    salvarEstado();
    // avança para o tutorial
    mostrarTela('screen-tutorial');
  }

  // ── Eventos ───────────────────────────────────────────────────────────────

  function bindEventos() {
    document.getElementById('select-nome')
      .addEventListener('input', atualizarConfirmar);

    document.getElementById('btn-cancelar')
      .addEventListener('click', cancelar);

    document.getElementById('btn-confirmar')
      .addEventListener('click', confirmar);
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    rodada = 0;
    selecionado = null;
    personagensMontados = [];
    render();
  }

  return { init };

})();
