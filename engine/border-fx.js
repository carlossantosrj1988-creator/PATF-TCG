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
    // Bloom
    ctx.strokeStyle = cor;
    ctx.lineWidth   = h * 3 * b;
    ctx.globalAlpha = 0.10 * b;
    ctx.filter      = `blur(${h * 1.2}px)`;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    // Glow
    ctx.lineWidth   = h * 1.4 * b;
    ctx.globalAlpha = 0.30 * b;
    ctx.filter      = `blur(${h * 0.5}px)`;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    // Core colorido
    ctx.strokeStyle = cor;
    ctx.lineWidth   = h * 0.55;
    ctx.globalAlpha = 0.90;
    ctx.filter      = 'none';
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
  function _drawLendario(prog) {
    if (!_ctxFull || !_cvFull) return;
    const w     = _cvFull.width;
    const hTela = _cvFull.height;
    _ctxFull.clearRect(0, 0, w, hTela);

    const pal   = PAL.lendario;
    const speed = 0.018;
    const cabT  = (_t * speed) % 1;
    const rastW = 0.35; // comprimento do rastro em fração do perímetro

    // Desenha o rastro da cobrinha
    const steps = 120;
    for (let i = 0; i < steps; i++) {
      const frac  = i / steps;
      const t0    = ((cabT - frac * rastW) % 1 + 1) % 1;
      const t1    = ((cabT - (frac + 1/steps) * rastW) % 1 + 1) % 1;
      const p0    = _perimetroPos(t0, w, hTela);
      const p1    = _perimetroPos(t1, w, hTela);
      const alpha = 1 - frac * 0.85;
      const cor   = pal[Math.floor((_t * 0.4 + i * 0.1)) % pal.length];
      const bri   = (1 - frac) * 2.5;

      _ctxFull.save();
      _ctxFull.globalAlpha = alpha;
      _neon(_ctxFull, p0.x, p0.y, p1.x, p1.y, cor, bri, 10);
      _ctxFull.restore();
    }

    // Flash ofuscante pulsando
    const flash = 0.15 + 0.15 * Math.abs(Math.sin(_t * 0.4));
    _ctxFull.save();
    _ctxFull.globalAlpha = flash;
    _ctxFull.fillStyle   = '#ffffff';
    _ctxFull.fillRect(0, 0, w, hTela);
    _ctxFull.restore();
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

    // Shake físico conforme intensidade
    if (nivel >= 1 && _t % 3 === 0) {
      const amp = [0, 3, 6, 10, 14][nivel] ?? 0;
      _shake(_cvTop, amp);
      _shake(_cvBot, amp);
    }
    if ((_estado === 'sirene' || _estado === 'defesa') && _t % 8 === 0) {
      _shake(_cvTop, 5);
      _shake(_cvBot, 5);
    }

    // ── Lendário: fullscreen ativo, top/bot ocultos ──
    if (isLendario) {
      if (_cvFull)  _cvFull.style.display  = 'block';
      if (_cvTop)   _cvTop.style.opacity   = '0';
      if (_cvBot)   _cvBot.style.opacity   = '0';
      _drawLendario(progPulso);
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
