// naipes/naipes.js
// Dados dos 4 naipes — identidade, vantagens, bônus fixos e layout do atlas.

const NAIPES_DATA = {
  copas: {
    label:       '♥ COPAS',
    cor:         '#e05555',
    vantagem:    'paus',
    desvantagem: 'espadas',
    bonuses:     [{ campo: 'def', valor: 2 }],
    mainDir:     [0, -1],
    perpDir:     [1,  0],
  },
  espadas: {
    label:       '♠ ESPADAS',
    cor:         '#5599cc',
    vantagem:    'copas',
    desvantagem: 'ouro',
    bonuses:     [{ campo: 'atq', valor: 2 }],
    mainDir:     [1,  0],
    perpDir:     [0,  1],
  },
  ouro: {
    label:       '♦ OURO',
    cor:         '#f0c030',
    vantagem:    'espadas',
    desvantagem: 'paus',
    bonuses:     [{ campo: 'inc', valor: 1 }, { campo: 'def', valor: 1 }],
    mainDir:     [0,  1],
    perpDir:     [1,  0],
  },
  paus: {
    label:       '♣ PAUS',
    cor:         '#4caf50',
    vantagem:    'ouro',
    desvantagem: 'copas',
    bonuses:     [{ campo: 'inc', valor: 1 }, { campo: 'atq', valor: 1 }],
    mainDir:     [-1, 0],
    perpDir:     [0,  1],
  },
};
