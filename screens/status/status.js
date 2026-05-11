const STATUS = (() => {
  let charIdx = 0;

  const ATLAS_NAIPES = {
    espadas: { label: '♠ ESPADAS', cor: '#5599cc', x: 400, y: 80  },
    copas:   { label: '♥ COPAS',   cor: '#e05555', x: 80,  y: 400 },
    ouro:    { label: '♦ OURO',    cor: '#f0c030', x: 720, y: 400 },
    paus:    { label: '♣ PAUS',    cor: '#4caf50', x: 400, y: 720 },
  };

  const ATLAS_NOS = [
    { id: 'centro', x: 400, y: 400, label: '',        tipo: 'centro',     custo: 0, naipe: null,      desbloqueado: true  },

    { id: 'esp_1',  x: 400, y: 280, label: 'ATQ +2',  tipo: 'atributo',   custo: 1, naipe: 'espadas', desbloqueado: false },
    { id: 'esp_2',  x: 320, y: 200, label: 'H1',      tipo: 'habilidade', custo: 2, naipe: 'espadas', desbloqueado: false, categoria: 1 },
    { id: 'esp_3',  x: 480, y: 200, label: 'PASSIVA', tipo: 'passiva',    custo: 2, naipe: 'espadas', desbloqueado: false },

    { id: 'cop_1',  x: 280, y: 400, label: 'DEF +2',  tipo: 'atributo',   custo: 1, naipe: 'copas',   desbloqueado: false },
    { id: 'cop_2',  x: 200, y: 320, label: 'H1',      tipo: 'habilidade', custo: 2, naipe: 'copas',   desbloqueado: false, categoria: 1 },
    { id: 'cop_3',  x: 200, y: 480, label: 'PASSIVA', tipo: 'passiva',    custo: 2, naipe: 'copas',   desbloqueado: false },

    { id: 'our_1',  x: 520, y: 400, label: 'INC +2',  tipo: 'atributo',   custo: 1, naipe: 'ouro',    desbloqueado: false },
    { id: 'our_2',  x: 600, y: 320, label: 'H1',      tipo: 'habilidade', custo: 2, naipe: 'ouro',    desbloqueado: false, categoria: 1 },
    { id: 'our_3',  x: 600, y: 480, label: 'PASSIVA', tipo: 'passiva',    custo: 2, naipe: 'ouro',    desbloqueado: false },

    { id: 'pau_1',  x: 400, y: 520, label: 'PVS +2',  tipo: 'atributo',   custo: 1, naipe: 'paus',    desbloqueado: false },
    { id: 'pau_2',  x: 320, y: 600, label: 'H1',      tipo: 'habilidade', custo: 2, naipe: 'paus',    desbloqueado: false, categoria: 1 },
    { id: 'pau_3',  x: 480, y: 600, label: 'PASSIVA', tipo: 'passiva',    custo: 2, naipe: 'paus',    desbloqueado: false },
  ];

  const ATLAS_CONEXOES = [
    ['centro', 'esp_1'], ['esp_1', 'esp_2'], ['esp_1', 'esp_3'],
    ['centro', 'cop_1'], ['cop_1', 'cop_2'], ['cop_1', 'cop_3'],
    ['centro', 'our_1'], ['our_1', 'our_2'], ['our_1', 'our_3'],
    ['centro', 'pau_1'], ['pau_1', 'pau_2'], ['pau_1', 'pau_3'],
  ];

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

  function renderTela() {
    const screen = document.getElementById('screen-status');
    screen.innerHTML = '';

    const topbar = document.createElement('div');
    topbar.id = 'status-topbar';
    topbar.innerHTML = `
      <div id="status-topbar-esq">
        <button id="status-topbar-voltar">← VOLTAR</button>
        <div id="status-topbar-titulo">⚔ STATUS</div>
      </div>
      <div id="status-topbar-pontos">PONTOS:<span id="status-topbar-pontos-valor">${PLAYER_STATE.pontos ?? 0}</span></div>
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

    initScroll();
    renderAtlas();
  }

  function renderPainelEsq() {
    const painel = document.createElement('div');
    painel.id = 'status-painel-esq';
    const p = PLAYER_STATE.personagens[charIdx] || {};
    painel.innerHTML = `
      <div id="status-char-avatar">?</div>
      <div id="status-char-nome">${p.nome || '—'}</div>
      <div id="status-char-pool">${p.poolId || '—'}</div>
      <div class="status-attr-linha"><span class="label">ATQ</span><span class="valor">${p.atq ?? 0}</span></div>
      <div class="status-attr-linha"><span class="label">DEF</span><span class="valor">${p.def ?? 0}</span></div>
      <div class="status-attr-linha"><span class="label">INC</span><span class="valor">${p.inc ?? 0}</span></div>
      <div class="status-attr-linha"><span class="label">PVS</span><span class="valor">${p.pvs ?? 0}</span></div>
      <div class="status-slot-titulo">EQUIPAMENTO</div>
      <div class="status-slot-item">SEM ITEM</div>
      <div class="status-slot-titulo">RELÍQUIA</div>
      <div class="status-slot-item">SEM RELÍQUIA</div>
    `;
    return painel;
  }

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

  function fecharPopup() {
    const overlay = document.getElementById('status-popup-overlay');
    if (overlay) overlay.remove();
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
    const tituloTipo = tipo === 'habilidade'
      ? `HABILIDADE ${slotIdx + 1}`
      : `PASSIVA ${slotIdx + 1}`;

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

  function renderAtlas() {
    const canvas = document.getElementById('status-atlas-canvas');
    if (!canvas) return;
    const comprados = PLAYER_STATE.personagens[charIdx].atlasComprados || [];
    canvas.innerHTML = '';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '800');
    svg.setAttribute('height', '800');
    svg.style.cssText = 'position:absolute;inset:0;pointer-events:none;';

    ATLAS_CONEXOES.forEach(([paiId, filhoId]) => {
      const pai   = ATLAS_NOS.find(n => n.id === paiId);
      const filho = ATLAS_NOS.find(n => n.id === filhoId);
      if (!pai || !filho) return;
      const ativa = comprados.includes(paiId);
      const cor   = ativa && filho.naipe ? ATLAS_NAIPES[filho.naipe].cor : '#ffffff0d';
      const line  = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', pai.x);
      line.setAttribute('y1', pai.y);
      line.setAttribute('x2', filho.x);
      line.setAttribute('y2', filho.y);
      line.setAttribute('stroke', cor);
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('opacity', ativa ? '0.4' : '1');
      svg.appendChild(line);
    });

    canvas.appendChild(svg);

    ATLAS_NOS.forEach(no => {
      const comprado   = comprados.includes(no.id);
      const disponivel = !comprado && (
        no.id === 'centro' ||
        ATLAS_CONEXOES.some(([pai, filho]) => filho === no.id && comprados.includes(pai))
      );
      const estado   = comprado ? 'comprado' : disponivel ? 'disponivel' : 'bloqueado';
      const naipeCor = no.naipe ? ATLAS_NAIPES[no.naipe].cor : '#c9a84c';
      const icone    = no.tipo === 'centro'      ? '✦'
                     : no.tipo === 'habilidade'  ? '⚔'
                     : no.tipo === 'passiva'     ? '◈'
                     : '+';

      const div = document.createElement('div');
      div.className = `atlas-no ${estado} ${no.tipo}`;
      div.style.cssText = `left:${no.x}px;top:${no.y}px;--naipe-cor:${naipeCor};`;
      div.innerHTML = `
        <div class="atlas-no-circulo">${icone}</div>
        <div class="atlas-no-label">${no.label}</div>
      `;

      if (disponivel && no.id !== 'centro') {
        div.addEventListener('click', () => comprarNo(no));
      }

      canvas.appendChild(div);
    });
  }

  function comprarNo(no) {
    if (PLAYER_STATE.pontos < no.custo) {
      const el = document.getElementById('status-topbar-pontos');
      if (el) {
        el.classList.add('sem-pontos');
        setTimeout(() => el.classList.remove('sem-pontos'), 600);
      }
      return;
    }
    PLAYER_STATE.pontos -= no.custo;
    const p = PLAYER_STATE.personagens[charIdx];
    if (!p.atlasComprados) p.atlasComprados = [];
    p.atlasComprados.push(no.id);
    if (typeof salvarEstado === 'function') salvarEstado();

    const pontosEl = document.getElementById('status-topbar-pontos-valor');
    if (pontosEl) pontosEl.textContent = PLAYER_STATE.pontos;

    renderAtlas();
  }

  function initScroll() {
    const area = document.getElementById('status-atlas-area');
    if (!area) return;
    let isDragging = false, startX, startY, scrollLeft, scrollTop;
    area.addEventListener('mousedown', e => {
      isDragging = true;
      startX = e.pageX - area.offsetLeft;
      startY = e.pageY - area.offsetTop;
      scrollLeft = area.scrollLeft;
      scrollTop  = area.scrollTop;
    });
    area.addEventListener('mouseleave', () => isDragging = false);
    area.addEventListener('mouseup',    () => isDragging = false);
    area.addEventListener('mousemove', e => {
      if (!isDragging) return;
      e.preventDefault();
      area.scrollLeft = scrollLeft - (e.pageX - area.offsetLeft - startX);
      area.scrollTop  = scrollTop  - (e.pageY - area.offsetTop  - startY);
    });
  }

  return { init };
})();
