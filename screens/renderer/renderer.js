const BASE_W = 1280;
const BASE_H = 720;

const gameContainer = document.createElement('div');
gameContainer.id = 'game-container';
document.body.appendChild(gameContainer);

function applyScale() {
  const scaleX = window.innerWidth / BASE_W;
  const scaleY = window.innerHeight / BASE_H;
  const scale = Math.max(scaleX, scaleY);
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
