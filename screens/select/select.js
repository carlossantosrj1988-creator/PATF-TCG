// screens/select/select.js

const SELECT = (() => {

  // ── Descrições dos personagens ────────────────────────────────────────────

  const DESCRICOES = {
    vigor:     'Alto PVS — ideal para absorver dano e durar mais.',
    ofensivo:  'Alto ATQ — causa mais dano por turno.',
    defensivo: 'Alto DEF — reduz o dano recebido consistentemente.',
    agil:      'Alto INC — age antes dos outros, controla o ritmo.',
  };

  // ── Estado interno ────────────────────────────────────────────────────────

  let rodada             = 0;
  let selecionado        = null;
  let personagensMontados = [];

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    // Cria o elemento se ainda não existir
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

  function render() {
    const screen = document.getElementById('screen-select');
    screen.style.display = 'flex';
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

  // ── Lógica de seleção ─────────────────────────────────────────────────────

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

  // ── Finalizar — salva estado e mostra resultado ───────────────────────────

  function finalizar() {
    PLAYER_STATE.personagens = personagensMontados;
    salvarEstado();
    mostrarResultado();
  }

  // ── Tela de resultado (placeholder de teste) ──────────────────────────────

  function mostrarResultado() {
    // Esconde select
    document.getElementById('screen-select').style.display = 'none';

    // Cria tela de resultado se não existir
    let resultado = document.getElementById('screen-resultado');
    if (!resultado) {
      resultado = document.createElement('div');
      resultado.id = 'screen-resultado';
      document.getElementById('game-container').appendChild(resultado);
    }

    resultado.style.display = 'flex';
    resultado.style.flexDirection = 'column';
    resultado.style.alignItems = 'center';
    resultado.style.justifyContent = 'center';
    resultado.style.width = '100%';
    resultado.style.height = '100%';
    resultado.style.background = '#0d0d0d';
    resultado.style.color = '#fff';
    resultado.style.gap = '24px';
    resultado.style.fontFamily = 'sans-serif';

    const itens = PLAYER_STATE.personagens.map((p, i) => {
      const base = CHAR_POOL.find(c => c.id === p.poolId);
      return `
        <div style="
          display:flex;align-items:center;gap:16px;
          padding:14px 20px;border-radius:10px;
          background:#1a1a1a;border:1px solid #333;
          width:280px;
        ">
          <div style="font-size:2rem;color:#888;">?</div>
          <div>
            <div style="font-size:1rem;font-weight:bold;color:#ffffff;letter-spacing:2px;">${p.nome}</div>
            <div style="font-size:0.75rem;color:#aaa;margin-top:4px;">${base.label} — ATQ ${p.atq} · DEF ${p.def} · INC ${p.inc} · PVS ${p.pvs}</div>
          </div>
        </div>
      `;
    }).join('');

    resultado.innerHTML = `
      <div style="font-size:0.75rem;color:#55cc88;letter-spacing:4px;text-transform:uppercase;">✔ Time montado</div>
      <div style="font-size:1.4rem;font-weight:900;color:#c9a84c;letter-spacing:6px;">SEU TIME</div>
      ${itens}
      <div style="font-size:0.75rem;color:#555;margin-top:16px;letter-spacing:2px;">[ PRÓXIMA TELA A DEFINIR ]</div>
    `;
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
