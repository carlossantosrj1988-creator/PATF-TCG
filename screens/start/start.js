const startScreen = document.createElement('div');
startScreen.id = 'start-screen';

startScreen.innerHTML = `
  <div id="start-layout">

    <div id="start-left">
      <div id="start-suits">
        <span class="suit hearts">♥</span>
        <span class="suit diamonds">♦</span>
        <span class="suit spades">♠</span>
        <span class="suit clubs">♣</span>
      </div>
      <div id="start-logo">PATF</div>
      <div id="start-subtitle">Past and the Future TCG</div>
      <div id="start-divider"></div>
      <div id="start-login-box">
        <div id="start-login-top">
          <span id="start-lock">🔒</span>
          <span id="start-login-label">Faça login para acessar sua conta</span>
        </div>
        <button id="start-google-btn">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" />
          Entrar com Google
        </button>
      </div>
    </div>

    <div id="start-right">
      <div class="mode-card" id="mode-survivor">
        <div class="mode-icon">🏆</div>
        <div class="mode-info">
          <div class="mode-title">SURVIVOR</div>
          <div class="mode-desc">Modo infinito com equipamentos e bosses.</div>
        </div>
        <div class="mode-badge pve">PVE</div>
      </div>
      <div class="mode-card" id="mode-pvp">
        <div class="mode-icon">⚔️</div>
        <div class="mode-info">
          <div class="mode-title">PVP</div>
          <div class="mode-desc">Desafie outros jogadores no modo ranked. Requer login.</div>
        </div>
        <div class="mode-badge ranked">RANKED</div>
      </div>
      <div class="mode-card" id="mode-teste">
        <div class="mode-icon">🧪</div>
        <div class="mode-info">
          <div class="mode-title">TESTE</div>
          <div class="mode-desc">Jogue contra a IA livremente. Experimente estratégias.</div>
        </div>
        <div class="mode-badge vsia">VS IA</div>
      </div>
    </div>

  </div>
`;

document.getElementById('game-container').appendChild(startScreen);

// Firebase Auth
const googleBtn = document.getElementById('start-google-btn');
if (googleBtn) {
  googleBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).catch(err => console.error(err));
  });
}

firebase.auth().onAuthStateChanged(user => {
  const loginBox = document.getElementById('start-login-box');
  if (!loginBox) return;
  if (user) {
    loginBox.innerHTML = `
      <img src="${user.photoURL}" id="start-user-photo" />
      <span id="start-user-name">${user.displayName}</span>
      <button id="start-logout-btn">Sair</button>
    `;
    document.getElementById('start-logout-btn').addEventListener('click', () => {
      firebase.auth().signOut();
    });
  }
});
