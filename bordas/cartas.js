/* bordas/cartas.js
   Sorteio aleatorio de cor pras bordas das cartas.
   JS sorteia cor + tempo, seta CSS variable, e o CSS transitiona suave. */

(function() {

  const CORES = [
    '#ff3050',  // vermelho neon
    '#ff7020',  // laranja
    '#ffd040',  // amarelo neon
    '#40d860',  // verde eletrico
    '#40d0e0',  // ciano
    '#4060e0',  // azul cobalto
    '#a040c0',  // roxo magenta
    '#ff6090',  // rosa neon
    '#ffffff',  // branco brilhante
    '#c040ff',  // roxo cosmico
  ];

  const EFEITOS = ['8bit', 'crt', 'barbearia', 'multi-neon'];

  const root = document.documentElement;
  const body = document.body;

  function corAleatoria() {
    return CORES[Math.floor(Math.random() * CORES.length)];
  }

  function efeitoAleatorio() {
    return EFEITOS[Math.floor(Math.random() * EFEITOS.length)];
  }

  function aplicarCor(cor) {
    root.style.setProperty('--carta-borda-cor', cor);
    root.style.setProperty('--carta-borda-glow', cor + '88');
  }

  function aplicarEfeito(efeito) {
    EFEITOS.forEach(e => body.classList.remove('efeito-' + e));
    if (efeito) body.classList.add('efeito-' + efeito);
  }

  function loopCor() {
    aplicarCor(corAleatoria());
    const prox = 6000 + Math.random() * 6000;  // 6-12s
    setTimeout(loopCor, prox);
  }

  function loopEfeito() {
    // 60% sem efeito (so cor base), 40% com efeito especial
    const usar = Math.random() < 0.4;
    aplicarEfeito(usar ? efeitoAleatorio() : null);
    // Duracao do estado atual: 8-18s
    const prox = 8000 + Math.random() * 10000;
    setTimeout(loopEfeito, prox);
  }

  aplicarCor(corAleatoria());
  setTimeout(loopCor, 6000 + Math.random() * 6000);
  setTimeout(loopEfeito, 4000 + Math.random() * 6000);

})();
