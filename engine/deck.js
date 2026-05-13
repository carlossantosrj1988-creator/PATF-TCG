// engine/deck.js
// Baralho de 54 cartas: criação, embaralhamento, compra e valores auxiliares.
// Não tem estado próprio — todas as funções recebem e devolvem dados.

const DECK = (() => {

  // ── Definições ────────────────────────────────────────────────────────────

  const NAIPES    = ['♥', '♣', '♦', '♠'];
  const NUMERICAS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  const ESPECIAIS = ['J', 'Q', 'K', 'A'];

  // Valor usado exclusivamente no cálculo de iniciativa e como base de dano
  const VALOR_NUM = {
    2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10,
    J: 11, Q: 12, K: 13, A: 14, '★': 15,
  };

  // ── Criação do baralho ────────────────────────────────────────────────────

  // Retorna array de 54 objetos de carta.
  // Estrutura de cada carta:
  //   { tipo, valor, naipe, label }
  //   tipo:  'numerica' | 'especial' | 'coringa'
  //   valor: 2-10 (number) | 'J'|'Q'|'K'|'A'|'★' (string)
  //   naipe: '♥'|'♣'|'♦'|'♠' | null (coringas)
  //   label: string de exibição, ex: '7♦', 'K♠', '★'

  function criarBaralho() {
    const cartas = [];

    // 36 numéricas (2-10 × 4 naipes)
    for (const naipe of NAIPES) {
      for (const valor of NUMERICAS) {
        cartas.push({ tipo: 'numerica', valor, naipe, label: `${valor}${naipe}` });
      }
    }

    // 16 especiais (J/Q/K/A × 4 naipes)
    for (const naipe of NAIPES) {
      for (const valor of ESPECIAIS) {
        cartas.push({ tipo: 'especial', valor, naipe, label: `${valor}${naipe}` });
      }
    }

    // 2 coringas (★ sem naipe fixo)
    cartas.push({ tipo: 'coringa', valor: '★', naipe: null, label: '★' });
    cartas.push({ tipo: 'coringa', valor: '★', naipe: null, label: '★' });

    return cartas; // 54 cartas
  }

  // ── Embaralhamento ────────────────────────────────────────────────────────

  // Fisher-Yates. Retorna novo array, não muta o original.
  function embaralhar(baralho) {
    const b = [...baralho];
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  }

  // ── Compra ────────────────────────────────────────────────────────────────

  // Retorna { cartas: [...n primeiras], resto: [...baralho sem as n] }
  function comprar(baralho, n = 1) {
    return {
      cartas: baralho.slice(0, n),
      resto:  baralho.slice(n),
    };
  }

  // ── Valores auxiliares ────────────────────────────────────────────────────

  function valorIniciativa(carta) {
    return VALOR_NUM[carta.valor] ?? 0;
  }

  // Mesmo mapeamento; função separada para deixar a intenção clara no código.
  function valorDano(carta) {
    return VALOR_NUM[carta.valor] ?? 0;
  }

  function ehEspecial(carta) {
    return carta.tipo === 'especial' || carta.tipo === 'coringa';
  }

  // ── API pública ───────────────────────────────────────────────────────────

  return { criarBaralho, embaralhar, comprar, valorIniciativa, valorDano, ehEspecial };

})();
