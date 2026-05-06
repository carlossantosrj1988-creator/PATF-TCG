function openOptions() {
  document.getElementById('home-screen').style.display = 'none';
  document.getElementById('options-screen').style.display = 'flex';
}

function closeOptions() {
  document.getElementById('options-screen').style.display = 'none';
  document.getElementById('home-screen').style.display = 'flex';
}

function setResolution(w, h) {
  localStorage.setItem('res_w', w);
  localStorage.setItem('res_h', h);
  document.querySelectorAll('.res-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

const optionsScreen = document.createElement('div');
optionsScreen.id = 'options-screen';

optionsScreen.innerHTML = `
  <div id="options-panel">
    <div id="options-tabs">
      <div class="tab active">VÍDEO</div>
    </div>
    <div id="options-content">
      <div class="options-section">RESOLUÇÃO</div>
      <div id="res-buttons">
        <button class="res-btn" onclick="setResolution(854,480)">854 x 480</button>
        <button class="res-btn" onclick="setResolution(960,540)">960 x 540</button>
        <button class="res-btn active" onclick="setResolution(1280,720)">1280 x 720</button>
      </div>
    </div>
    <button id="options-close" onclick="closeOptions()">FECHAR</button>
  </div>
`;

document.body.appendChild(optionsScreen);
