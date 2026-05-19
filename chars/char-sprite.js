// chars/char-sprite.js — sprite utility shared across all screens.

const CHAR_SPRITE = (() => {
  const MAP = {
    vigor:     'assets/sprites/vigor.png',
    ofensivo:  'assets/sprites/ofensivo.png',
    defensivo: 'assets/sprites/defensivo.png',
    agil:      'assets/sprites/agil.png',
  };

  // Returns <img> or placeholder HTML.
  // opts.width  — display width in px (default 64)
  // opts.cls    — extra CSS classes (e.g. 'fill' to cover parent)
  function imgHTML(poolId, { width = 64, cls = '' } = {}) {
    const src = MAP[poolId];
    if (!src) return `<span class="csp-placeholder">?</span>`;
    return `<img class="csp-img ${cls}" src="${src}" style="width:${width}px" draggable="false" alt="">`;
  }

  return { MAP, imgHTML };
})();
