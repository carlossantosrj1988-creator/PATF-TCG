window.BORDER_FX = (function() {

  function _criarOverlay(id, pos) {
    const el = document.createElement('div');
    el.id = id;
    el.className = 'bfx-overlay';
    Object.keys(pos).forEach(k => { el.style[k] = pos[k]; });

    ['tl', 'tr', 'bl', 'br'].forEach(canto => {
      const q = document.createElement('div');
      q.className = `bfx-canto bfx-canto-${canto}`;
      el.appendChild(q);
    });

    return el;
  }

  function init() {
    const screen = document.getElementById('screen-battle');
    if (!screen) return;

    document.getElementById('bfx-overlay-top')?.remove();
    document.getElementById('bfx-overlay-bot')?.remove();

    const top = _criarOverlay('bfx-overlay-top', { top: '0',    height: '52px'  });
    const bot = _criarOverlay('bfx-overlay-bot', { bottom: '0', height: '180px' });

    screen.appendChild(top);
    screen.appendChild(bot);
  }

  return { init };

})();
