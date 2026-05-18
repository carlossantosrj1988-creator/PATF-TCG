// screens/gameover/gameover.js
// Tela de Game Over — todos os personagens caíram.
// Mostra o que sobrou na conta (pontos + itens + relíquias) e volta pro Start.

const GAMEOVER = (() => {

  function init() {
    let screen = document.getElementById('screen-gameover');
    if (!screen) {
      screen = document.createElement('div');
      screen.id = 'screen-gameover';
      document.getElementById('game-container').appendChild(screen);
    }

    screen.innerHTML = '';
    screen.style.display = 'flex';

    const pontos    = PLAYER_STATE.pontos ?? 0;
    const itens     = PLAYER_STATE.itens     ?? [];
    const reliquias = PLAYER_STATE.reliquias ?? [];

    const itensHTML = itens.length > 0
      ? itens.map(i => `<div class="go-item">${i.nome ?? i}</div>`).join('')
      : '<div class="go-item-vazio">Nenhum item salvo</div>';

    const reliquiasHTML = reliquias.length > 0
      ? reliquias.map(r => `<div class="go-item">${r.nome ?? r}</div>`).join('')
      : '<div class="go-item-vazio">Nenhuma relíquia salva</div>';

    screen.innerHTML = `
      <div id="go-bg"></div>
      <div id="go-content">
        <div id="go-titulo">💀 GAME OVER</div>
        <div id="go-subtitulo">Seus personagens caíram.<br>Sua conta persiste.</div>

        <div id="go-sobreviveu">
          <div class="go-secao">
            <div class="go-secao-titulo">🪙 PONTOS GUARDADOS</div>
            <div id="go-pontos">${pontos}</div>
          </div>
          <div class="go-secao">
            <div class="go-secao-titulo">🎒 ITENS NA CONTA</div>
            <div class="go-lista">${itensHTML}</div>
          </div>
          <div class="go-secao">
            <div class="go-secao-titulo">💎 RELÍQUIAS NA CONTA</div>
            <div class="go-lista">${reliquiasHTML}</div>
          </div>
        </div>

        <div id="go-aviso">Crie 3 novos personagens para continuar.</div>
        <button id="go-btn">RECOMEÇAR →</button>
      </div>
    `;

    screen.querySelector('#go-btn').addEventListener('click', () => {
      screen.style.display = 'none';
      window.irParaTela('start-screen');
    });
  }

  return { init };

})();
