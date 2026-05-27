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

window.applyScale = function() {
  const aspectDevice = window.innerWidth / window.innerHeight;
  BASE_W = Math.max(BASE_W_MIN, Math.round(BASE_H * aspectDevice));

  const scaleX = window.innerWidth / BASE_W;
  const scaleY = window.innerHeight / BASE_H;
  const scale = Math.min(scaleX, scaleY);
  document.documentElement.style.setProperty('--base-w', BASE_W + 'px');
  document.documentElement.style.setProperty('--base-h', BASE_H + 'px');
  document.documentElement.style.setProperty('--scale', scale);
  gameContainer.style.width = BASE_W + 'px';
  gameContainer.style.height = BASE_H + 'px';
  gameContainer.style.transform = `scale(${scale})`;
  gameContainer.style.transformOrigin = 'center center';
  gameContainer.style.position = 'absolute';
  gameContainer.style.left = '50%';
  gameContainer.style.top = '50%';
  gameContainer.style.marginLeft = -(BASE_W / 2) + 'px';
  gameContainer.style.marginTop = -(BASE_H / 2) + 'px';
}

window.addEventListener('resize', applyScale);
applyScale();
