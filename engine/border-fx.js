// engine/border-fx.js  v2
// Sistema de bordas neon vivas — estilo Marvel Snap
//
// Estados:
//   repouso        — azul suave, espiral lenta, borda fina
//   inimigo        — vermelho suave, espiral lenta
//   sirene         — azul/vermelho alternando, borda PULSA mais grossa, shake
//   defesa         — igual sirene
//   troca_turno    — pisca pisca dourado
//   dano_fraco     — shake leve, ondulação suave
//   dano_medio     — shake médio, ondulação + ponto horário
//   dano_forte     — shake forte, ondulação rápida + ponto horário acelerado
//   dano_lendario  — bordas se juntam e percorrem os 4 lados como cobrinha
//
// API:
//   BORDER_FX.init()
//   BORDER_FX.destroy()
//   BORDER_FX.estado(nome)
//   BORDER_FX.pulso(nivel)   — 1=fraco 2=medio 3=forte 4=lendario
//   BORDER_FX.preview(nome)  — preview temporário 3s

const BORDER_FX = (() => {

  // ── Canvas ───────────────────────────────────────────────────────────────
  let _cvTop   = null;  // borda superior
  let _cvBot   = null;  // borda inferior
  let _cvFull  = null;  // canvas fullscreen — dano lendário (4 lados)
  let _ctxTop  = null;
  let _ctxBot  = null;
  let _ctxFull = null;
  let _raf     = null;
  let _t       = 0;
  let _estado  = 'repouso';
  let _pulso   = null;   // { nivel, t, dur }

  // Altura base e altura atual (pulso aumenta)
  const H_BASE = 7;
  let _hAtual  = H_BASE;

  // ── Paletas ──────────────────────────────────────────────────────────────
  const PAL = {
    azul:     ['#00cfff','#0088ff','#00eeff','#44aaff','#ffffff'],
    vermelho: ['#ff2200','#ff6600','#ff0055','#ff4444','#ffffff'],
    dourado:  ['#ffd700','#ffaa00','#fff200','#ff8800','#ffffff'],
    arco:     ['#ff0000','#ff7700','#ffff00','#00ff00','#00ffff','#0077ff','#aa00ff','#ff00aa','#ffffff'],
    lendario: ['#ff00ff','#00ffff','#ffff00','#ff0000','#00ff00','#ffffff','#ff7700','#aa00ff'],
  };

  // ── Neon real: bloom + glow + core + branco ──────────────────────────────
  function _neon(ctx, x1, y1, x2, y2, cor, brilho = 1, h = H_BASE) {
    const b = Math.max(0.3, brilho);
    ctx.save();
    ctx.lineCap = 'round';
    // Bloom externo — linha grossa transparente (sem filter)
    ctx.strokeStyle = cor;
    ctx.lineWidth   = h * 3.5 * b;
    ctx.globalAlpha = 0.09 * b;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    // Glow médio
    ctx.lineWidth   = h * 1.6 * b;
    ctx.globalAlpha = 0.28 * b;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    // Core colorido
    ctx.lineWidth   = h * 0.55;
    ctx.globalAlpha = 0.90;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    // Centro branco
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = h * 0.22;
    ctx.globalAlpha = 0.65 * b;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    ctx.restore();
  }

  // ── Shake físico nos canvas ───────────────────────────────────────────────
  function _shake(cv, amp) {
    if (!cv) return;
    const dx = (Math.random() - 0.5) * amp * 2;
    const dy = (Math.random() - 0.5) * amp * 0.5;
    cv.style.transform = `translate(${dx}px, ${dy}px)`;
    setTimeout(() => { if (cv) cv.style.transform = ''; }, 60);
  }

  // ── Posição no perímetro (sentido horário) ────────────────────────────────
  // Dado t ∈ [0,1], retorna {x,y} no perímetro do retângulo w×h_tela
  function _perimetroPos(t, w, hTela) {
    const perimetro = 2 * (w + hTela);
    const dist      = ((t % 1) + 1) % 1 * perimetro;
    if (dist < w)                    return { x: dist,          y: 0 };           // topo →
    if (dist < w + hTela)            return { x: w,             y: dist - w };    // dir ↓
    if (dist < 2 * w + hTela)        return { x: w - (dist - w - hTela), y: hTela }; // base ←
    return { x: 0, y: hTela - (dist - 2 * w - hTela) };                           // esq ↑
  }

  // ── Desenho dos estados ──────────────────────────────────────────────────

  // Espiral barbearia: segs segmentos coloridos ciclando
  function _barbearia(ctx, w, t, flipped, pal, speed, brilho) {
    const h    = _hAtual;
    const segs = 8;
    const sw   = w / segs;
    for (let s = 0; s < segs; s++) {
      const phase = (flipped ? -1 : 1) * (t * speed + s / segs);
      const idx   = Math.abs(Math.floor(phase * pal.length)) % pal.length;
      const alpha = 0.5 + 0.25 * Math.sin(t * 0.05 + s);
      ctx.save(); ctx.globalAlpha = alpha;
      _neon(ctx, s * sw, h/2, (s+1)*sw, h/2, pal[idx], brilho, h);
      ctx.restore();
    }
  }

  // Ponto brilhante viajando no sentido horário pelas bordas (topo+base)
  function _pontoHorario(ctx, w, t, isBot, speed, cor, brilho) {
    const h    = _hAtual;
    const pos  = ((t * speed) % 1 + 1) % 1;
    const x    = isBot ? (1 - pos) * w : pos * w;
    const r    = h * 2.5 * brilho;
    ctx.save();
    const grd = ctx.createRadialGradient(x, h/2, 0, x, h/2, r);
    grd.addColorStop(0, '#ffffff');
    grd.addColorStop(0.3, cor);
    grd.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.9 * brilho;
    ctx.fillStyle   = grd;
    ctx.beginPath(); ctx.arc(x, h/2, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Ondulação snake
  function _ondulacao(ctx, w, t, flipped, pal, speed, amplitude, brilho) {
    const h   = _hAtual;
    const pts = 100;
    const dir = flipped ? -1 : 1;
    for (let i = 0; i < pts - 1; i++) {
      const x1 = (i / pts) * w;
      const x2 = ((i + 1) / pts) * w;
      const y1 = h/2 + Math.sin(i * 0.28 + dir * t * speed) * amplitude;
      const y2 = h/2 + Math.sin((i+1) * 0.28 + dir * t * speed) * amplitude;
      const cor = pal[(i + Math.floor(t * 0.5)) % pal.length];
      _neon(ctx, x1, y1, x2, y2, cor, brilho, h);
    }
  }

  // ── Pulso de espessura ────────────────────────────────────────────────────
  function _atualizarAltura(alvoH) {
    _hAtual += (alvoH - _hAtual) * 0.12;
    if (_cvTop)  { _cvTop.height  = Math.ceil(_hAtual); _cvTop.style.height  = Math.ceil(_hAtual) + 'px'; }
    if (_cvBot)  { _cvBot.height  = Math.ceil(_hAtual); _cvBot.style.height  = Math.ceil(_hAtual) + 'px'; }
  }

  // ── Dano lendário: cobrinha no perímetro fullscreen ───────────────────────
  function _drawLendario() {
    if (!_ctxFull || !_cvFull) return;
    const w     = _cvFull.width;
    const hTela = _cvFull.height;
    _ctxFull.clearRect(0, 0, w, hTela);

    const pal   = PAL.lendario;
    const speed = 0.009;  // mais lento = mais fluido
    const cabT  = (_t * speed) % 1;
    const rastW = 0.28;
    const steps = 35;     // menos steps = menos processamento

    for (let i = 0; i < steps; i++) {
      const frac  = i / steps;
      const t0    = ((cabT - frac * rastW) % 1 + 1) % 1;
      const t1    = ((cabT - (frac + 1/steps) * rastW) % 1 + 1) % 1;
      const p0    = _perimetroPos(t0, w, hTela);
      const p1    = _perimetroPos(t1, w, hTela);
      const alpha = (1 - frac) * 0.95;
      const cor   = pal[Math.floor((_t * 0.3 + i * 0.15)) % pal.length];
      const lw    = (1 - frac) * 14 + 2; // linha grossa na cabeça, fina no rastro

      // Sem filter: blur — 3 camadas manuais de glow
      _ctxFull.save();
      _ctxFull.globalAlpha = alpha * 0.18;
      _ctxFull.strokeStyle = cor;
      _ctxFull.lineWidth   = lw * 3;
      _ctxFull.lineCap     = 'round';
      _ctxFull.beginPath(); _ctxFull.moveTo(p0.x, p0.y); _ctxFull.lineTo(p1.x, p1.y); _ctxFull.stroke();

      _ctxFull.globalAlpha = alpha * 0.45;
      _ctxFull.lineWidth   = lw * 1.2;
      _ctxFull.beginPath(); _ctxFull.moveTo(p0.x, p0.y); _ctxFull.lineTo(p1.x, p1.y); _ctxFull.stroke();

      _ctxFull.globalAlpha = alpha;
      _ctxFull.strokeStyle = '#ffffff';
      _ctxFull.lineWidth   = lw * 0.35;
      _ctxFull.beginPath(); _ctxFull.moveTo(p0.x, p0.y); _ctxFull.lineTo(p1.x, p1.y); _ctxFull.stroke();
      _ctxFull.restore();
    }
  }

  // ── Loop principal ────────────────────────────────────────────────────────
  function _draw() {
    _t++;

    let isLendario = false;
    let progPulso  = 1;

    if (_pulso) {
      _pulso.t++;
      progPulso = Math.min(1, _pulso.t / _pulso.dur);
      if (progPulso >= 1) { _pulso = null; }
    }

    const nivel = _pulso ? _pulso.nivel : 0;
    isLendario  = nivel === 4;

    // Altura alvo conforme estado
    let alvoH = H_BASE;
    if (_estado === 'sirene' || _estado === 'defesa') alvoH = H_BASE * 2.8;
    else if (nivel >= 1) alvoH = H_BASE * (1 + nivel * 0.7);
    _atualizarAltura(alvoH);

    // CSS classes conforme estado/pulso (aplicado só quando muda)
    if (isLendario) {
      _setCssClasse(null, null);
    } else if (nivel === 3) {
      _setCssClasse('bfx-onda-top bfx-shake-forte', 'bfx-onda-bot bfx-shake-forte');
    } else if (nivel === 2) {
      _setCssClasse('bfx-onda-top bfx-shake-medio', 'bfx-onda-bot bfx-shake-medio');
    } else if (nivel === 1) {
      _setCssClasse('bfx-shake-leve', 'bfx-shake-leve');
    } else if (_estado === 'sirene' || _estado === 'defesa') {
      _setCssClasse('bfx-sirene', 'bfx-sirene');
    } else if (_estado === 'troca_turno') {
      _setCssClasse('bfx-pisca', 'bfx-pisca');
    } else {
      _setCssClasse(null, null);
    }

    // ── Lendário: fullscreen ativo, top/bot ocultos ──
    if (isLendario) {
      if (_cvFull)  _cvFull.style.display  = 'block';
      if (_cvTop)   _cvTop.style.opacity   = '0';
      if (_cvBot)   _cvBot.style.opacity   = '0';
      _drawLendario();
      _raf = requestAnimationFrame(_draw);
      return;
    } else {
      if (_cvFull)  _cvFull.style.display  = 'none';
      if (_cvTop)   _cvTop.style.opacity   = '1';
      if (_cvBot)   _cvBot.style.opacity   = '1';
    }

    // ── Desenha top e bot ──
    const w = _cvTop?.width ?? 0;
    if (!_ctxTop || !_ctxBot || w === 0) { _raf = requestAnimationFrame(_draw); return; }

    _ctxTop.clearRect(0, 0, w, _hAtual + 4);
    _ctxBot.clearRect(0, 0, w, _hAtual + 4);

    // Estado base
    if (nivel === 0) {
      if (_estado === 'sirene' || _estado === 'defesa') {
        const fase = Math.floor(_t / 7) % 2;
        const cor  = fase === 0 ? '#0044ff' : '#ff0022';
        const bri  = 1.6 + 0.6 * Math.abs(Math.sin(_t * 0.28));
        _barbearia(_ctxTop, w, _t, false, [cor, '#ffffff', cor], 0.025, bri);
        _barbearia(_ctxBot, w, _t, true,  [cor, '#ffffff', cor], 0.025, bri);
        _pontoHorario(_ctxTop, w, _t, false, 0.006, cor, bri);
        _pontoHorario(_ctxBot, w, _t, true,  0.006, cor, bri);
      } else if (_estado === 'troca_turno') {
        const sw  = 38;
        const segs = Math.ceil(w / sw);
        for (let s = 0; s < segs; s++) {
          const on  = ((s + Math.floor(_t / 5)) % 2) === 0;
          const cor = PAL.dourado[s % PAL.dourado.length];
          if (on) {
            _neon(_ctxTop, s*sw, _hAtual/2, Math.min((s+1)*sw,w), _hAtual/2, cor, 1.4, _hAtual);
            _neon(_ctxBot, s*sw, _hAtual/2, Math.min((s+1)*sw,w), _hAtual/2, cor, 1.4, _hAtual);
          }
        }
      } else {
        // Repouso / inimigo
        const pal = _estado === 'inimigo' ? PAL.vermelho : PAL.azul;
        const bri = 0.75 + 0.15 * Math.sin(_t * 0.04);
        _barbearia(_ctxTop, w, _t, false, pal, 0.009, bri);
        _barbearia(_ctxBot, w, _t, true,  pal, 0.009, bri);
        _pontoHorario(_ctxTop, w, _t, false, 0.002, pal[0], bri * 0.8);
        _pontoHorario(_ctxBot, w, _t, true,  0.002, pal[0], bri * 0.8);
      }
    }

    // Dano fraco
    else if (nivel === 1) {
      const bri = 1.0 + 0.4 * Math.abs(Math.sin(_t * 0.35));
      _barbearia(_ctxTop, w, _t, false, PAL.arco, 0.018, bri);
      _barbearia(_ctxBot, w, _t, true,  PAL.arco, 0.018, bri);
    }

    // Dano médio
    else if (nivel === 2) {
      const bri = 1.3 + 0.4 * Math.abs(Math.sin(_t * 0.4));
      _ondulacao(_ctxTop, w, _t, false, PAL.arco, 0.14, _hAtual * 0.38, bri);
      _ondulacao(_ctxBot, w, _t, true,  PAL.arco, 0.14, _hAtual * 0.38, bri);
      _pontoHorario(_ctxTop, w, _t, false, 0.008, '#ffffff', 1.8);
      _pontoHorario(_ctxBot, w, _t, true,  0.008, '#ffffff', 1.8);
    }

    // Dano forte
    else if (nivel === 3) {
      const bri = 1.8 + 0.5 * Math.abs(Math.sin(_t * 0.5));
      _ondulacao(_ctxTop, w, _t, false, PAL.lendario, 0.22, _hAtual * 0.45, bri);
      _ondulacao(_ctxBot, w, _t, true,  PAL.lendario, 0.22, _hAtual * 0.45, bri);
      _pontoHorario(_ctxTop, w, _t, false, 0.015, '#ffffff', 2.2);
      _pontoHorario(_ctxBot, w, _t, true,  0.015, '#ffffff', 2.2);
    }

    _raf = requestAnimationFrame(_draw);
  }

  // ── CSS dinâmico para animações das bordas físicas ───────────────────────
  const _CSS_ID = 'border-fx-style';

  function _injetarCSS() {
    if (document.getElementById(_CSS_ID)) return;
    const style = document.createElement('style');
    style.id = _CSS_ID;
    style.textContent = `
      /* Shake — tremor físico da borda */
      @keyframes bfx-shake-leve {
        0%,100%{ transform:translateX(0) }
        20%    { transform:translateX(-3px) }
        40%    { transform:translateX(3px) }
        60%    { transform:translateX(-2px) }
        80%    { transform:translateX(2px) }
      }
      @keyframes bfx-shake-medio {
        0%,100%{ transform:translateX(0) }
        15%    { transform:translateX(-6px) scaleY(1.3) }
        35%    { transform:translateX(6px)  scaleY(0.8) }
        55%    { transform:translateX(-4px) scaleY(1.2) }
        75%    { transform:translateX(4px)  scaleY(0.9) }
      }
      @keyframes bfx-shake-forte {
        0%,100%{ transform:translateX(0) scaleY(1) }
        10%    { transform:translateX(-10px) scaleY(1.6) }
        25%    { transform:translateX(10px)  scaleY(0.6) }
        40%    { transform:translateX(-8px)  scaleY(1.5) }
        55%    { transform:translateX(8px)   scaleY(0.7) }
        70%    { transform:translateX(-6px)  scaleY(1.3) }
        85%    { transform:translateX(6px)   scaleY(0.8) }
      }

      /* Ondulação — a borda serpenteia */
      @keyframes bfx-onda-top {
        0%  { transform:skewX(0deg)   scaleY(1)   }
        20% { transform:skewX(6deg)   scaleY(1.4) }
        40% { transform:skewX(-6deg)  scaleY(0.7) }
        60% { transform:skewX(4deg)   scaleY(1.3) }
        80% { transform:skewX(-4deg)  scaleY(0.8) }
        100%{ transform:skewX(0deg)   scaleY(1)   }
      }
      @keyframes bfx-onda-bot {
        0%  { transform:skewX(0deg)   scaleY(1)   }
        20% { transform:skewX(-6deg)  scaleY(1.4) }
        40% { transform:skewX(6deg)   scaleY(0.7) }
        60% { transform:skewX(-4deg)  scaleY(1.3) }
        80% { transform:skewX(4deg)   scaleY(0.8) }
        100%{ transform:skewX(0deg)   scaleY(1)   }
      }

      /* Pulso — engrossa e afina */
      @keyframes bfx-pulso {
        0%,100%{ transform:scaleY(1)   }
        30%    { transform:scaleY(3.5) }
        60%    { transform:scaleY(1.5) }
      }

      /* Sirene — pulso rápido com flash */
      @keyframes bfx-sirene {
        0%,100%{ transform:scaleY(1)   opacity:1   }
        25%    { transform:scaleY(3.2) opacity:0.8 }
        50%    { transform:scaleY(1)   opacity:1   }
        75%    { transform:scaleY(2.8) opacity:0.9 }
      }

      /* Pisca pisca troca de turno */
      @keyframes bfx-pisca {
        0%,49%{ opacity:1 } 50%,100%{ opacity:0.1 }
      }

      /* Classes aplicadas via JS */
      .bfx-shake-leve  { animation: bfx-shake-leve  0.35s ease infinite; }
      .bfx-shake-medio { animation: bfx-shake-medio 0.30s ease infinite; }
      .bfx-shake-forte { animation: bfx-shake-forte 0.25s ease infinite; }
      .bfx-onda-top    { animation: bfx-onda-top    0.6s  ease infinite; transform-origin: center center; }
      .bfx-onda-bot    { animation: bfx-onda-bot    0.6s  ease infinite; transform-origin: center center; }
      .bfx-pulso       { animation: bfx-pulso       0.5s  ease infinite; transform-origin: ${_CSS_BOT_ORIG}; }
      .bfx-sirene      { animation: bfx-sirene       0.4s  ease infinite; transform-origin: center center; }
      .bfx-pisca       { animation: bfx-pisca        0.35s steps(1) infinite; }
    `;
    document.head.appendChild(style);
  }

  const _CSS_BOT_ORIG = 'bottom center';

  // Aplica classes CSS nos dois canvas de borda (aceita string com espaços)
  const _TODAS_CLASSES = ['bfx-shake-leve','bfx-shake-medio','bfx-shake-forte',
                          'bfx-onda-top','bfx-onda-bot','bfx-pulso','bfx-sirene','bfx-pisca'];
  let _classeAtualTop = '';
  let _classeAtualBot = '';

  function _setCssClasse(topClass, botClass) {
    if (!_cvTop || !_cvBot) return;
    const tc = topClass ?? '';
    const bc = botClass ?? '';
    if (tc === _classeAtualTop && bc === _classeAtualBot) return; // sem mudança
    _classeAtualTop = tc;
    _classeAtualBot = bc;
    _TODAS_CLASSES.forEach(c => { _cvTop.classList.remove(c); _cvBot.classList.remove(c); });
    tc.split(' ').forEach(c => c && _cvTop.classList.add(c));
    bc.split(' ').forEach(c => c && _cvBot.classList.add(c));
  }

  // ── Criação dos canvas ────────────────────────────────────────────────────
  function _criarCv(id, isBot, fullscreen) {
    const cv = document.createElement('canvas');
    cv.id = id;
    if (fullscreen) {
      cv.style.cssText = `
        position:fixed; top:0; left:0;
        width:100%; height:100%;
        pointer-events:none; z-index:9997;
        display:none;
      `;
    } else {
      cv.height = H_BASE;
      cv.style.cssText = `
        position:fixed;
        left:0; right:0;
        ${isBot ? 'bottom:0' : 'top:0'};
        width:100%;
        height:${H_BASE}px;
        pointer-events:none;
        z-index:9998;
        transition: opacity 0.4s;
      `;
    }
    return cv;
  }

  // ── Resize ────────────────────────────────────────────────────────────────
  function _resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (_cvTop)  { _cvTop.width  = w; }
    if (_cvBot)  { _cvBot.width  = w; }
    if (_cvFull) { _cvFull.width = w; _cvFull.height = h; }
  }

  // ── API ───────────────────────────────────────────────────────────────────
  function init() {
    destroy();
    _cvTop  = _criarCv('border-fx-top',  false, false);
    _cvBot  = _criarCv('border-fx-bot',  true,  false);
    _cvFull = _criarCv('border-fx-full', false, true);
    document.body.appendChild(_cvTop);
    document.body.appendChild(_cvBot);
    document.body.appendChild(_cvFull);
    _ctxTop  = _cvTop.getContext('2d');
    _ctxBot  = _cvBot.getContext('2d');
    _ctxFull = _cvFull.getContext('2d');
    _hAtual  = H_BASE;
    _t       = 0;
    _pulso   = null;
    _estado  = 'repouso';
    _injetarCSS();
    _resize();
    window.addEventListener('resize', _resize);
    _draw();
  }

  function destroy() {
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
    window.removeEventListener('resize', _resize);
    document.getElementById('border-fx-top')?.remove();
    document.getElementById('border-fx-bot')?.remove();
    document.getElementById('border-fx-full')?.remove();
    _cvTop = _cvBot = _cvFull = _ctxTop = _ctxBot = _ctxFull = null;
  }

  function estado(nome) {
    _estado = nome;
  }

  function pulso(nivel = 1) {
    const durs = [0, 45, 65, 95, 160];
    _pulso = { nivel: Math.max(1, Math.min(4, nivel)), t: 0, dur: durs[nivel] ?? 65 };
  }

  function preview(nome, durMs = 3000) {
    const map = { dano_fraco: 1, dano_medio: 2, dano_forte: 3, dano_lendario: 4 };
    const anterior = _estado;
    if (map[nome]) {
      pulso(map[nome]);
    } else {
      estado(nome);
      setTimeout(() => estado(anterior), durMs);
    }
  }

  return { init, destroy, estado, pulso, preview };

})();
