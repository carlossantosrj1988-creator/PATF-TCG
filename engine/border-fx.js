// engine/border-fx.js  v4 — arquitetura correta
//
// 3 camadas independentes:
//   1. Borda física (CSS border + box-shadow + @keyframes) no #battle-topbar e #battle-panel
//   2. Canvas de neon (cores animadas correndo dentro da borda)
//   3. Quadradinhos nos cantos (parados no repouso, giram quando IA ativa)
//
// IA de estados:
//   repouso | inimigo | sirene | defesa | troca_turno
//   + pulso(1=fraco, 2=medio, 3=forte, 4=lendario)
//
// Lendário: cobrinha percorre os 4 lados do game-container
//
// API:
//   BORDER_FX.init()        — inicia o sistema (battle start)
//   BORDER_FX.destroy()     — remove tudo
//   BORDER_FX.atualizar()   — re-aplica após render (DOM recriado)
//   BORDER_FX.estado(nome)  — muda estado da IA
//   BORDER_FX.pulso(nivel)  — dispara animação de dano
//   BORDER_FX.preview(nome) — preview temporário

const BORDER_FX = (() => {

  // ── Estado ────────────────────────────────────────────────────────────────
  let _estado = 'repouso';
  let _pulso  = null;  // { nivel, t, dur }
  let _t      = 0;
  let _lendT  = 0;
  let _raf    = null;

  // Canvas refs (recriados após cada render via atualizar())
  let _cvTop = null, _ctxTop = null;
  let _cvBot = null, _ctxBot = null;
  let _cvLend = null, _ctxLend = null;

  // ── Cores e paletas ───────────────────────────────────────────────────────
  const COR_BASE    = '#00cfff';
  const COR_INIMIGO = '#ff3300';

  const PAL = {
    azul:     ['#00cfff','#0088ff','#00eeff','#44ccff'],
    vermelho: ['#ff3300','#ff6600','#ff0044','#ff8888'],
    sirene:   ['#0044ff','#ff0022','#00cfff','#ff3300'],
    arco:     ['#ff0000','#ff7700','#ffff00','#00ff00','#00ffff','#0077ff','#aa00ff'],
    lendario: ['#ff00ff','#00ffff','#ffff00','#ff0000','#00ff00','#ff7700','#aa00ff'],
  };

  // ── CSS injetado dinamicamente ────────────────────────────────────────────
  function _css() {
    if (document.getElementById('bfx-style')) return;
    const s = document.createElement('style');
    s.id = 'bfx-style';
    s.textContent = `
      /* Borda neon no elemento */
      .bfx-on {
        overflow: visible !important;
        border: 2px solid ${COR_BASE} !important;
        box-shadow: 0 0 8px ${COR_BASE}99, 0 0 22px ${COR_BASE}44,
                    inset 0 0 8px ${COR_BASE}22 !important;
        transition: border-color 0.25s, box-shadow 0.25s;
        box-sizing: border-box;
      }
      .bfx-on.bfx-inimigo {
        border-color: ${COR_INIMIGO} !important;
        box-shadow: 0 0 8px ${COR_INIMIGO}99, 0 0 22px ${COR_INIMIGO}44,
                    inset 0 0 8px ${COR_INIMIGO}22 !important;
      }

      /* ── Animações físicas da borda ── */
      @keyframes bfx-shake-leve {
        0%,100%{ transform:translateX(0) }
        25%    { transform:translateX(-3px) }
        75%    { transform:translateX( 3px) }
      }
      @keyframes bfx-shake-medio {
        0%,100%{ transform:translateX(0) scaleY(1) }
        20%    { transform:translateX(-6px) scaleY(1.15) }
        50%    { transform:translateX( 6px) scaleY(0.90) }
        80%    { transform:translateX(-4px) scaleY(1.10) }
      }
      @keyframes bfx-shake-forte {
        0%,100%{ transform:translateX(0)   scaleY(1)   }
        15%    { transform:translateX(-10px) scaleY(1.4) }
        35%    { transform:translateX( 10px) scaleY(0.7) }
        55%    { transform:translateX( -8px) scaleY(1.3) }
        75%    { transform:translateX(  8px) scaleY(0.8) }
      }
      @keyframes bfx-ondula-top {
        0%,100%{ transform:skewX(0deg)    scaleY(1)    }
        25%    { transform:skewX( 4deg)   scaleY(1.2)  }
        75%    { transform:skewX(-4deg)   scaleY(0.85) }
      }
      @keyframes bfx-ondula-bot {
        0%,100%{ transform:skewX(0deg)    scaleY(1)    }
        25%    { transform:skewX(-4deg)   scaleY(1.2)  }
        75%    { transform:skewX( 4deg)   scaleY(0.85) }
      }
      @keyframes bfx-sirene {
        0%,49% { border-color:#0044ff !important;
                 box-shadow:0 0 14px #0044ff,0 0 32px #0044ff99,inset 0 0 10px #0044ff33 !important; }
        50%,100%{ border-color:#ff0022 !important;
                 box-shadow:0 0 14px #ff0022,0 0 32px #ff002299,inset 0 0 10px #ff002233 !important; }
      }
      @keyframes bfx-pisca {
        0%,49% { opacity:1   }
        50%,100%{ opacity:0.15 }
      }

      /* Classes de estado aplicadas via JS */
      .bfx-shake-leve  { animation: bfx-shake-leve  0.35s ease infinite; }
      .bfx-shake-medio { animation: bfx-shake-medio 0.28s ease infinite; }
      .bfx-shake-forte { animation: bfx-shake-forte 0.22s ease infinite; }
      .bfx-ondula-top  { animation: bfx-ondula-top  0.55s ease infinite; }
      .bfx-ondula-bot  { animation: bfx-ondula-bot  0.55s ease infinite; }
      .bfx-sirene      { animation: bfx-sirene 0.45s steps(1) infinite; }
      .bfx-pisca       { animation: bfx-pisca  0.35s steps(1) infinite; }

      /* ── Quadradinhos dos cantos ── */
      @keyframes bfx-girar {
        from { transform: rotate(0deg)   }
        to   { transform: rotate(360deg) }
      }
      .bfx-canto {
        position: absolute;
        width: 9px; height: 9px;
        border: 2px solid currentColor;
        background: rgba(0,0,0,0.65);
        z-index: 20;
        pointer-events: none;
        animation: bfx-girar 1.4s linear infinite;
        animation-play-state: paused;
      }
      .bfx-canto.girando       { animation-play-state: running; }
      .bfx-canto.girando-fast  { animation-play-state: running; animation-duration: 0.35s; }
      .bfx-canto-tl { top:-5px; left:-5px; }
      .bfx-canto-tr { top:-5px; right:-5px; }
      .bfx-canto-bl { bottom:-5px; left:-5px; }
      .bfx-canto-br { bottom:-5px; right:-5px; }

      /* ── Brilho pulsante animado (substitui canvas) ── */
      @keyframes bfx-brilho-azul {
        0%  { box-shadow: 0 0 8px #00cfff99, 0 0 22px #00cfff44, inset 0 0 8px #00cfff22; }
        33% { box-shadow: 0 0 14px #0088ffcc, 0 0 35px #0088ff66, inset 0 0 12px #0088ff33; }
        66% { box-shadow: 0 0 10px #00eeffaa, 0 0 28px #00eeff55, inset 0 0 10px #00eeff28; }
        100%{ box-shadow: 0 0 8px #00cfff99, 0 0 22px #00cfff44, inset 0 0 8px #00cfff22; }
      }
      @keyframes bfx-brilho-vermelho {
        0%  { box-shadow: 0 0 8px #ff330099, 0 0 22px #ff330044, inset 0 0 8px #ff330022; }
        33% { box-shadow: 0 0 14px #ff6600cc, 0 0 35px #ff660066, inset 0 0 12px #ff660033; }
        66% { box-shadow: 0 0 10px #ff0044aa, 0 0 28px #ff004455, inset 0 0 10px #ff004428; }
        100%{ box-shadow: 0 0 8px #ff330099, 0 0 22px #ff330044, inset 0 0 8px #ff330022; }
      }
      .bfx-on:not(.bfx-inimigo):not(.bfx-sirene):not(.bfx-pisca) {
        animation: bfx-brilho-azul 3s ease infinite;
      }
      .bfx-on.bfx-inimigo:not(.bfx-sirene) {
        animation: bfx-brilho-vermelho 3s ease infinite;
      }
    `;
    document.head.appendChild(s);
  }

  // ── Canvas: neon correndo ao longo da borda ──────────────────────────────
  function _drawNeon(ctx, w, h, t, pal, speed, brilho) {
    ctx.clearRect(0, 0, w, h);
    if (w <= 0 || h <= 0) return;

    // Gradiente horizontal animado (simula cores correndo)
    const off = ((t * speed * 0.4) % 1 + 1) % 1;
    const idx = Math.floor(off * pal.length);
    const c0  = pal[idx % pal.length];
    const c1  = pal[(idx + 1) % pal.length];
    const c2  = pal[(idx + 2) % pal.length];

    const grd = ctx.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0,                          c0);
    grd.addColorStop(Math.max(0, off - 0.01),    c0);
    grd.addColorStop(off,                        c1);
    grd.addColorStop(Math.min(1, off + 0.5),     c2);
    grd.addColorStop(1,                          c0);

    ctx.save();
    ctx.lineCap = 'square';

    // Bloom externo
    ctx.strokeStyle = grd;
    ctx.lineWidth   = 10 * brilho;
    ctx.globalAlpha = 0.07;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    // Glow médio
    ctx.lineWidth   = 5 * brilho;
    ctx.globalAlpha = 0.22;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    // Core colorido
    ctx.lineWidth   = 1.8;
    ctx.globalAlpha = 0.88;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    // Linha branca central
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 0.7;
    ctx.globalAlpha = 0.55 * brilho;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    ctx.restore();
  }

  // ── Cobrinha lendária: percorre os 4 lados do game-container ─────────────
  function _perim(t01, w, h) {
    const p = 2 * (w + h);
    const d = ((t01 % 1) + 1) % 1 * p;
    if (d < w)           return { x: d,         y: 0 };
    if (d < w + h)       return { x: w,          y: d - w };
    if (d < 2 * w + h)   return { x: w - (d - w - h), y: h };
    return { x: 0, y: h - (d - 2 * w - h) };
  }

  function _drawLendario() {
    if (!_ctxLend || !_cvLend) return;
    const w = _cvLend.width, h = _cvLend.height;
    _ctxLend.clearRect(0, 0, w, h);

    const pal   = PAL.lendario;
    const cabT  = (_lendT * 0.007) % 1;
    const rastW = 0.22;
    const steps = 30;

    for (let i = 0; i < steps; i++) {
      const frac = i / steps;
      const t0   = ((cabT - frac * rastW) % 1 + 1) % 1;
      const t1   = ((cabT - (frac + 1 / steps) * rastW) % 1 + 1) % 1;
      const p0   = _perim(t0, w, h);
      const p1   = _perim(t1, w, h);
      const alpha = (1 - frac) * 0.92;
      const cor   = pal[Math.floor((_lendT * 0.22 + i * 0.11)) % pal.length];
      const lw    = (1 - frac) * 14 + 2;

      _ctxLend.save();
      _ctxLend.lineCap = 'round';
      // Glow
      _ctxLend.strokeStyle = cor;
      _ctxLend.lineWidth   = lw * 2.2;
      _ctxLend.globalAlpha = alpha * 0.14;
      _ctxLend.beginPath(); _ctxLend.moveTo(p0.x, p0.y); _ctxLend.lineTo(p1.x, p1.y); _ctxLend.stroke();
      // Core
      _ctxLend.lineWidth   = lw * 0.75;
      _ctxLend.globalAlpha = alpha;
      _ctxLend.beginPath(); _ctxLend.moveTo(p0.x, p0.y); _ctxLend.lineTo(p1.x, p1.y); _ctxLend.stroke();
      // Branco
      _ctxLend.strokeStyle = '#ffffff';
      _ctxLend.lineWidth   = lw * 0.22;
      _ctxLend.globalAlpha = alpha * 0.65;
      _ctxLend.beginPath(); _ctxLend.moveTo(p0.x, p0.y); _ctxLend.lineTo(p1.x, p1.y); _ctxLend.stroke();
      _ctxLend.restore();
    }
  }

  // ── Cantos ────────────────────────────────────────────────────────────────
  function _criarCantos(el) {
    ['tl','tr','bl','br'].forEach(pos => {
      const d = document.createElement('div');
      d.className = `bfx-canto bfx-canto-${pos}`;
      _colorirCanto(d);
      el.appendChild(d);
    });
  }

  function _colorirCanto(el) {
    const cor = _estado === 'inimigo' ? COR_INIMIGO : COR_BASE;
    el.style.color       = cor;
    el.style.borderColor = cor;
    el.style.boxShadow   = `0 0 6px ${cor}, 0 0 14px ${cor}66`;
  }

  function _atualizarCantos(girando, rapido) {
    document.querySelectorAll('.bfx-canto').forEach(c => {
      c.classList.remove('girando', 'girando-fast');
      _colorirCanto(c);
      if (girando) c.classList.add(rapido ? 'girando-fast' : 'girando');
    });
  }

  // ── Aplicar classes de estado nos elementos ───────────────────────────────
  const _TODAS = ['bfx-shake-leve','bfx-shake-medio','bfx-shake-forte',
                  'bfx-ondula-top','bfx-ondula-bot','bfx-sirene','bfx-pisca'];

  function _setCls(top, bot) {
    const elTop = document.getElementById('battle-topbar');
    const elBot = document.getElementById('battle-panel');
    if (!elTop || !elBot) return;
    _TODAS.forEach(c => { elTop.classList.remove(c); elBot.classList.remove(c); });
    top.split(' ').forEach(c => c && elTop.classList.add(c));
    bot.split(' ').forEach(c => c && elBot.classList.add(c));
    elTop.classList.toggle('bfx-inimigo', _estado === 'inimigo');
    elBot.classList.toggle('bfx-inimigo', _estado === 'inimigo');
  }

  function _aplicarEstado() {
    const nivel  = _pulso ? _pulso.nivel : 0;
    const isLend = nivel === 4;

    if (isLend) {
      _setCls('', '');
      _atualizarCantos(true, true);
      if (_cvLend) { _cvLend.style.display = 'block'; }
    } else {
      if (_cvLend) { _cvLend.style.display = 'none'; }
      if (nivel === 3) {
        _setCls('bfx-shake-forte bfx-ondula-top', 'bfx-shake-forte bfx-ondula-bot');
        _atualizarCantos(true, true);
      } else if (nivel === 2) {
        _setCls('bfx-shake-medio bfx-ondula-top', 'bfx-shake-medio bfx-ondula-bot');
        _atualizarCantos(true, false);
      } else if (nivel === 1) {
        _setCls('bfx-shake-leve', 'bfx-shake-leve');
        _atualizarCantos(true, false);
      } else if (_estado === 'sirene' || _estado === 'defesa') {
        _setCls('bfx-sirene', 'bfx-sirene');
        _atualizarCantos(true, false);
      } else if (_estado === 'troca_turno') {
        _setCls('bfx-pisca', 'bfx-pisca');
        _atualizarCantos(true, false);
      } else {
        _setCls('', '');
        _atualizarCantos(false, false);
      }
    }
  }

  // ── Loop principal ────────────────────────────────────────────────────────
  function _draw() {
    _t++;

    // Pulso: conta e reseta
    if (_pulso) {
      _pulso.t++;
      if (_pulso.t >= _pulso.dur) {
        _pulso = null;
        _aplicarEstado();
      }
    }

    const nivel  = _pulso ? _pulso.nivel : 0;
    const isLend = nivel === 4;
    const pal    = _estado === 'inimigo'                          ? PAL.vermelho :
                   (_estado === 'sirene' || _estado === 'defesa') ? PAL.sirene   :
                   nivel >= 2                                      ? PAL.arco     :
                   PAL.azul;
    const brilho = 0.85 + nivel * 0.35;
    const speed  = 0.025 + nivel * 0.018;

    // Canvas top
    if (_ctxTop && _cvTop?.isConnected) {
      _drawNeon(_ctxTop, _cvTop.width, _cvTop.height, _t, pal, speed, brilho);
    }

    // Canvas bot
    if (_ctxBot && _cvBot?.isConnected) {
      _drawNeon(_ctxBot, _cvBot.width, _cvBot.height, _t, pal, speed, brilho);
    }

    // Lendário
    if (isLend) {
      _lendT++;
      _drawLendario();
    }

    _raf = requestAnimationFrame(_draw);
  }

  // ── Cria cantos e aplica bfx-on ao elemento — SEM canvas dentro ──────────
  function _montarElemento(el) {
    el.style.overflow = 'visible';
    _criarCantos(el);
    el.classList.add('bfx-on');
  }

  // ── API pública ───────────────────────────────────────────────────────────

  function init() {
    _css();
    _t     = 0;
    _lendT = 0;
    _pulso = null;
    _estado = 'repouso';

    // Canvas lendário no game-container
    document.getElementById('bfx-lend')?.remove();
    const gc = document.getElementById('game-container');
    if (gc) {
      _cvLend = document.createElement('canvas');
      _cvLend.id = 'bfx-lend';
      _cvLend.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:9998;display:none;';
      _cvLend.width  = gc.offsetWidth  || 1280;
      _cvLend.height = gc.offsetHeight || 720;
      gc.appendChild(_cvLend);
      _ctxLend = _cvLend.getContext('2d');
    }

    if (!_raf) _draw();
  }

  function destroy() {
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
    document.getElementById('bfx-style')?.remove();
    document.getElementById('bfx-lend')?.remove();
    ['battle-topbar','battle-panel'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('bfx-on','bfx-inimigo',..._TODAS);
      el.querySelectorAll('.bfx-canto,.bfx-cv').forEach(n => n.remove());
    });
    _cvTop = _cvBot = _ctxTop = _ctxBot = _cvLend = _ctxLend = null;
  }

  // Chamado após cada _renderizar() — re-aplica borda e cantos ao novo DOM
  function atualizar() {
    const top = document.getElementById('battle-topbar');
    const bot = document.getElementById('battle-panel');

    if (top && !top.classList.contains('bfx-on')) _montarElemento(top);
    if (bot && !bot.classList.contains('bfx-on')) _montarElemento(bot);

    // Atualiza canvas lendário
    if (_cvLend) {
      const gc = document.getElementById('game-container');
      if (gc) { _cvLend.width = gc.offsetWidth; _cvLend.height = gc.offsetHeight; }
    }

    _aplicarEstado();
  }

  function estado(nome) {
    _estado = nome;
    _aplicarEstado();
  }

  function pulso(nivel = 1) {
    const durs = [0, 50, 75, 105, 175];
    _pulso  = { nivel: Math.max(1, Math.min(4, nivel)), t: 0, dur: durs[nivel] ?? 75 };
    _lendT  = 0;
    _aplicarEstado();
  }

  function preview(nome, durMs = 3000) {
    const map = { dano_fraco: 1, dano_medio: 2, dano_forte: 3, dano_lendario: 4 };
    const ant = _estado;
    if (map[nome] !== undefined) {
      pulso(map[nome]);
    } else {
      estado(nome);
      setTimeout(() => estado(ant), durMs);
    }
  }

  return { init, destroy, atualizar, estado, pulso, preview };

})();
