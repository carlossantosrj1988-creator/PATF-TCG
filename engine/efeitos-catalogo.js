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

  enfraquecido: {
    nome:      'Enfraquecido',
    categoria: 'debuff_stat',
    descricao: 'ATQ base do alvo reduzido em 50% por 2 turnos.',
  },

  derretar_armadura: {
    nome:      'Armadura Derretida',
    categoria: 'debuff_marca',
    descricao: 'Impede uso de cartas de defesa e do Valete por 2 turnos. DEF base permanece.',
  },

  radiacao: {
    nome:      'Radiação',
    categoria: 'debuff_dot',
    descricao: '4 de dano por turno por 2 turnos. Acumula até 4 stacks (máx 16 de dano/turno).',
  },

  congelado: {
    nome:      'Congelado',
    categoria: 'debuff_ctrl',
    descricao: '50% de chance de perder o turno por 2 turnos.',
  },

  estatica: {
    nome:      'Estática',
    categoria: 'debuff_marca',
    descricao: 'Qualquer habilidade Elétrica usada no campo causa 5 de dano antes de resolver. Dura 2 turnos.',
  },

  encantado: {
    nome:      'Encantado',
    categoria: 'debuff_ctrl',
    descricao: '50% de chance de redirecionar ataque para um aliado próprio. Não afeta Furtivos. Dura 2 turnos.',
  },

  imagem_espelhada: {
    nome:      'Imagem Espelhada',
    categoria: 'buff_marca',
    descricao: '50% de esquiva ao ser atacado (não funciona contra Furtivo). Consumida ao esquivar.',
  },

  // ── Vantagens de naipe ────────────────────────────────────────────────────

  hearts_adv: {
    nome:      'Vantagem Copas',
    categoria: 'buff_marca',
    descricao: 'ATQ e DEF dobrados por 2 turnos. Ativa ao interagir com ♣ Paus.',
  },

  clubs_furtivo: {
    nome:      'Furtivo (Paus)',
    categoria: 'buff_marca',
    descricao: 'Ações normais tornam-se Furtivas. Contra-ataca qualquer atacante enquanto ativo. 2 turnos.',
  },

};
