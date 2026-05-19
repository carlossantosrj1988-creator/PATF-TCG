// chars/char-sprite.js — sprite utility shared across all screens.

const CHAR_SPRITE = (() => {
  const MAP = {
    vigor:     'assets/sprites/vigor.png',
    ofensivo:  'assets/sprites/ofensivo.png',
    defensivo: 'assets/sprites/defensivo.png',
    agil:      'assets/sprites/agil.png',
  };

  // Returns <img> or placeholder HTML.
  // opts.h   — max display height in px (default 64); width is proportional (auto)
  // opts.cls — extra CSS classes (e.g. 'fill' to cover parent)
  function imgHTML(poolId, { h = 64, cls = '' } = {}) {
    const src = MAP[poolId];
    if (!src) return `<span class="csp-placeholder">?</span>`;
    return `<img class="csp-img ${cls}" src="${src}" style="height:${h}px;width:auto" draggable="false" alt="">`;
  }

  return { MAP, imgHTML };
})();
