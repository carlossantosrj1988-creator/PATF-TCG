const homeScreen = document.createElement('div');
homeScreen.id = 'home-screen';

homeScreen.innerHTML = `
  <div id="rotate-warning">
    <div id="rotate-icon">📱</div>
    <div id="rotate-title">VIRE SEU DISPOSITIVO</div>
    <div id="rotate-sub">PATF TCG é melhor em modo paisagem</div>
  </div>
  <div id="home-content">
    <div id="home-logo">PATF</div>
    <div id="home-subtitle">PAST AND THE FUTURE TCG</div>
    <div id="home-start">TOQUE PARA COMEÇAR</div>
  </div>
`;

document.getElementById('game-container').appendChild(homeScreen);

function checkOrientation() {
  const isPortrait = window.innerHeight > window.innerWidth;
  document.getElementById('rotate-warning').style.display = isPortrait ? 'flex' : 'none';
  document.getElementById('home-content').style.display = isPortrait ? 'none' : 'flex';

  if (!isPortrait) {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }
}

window.addEventListener('resize', checkOrientation);
checkOrientation();

const optionsBtn = document.createElement('div');
optionsBtn.id = 'options-btn';
optionsBtn.innerHTML = '⚙';
optionsBtn.addEventListener('click', openOptions);
homeScreen.appendChild(optionsBtn);
