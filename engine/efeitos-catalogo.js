// engine/efeitos-catalogo.js
// Catálogo de buffs/debuffs nomeados — fonte única de DADOS.
//
// Pareia com engine/habilidades.js (HABILIDADES_DATA/PASSIVAS_DATA): aqui
// mora o conteúdo (nome, categoria, descrição); o COMPORTAMENTO (função
// aplicar) vive em engine/efeitos.js.
//
// Fluxo pra criar um efeito novo:
//   1. Adicionar entrada aqui (id → { nome, categoria, descricao }).
//   2. Registrar o aplicar em engine/efeitos.js (EFEITOS.registrar).
//   3. Referenciar a id no array `tags` da habilidade que dispara.
//
// Categorias:
//   debuff_dot    — dano contínuo por turno
//   debuff_stat   — redução persistente de ATQ/DEF/INC
//   debuff_marca  — marca não-stat (ex: Amaciado, Marcado)
//   debuff_ctrl   — controle (Atordoado, Congelado, Lento, Stun)
//   buff_stat     — aumento persistente de stats
//   buff_marca    — marca não-stat (ex: Furtivo, Imagem Espelhada)
//   buff_escudo   — absorção de dano

const EFEITOS_DATA = {

  // ── Marcas ────────────────────────────────────────────────────────────────

  amaciado: {
    nome:      'Amaciado',
    categoria: 'debuff_marca',
    descricao: 'Habilidades de Corte recebidas têm o poder dobrado por 2 turnos.',
  },

  // ── Stats ────────────────────────────────────────────────────────────────

  exposto: {
    nome:      'Exposto',
    categoria: 'debuff_stat',
    descricao: 'DEF base do alvo reduzida em 50% por 2 turnos.',
  },

  // ── DoTs ─────────────────────────────────────────────────────────────────

  queimadura: {
    nome:      'Queimadura',
    categoria: 'debuff_dot',
    descricao: '10 de dano por turno + -1 DEF por 2 turnos.',
  },

  resfriamento: {
    nome:      'Resfriamento',
    categoria: 'debuff_dot',
    descricao: '10 de dano por turno + -1 ATQ por 2 turnos.',
  },

};
