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

  const root = document.documentElement;

  // Cor inicial aleatoria
  function corAleatoria() {
    return CORES[Math.floor(Math.random() * CORES.length)];
  }

  function aplicar(cor) {
    root.style.setProperty('--carta-borda-cor', cor);
    root.style.setProperty('--carta-borda-glow', cor + '88');
  }

  function loop() {
    aplicar(corAleatoria());
    // Proxima troca entre 6 e 12 segundos
    const prox = 6000 + Math.random() * 6000;
    setTimeout(loop, prox);
  }

  aplicar(corAleatoria());
  setTimeout(loop, 6000 + Math.random() * 6000);

})();
