// chars/chars.js

// ── Pool fixo de personagens disponíveis ──────────────────────────────────────

const CHAR_POOL = [
  { id: 'vigor',     label: 'Vigor',     atq: 3, def: 4, inc: 0, pvs: 120 },
  { id: 'ofensivo',  label: 'Ofensivo',  atq: 5, def: 3, inc: 1, pvs: 100 },
  { id: 'defensivo', label: 'Defensivo', atq: 3, def: 5, inc: 0, pvs: 110 },
  { id: 'agil',      label: 'Ágil',      atq: 4, def: 3, inc: 2, pvs: 100 },
];

// ── Gradiente e símbolo genérico (antes de definir naipe) ─────────────────────

const CHAR_VISUAL_DEFAULT = {
  simbolo: '?',
  gradiente: 'linear-gradient(160deg, #4a4a4a, #1a1a1a)',
  cor: '#888888',
};

// ── Cores por naipe (usadas após definir naipe no Atlas) ──────────────────────

const NAIPE_VISUAL = {
  copas:    { simbolo: '♥', gradiente: 'linear-gradient(160deg, #8b0000, #1a0000)', cor: '#e05555' },
  paus:     { simbolo: '♣', gradiente: 'linear-gradient(160deg, #1a5c1a, #0a1a0a)', cor: '#4caf50' },
  ouro:     { simbolo: '♦', gradiente: 'linear-gradient(160deg, #7a5c00, #1a1400)', cor: '#f0c030' },
  espadas:  { simbolo: '♠', gradiente: 'linear-gradient(160deg, #1a2a4a, #0a0a1a)', cor: '#5599cc' },
};

// ── Criar personagem do jogador ───────────────────────────────────────────────

function criarPersonagem(poolId, nome) {
  const base = CHAR_POOL.find(c => c.id === poolId);
  if (!base) return null;

  return {
    poolId:          base.id,
    nome:            nome || '',
    atq:             base.atq,
    def:             base.def,
    inc:             base.inc,
    pvs:             base.pvs,
    naipe:           null,
    naipeSecundario: null,
    naipeAtivo:      null,
    passivas:        [null, null],
    habilidades:     [null, null, null],
    atlas:           {},
  };
}

// ── Estado global do jogador ──────────────────────────────────────────────────

const PLAYER_STATE = {
  pontos:       0,
  personagens:  [],
};

// ── Salvar / carregar estado ──────────────────────────────────────────────────

function salvarEstado() {
  localStorage.setItem('patf_state', JSON.stringify(PLAYER_STATE));
}

function carregarEstado() {
  const salvo = localStorage.getItem('patf_state');
  if (!salvo) return false;

  const dados = JSON.parse(salvo);
  PLAYER_STATE.pontos      = dados.pontos      ?? 0;
  PLAYER_STATE.personagens = dados.personagens ?? [];
  return true;
}

function limparEstado() {
  localStorage.removeItem('patf_state');
  PLAYER_STATE.pontos      = 0;
  PLAYER_STATE.personagens = [];
}
