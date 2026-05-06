const BASE_W = 1280;
const BASE_H = 720;

const gameContainer = document.createElement('div');
gameContainer.id = 'game-container';
document.body.appendChild(gameContainer);

function applyScale() {
  const scaleX = window.innerWidth / BASE_W;
  const scaleY = window.innerHeight / BASE_H;
  const scale = Math.max(scaleX, scaleY);
  const w = BASE_W * scale;
  const h = BASE_H * scale;
  gameContainer.style.width = BASE_W + 'px';
  gameContainer.style.height = BASE_H + 'px';
  gameContainer.style.transform = `scale(${scale})`;
  gameContainer.style.transformOrigin = 'top left';
  gameContainer.style.position = 'absolute';
  gameContainer.style.left = ((window.innerWidth - w) / 2) + 'px';
  gameContainer.style.top = ((window.innerHeight - h) / 2) + 'px';
}

window.addEventListener('resize', applyScale);
applyScale();
