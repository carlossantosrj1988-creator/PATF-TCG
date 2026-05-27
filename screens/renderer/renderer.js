let BASE_W = 1280;
let BASE_H = 720;
const BASE_W_MIN = 1280;

const gameContainer = document.createElement('div');
gameContainer.id = 'game-container';
document.body.appendChild(gameContainer);

const btnOptions = document.createElement('div');
btnOptions.id = 'btn-options';
btnOptions.textContent = '⚙';
gameContainer.appendChild(btnOptions);

// Medidor de safe-area-insets — lê env(safe-area-inset-*) via getComputedStyle
const safeAreaProbe = document.createElement('div');
safeAreaProbe.style.cssText = [
  'position:fixed','top:0','left:0','width:0','height:0',
  'visibility:hidden','pointer-events:none',
  'padding-top:env(safe-area-inset-top)',
  'padding-right:env(safe-area-inset-right)',
  'padding-bottom:env(safe-area-inset-bottom)',
  'padding-left:env(safe-area-inset-left)',
].join(';');
document.body.appendChild(safeAreaProbe);

function lerInsets() {
  const cs = getComputedStyle(safeAreaProbe);
  return {
    top:    parseFloat(cs.paddingTop)    || 0,
    right:  parseFloat(cs.paddingRight)  || 0,
    bottom: parseFloat(cs.paddingBottom) || 0,
    left:   parseFloat(cs.paddingLeft)   || 0,
  };
}

window.applyScale = function() {
  const inset = lerInsets();
  const larguraUtil = Math.max(1, window.innerWidth  - inset.left - inset.right);
  const alturaUtil  = Math.max(1, window.innerHeight - inset.top  - inset.bottom);

  const aspectDevice = larguraUtil / alturaUtil;
  BASE_W = Math.max(BASE_W_MIN, Math.round(BASE_H * aspectDevice));

  const scaleX = larguraUtil / BASE_W;
  const scaleY = alturaUtil  / BASE_H;
  const scale  = Math.min(scaleX, scaleY);

  const centroX = inset.left + larguraUtil / 2;
  const centroY = inset.top  + alturaUtil  / 2;

  document.documentElement.style.setProperty('--base-w', BASE_W + 'px');
  document.documentElement.style.setProperty('--base-h', BASE_H + 'px');
  document.documentElement.style.setProperty('--scale', scale);
  gameContainer.style.width = BASE_W + 'px';
  gameContainer.style.height = BASE_H + 'px';
  gameContainer.style.transform = `scale(${scale})`;
  gameContainer.style.transformOrigin = 'center center';
  gameContainer.style.position = 'absolute';
  gameContainer.style.left = centroX + 'px';
  gameContainer.style.top  = centroY + 'px';
  gameContainer.style.marginLeft = -(BASE_W / 2) + 'px';
  gameContainer.style.marginTop  = -(BASE_H / 2) + 'px';
}

window.addEventListener('resize', applyScale);
applyScale();
