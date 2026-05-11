// screens/status/status.js

const STATUS = (() => {
  let charIdx = 0;

  // ── Naipes — direções cardinais no canvas 2000×2000 ───────────────────────
  const CX = 1000, CY = 1000;

  const ATLAS_NAIPES = {
    copas:   { label: '♥ COPAS',   cor: '#e05555', mainDir: [0,-1], perpDir: [1,0],  vantagem: 'paus',    desvantagem: 'espadas', bonusCampo: null, bonusValor: 0 },
    espadas: { label: '♠ ESPADAS', cor: '#5599cc', mainDir: [1,0],  perpDir: [0,1],  vantagem: 'copas',   desvantagem: 'ouro',    bonusCampo: null, bonusValor: 0 },
    ouro:    { label: '♦ OURO',    cor: '#f0c030', mainDir: [0,1],  perpDir: [1,0],  vantagem: 'espadas', desvantagem: 'paus',    bonusCampo: null, bonusValor: 0 },
    paus:    { label: '♣ PAUS',    cor: '#4caf50', mainDir: [-1,0], perpDir: [0,1],  vantagem: 'ouro',    desvantagem: 'copas',   bonusCampo: null, bonusValor: 0 },
  };

  const CUSTO_NAIPE = 1;

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

    renderAtlas();
  }

  // ── Painel esquerdo ───────────────────────────────────────────────────────

  function renderPainelEsq() {
    const painel = document.createElement('div');
    painel.id = 'status-painel-esq';
    const p = PLAYER_STATE.personagens[charIdx] || {};
    const naipeInfo = p.naipe ? ATLAS_NAIPES[p.naipe] : null;
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
    habilidades.forEach((id, i) => {
      const no = id ? ATLAS_NOS.find(n => n.id === id) : null;
      const naipeCor = no?.naipe ? ATLAS_NAIPES[no.naipe].cor : '#c9a84c';
      habHTML += `
        <div class="status-slot-habilidade ${no ? 'ocupado' : ''}" data-slot="${i}" data-tipo="habilidade">
          ${no
            ? `<div class="slot-h-nome" style="color:${naipeCor}">${no.label}</div>
               <div class="slot-h-tipo" style="color:${naipeCor}88">${no.naipe ? no.naipe.toUpperCase() : ''}</div>`
            : `<div class="slot-h-nome">HAB ${i + 1}</div>`
          }
        </div>
      `;
    });

    let pasHTML = '<div class="status-dir-label" style="margin-top:8px;">PASSIVAS</div>';
    passivas.forEach((id, i) => {
      const no = id ? ATLAS_NOS.find(n => n.id === id) : null;
      const naipeCor = no?.naipe ? ATLAS_NAIPES[no.naipe].cor : '#8866ff';
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
          const no = ATLAS_NOS.find(n => n.id === equipadoId);
          if (no) abrirPopupDetalhe(tipo, slotIdx, no);
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
    const screen  = document.getElementById('screen-status');
    const naipe   = ATLAS_NAIPES[no.naipe];
    const icone   = no.tipo === 'habilidade' ? '⚔' : '◈';
    const catLabel = no.tipo === 'habilidade'
      ? ['', 'HAB BÁSICA', 'HAB INTERMEDIÁRIA', 'HAB AVANÇADA'][no.categoria] || ''
      : 'PASSIVA';
    const descricao = no.descricao || 'Descrição em breve.';

    const overlay = document.createElement('div');
    overlay.id = 'status-popup-overlay';
    overlay.innerHTML = `
      <div id="status-popup-box">
        <div id="status-popup-titulo">${catLabel}</div>
        <div class="popup-detalhe-icone" style="color:${naipe.cor}">${icone}</div>
        <div class="popup-detalhe-nome" style="color:${naipe.cor}">${no.label}</div>
        <div class="popup-detalhe-naipe" style="color:${naipe.cor}88">${naipe.label}</div>
        <div class="popup-detalhe-desc">${descricao}</div>
        <div class="popup-detalhe-acoes">
          <button id="status-popup-fechar">FECHAR</button>
          <button id="btn-comprar-no" style="color:${naipe.cor};border-color:${naipe.cor}66;">COMPRAR — ${no.custo} PT</button>
        </div>
      </div>
    `;
    screen.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) fecharPopup(); });
    overlay.querySelector('#status-popup-fechar').addEventListener('click', fecharPopup);
    overlay.querySelector('#btn-comprar-no').addEventListener('click', () => {
      comprarNo(no);
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
        const naipeCor = no.naipe ? ATLAS_NAIPES[no.naipe].cor : '#c9a84c';
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

  function abrirPopupDetalhe(tipo, slotIdx, no) {
    fecharPopup();
    const screen = document.getElementById('screen-status');
    const p = PLAYER_STATE.personagens[charIdx];
    const slotsAtuais = tipo === 'habilidade' ? p.habilidades : p.passivas;
    const naipeCor = no.naipe ? ATLAS_NAIPES[no.naipe].cor : '#c9a84c';
    const icone    = tipo === 'habilidade' ? '⚔' : '◈';
    const tituloTipo = tipo === 'habilidade' ? `HABILIDADE ${slotIdx + 1}` : `PASSIVA ${slotIdx + 1}`;

    const overlay = document.createElement('div');
    overlay.id = 'status-popup-overlay';
    overlay.innerHTML = `
      <div id="status-popup-box">
        <div id="status-popup-titulo">${tituloTipo}</div>
        <div class="popup-detalhe-icone" style="color:${naipeCor}">${icone}</div>
        <div class="popup-detalhe-nome" style="color:${naipeCor}">${no.label}</div>
        <div class="popup-detalhe-naipe" style="color:${naipeCor}88">${no.naipe ? no.naipe.toUpperCase() : ''}</div>
        <div class="popup-detalhe-desc">Descrição em breve.</div>
        <div class="popup-detalhe-acoes">
          <button id="status-popup-remover">REMOVER</button>
          <button id="status-popup-fechar">FECHAR</button>
        </div>
      </div>
    `;
    screen.appendChild(overlay);

    overlay.addEventListener('click', e => { if (e.target === overlay) fecharPopup(); });
    overlay.querySelector('#status-popup-fechar').addEventListener('click', fecharPopup);
    overlay.querySelector('#status-popup-remover').addEventListener('click', () => {
      slotsAtuais[slotIdx] = null;
      if (typeof salvarEstado === 'function') salvarEstado();
      fecharPopup();
      document.getElementById('status-painel-dir').replaceWith(renderPainelDir());
    });
  }

  // ── Navegação ─────────────────────────────────────────────────────────────

  function trocarChar(idx) {
    charIdx = idx;
    document.querySelectorAll('.status-aba').forEach((a, i) => {
      a.classList.toggle('ativa', i === idx);
    });
    document.getElementById('status-painel-esq').replaceWith(renderPainelEsq());
    document.getElementById('status-painel-dir').replaceWith(renderPainelDir());
    renderAtlas();
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
    const naipe = ATLAS_NAIPES[naipeId];
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

      // Skills se abrem para fora (perpendicular, afastando do centro)
      const sinal = cat.po < 0 ? -1 : 1;
      cat.nos.forEach((no, i) => {
        const sx = catX + (i + 1) * 80 * sinal * qx;
        const sy = catY + (i + 1) * 80 * sinal * qy;
        resultado.push({ ...no, x: sx, y: sy });
        const px2 = i === 0 ? catX : catX + i * 80 * sinal * qx;
        const py2 = i === 0 ? catY : catY + i * 80 * sinal * qy;
        linhas.push({ x1: px2, y1: py2, x2: sx, y2: sy, op: 0.25 });
      });
    });

    return { nos: resultado, linhas };
  }

  function renderAtlas() {
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
    Object.entries(ATLAS_NAIPES).forEach(([id, n]) => {
      const ix = CX + 200 * n.mainDir[0];
      const iy = CY + 200 * n.mainDir[1];
      svgLinha(svg, CX, CY, ix, iy, n.cor, p.naipe === id ? 0.45 : 0.13);
    });

    // Linhas e nós da árvore do naipe ativo (desenhados antes dos ícones)
    let t1Node = null;
    if (p.naipe) {
      const { nos, linhas } = gerarNosArvore(p.naipe);
      const naipe = ATLAS_NAIPES[p.naipe];

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
          canvas.appendChild(div);

        } else {
          if (no.tipo === 't2') {
            const div = document.createElement('div');
            div.className = 'atlas-no-t2';
            div.style.cssText = `left:${no.x}px;top:${no.y}px;--naipe-cor:${naipe.cor};`;
            div.innerHTML = `<div class="atlas-no-t2-circulo">T2</div>`;
            canvas.appendChild(div);
          } else {
            const comprado = comprados.includes(no.id);
            const icone    = no.tipo === 'passiva' ? '◈' : '⚔';
            const div = document.createElement('div');
            div.className = 'atlas-no-skill' + (comprado ? ' comprado' : '');
            div.style.cssText = `left:${no.x}px;top:${no.y}px;--naipe-cor:${naipe.cor};`;
            div.innerHTML = `<div class="atlas-no-skill-circulo">${comprado ? '✓' : icone}</div>`;
            if (!comprado) div.addEventListener('click', () => abrirPopupNo(no));
            canvas.appendChild(div);
          }
        }
      });
    }

    // Ícones de naipe (4 cardinais) — sobre as linhas
    Object.entries(ATLAS_NAIPES).forEach(([id, n]) => {
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

    // Scroll
    setTimeout(() => {
      if (t1Node) {
        area.scrollLeft = t1Node.x - area.clientWidth  / 2;
        area.scrollTop  = t1Node.y - area.clientHeight / 2;
      } else {
        area.scrollLeft = CX - area.clientWidth  / 2;
        area.scrollTop  = CY - area.clientHeight / 2;
      }
    }, 0);

    initScroll(area);
  }

  // ── Popup de naipe ────────────────────────────────────────────────────────

  function abrirPopupNaipe(naipeId) {
    fecharPopup();
    const screen  = document.getElementById('screen-status');
    const naipe   = ATLAS_NAIPES[naipeId];
    const vantNaipe = ATLAS_NAIPES[naipe.vantagem];
    const desvNaipe = ATLAS_NAIPES[naipe.desvantagem];
    const bonusTexto = naipe.bonusCampo && naipe.bonusValor > 0
      ? `+${naipe.bonusValor} ${naipe.bonusCampo.toUpperCase()}`
      : 'Bônus a definir';

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
        <div id="status-popup-titulo" style="color:${naipe.cor}">TIER 1 — ${naipe.label}</div>
        <div class="popup-detalhe-desc">
          Primeira camada da árvore de habilidades.<br><br>
          <strong style="color:${naipe.cor}">H1</strong> — Habilidades básicas · 2 pts<br>
          <strong style="color:${naipe.cor}">H2</strong> — Habilidades intermediárias · 3 pts<br>
          <strong style="color:${naipe.cor}">H3</strong> — Habilidades avançadas · 4 pts<br>
          <strong style="color:${naipe.cor}">P</strong> &nbsp;— Passivas automáticas · 2 pts
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

    const naipe = ATLAS_NAIPES[naipeId];
    if (naipe.bonusCampo && naipe.bonusValor > 0) {
      p[naipe.bonusCampo] = (p[naipe.bonusCampo] || 0) + naipe.bonusValor;
    }

    if (typeof salvarEstado === 'function') salvarEstado();

    const pontosEl = document.getElementById('status-topbar-pontos-valor');
    if (pontosEl) pontosEl.textContent = PLAYER_STATE.pontos;

    const painelEsq = document.getElementById('status-painel-esq');
    if (painelEsq) painelEsq.replaceWith(renderPainelEsq());

    fecharPopup();
    renderAtlas();
  }

  function comprarNo(no) {
    if (PLAYER_STATE.pontos < no.custo) {
      const el = document.getElementById('status-topbar-pontos');
      if (el) { el.classList.add('sem-pontos'); setTimeout(() => el.classList.remove('sem-pontos'), 600); }
      return;
    }
    PLAYER_STATE.pontos -= no.custo;
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
