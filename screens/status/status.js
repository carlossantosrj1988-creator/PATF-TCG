// screens/status/status.js

const STATUS = (() => {
  let charIdx = 0;

  // ── Canvas 2000×2000, centro (1000,1000) ─────────────────────────────────
  const CX = 1000, CY = 1000;

  const CUSTO_NAIPE = 1;

  const CUSTO_PROGRESSIVO = {
    h1: [2,  4,  8,  16,  32],
    h2: [3,  6,  12, 24,  48],
    h3: [5,  10, 20, 40,  80],
    pa: [15, 30, 60],
  };

  function custoProximaCompra(no, personagem) {
    const catKey = no.tipo === 'passiva' ? 'pa' : `h${no.categoria}`;
    const tabela = CUSTO_PROGRESSIVO[catKey] || [no.custo];
    const comprados = personagem.atlasComprados || [];
    const jaComprados = ATLAS_NOS.filter(n =>
      n.tipo === no.tipo &&
      n.categoria === no.categoria &&
      comprados.includes(n.id)
    ).length;
    return tabela[Math.min(jaComprados, tabela.length - 1)];
  }

  // ── Nós da árvore — 18 por naipe (H1×5 + H2×5 + H3×5 + Passivas×3) ───────
  const ATLAS_NOS = [
    // ── Copas ────────────────────────────────────────────────────────────────
    { id: 'cop_h1_1', naipe: 'copas', tipo: 'habilidade', categoria: 1, custo: 2, label: 'H1-1', descricao: '' },
    { id: 'cop_h1_2', naipe: 'copas', tipo: 'habilidade', categoria: 1, custo: 2, label: 'H1-2', descricao: '' },
    { id: 'cop_h1_3', naipe: 'copas', tipo: 'habilidade', categoria: 1, custo: 2, label: 'H1-3', descricao: '' },
    { id: 'cop_h1_4', naipe: 'copas', tipo: 'habilidade', categoria: 1, custo: 2, label: 'H1-4', descricao: '' },
    { id: 'cop_h1_5', naipe: 'copas', tipo: 'habilidade', categoria: 1, custo: 2, label: 'H1-5', descricao: '' },
    { id: 'cop_h2_1', naipe: 'copas', tipo: 'habilidade', categoria: 2, custo: 3, label: 'H2-1', descricao: '' },
    { id: 'cop_h2_2', naipe: 'copas', tipo: 'habilidade', categoria: 2, custo: 3, label: 'H2-2', descricao: '' },
    { id: 'cop_h2_3', naipe: 'copas', tipo: 'habilidade', categoria: 2, custo: 3, label: 'H2-3', descricao: '' },
    { id: 'cop_h2_4', naipe: 'copas', tipo: 'habilidade', categoria: 2, custo: 3, label: 'H2-4', descricao: '' },
    { id: 'cop_h2_5', naipe: 'copas', tipo: 'habilidade', categoria: 2, custo: 3, label: 'H2-5', descricao: '' },
    { id: 'cop_h3_1', naipe: 'copas', tipo: 'habilidade', categoria: 3, custo: 4, label: 'H3-1', descricao: '' },
    { id: 'cop_h3_2', naipe: 'copas', tipo: 'habilidade', categoria: 3, custo: 4, label: 'H3-2', descricao: '' },
    { id: 'cop_h3_3', naipe: 'copas', tipo: 'habilidade', categoria: 3, custo: 4, label: 'H3-3', descricao: '' },
    { id: 'cop_h3_4', naipe: 'copas', tipo: 'habilidade', categoria: 3, custo: 4, label: 'H3-4', descricao: '' },
    { id: 'cop_h3_5', naipe: 'copas', tipo: 'habilidade', categoria: 3, custo: 4, label: 'H3-5', descricao: '' },
    { id: 'cop_p1',   naipe: 'copas', tipo: 'passiva',    categoria: null, custo: 2, label: 'P-1', descricao: '' },
    { id: 'cop_p2',   naipe: 'copas', tipo: 'passiva',    categoria: null, custo: 2, label: 'P-2', descricao: '' },
    { id: 'cop_p3',   naipe: 'copas', tipo: 'passiva',    categoria: null, custo: 2, label: 'P-3', descricao: '' },

    // ── Espadas ──────────────────────────────────────────────────────────────
    { id: 'esp_h1_1', naipe: 'espadas', tipo: 'habilidade', categoria: 1, custo: 2, label: 'H1-1', descricao: '' },
    { id: 'esp_h1_2', naipe: 'espadas', tipo: 'habilidade', categoria: 1, custo: 2, label: 'H1-2', descricao: '' },
    { id: 'esp_h1_3', naipe: 'espadas', tipo: 'habilidade', categoria: 1, custo: 2, label: 'H1-3', descricao: '' },
    { id: 'esp_h1_4', naipe: 'espadas', tipo: 'habilidade', categoria: 1, custo: 2, label: 'H1-4', descricao: '' },
    { id: 'esp_h1_5', naipe: 'espadas', tipo: 'habilidade', categoria: 1, custo: 2, label: 'H1-5', descricao: '' },
    { id: 'esp_h2_1', naipe: 'espadas', tipo: 'habilidade', categoria: 2, custo: 3, label: 'H2-1', descricao: '' },
    { id: 'esp_h2_2', naipe: 'espadas', tipo: 'habilidade', categoria: 2, custo: 3, label: 'H2-2', descricao: '' },
    { id: 'esp_h2_3', naipe: 'espadas', tipo: 'habilidade', categoria: 2, custo: 3, label: 'H2-3', descricao: '' },
    { id: 'esp_h2_4', naipe: 'espadas', tipo: 'habilidade', categoria: 2, custo: 3, label: 'H2-4', descricao: '' },
    { id: 'esp_h2_5', naipe: 'espadas', tipo: 'habilidade', categoria: 2, custo: 3, label: 'H2-5', descricao: '' },
    { id: 'esp_h3_1', naipe: 'espadas', tipo: 'habilidade', categoria: 3, custo: 4, label: 'H3-1', descricao: '' },
    { id: 'esp_h3_2', naipe: 'espadas', tipo: 'habilidade', categoria: 3, custo: 4, label: 'H3-2', descricao: '' },
    { id: 'esp_h3_3', naipe: 'espadas', tipo: 'habilidade', categoria: 3, custo: 4, label: 'H3-3', descricao: '' },
    { id: 'esp_h3_4', naipe: 'espadas', tipo: 'habilidade', categoria: 3, custo: 4, label: 'H3-4', descricao: '' },
    { id: 'esp_h3_5', naipe: 'espadas', tipo: 'habilidade', categoria: 3, custo: 4, label: 'H3-5', descricao: '' },
    { id: 'esp_p1',   naipe: 'espadas', tipo: 'passiva',    categoria: null, custo: 2, label: 'P-1', descricao: '' },
    { id: 'esp_p2',   naipe: 'espadas', tipo: 'passiva',    categoria: null, custo: 2, label: 'P-2', descricao: '' },
    { id: 'esp_p3',   naipe: 'espadas', tipo: 'passiva',    categoria: null, custo: 2, label: 'P-3', descricao: '' },

    // ── Ouro ─────────────────────────────────────────────────────────────────
    { id: 'our_h1_1', naipe: 'ouro', tipo: 'habilidade', categoria: 1, custo: 2, label: 'H1-1', descricao: '' },
    { id: 'our_h1_2', naipe: 'ouro', tipo: 'habilidade', categoria: 1, custo: 2, label: 'H1-2', descricao: '' },
    { id: 'our_h1_3', naipe: 'ouro', tipo: 'habilidade', categoria: 1, custo: 2, label: 'H1-3', descricao: '' },
    { id: 'our_h1_4', naipe: 'ouro', tipo: 'habilidade', categoria: 1, custo: 2, label: 'H1-4', descricao: '' },
    { id: 'our_h1_5', naipe: 'ouro', tipo: 'habilidade', categoria: 1, custo: 2, label: 'H1-5', descricao: '' },
    { id: 'our_h2_1', naipe: 'ouro', tipo: 'habilidade', categoria: 2, custo: 3, label: 'H2-1', descricao: '' },
    { id: 'our_h2_2', naipe: 'ouro', tipo: 'habilidade', categoria: 2, custo: 3, label: 'H2-2', descricao: '' },
    { id: 'our_h2_3', naipe: 'ouro', tipo: 'habilidade', categoria: 2, custo: 3, label: 'H2-3', descricao: '' },
    { id: 'our_h2_4', naipe: 'ouro', tipo: 'habilidade', categoria: 2, custo: 3, label: 'H2-4', descricao: '' },
    { id: 'our_h2_5', naipe: 'ouro', tipo: 'habilidade', categoria: 2, custo: 3, label: 'H2-5', descricao: '' },
    { id: 'our_h3_1', naipe: 'ouro', tipo: 'habilidade', categoria: 3, custo: 4, label: 'H3-1', descricao: '' },
    { id: 'our_h3_2', naipe: 'ouro', tipo: 'habilidade', categoria: 3, custo: 4, label: 'H3-2', descricao: '' },
    { id: 'our_h3_3', naipe: 'ouro', tipo: 'habilidade', categoria: 3, custo: 4, label: 'H3-3', descricao: '' },
    { id: 'our_h3_4', naipe: 'ouro', tipo: 'habilidade', categoria: 3, custo: 4, label: 'H3-4', descricao: '' },
    { id: 'our_h3_5', naipe: 'ouro', tipo: 'habilidade', categoria: 3, custo: 4, label: 'H3-5', descricao: '' },
    { id: 'our_p1',   naipe: 'ouro', tipo: 'passiva',    categoria: null, custo: 2, label: 'P-1', descricao: '' },
    { id: 'our_p2',   naipe: 'ouro', tipo: 'passiva',    categoria: null, custo: 2, label: 'P-2', descricao: '' },
    { id: 'our_p3',   naipe: 'ouro', tipo: 'passiva',    categoria: null, custo: 2, label: 'P-3', descricao: '' },

    // ── Paus ─────────────────────────────────────────────────────────────────
    { id: 'pau_h1_1', naipe: 'paus', tipo: 'habilidade', categoria: 1, custo: 2, label: 'H1-1', descricao: '' },
    { id: 'pau_h1_2', naipe: 'paus', tipo: 'habilidade', categoria: 1, custo: 2, label: 'H1-2', descricao: '' },
    { id: 'pau_h1_3', naipe: 'paus', tipo: 'habilidade', categoria: 1, custo: 2, label: 'H1-3', descricao: '' },
    { id: 'pau_h1_4', naipe: 'paus', tipo: 'habilidade', categoria: 1, custo: 2, label: 'H1-4', descricao: '' },
    { id: 'pau_h1_5', naipe: 'paus', tipo: 'habilidade', categoria: 1, custo: 2, label: 'H1-5', descricao: '' },
    { id: 'pau_h2_1', naipe: 'paus', tipo: 'habilidade', categoria: 2, custo: 3, label: 'H2-1', descricao: '' },
    { id: 'pau_h2_2', naipe: 'paus', tipo: 'habilidade', categoria: 2, custo: 3, label: 'H2-2', descricao: '' },
    { id: 'pau_h2_3', naipe: 'paus', tipo: 'habilidade', categoria: 2, custo: 3, label: 'H2-3', descricao: '' },
    { id: 'pau_h2_4', naipe: 'paus', tipo: 'habilidade', categoria: 2, custo: 3, label: 'H2-4', descricao: '' },
    { id: 'pau_h2_5', naipe: 'paus', tipo: 'habilidade', categoria: 2, custo: 3, label: 'H2-5', descricao: '' },
    { id: 'pau_h3_1', naipe: 'paus', tipo: 'habilidade', categoria: 3, custo: 4, label: 'H3-1', descricao: '' },
    { id: 'pau_h3_2', naipe: 'paus', tipo: 'habilidade', categoria: 3, custo: 4, label: 'H3-2', descricao: '' },
    { id: 'pau_h3_3', naipe: 'paus', tipo: 'habilidade', categoria: 3, custo: 4, label: 'H3-3', descricao: '' },
    { id: 'pau_h3_4', naipe: 'paus', tipo: 'habilidade', categoria: 3, custo: 4, label: 'H3-4', descricao: '' },
    { id: 'pau_h3_5', naipe: 'paus', tipo: 'habilidade', categoria: 3, custo: 4, label: 'H3-5', descricao: '' },
    { id: 'pau_p1',   naipe: 'paus', tipo: 'passiva',    categoria: null, custo: 2, label: 'P-1', descricao: '' },
    { id: 'pau_p2',   naipe: 'paus', tipo: 'passiva',    categoria: null, custo: 2, label: 'P-2', descricao: '' },
    { id: 'pau_p3',   naipe: 'paus', tipo: 'passiva',    categoria: null, custo: 2, label: 'P-3', descricao: '' },
  ];

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    if (!document.getElementById('screen-status')) {
      const el = document.createElement('div');
      el.id = 'screen-status';
      document.getElementById('game-container').appendChild(el);
    }
    garantirEstadoPersonagens();
    renderTela();
  }

  function garantirEstadoPersonagens() {
    if (typeof PLAYER_STATE === 'undefined' || !Array.isArray(PLAYER_STATE.personagens)) return;
    PLAYER_STATE.personagens.forEach(p => {
      if (!p.atlasComprados) p.atlasComprados = [];
      if (!p.habilidades)    p.habilidades    = [null, null, null];
      if (!p.passivas)       p.passivas       = [null, null];
    });
  }

  // ── Render da tela ────────────────────────────────────────────────────────

  function renderTela() {
    const screen = document.getElementById('screen-status');
    screen.innerHTML = '';

    const topbar = document.createElement('div');
    topbar.id = 'status-topbar';
    topbar.innerHTML = `
      <div id="status-topbar-esq">
        <button id="status-topbar-voltar">← VOLTAR</button>
        <div id="status-topbar-titulo">⚔ STATUS</div>
        <div id="status-topbar-pontos">PONTOS:<span id="status-topbar-pontos-valor">${PLAYER_STATE.pontos ?? 0}</span></div>
      </div>
    `;
    topbar.querySelector('#status-topbar-voltar').addEventListener('click', voltar);
    screen.appendChild(topbar);

    const abas = document.createElement('div');
    abas.id = 'status-abas';
    (PLAYER_STATE.personagens || []).forEach((p, i) => {
      const aba = document.createElement('div');
      aba.className = 'status-aba' + (i === charIdx ? ' ativa' : '');
      aba.textContent = p?.nome || `PERSONAGEM ${i + 1}`;
      aba.addEventListener('click', () => trocarChar(i));
      abas.appendChild(aba);
    });
    screen.appendChild(abas);

    screen.appendChild(renderPainelEsq());

    const area = document.createElement('div');
    area.id = 'status-atlas-area';
    const canvas = document.createElement('div');
    canvas.id = 'status-atlas-canvas';
    area.appendChild(canvas);
    screen.appendChild(area);

    screen.appendChild(renderPainelDir());

    renderAtlas(true);
  }

  // ── Painel esquerdo ───────────────────────────────────────────────────────

  function renderPainelEsq() {
    const painel = document.createElement('div');
    painel.id = 'status-painel-esq';
    const p = PLAYER_STATE.personagens[charIdx] || {};
    const naipeInfo = p.naipe ? NAIPES_DATA[p.naipe] : null;
    const naipeSlotStyle = naipeInfo
      ? `color:${naipeInfo.cor};border-color:${naipeInfo.cor}55;background:${naipeInfo.cor}12;border-style:solid;`
      : '';
    painel.innerHTML = `
      <div id="status-char-avatar">?</div>
      <div id="status-char-nome">${p.nome || '—'}</div>
      <div id="status-char-pool">${p.poolId || '—'}</div>
      <div class="status-attr-linha"><span class="label">ATQ</span><span class="valor">${p.atq ?? 0}</span></div>
      <div class="status-attr-linha"><span class="label">DEF</span><span class="valor">${p.def ?? 0}</span></div>
      <div class="status-attr-linha"><span class="label">INC</span><span class="valor">${p.inc ?? 0}</span></div>
      <div class="status-attr-linha"><span class="label">PVS</span><span class="valor">${p.pvs ?? 0}</span></div>
      <div class="status-slot-titulo">NAIPE</div>
      <div class="status-slot-naipe ${naipeInfo ? 'definido' : ''}" style="${naipeSlotStyle}">
        ${naipeInfo ? naipeInfo.label : 'SEM NAIPE'}
      </div>
      <div class="status-slot-titulo">EQUIPAMENTO</div>
      <div class="status-slot-item">SEM ITEM</div>
      <div class="status-slot-titulo">RELÍQUIA</div>
      <div class="status-slot-item">SEM RELÍQUIA</div>
    `;
    return painel;
  }

  // ── Painel direito ────────────────────────────────────────────────────────

  function renderPainelDir() {
    const painel = document.createElement('div');
    painel.id = 'status-painel-dir';
    const p = PLAYER_STATE.personagens[charIdx] || {};
    const habilidades = p.habilidades || [null, null, null];
    const passivas    = p.passivas    || [null, null];

    let habHTML = '<div class="status-dir-label">HABILIDADES</div>';
    habilidades.forEach((slotVal, i) => {
      const ehBasico = typeof slotVal === 'string' && slotVal.startsWith('basico:');
      const no       = (slotVal && !ehBasico) ? ATLAS_NOS.find(n => n.id === slotVal) : null;
      const hab      = HABILIDADES.resolverHabilidade(slotVal);
      const naipeCor = no?.naipe ? NAIPES_DATA[no.naipe].cor : '#c9a84c';
      habHTML += `
        <div class="status-slot-habilidade ${hab ? 'ocupado' : ''}" data-slot="${i}" data-tipo="habilidade">
          ${hab
            ? `<div class="slot-h-nome" style="color:${naipeCor}">${hab.nome}</div>
               <div class="slot-h-tipo" style="color:${naipeCor}88">${ehBasico ? 'BÁSICA' : (no?.naipe ? no.naipe.toUpperCase() : '')}</div>`
            : `<div class="slot-h-nome">HAB ${i + 1}</div>`
          }
        </div>
      `;
    });

    let pasHTML = '<div class="status-dir-label" style="margin-top:8px;">PASSIVAS</div>';
    passivas.forEach((id, i) => {
      const no = id ? ATLAS_NOS.find(n => n.id === id) : null;
      const naipeCor = no?.naipe ? NAIPES_DATA[no.naipe].cor : '#8866ff';
      pasHTML += `
        <div class="status-slot-passiva ${no ? 'ocupado' : ''}" data-slot="${i}" data-tipo="passiva"
             style="${no ? `color:${naipeCor};border-color:${naipeCor}66` : ''}">
          ${no ? no.label : 'VAZIO'}
        </div>
      `;
    });

    painel.innerHTML = habHTML + pasHTML;

    painel.querySelectorAll('[data-tipo]').forEach(el => {
      el.addEventListener('click', () => {
        const tipo    = el.dataset.tipo;
        const slotIdx = parseInt(el.dataset.slot, 10);
        const slots   = tipo === 'habilidade' ? habilidades : passivas;
        const equipadoId = slots[slotIdx];
        if (equipadoId) {
          abrirPopupDetalhe(tipo, slotIdx, equipadoId);
        } else {
          abrirPopupSlot(tipo, slotIdx);
        }
      });
    });

    return painel;
  }

  // ── Popup helpers ─────────────────────────────────────────────────────────

  function fecharPopup() {
    const overlay = document.getElementById('status-popup-overlay');
    if (overlay) overlay.remove();
  }

  function abrirPopupNo(no) {
    fecharPopup();
    const screen   = document.getElementById('screen-status');
    const naipe    = NAIPES_DATA[no.naipe];
    const p        = PLAYER_STATE.personagens[charIdx];
    const custo    = custoProximaCompra(no, p);
    const icone    = no.tipo === 'habilidade' ? '⚔' : '◈';
    const catLabel = no.tipo === 'habilidade'
      ? ['', 'H1 — BÁSICA', 'H2 — INTERMEDIÁRIA', 'H3 — AVANÇADA'][no.categoria] || ''
      : 'PASSIVA';
    const descricao = no.descricao || 'Sem descrição ainda.';

    const semPontos = PLAYER_STATE.pontos < custo;
    const overlay = document.createElement('div');
    overlay.id = 'status-popup-overlay';
    overlay.innerHTML = `
      <div id="status-popup-box">
        <div class="popup-topo-row">
          <span class="popup-cat-badge">${catLabel}</span>
          <span class="popup-custo-badge">${custo} PT</span>
        </div>
        <div class="popup-detalhe-icone" style="color:${naipe.cor}">${icone}</div>
        <div class="popup-detalhe-nome" style="color:${naipe.cor}">${no.label}</div>
        <div class="popup-detalhe-naipe" style="color:${naipe.cor}99">${naipe.label}</div>
        <div class="popup-detalhe-desc">${descricao}</div>
        <div class="popup-detalhe-acoes">
          <button id="status-popup-fechar">FECHAR</button>
          <button id="btn-comprar-no"
            ${semPontos ? 'disabled' : ''}
            style="${semPontos ? '' : `color:${naipe.cor};border-color:${naipe.cor}66;`}">
            ${semPontos ? 'SEM PONTOS' : 'COMPRAR'}
          </button>
        </div>
      </div>
    `;
    screen.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) fecharPopup(); });
    overlay.querySelector('#status-popup-fechar').addEventListener('click', fecharPopup);
    overlay.querySelector('#btn-comprar-no').addEventListener('click', () => {
      comprarNo(no, custo);
      document.getElementById('status-painel-dir').replaceWith(renderPainelDir());
    });
  }

  function abrirPopupSlot(tipo, slotIdx) {
    fecharPopup();
    const screen = document.getElementById('screen-status');
    const p = PLAYER_STATE.personagens[charIdx];
    const comprados = p.atlasComprados || [];
    const slotsAtuais = tipo === 'habilidade' ? p.habilidades : p.passivas;

    let disponiveis = ATLAS_NOS.filter(n =>
      n.tipo === tipo &&
      comprados.includes(n.id) &&
      !slotsAtuais.includes(n.id)
    );

    if (tipo === 'habilidade') {
      const categoriaSlot = slotIdx + 1;
      disponiveis = disponiveis.filter(n => n.categoria === categoriaSlot);
    }

    const tituloTipo = tipo === 'habilidade'
      ? `HABILIDADE ${slotIdx + 1} — DISPONÍVEIS`
      : `PASSIVA ${slotIdx + 1} — DISPONÍVEIS`;

    let listaHTML = '';
    if (disponiveis.length === 0) {
      const msg = tipo === 'habilidade'
        ? `Nenhuma habilidade categoria ${slotIdx + 1} disponível.`
        : 'Nenhuma passiva disponível.';
      listaHTML = `<div class="popup-vazio">${msg}</div>`;
    } else {
      disponiveis.forEach(no => {
        const naipeCor = no.naipe ? NAIPES_DATA[no.naipe].cor : '#c9a84c';
        const icone = tipo === 'habilidade' ? '⚔' : '◈';
        listaHTML += `
          <div class="popup-item" data-id="${no.id}">
            <div class="popup-item-icone" style="color:${naipeCor}">${icone}</div>
            <div class="popup-item-info">
              <div class="popup-item-nome">${no.label}</div>
              <div class="popup-item-detalhe" style="color:${naipeCor}">${no.naipe ? no.naipe.toUpperCase() : ''}</div>
            </div>
          </div>
        `;
      });
    }

    const overlay = document.createElement('div');
    overlay.id = 'status-popup-overlay';
    overlay.innerHTML = `
      <div id="status-popup-box">
        <div id="status-popup-titulo">${tituloTipo}</div>
        <div id="status-popup-lista">${listaHTML}</div>
        <button id="status-popup-fechar">FECHAR</button>
      </div>
    `;
    screen.appendChild(overlay);

    overlay.addEventListener('click', e => { if (e.target === overlay) fecharPopup(); });
    overlay.querySelector('#status-popup-fechar').addEventListener('click', fecharPopup);

    overlay.querySelectorAll('.popup-item[data-id]').forEach(item => {
      item.addEventListener('click', () => {
        slotsAtuais[slotIdx] = item.dataset.id;
        if (typeof salvarEstado === 'function') salvarEstado();
        fecharPopup();
        document.getElementById('status-painel-dir').replaceWith(renderPainelDir());
      });
    });
  }

  function abrirPopupDetalhe(tipo, slotIdx, slotValue) {
    fecharPopup();
    const screen = document.getElementById('screen-status');
    const p = PLAYER_STATE.personagens[charIdx];
    const slotsAtuais = tipo === 'habilidade' ? p.habilidades : p.passivas;

    const ehBasico = tipo === 'habilidade'
      && typeof slotValue === 'string'
      && slotValue.startsWith('basico:');

    const icone      = tipo === 'habilidade' ? '⚔' : '◈';
    const tituloTipo = tipo === 'habilidade' ? `HABILIDADE ${slotIdx + 1}` : `PASSIVA ${slotIdx + 1}`;

    // Resolve dados, nome, descrição, cor e sublabel conforme a origem do slot
    let dados, nome, descricao, naipeCor, subLabel;
    if (ehBasico) {
      dados     = HABILIDADES.resolverHabilidade(slotValue);
      nome      = dados ? dados.nome : '—';
      descricao = dados && dados.descricao ? dados.descricao : 'Descrição em breve.';
      subLabel  = dados ? `BÁSICA · ${dados.tipo}` : 'BÁSICA';
      naipeCor  = '#c9a84c';
    } else {
      const no  = ATLAS_NOS.find(n => n.id === slotValue);
      dados     = tipo === 'habilidade'
        ? HABILIDADES.getHabilidade(slotValue)
        : HABILIDADES.getPassiva(slotValue);
      nome      = dados && dados.nome ? dados.nome : (no ? no.label : '—');
      descricao = dados && dados.descricao ? dados.descricao : 'Descrição em breve.';
      subLabel  = no && no.naipe ? no.naipe.toUpperCase() : '';
      naipeCor  = no && no.naipe ? NAIPES_DATA[no.naipe].cor : '#c9a84c';
    }

    // Ficha técnica — só para habilidades (passivas têm outro formato)
    let fichaHTML = '';
    if (tipo === 'habilidade' && dados) {
      const ALVO_LABEL = { unico: 'Alvo único', inimigos: 'Inimigos', aliados: 'Aliados', self: 'Si próprio', todos: 'Todos' };
      const ACAO_LABEL = { N: 'Normal', R: 'Rápida', F: 'Furtiva', L: 'Lenta' };
      const linhas = [
        ['PODER',   dados.efeitoPuro ? 'EFEITO' : String(dados.poder ?? 0)],
        ['TIPO',    dados.tipo || '—'],
        ['ALVO',    ALVO_LABEL[dados.alvo] || dados.alvo || '—'],
        ['TURNO',   dados.turno === 'nao' ? 'NÃO' : 'SIM'],
        ['RECARGA', String(dados.recarga ?? 0)],
        ['AÇÃO',    ACAO_LABEL[dados.acao] || dados.acao || '—'],
      ];
      fichaHTML = `
        <div style="margin:4px 0 10px;padding:8px 14px;border:1px solid #ffffff14;border-radius:8px;background:#ffffff06;text-align:left;">
          ${linhas.map(([l, v]) => `
            <div style="display:flex;justify-content:space-between;font-size:11px;line-height:1.95;">
              <span style="color:#8899aa;letter-spacing:1px;">${l}</span>
              <span style="color:#e8e8f0;font-weight:600;">${v}</span>
            </div>`).join('')}
        </div>`;
    }

    const avisoBasico = ehBasico
      ? `<div style="margin:10px 0;padding:10px 12px;border:1px solid #c9a84c55;border-radius:8px;background:#c9a84c12;font-size:11px;color:#e0c060;line-height:1.5;">
           ⚠ Habilidade inicial. Se você trocá-la, ela <strong>some para sempre</strong> — não volta para o mostruário.
         </div>`
      : '';

    const botaoAcao = ehBasico
      ? `<button id="status-popup-trocar" style="color:#c9a84c;border-color:#c9a84c66;">TROCAR</button>`
      : `<button id="status-popup-remover">REMOVER</button>`;

    const overlay = document.createElement('div');
    overlay.id = 'status-popup-overlay';
    overlay.innerHTML = `
      <div id="status-popup-box">
        <div id="status-popup-titulo">${tituloTipo}</div>
        <div class="popup-detalhe-icone" style="color:${naipeCor}">${icone}</div>
        <div class="popup-detalhe-nome" style="color:${naipeCor}">${nome}</div>
        <div class="popup-detalhe-naipe" style="color:${naipeCor}88">${subLabel}</div>
        ${fichaHTML}
        <div class="popup-detalhe-desc">${descricao}</div>
        ${avisoBasico}
        <div class="popup-detalhe-acoes">
          ${botaoAcao}
          <button id="status-popup-fechar">FECHAR</button>
        </div>
      </div>
    `;
    screen.appendChild(overlay);

    overlay.addEventListener('click', e => { if (e.target === overlay) fecharPopup(); });
    overlay.querySelector('#status-popup-fechar').addEventListener('click', fecharPopup);

    if (ehBasico) {
      overlay.querySelector('#status-popup-trocar').addEventListener('click', () => {
        fecharPopup();
        abrirPopupSlot(tipo, slotIdx);
      });
    } else {
      overlay.querySelector('#status-popup-remover').addEventListener('click', () => {
        slotsAtuais[slotIdx] = null;
        if (typeof salvarEstado === 'function') salvarEstado();
        fecharPopup();
        document.getElementById('status-painel-dir').replaceWith(renderPainelDir());
      });
    }
  }

  // ── Navegação ─────────────────────────────────────────────────────────────

  function trocarChar(idx) {
    charIdx = idx;
    document.querySelectorAll('.status-aba').forEach((a, i) => {
      a.classList.toggle('ativa', i === idx);
    });
    document.getElementById('status-painel-esq').replaceWith(renderPainelEsq());
    document.getElementById('status-painel-dir').replaceWith(renderPainelDir());
    renderAtlas(true);
  }

  function voltar() {
    window.irParaTela('screen-tutorial');
    if (typeof window.aoVoltarDoStatus === 'function') {
      const cb = window.aoVoltarDoStatus;
      window.aoVoltarDoStatus = null;
      cb();
    }
  }

  // ── Atlas PoE-style ───────────────────────────────────────────────────────

  function svgLinha(svg, x1, y1, x2, y2, cor, opacity, dashed) {
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', x1); l.setAttribute('y1', y1);
    l.setAttribute('x2', x2); l.setAttribute('y2', y2);
    l.setAttribute('stroke', cor);
    l.setAttribute('stroke-width', '1.5');
    l.setAttribute('opacity', opacity);
    if (dashed) l.setAttribute('stroke-dasharray', '4 4');
    svg.appendChild(l);
  }

  function gerarNosArvore(naipeId) {
    const naipe = NAIPES_DATA[naipeId];
    const [dx, dy] = naipe.mainDir;
    const [qx, qy] = naipe.perpDir;
    const naipeX = CX + 200 * dx, naipeY = CY + 200 * dy;
    const t1X    = naipeX + 200 * dx, t1Y = naipeY + 200 * dy;

    const nos = ATLAS_NOS.filter(n => n.naipe === naipeId);
    const cats = [
      { catId: 'h1', label: 'H1', icone: '⚔', po: -225, nos: nos.filter(n => n.tipo === 'habilidade' && n.categoria === 1) },
      { catId: 'h2', label: 'H2', icone: '⚡', po: -75,  nos: nos.filter(n => n.tipo === 'habilidade' && n.categoria === 2) },
      { catId: 'h3', label: 'H3', icone: '💥', po: +75,  nos: nos.filter(n => n.tipo === 'habilidade' && n.categoria === 3) },
      { catId: 'pa', label: 'P',  icone: '◈',  po: +225, nos: nos.filter(n => n.tipo === 'passiva') },
    ];

    const resultado = [{ tipo: 't1', x: t1X, y: t1Y, naipeId }];
    const linhas    = [{ x1: naipeX, y1: naipeY, x2: t1X, y2: t1Y, op: 0.6 }];

    // Tronco continua além dos galhos → T2
    const t2X = t1X + 370 * dx;
    const t2Y = t1Y + 370 * dy;
    resultado.push({ tipo: 't2', x: t2X, y: t2Y, naipeId });
    linhas.push({ x1: t1X, y1: t1Y, x2: t2X, y2: t2Y, op: 0.12, dashed: true });

    cats.forEach(cat => {
      // Nó de categoria: 140px no tronco + offset perpendicular
      const catX = t1X + 140 * dx + cat.po * qx;
      const catY = t1Y + 140 * dy + cat.po * qy;
      resultado.push({ tipo: 'categoria', id: naipeId + '_' + cat.catId, label: cat.label, icone: cat.icone, x: catX, y: catY, naipeId });
      linhas.push({ x1: t1X, y1: t1Y, x2: catX, y2: catY, op: 0.35 });

      // Skills crescem na direção T1→categoria (cada galho irradia na sua própria diagonal)
      const ddx = catX - t1X;
      const ddy = catY - t1Y;
      const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
      const nx = ddx / dist;
      const ny = ddy / dist;

      cat.nos.forEach((no, i) => {
        const sx = catX + (i + 1) * 80 * nx;
        const sy = catY + (i + 1) * 80 * ny;
        resultado.push({ ...no, x: sx, y: sy });
        const px2 = i === 0 ? catX : catX + i * 80 * nx;
        const py2 = i === 0 ? catY : catY + i * 80 * ny;
        linhas.push({ x1: px2, y1: py2, x2: sx, y2: sy, op: 0.25 });
      });
    });

    return { nos: resultado, linhas };
  }

  function renderAtlas(autoScroll = false) {
    const area   = document.getElementById('status-atlas-area');
    const canvas = document.getElementById('status-atlas-canvas');
    if (!canvas || !area) return;

    const p = PLAYER_STATE.personagens[charIdx];
    canvas.innerHTML = '';
    canvas.style.cssText = 'position:relative;width:2000px;height:2000px;';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '2000');
    svg.setAttribute('height', '2000');
    svg.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    canvas.appendChild(svg);

    const comprados = p.atlasComprados || [];

    // Cruz: linhas do centro para os 4 ícones de naipe
    Object.entries(NAIPES_DATA).forEach(([id, n]) => {
      const ix = CX + 200 * n.mainDir[0];
      const iy = CY + 200 * n.mainDir[1];
      svgLinha(svg, CX, CY, ix, iy, n.cor, p.naipe === id ? 0.45 : 0.13);
    });

    // Linhas e nós da árvore do naipe ativo (desenhados antes dos ícones)
    let t1Node = null;
    if (p.naipe) {
      const { nos, linhas } = gerarNosArvore(p.naipe);
      const naipe = NAIPES_DATA[p.naipe];

      linhas.forEach(l => svgLinha(svg, l.x1, l.y1, l.x2, l.y2, naipe.cor, l.op, l.dashed));

      nos.forEach(no => {
        if (no.tipo === 't1') {
          t1Node = no;
          const div = document.createElement('div');
          div.className = 'atlas-no-t1';
          div.style.cssText = `left:${no.x}px;top:${no.y}px;--naipe-cor:${naipe.cor};`;
          div.innerHTML = `<div class="atlas-no-t1-circulo">T1</div><div class="atlas-naipe-label">TIER 1</div>`;
          div.addEventListener('click', () => abrirPopupT1(naipe));
          canvas.appendChild(div);

        } else if (no.tipo === 'categoria') {
          const div = document.createElement('div');
          div.className = 'atlas-no-cat';
          div.style.cssText = `left:${no.x}px;top:${no.y}px;--naipe-cor:${naipe.cor};`;
          div.innerHTML = `<div class="atlas-no-cat-circulo">${no.icone}</div><div class="atlas-naipe-label">${no.label}</div>`;
          div.addEventListener('click', () => abrirPopupCategoria(no.id.split('_')[1], no.naipeId));
          canvas.appendChild(div);

        } else {
          if (no.tipo === 't2') {
            const div = document.createElement('div');
            div.className = 'atlas-no-t2';
            div.style.cssText = `left:${no.x}px;top:${no.y}px;--naipe-cor:${naipe.cor};`;
            div.innerHTML = `<div class="atlas-no-t2-circulo">T2</div>`;
            canvas.appendChild(div);
          } else {
            const comprado  = comprados.includes(no.id);
            const isPassiva = no.tipo === 'passiva';
            const icone     = isPassiva ? '◈' : '⚔';
            const baseClass = isPassiva ? 'atlas-no-passiva' : 'atlas-no-skill';
            const circClass = isPassiva ? 'atlas-no-passiva-circulo' : 'atlas-no-skill-circulo';
            const div = document.createElement('div');
            div.className = baseClass + (comprado ? ' comprado' : '');
            div.style.cssText = `left:${no.x}px;top:${no.y}px;--naipe-cor:${naipe.cor};`;
            div.innerHTML = `<div class="${circClass}">${comprado ? '✓' : icone}</div>`;
            if (!comprado) div.addEventListener('click', () => abrirPopupNo(no));
            canvas.appendChild(div);
          }
        }
      });
    }

    // Ícones de naipe (4 cardinais) — sobre as linhas
    Object.entries(NAIPES_DATA).forEach(([id, n]) => {
      const ix = CX + 200 * n.mainDir[0];
      const iy = CY + 200 * n.mainDir[1];
      const ativo   = p.naipe === id;
      const inativo = !!p.naipe && !ativo;
      const div = document.createElement('div');
      div.className = 'atlas-naipe-icone';
      div.style.cssText = `left:${ix}px;top:${iy}px;--naipe-cor:${n.cor};opacity:${inativo ? 0.22 : 1};`;
      div.innerHTML = `
        <div class="atlas-naipe-circulo${ativo ? ' ativo' : ''}">${n.label.split(' ')[0]}</div>
        <div class="atlas-naipe-label">${n.label.split(' ').slice(1).join(' ')}</div>
      `;
      if (!p.naipe) div.addEventListener('click', () => abrirPopupNaipe(id));
      canvas.appendChild(div);
    });

    // Nó central ✦
    const centro = document.createElement('div');
    centro.className = 'atlas-seletor-centro';
    centro.style.cssText = `left:${CX}px;top:${CY}px;`;
    centro.textContent = '✦';
    canvas.appendChild(centro);

    // Scroll automático só quando explicitamente solicitado
    if (autoScroll) {
      setTimeout(() => {
        if (t1Node) {
          area.scrollLeft = t1Node.x - area.clientWidth  / 2;
          area.scrollTop  = t1Node.y - area.clientHeight / 2;
        } else {
          area.scrollLeft = CX - area.clientWidth  / 2;
          area.scrollTop  = CY - area.clientHeight / 2;
        }
      }, 0);
    }

    initScroll(area);
  }

  // ── Popup de naipe ────────────────────────────────────────────────────────

  function abrirPopupNaipe(naipeId) {
    fecharPopup();
    const screen  = document.getElementById('screen-status');
    const naipe   = NAIPES_DATA[naipeId];
    const vantNaipe = NAIPES_DATA[naipe.vantagem];
    const desvNaipe = NAIPES_DATA[naipe.desvantagem];
    const bonusTexto = naipe.bonuses && naipe.bonuses.length > 0
      ? naipe.bonuses.map(b => `+${b.valor} ${b.campo.toUpperCase()}`).join(' · ')
      : 'Sem bônus';

    const overlay = document.createElement('div');
    overlay.id = 'status-popup-overlay';
    overlay.innerHTML = `
      <div id="status-popup-box">
        <div class="atlas-naipe-popup-simbolo" style="color:${naipe.cor}">${naipe.label.split(' ')[0]}</div>
        <div id="status-popup-titulo" style="color:${naipe.cor}">${naipe.label}</div>
        <div class="atlas-naipe-popup-linha">
          <span class="atlas-naipe-popup-tag vantagem">VANTAGEM</span>
          <span style="color:${vantNaipe.cor}">${vantNaipe.label}</span>
        </div>
        <div class="atlas-naipe-popup-linha">
          <span class="atlas-naipe-popup-tag desvantagem">DESVANTAGEM</span>
          <span style="color:${desvNaipe.cor}">${desvNaipe.label}</span>
        </div>
        <div class="atlas-naipe-popup-bonus">${bonusTexto}</div>
        <div class="popup-detalhe-acoes">
          <button id="status-popup-fechar">CANCELAR</button>
          <button id="btn-comprar-naipe" style="color:${naipe.cor};border-color:${naipe.cor}66;">DEFINIR NAIPE — ${CUSTO_NAIPE} PT</button>
        </div>
      </div>
    `;
    screen.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) fecharPopup(); });
    overlay.querySelector('#status-popup-fechar').addEventListener('click', fecharPopup);
    overlay.querySelector('#btn-comprar-naipe').addEventListener('click', () => comprarNaipe(naipeId));
  }

  function abrirPopupT1(naipe) {
    fecharPopup();
    const screen  = document.getElementById('screen-status');
    const overlay = document.createElement('div');
    overlay.id = 'status-popup-overlay';
    overlay.innerHTML = `
      <div id="status-popup-box">
        <div class="popup-topo-row">
          <span class="popup-cat-badge" style="color:${naipe.cor};border-color:${naipe.cor}44;">TIER 1</span>
          <span class="popup-custo-badge">ATIVO</span>
        </div>
        <div class="popup-detalhe-icone" style="color:${naipe.cor};font-size:1rem;letter-spacing:2px;">T1</div>
        <div class="popup-detalhe-naipe" style="color:${naipe.cor}99">${naipe.label}</div>
        <div class="popup-detalhe-desc">
          Desbloqueado ao escolher o naipe.<br><br>
          Dá acesso a todas as <strong style="color:${naipe.cor}">habilidades</strong> e
          <strong style="color:${naipe.cor}">passivas</strong> deste naipe.<br><br>
          Clique nos nós <strong style="color:${naipe.cor}">H1 · H2 · H3 · P</strong>
          para ver detalhes e custos de cada categoria.
        </div>
        <div class="popup-detalhe-acoes">
          <button id="status-popup-fechar">ENTENDIDO</button>
        </div>
      </div>
    `;
    screen.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) fecharPopup(); });
    overlay.querySelector('#status-popup-fechar').addEventListener('click', fecharPopup);
  }

  function abrirPopupCategoria(catId, naipeId) {
    fecharPopup();
    const screen = document.getElementById('screen-status');
    const naipe  = NAIPES_DATA[naipeId];

    const INFO = {
      h1: {
        icone: '⚔',
        titulo: 'H1 — HABILIDADES BÁSICAS',
        custo: CUSTO_PROGRESSIVO.h1.join(' → ') + ' PT',
        desc: 'Habilidades de entrada de qualquer build. Disponíveis no início do turno e geralmente sem recarga — você pode contar com elas toda rodada. São o ponto de partida da sua estratégia.',
      },
      h2: {
        icone: '⚡',
        titulo: 'H2 — HABILIDADES INTERMEDIÁRIAS',
        custo: CUSTO_PROGRESSIVO.h2.join(' → ') + ' PT',
        desc: 'Mais versáteis e poderosas que as básicas. Ideais para combos e situações específicas. Costumam ter recarga após uso — use no momento certo.',
      },
      h3: {
        icone: '💥',
        titulo: 'H3 — HABILIDADES ESPECIAIS',
        custo: CUSTO_PROGRESSIVO.h3.join(' → ') + ' PT',
        desc: 'As mais impactantes da árvore. Definem o estilo da sua build. Geralmente bloqueadas no primeiro turno e com recarga pesada — mas quando ativam, mudam o rumo da batalha.',
      },
      pa: {
        icone: '◈',
        titulo: 'PASSIVAS',
        custo: CUSTO_PROGRESSIVO.pa.join(' → ') + ' PT',
        desc: 'Não precisam de ativação. Enquanto equipadas nos slots de passiva, funcionam automaticamente durante a batalha conforme a descrição.',
      },
    };

    const info = INFO[catId];
    if (!info) return;

    const overlay = document.createElement('div');
    overlay.id = 'status-popup-overlay';
    overlay.innerHTML = `
      <div id="status-popup-box">
        <div class="popup-topo-row">
          <span class="popup-cat-badge">${info.titulo}</span>
          <span class="popup-custo-badge">${info.custo}</span>
        </div>
        <div class="popup-detalhe-icone" style="color:${naipe.cor}">${info.icone}</div>
        <div class="popup-detalhe-naipe" style="color:${naipe.cor}99">${naipe.label}</div>
        <div class="popup-detalhe-desc">${info.desc}</div>
        <div class="popup-detalhe-acoes">
          <button id="status-popup-fechar">ENTENDIDO</button>
        </div>
      </div>
    `;
    screen.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) fecharPopup(); });
    overlay.querySelector('#status-popup-fechar').addEventListener('click', fecharPopup);
  }

  // ── Compras ───────────────────────────────────────────────────────────────

  function comprarNaipe(naipeId) {
    if (PLAYER_STATE.pontos < CUSTO_NAIPE) {
      const el = document.getElementById('status-topbar-pontos');
      if (el) { el.classList.add('sem-pontos'); setTimeout(() => el.classList.remove('sem-pontos'), 600); }
      return;
    }
    const p = PLAYER_STATE.personagens[charIdx];
    PLAYER_STATE.pontos -= CUSTO_NAIPE;
    p.naipe      = naipeId;
    p.naipeAtivo = naipeId;

    const naipe = NAIPES_DATA[naipeId];
    (naipe.bonuses || []).forEach(b => {
      p[b.campo] = (p[b.campo] || 0) + b.valor;
    });

    if (typeof salvarEstado === 'function') salvarEstado();

    const pontosEl = document.getElementById('status-topbar-pontos-valor');
    if (pontosEl) pontosEl.textContent = PLAYER_STATE.pontos;

    const painelEsq = document.getElementById('status-painel-esq');
    if (painelEsq) painelEsq.replaceWith(renderPainelEsq());

    fecharPopup();
    renderAtlas(true);
  }

  function comprarNo(no, custo) {
    if (custo === undefined) custo = custoProximaCompra(no, PLAYER_STATE.personagens[charIdx]);
    if (PLAYER_STATE.pontos < custo) {
      const el = document.getElementById('status-topbar-pontos');
      if (el) { el.classList.add('sem-pontos'); setTimeout(() => el.classList.remove('sem-pontos'), 600); }
      return;
    }
    PLAYER_STATE.pontos -= custo;
    const p = PLAYER_STATE.personagens[charIdx];
    if (!p.atlasComprados) p.atlasComprados = [];
    p.atlasComprados.push(no.id);
    if (typeof salvarEstado === 'function') salvarEstado();

    const pontosEl = document.getElementById('status-topbar-pontos-valor');
    if (pontosEl) pontosEl.textContent = PLAYER_STATE.pontos;

    fecharPopup();
    renderAtlas();
  }

  // ── Drag-to-scroll ────────────────────────────────────────────────────────

  function initScroll(area) {
    if (!area || area._scrollBound) return;
    area._scrollBound = true;
    let drag = false, sx, sy, sl, st;
    area.addEventListener('mousedown', e => {
      drag = true;
      sx = e.pageX - area.offsetLeft; sy = e.pageY - area.offsetTop;
      sl = area.scrollLeft;           st = area.scrollTop;
    });
    area.addEventListener('mouseleave', () => drag = false);
    area.addEventListener('mouseup',    () => drag = false);
    area.addEventListener('mousemove', e => {
      if (!drag) return;
      e.preventDefault();
      area.scrollLeft = sl - (e.pageX - area.offsetLeft - sx);
      area.scrollTop  = st - (e.pageY - area.offsetTop  - sy);
    });
  }

  return { init };
})();
