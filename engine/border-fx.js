// engine/border-fx.js
// Sistema de bordas neon vivas — estilo Marvel Snap
// Estados: repouso | sirene | defesa | inimigo | dano_fraco | dano_medio | dano_forte | dano_lendario | troca_turno
//
// API pública:
//   BORDER_FX.init()           — cria os canvas de borda na tela de batalha
//   BORDER_FX.estado(nome)     — muda o estado da borda
//   BORDER_FX.pulso(nivel)     — dispara pulso de dano (1=fraco, 2=medio, 3=forte, 4=lendario)
//   BORDER_FX.destroy()        — remove os canvas

const BORDER_FX = (() => {

  // ── Canvas: topo e base ──────────────────────────────────────────────────
  let _cvTop  = null;
  let _cvBot  = null;
  let _ctxTop = null;
  let _ctxBot = null;
  let _raf    = null;
  let _t      = 0;           // tempo global (frames)
  let _estado = 'repouso';   // estado atual
  let _pulso  = null;        // { nivel, t } — animação de dano em curso

  const H = 6; // altura dos canvas em px (borda fina mas com bloom)

  // ── Paletas ─────────────────────────────────────────────────────────────

  const PAL = {
    azul:     ['#00cfff', '#0088ff', '#00eeff', '#44aaff', '#ffffff'],
    vermelho: ['#ff2200', '#ff6600', '#ff0055', '#ff4444', '#ffffff'],
    sirene:   ['#0044ff', '#ff0022', '#00cfff', '#ff3300', '#ffffff'],
    dourado:  ['#ffd700', '#ffaa00', '#fff200', '#ff8800', '#ffffff'],
    arco:     ['#ff0000','#ff7700','#ffff00','#00ff00','#00ffff','#0077ff','#aa00ff','#ffffff'],
    lendario: ['#ff00ff','#00ffff','#ffff00','#ff0000','#00ff00','#ffffff','#ff7700','#aa00ff'],
  };

  // ── Helpers ──────────────────────────────────────────────────────────────

  function _cor(pal, idx) {
    return pal[((idx % pal.length) + pal.length) % pal.length];
  }

  // Neon real: core branco + glow colorido + bloom externo
  function _neonStroke(ctx, x1, y1, x2, y2, cor, brilho = 1) {
    // Bloom externo
    ctx.save();
    ctx.strokeStyle = cor;
    ctx.lineWidth   = 14 * brilho;
    ctx.globalAlpha = 0.12 * brilho;
    ctx.filter      = `blur(${6 * brilho}px)`;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    // Glow médio
    ctx.lineWidth   = 6 * brilho;
    ctx.globalAlpha = 0.35 * brilho;
    ctx.filter      = `blur(${2 * brilho}px)`;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    // Core
    ctx.lineWidth   = 2;
    ctx.globalAlpha = 0.9;
    ctx.filter      = 'none';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    // Centro branco
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 0.8;
    ctx.globalAlpha = 0.7 * brilho;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }

  // ── Desenhos por estado ──────────────────────────────────────────────────

  function _drawRepouso(ctx, w, t, flipped) {
    ctx.clearRect(0, 0, w, H);
    const pal    = _estado === 'inimigo' ? PAL.vermelho : PAL.azul;
    const speed  = 0.008;
    const segs   = 6;
    const segW   = w / segs;
    // Espiral lenta — barbearia
    for (let s = 0; s < segs; s++) {
      const phase  = (flipped ? -1 : 1) * (t * speed + s / segs);
      const idx    = Math.floor(phase * pal.length) % pal.length;
      const alpha  = 0.55 + 0.2 * Math.sin(t * 0.04 + s);
      const cor    = pal[Math.abs(idx) % pal.length];
      const x1     = s * segW;
      const x2     = x1 + segW;
      ctx.save();
      ctx.globalAlpha = alpha;
      _neonStroke(ctx, x1, H / 2, x2, H / 2, cor, 0.7);
      ctx.restore();
    }
    // Flicker suave
    const flicker = 0.85 + 0.15 * Math.sin(t * 0.13 + (flipped ? 1 : 0));
    ctx.save();
    ctx.globalAlpha = flicker * 0.15;
    ctx.fillStyle   = _estado === 'inimigo' ? '#ff2200' : '#00cfff';
    ctx.fillRect(0, 0, w, H);
    ctx.restore();
  }

  function _drawSirene(ctx, w, t, flipped) {
    ctx.clearRect(0, 0, w, H);
    const fase  = Math.floor(t / 8) % 2; // alterna a cada 8 frames
    const cor   = fase === 0 ? '#0044ff' : '#ff0022';
    const brilho = 1.5 + 0.5 * Math.sin(t * 0.3);
    _neonStroke(ctx, 0, H / 2, w, H / 2, cor, brilho);
    // Pulso de alerta
    const alpha = 0.3 + 0.3 * Math.abs(Math.sin(t * 0.25));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = cor;
    ctx.fillRect(0, 0, w, H);
    ctx.restore();
  }

  function _drawTrocaTurno(ctx, w, t, flipped) {
    ctx.clearRect(0, 0, w, H);
    // Pisca pisca natal — segmentos alternados
    const segW = 40;
    const segs = Math.ceil(w / segW);
    for (let s = 0; s < segs; s++) {
      const on  = ((s + Math.floor(t / 6)) % 2) === 0;
      const cor = PAL.dourado[s % PAL.dourado.length];
      if (on) {
        _neonStroke(ctx, s * segW, H / 2, Math.min((s + 1) * segW, w), H / 2, cor, 1.2);
      }
    }
  }

  function _drawDanoFraco(ctx, w, t, flipped, prog) {
    ctx.clearRect(0, 0, w, H);
    // Shake: deslocamento vertical pequeno
    const shake = Math.sin(t * 1.8) * 2 * (1 - prog);
    const pal   = PAL.arco;
    const segs  = 8;
    const segW  = w / segs;
    for (let s = 0; s < segs; s++) {
      const cor = pal[(s + Math.floor(t * 0.4)) % pal.length];
      const y   = H / 2 + shake * Math.sin(s * 1.3);
      _neonStroke(ctx, s * segW, y, (s + 1) * segW, y, cor, 0.9 + 0.3 * (1 - prog));
    }
  }

  function _drawDanoMedio(ctx, w, t, flipped, prog) {
    ctx.clearRect(0, 0, w, H);
    // Ondulação + espiral barbearia acelerada
    const pal   = PAL.arco;
    const pts   = 80;
    const speed = (flipped ? -1 : 1) * t * 0.12;
    for (let i = 0; i < pts - 1; i++) {
      const x1  = (i / pts) * w;
      const x2  = ((i + 1) / pts) * w;
      const y1  = H / 2 + Math.sin(i * 0.25 + speed) * (H / 2 - 1);
      const y2  = H / 2 + Math.sin((i + 1) * 0.25 + speed) * (H / 2 - 1);
      const cor = pal[(i + Math.floor(t * 0.6)) % pal.length];
      _neonStroke(ctx, x1, y1, x2, y2, cor, 1.1);
    }
  }

  function _drawDanoForte(ctx, w, t, flipped, prog) {
    ctx.clearRect(0, 0, w, H);
    // Cobrinha correndo da borda para o centro e voltando
    const pal    = PAL.lendario;
    const cobra  = ((t * 4) % (w * 2)); // posição da cabeça (vai e volta)
    const pos    = cobra > w ? w * 2 - cobra : cobra;
    const headW  = 120;
    const x1     = Math.max(0, pos - headW);
    const x2     = Math.min(w, pos + headW);
    const cor    = pal[Math.floor(t * 0.5) % pal.length];
    const corB   = pal[(Math.floor(t * 0.5) + 2) % pal.length];
    _neonStroke(ctx, x1, H / 2, x2, H / 2, cor, 2.0);
    // Rastro
    if (x1 > 0)  _neonStroke(ctx, 0, H / 2, x1, H / 2, corB, 0.4);
    if (x2 < w)  _neonStroke(ctx, x2, H / 2, w, H / 2, corB, 0.4);
  }

  function _drawDanoLendario(ctx, w, t, flipped, prog) {
    ctx.clearRect(0, 0, w, H);
    const pal   = PAL.lendario;
    // Tudo ao mesmo tempo — ondulação + cobrinha + flash
    const pts   = 80;
    const speed = (flipped ? -1 : 1) * t * 0.25;
    for (let i = 0; i < pts - 1; i++) {
      const x1  = (i / pts) * w;
      const x2  = ((i + 1) / pts) * w;
      const y1  = H / 2 + Math.sin(i * 0.4 + speed) * (H / 2 - 1);
      const y2  = H / 2 + Math.sin((i + 1) * 0.4 + speed) * (H / 2 - 1);
      const cor = pal[(i + Math.floor(t * 1.2)) % pal.length];
      _neonStroke(ctx, x1, y1, x2, y2, cor, 2.2);
    }
    // Flash ofuscante
    const flash = 0.4 + 0.4 * Math.abs(Math.sin(t * 0.5));
    ctx.save();
    ctx.globalAlpha = flash;
    ctx.fillStyle   = '#ffffff';
    ctx.fillRect(0, 0, w, H);
    ctx.restore();
  }

  // ── Loop principal ───────────────────────────────────────────────────────

  function _draw() {
    if (!_cvTop || !_cvBot) return;
    const w = _cvTop.width;
    _t++;

    let drawFn = _drawRepouso;
    let progPulso = 1;

    if (_pulso) {
      _pulso.t++;
      const dur = [0, 40, 60, 90, 130][_pulso.nivel] ?? 60;
      progPulso = Math.min(1, _pulso.t / dur);
      if (progPulso >= 1) _pulso = null;

      if (_pulso) {
        const fns = [null, _drawDanoFraco, _drawDanoMedio, _drawDanoForte, _drawDanoLendario];
        drawFn = fns[_pulso.nivel] ?? _drawDanoFraco;
      }
    }

    if (!_pulso) {
      if (_estado === 'sirene' || _estado === 'defesa') drawFn = _drawSirene;
      else if (_estado === 'troca_turno')               drawFn = _drawTrocaTurno;
      else                                              drawFn = _drawRepouso;
    }

    drawFn(_ctxTop, w, _t, false, progPulso);
    drawFn(_ctxBot, w, _t, true,  progPulso);

    _raf = requestAnimationFrame(_draw);
  }

  // ── Criação dos canvas ───────────────────────────────────────────────────

  function _criarCanvas(id, bottom) {
    const cv = document.createElement('canvas');
    cv.id     = id;
    cv.height = H;
    cv.style.cssText = `
      position: absolute;
      left: 0; right: 0;
      ${bottom ? 'bottom: 180px' : 'top: 0'};
      width: 100%;
      height: ${H}px;
      pointer-events: none;
      z-index: 9998;
      image-rendering: pixelated;
    `;
    return cv;
  }

  // ── API ──────────────────────────────────────────────────────────────────

  function init() {
    destroy();

    const container = document.getElementById('game-container') ?? document.body;
    _cvTop = _criarCanvas('border-fx-top',  false);
    _cvBot = _criarCanvas('border-fx-bot',  true);
    container.appendChild(_cvTop);
    container.appendChild(_cvBot);

    // Ajusta largura ao container
    const resize = () => {
      const cw = container.offsetWidth;
      if (_cvTop) { _cvTop.width  = cw; }
      if (_cvBot) { _cvBot.width  = cw; }
    };
    resize();
    window.addEventListener('resize', resize);

    _ctxTop = _cvTop.getContext('2d');
    _ctxBot = _cvBot.getContext('2d');
    _t      = 0;
    _pulso  = null;
    _estado = 'repouso';

    _draw();
  }

  function destroy() {
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
    document.getElementById('border-fx-top')?.remove();
    document.getElementById('border-fx-bot')?.remove();
    _cvTop = _ctxTop = _cvBot = _ctxBot = null;
  }

  function estado(nome) {
    _estado = nome;
  }

  function pulso(nivel = 1) {
    _pulso = { nivel: Math.max(1, Math.min(4, nivel)), t: 0 };
  }

  // Preview — dispara um estado temporário por durMs e volta ao anterior
  function preview(nome, durMs = 2500) {
    const anterior = _estado;
    if (nome.startsWith('dano_')) {
      const map = { dano_fraco: 1, dano_medio: 2, dano_forte: 3, dano_lendario: 4 };
      pulso(map[nome] ?? 1);
    } else {
      estado(nome);
      setTimeout(() => estado(anterior), durMs);
    }
  }

  return { init, destroy, estado, pulso, preview };

})();
