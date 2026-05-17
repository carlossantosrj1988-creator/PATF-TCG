// engine/habilidades.js
// Fonte única dos dados de habilidades e passivas.
//
// A estrutura da árvore (posição, naipe, custo) vive em ATLAS_NOS (status.js).
// Aqui mora o CONTEÚDO — nome, tags e descrição — indexado por id.
//
// Schema de uma habilidade:
//   {
//     nome:       string
//     poder:      number | null      — somado no dano; null em efeito puro
//     tipo:       string            — categoria (Concussivo, Sagrado, ...)
//     alvo:       'unico'|'inimigos'|'aliados'|'self'|'todos'
//     turno:      'sim'|'nao'        — disponível desde o 1º turno?
//     recarga:    number            — rodadas de espera após uso
//     acao:       'N'|'R'|'F'|'L'
//     efeitoPuro: boolean            — habilidade sem dano
//     tags:       string[]           — efeitos que aplica (ex: 'amaciado'),
//                                      ganchos para o sistema de buffs/debuffs
//     descricao:  string
//   }
// Schema de uma passiva: { nome, gatilho, descricao }

const HABILIDADES = (() => {

  // ══════════════════════════════════════════════════════════════════════════
  // BÁSICAS — uma por arquétipo do CHAR_POOL
  // ══════════════════════════════════════════════════════════════════════════
  //
  // Starters: nascem equipadas no slot de H1 do personagem. Não estão no
  // Atlas nem no mostruário de habilidades. Ao serem trocadas por uma H1
  // comprada na árvore, somem para sempre.
  // Todas: poder 3, sem efeito, perfil básico. Muda só nome, tipo e descrição.

  const BASICOS = {
    ofensivo: {
      nome:       'Golpe Bate-Estacas',
      poder:      3,
      tipo:       'Concussivo',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Jogue goblins suficientes em qualquer problema e ele há de sumir. No mínimo, vão sobrar menos goblins.',
    },
    defensivo: {
      nome:       'Ataque Pacificador',
      poder:      3,
      tipo:       'Sagrado',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Pela primeira vez na vida, Gra... sentiu um calorzinho gostoso por dentro.',
    },
    agil: {
      nome:       'Disparo Cerebral',
      poder:      3,
      tipo:       'Psíquico',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'O conjunto de esferas de miz... mergulhou a mente dela no campo do pensamento, onde só as mais raras fagulhas de gênio podem ser colhidas.',
    },
    vigor: {
      nome:       'Trespassar',
      poder:      3,
      tipo:       'Perfurante',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Quer conhecer seu inimigo? Olhe para os seus pés enquanto o atropela. — Tah... da Wea...',
    },
  };

  // ══════════════════════════════════════════════════════════════════════════
  // ÁRVORE — habilidades e passivas do Atlas
  // ══════════════════════════════════════════════════════════════════════════
  //
  // Indexadas pelo id do nó em ATLAS_NOS. Preenchidas conforme o catálogo
  // antigo for adaptado — ver game-design/06 e game-design/07.

  const HABILIDADES_DATA = {
    // ── Copas ────────────────────────────────────────────────────────────────
    cop_h1_1: {                       // ex-ATACARRRR (Gorath ♥)
      nome:       'Golpe Pesado',
      poder:      4,
      tipo:       'Corte e Contusão',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       ['amaciado'],
      descricao:  'Aplica Amaciado.',
    },
    cop_h1_2: {                       // ex-Avanço Espada (Tyren ♥)
      nome:       'Golpe Amplo',
      poder:      4,
      tipo:       'Cortante',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Ao causar dano, ganha 1 de DEF até o início de sua próxima rodada. Não acumulativo.',
    },
    cop_h1_3: {                       // ex-Lança do Poder (Thalion ♥)
      nome:       'Perfurar',
      poder:      6,
      tipo:       'Perfurante',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Estocada perfurante de dano puro.',
    },
    cop_h2_1: {                       // ex-Avanço Escudo (Tyren ♥)
      nome:       'Avanço Escudo',
      poder:      3,
      tipo:       'Corporal',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       ['exposto'],
      descricao:  'Aplica Exposto.',
    },
    cop_h2_2: {                       // ex-Corte Flamejante (Caeryn ♥)
      nome:       'Corte Flamejante',
      poder:      3,
      tipo:       'Fogo',
      alvo:       'unico',
      turno:      'sim',
      recarga:    1,
      acao:       'N',
      efeitoPuro: false,
      tags:       ['queimadura'],
      descricao:  'Aplica Queimadura.',
    },
    cop_h2_3: {                       // ex-Corte Gélido (Thalion ♥)
      nome:       'Pancada Glacial',
      poder:      3,
      tipo:       'Frio',
      alvo:       'unico',
      turno:      'sim',
      recarga:    1,
      acao:       'N',
      efeitoPuro: false,
      tags:       ['resfriamento'],
      descricao:  'Aplica Resfriamento.',
    },
    cop_h3_1: {                       // ex-Agora é Sério (Gorath ♥)
      nome:       'Ódio',
      poder:      null,
      tipo:       'Melhoria',
      alvo:       'self',
      turno:      'sim',
      recarga:    1,
      acao:       'N',
      efeitoPuro: true,
      tags:       [],
      descricao:  'Cada ataque recebido aumenta o poder da sua próxima habilidade de dano em 4. Dura até a próxima rodada.',
    },
    cop_h3_2: {                       // ex-Espírito do Urso Polar (Thalion ♥)
      nome:       'Espírito do Urso Polar',
      poder:      2,
      tipo:       'Invocação',
      alvo:       'inimigos',
      turno:      'sim',
      recarga:    1,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Ganha +3 de poder para cada debuff ativo no alvo.',
    },

    // ── Espadas ──────────────────────────────────────────────────────────────
    esp_h1_1: {                       // ex-Golpe Tático (Comandante Vance ♠ 1ª)
      nome:       'Golpe Tático',
      poder:      5,
      tipo:       'Corporal',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Dano direto sem efeito adicional.',
    },
    esp_h1_2: {                       // ex-Soco Metálico (Kael Vorn ♠ 1ª)
      nome:       'Golpe de Abate',
      poder:      1,
      tipo:       'Corporal',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Crítico Alto: 50% de chance de dano dobrado.',
    },
    esp_h1_3: {                       // ex-Lança Infernal (Lorien ♠ 1ª)
      nome:       'Empalar',
      poder:      3,
      tipo:       'Perfurante',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       ['exposto'],
      descricao:  'Aplica Exposto.',
    },
    esp_h1_4: {                       // ex-Flecha Imperial (Lorien ♠ 2ª)
      nome:       'Marca do Atirador',
      poder:      3,
      tipo:       'Distância',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       ['enfraquecido'],
      descricao:  'Aplica Enfraquecido.',
    },
    esp_h1_5: {                       // ex-Machado do Poder (Varok ♠ 1ª)
      nome:       'Corte Metamorphosis',
      poder:      2,
      tipo:       'Cortante',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Ao causar dano, cura 2 de vida.',
    },
    esp_h2_1: {                       // ex-Punho Incendiário (Comandante Vance ♠ 2ª)
      nome:       'Mãos Flamejantes',
      poder:      3,
      tipo:       'Fogo',
      alvo:       'unico',
      turno:      'sim',
      recarga:    1,
      acao:       'N',
      efeitoPuro: false,
      tags:       ['queimadura'],
      descricao:  'Aplica Queimadura.',
    },
    esp_h2_2: {                       // ex-Ataque de Fúria (Kael Vorn ♠ 3ª)
      nome:       'Redemoinho',
      poder:      1,
      tipo:       'Corporal',
      alvo:       'self',
      turno:      'sim',
      recarga:    1,
      acao:       'N',
      efeitoPuro: true,
      tags:       [],
      descricao:  'Ativa contra-ataque: quando qualquer aliado (incluindo si) sofre dano, responde com ATQ + 1 de poder. 50% atinge só o agressor, 50% atinge todos os inimigos. Dura até o início do seu próximo turno.',
    },
    esp_h3_1: {                       // ex-Investida Unicórnio (Lorien ♠ 3ª)
      nome:       'Atropelar',
      poder:      5,
      tipo:       'Invocação',
      alvo:       'inimigos',
      turno:      'sim',
      recarga:    1,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Atinge todos os inimigos. Exposto = ×2 de poder, Enfraquecido = ×2 de poder, ambos = ×4.',
    },

    // ── Ouros ────────────────────────────────────────────────────────────────
    our_h1_1: {                       // ex-Arcabuz (Samus ♦ 1ª)
      nome:       'Barragem',
      poder:      2,
      tipo:       'Distância',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Começa com 0 cargas (máx 3). Ao passar a rodada, ganha 1 carga. Ao usar, gasta 1 carga e inicia ação extra: seleciona carta e alvo novamente com poder 2.',
    },
    our_h1_2: {                       // ex-Feixe de Plasma (Samus ♦ 2ª)
      nome:       'Feixe de Plasma',
      poder:      4,
      tipo:       'Elétrico',
      alvo:       'unico',
      turno:      'nao',
      recarga:    1,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Ignora armadura do alvo.',
    },
    our_h2_1: {                       // ex-Feixe Congelante (Samus ♦)
      nome:       'Feixe Congelante',
      poder:      3,
      tipo:       'Frio',
      alvo:       'unico',
      turno:      'nao',
      recarga:    1,
      acao:       'N',
      efeitoPuro: false,
      tags:       ['congelado'],
      descricao:  'Aplica Congelado.',
    },
    our_h2_2: {                       // ex-Bomba Ácida (Samus ♦)
      nome:       'Bomba Ácida',
      poder:      3,
      tipo:       'Ácido',
      alvo:       'unico',
      turno:      'nao',
      recarga:    1,
      acao:       'N',
      efeitoPuro: false,
      tags:       ['derretar_armadura'],
      descricao:  'Aplica Armadura Derretida.',
    },
    our_h2_3: {                       // ex-Bomba Radiação (Samus ♦)
      nome:       'Bomba Radiação',
      poder:      3,
      tipo:       'Radiação',
      alvo:       'unico',
      turno:      'nao',
      recarga:    1,
      acao:       'N',
      efeitoPuro: false,
      tags:       ['radiacao'],
      descricao:  'Aplica Radiação (empilhável até 4×, 4 de dano/turno por stack).',
    },
    our_h2_4: {                       // ex-Máscara de Faces (Samus ♦)
      nome:       'Máscara de Faces',
      poder:      null,
      tipo:       'Melhoria',
      alvo:       'self',
      turno:      'nao',
      recarga:    2,
      acao:       'N',
      efeitoPuro: true,
      tags:       [],
      descricao:  'Alterna entre Máscara Feliz (+1 ATQ a aliados) e Máscara Triste (−1 ATQ a inimigos) por 1 rodada. Enquanto ativa, contra-ataque automático sem cartas ao sofrer dano.',
    },
    our_h2_5: {                       // ex-Dados Penetrantes (♦)
      nome:       'Punhais Penetrantes',
      poder:      '1/1',
      tipo:       'Distância',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Dois ataques de poder 1 no mesmo alvo.',
    },
    our_h3_1: {                       // ex-Elixir da Cura (Samus ♦ 3ª)
      nome:       'Elixir da Cura',
      poder:      1,
      tipo:       'Sagrado',
      alvo:       'aliados',
      turno:      'nao',
      recarga:    1,
      acao:       'N',
      efeitoPuro: true,
      tags:       [],
      descricao:  'Cura aliados em (ATQ + 1) de vida em vez de causar dano.',
    },

    // ── Paus ─────────────────────────────────────────────────────────────────
    pau_h1_1: {                       // ex-Façada Sônica (♣)
      nome:       'Disparo Dividido',
      poder:      2,
      tipo:       'Distância',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Disparo de poder 2.',
    },
    pau_h1_2: {                       // ex-Facada (♣)
      nome:       'Corte Preciso',
      poder:      3,
      tipo:       'Cortante',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Corte direto.',
    },
    pau_h1_3: {                       // ex-Lança Granada (♣)
      nome:       'Granada Explosiva',
      poder:      3,
      tipo:       'Explosão',
      alvo:       'inimigos',
      turno:      'sim',
      recarga:    1,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Atinge todos os inimigos.',
    },
    pau_h1_4: {                       // ex-Atagas do Poder (♣)
      nome:       'Atagas do Poder',
      poder:      '1/1',
      tipo:       'Distância',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Dois ataques de poder 1 no mesmo alvo.',
    },
    pau_h2_1: {                       // ex-Sou Seu Amigo (♣)
      nome:       'Controle Mental',
      poder:      null,
      tipo:       'Psíquico',
      alvo:       'unico',
      turno:      'sim',
      recarga:    2,
      acao:       'N',
      efeitoPuro: true,
      tags:       [],
      descricao:  'Aplica Encantado (50% de chance de o alvo atacar um aliado próprio ao usar habilidade de alvo único).',
    },
    pau_h2_2: {                       // ex-Corte Estático (♣)
      nome:       'Golpe Estático',
      poder:      3,
      tipo:       'Elétrico',
      alvo:       'unico',
      turno:      'sim',
      recarga:    1,
      acao:       'N',
      efeitoPuro: false,
      tags:       ['estatica'],
      descricao:  'Aplica Estática.',
    },
    pau_h3_1: {                       // ex-Prestidigitação (♣)
      nome:       'Prestidigitação',
      poder:      null,
      tipo:       'Melhoria',
      alvo:       'aliados',
      turno:      'sim',
      recarga:    2,
      acao:       'N',
      efeitoPuro: true,
      tags:       [],
      descricao:  'Aplica Imagem Espelhada em todos os aliados.',
    },
  };

  const PASSIVAS_DATA    = {
    // ── Copas ────────────────────────────────────────────────────────────────
    cop_p1: {                         // ex-Acúmulo de Poder (Tyren ♥) — versão genérica
      nome:      'Acúmulo de Poder',
      gatilho:   'Ao passar a rodada',
      descricao: 'Ao passar a rodada, ganha 1 carga de poder (máx 2). Sua próxima habilidade de dano gasta as cargas: com 1 carga, ignora a armadura do alvo; com 2 cargas, o alvo passa a ser todos os inimigos.',
    },
    cop_p2: {                         // ex-Defender os Fracos (Gorath ♥)
      nome:      'Defender os Fracos',
      gatilho:   'Aliado é atacado',
      descricao: 'Defende aliados de ataques de alvo único que não sejam Rápidos nem Furtivos.',
    },
    cop_p3: {                         // ex-Sou Invencível (Gorath ♥)
      nome:      'Sou Invencível',
      gatilho:   'Permanente',
      descricao: 'Ganha +1 de DEF a cada 10% de vida perdida.',
    },

    // ── Espadas ──────────────────────────────────────────────────────────────
    esp_p1: {                         // ex-Instinto Furioso (Kael Vorn ♠)
      nome:      'Resiliência',
      gatilho:   'Aliado nocauteado',
      descricao: 'Quando um aliado é nocauteado, recupera 20% de vida.',
    },
    esp_p2: {                         // ex-Grande Estrela (Lorien ♠)
      nome:      'Novo Level',
      gatilho:   'Nocautear inimigo',
      descricao: 'Ao nocautear um inimigo, compra 1 carta extra e ganha 1 rodada extra.',
    },
    esp_p3: {                         // ex-Gladiadora (Lorien ♠)
      nome:      'Gladiador',
      gatilho:   'Permanente',
      descricao: 'Abaixo de 20% de vida, ganha +2 ATQ e +2 DEF.',
    },

    // ── Ouros ────────────────────────────────────────────────────────────────
    our_p1: {                         // ex-Concentração de Energia (Samus ♦)
      nome:      'Concentração de Energia',
      gatilho:   'Ao passar a rodada / ao usar habilidade',
      descricao: 'Ao passar a rodada, ganha 1 carga e causa 1 de dano puro a todos os inimigos. Ao usar qualquer habilidade, gasta cargas para aumentar o poder (+1 por carga). Com 5 cargas gastas, o alvo muda para todos os inimigos.',
    },
    our_p2: {                         // ex-Presença de Nimb (♦)
      nome:      'Ação Duplicada',
      gatilho:   'A cada turno',
      descricao: '50% de chance de realizar uma segunda ação Rápida gratuita após a ação principal do turno.',
    },

    // ── Paus ─────────────────────────────────────────────────────────────────
    pau_p1: {                         // ex-Sorte Grande (♣)
      nome:      'Sorte Grande',
      gatilho:   'Início de rodada',
      descricao: '50% de chance de comprar 1 carta extra no início de cada rodada.',
    },
    pau_p2: {                         // ex-Protetor Instintivo (♣)
      nome:      'Protetor Instintivo',
      gatilho:   'Aliado é atacado',
      descricao: '50% de chance de interceptar ataques de alvo único em aliados. 25% se o ataque for Rápido ou Furtivo.',
    },
    pau_p3: {                         // ex-Inspirar Coragem (♣)
      nome:      'Inspirar Coragem',
      gatilho:   'Permanente',
      descricao: 'Enquanto vivo, todos os aliados ganham +1 ATQ e +1 DEF.',
    },
  };

  // ── Pendentes — Tier 2 ────────────────────────────────────────────────────
  // Habilidades marcadas para Tier 2. O Atlas só tem Tier 1 por enquanto,
  // então ficam aqui até a estrutura de T2 existir. Nome novo e nó definitivo
  // a definir; dados preliminares vindos do catálogo antigo.
  const PENDENTE_T2 = {
    cop_espada_poder: {               // ex-Espada do Poder* (Caeryn ♥)
      naipe:      'copas',
      categoria:  1,                  // posição no catálogo antigo (1ª skill)
      nome:       'Espada do Poder',  // placeholder — renomear
      poder:      '2/2',
      tipo:       'Cortante',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Ataque múltiplo — 2 golpes de poder 2.',
    },
    cop_skaar: {                      // ex-SKAAAAARRRRR!!! (Gorath ♥)
      naipe:      'copas',
      categoria:  2,                  // posição no catálogo antigo (2ª skill)
      nome:       'SKAAAAARRRRR!!!',   // placeholder — renomear
      poder:      4,
      tipo:       'Invocação',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'R',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Ação Rápida — invoca uma criatura que ataca o inimigo.',
    },
    cop_roupas: {                     // ex-Roupas Encantadas (Tyren ♥)
      naipe:      'copas',
      categoria:  3,                  // posição no catálogo antigo (3ª skill)
      nome:       'Roupas Encantadas', // placeholder — renomear
      poder:      null,
      tipo:       'Melhoria',
      alvo:       'self',
      turno:      'sim',
      recarga:    1,
      acao:       'R',
      efeitoPuro: true,
      tags:       [],
      descricao:  'Três modos (regeneração / proteção / contra-ataque). Ação Rápida.',
    },
    cop_salamandra: {                 // ex-Espírito da Salamandra (Caeryn ♥)
      naipe:      'copas',
      categoria:  3,                  // posição no catálogo antigo (3ª skill)
      nome:       'Espírito da Salamandra', // placeholder — renomear
      poder:      '2/2',
      tipo:       'Invocação',
      alvo:       'inimigos',
      turno:      'sim',
      recarga:    1,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Aplica Derreter Armadura em todos os inimigos.',
    },
    // Passivas "Patrulheiro de Combate" — conceito mantido, interligadas
    // entre si; vão para Tier 2.
    cop_patrulheiro_cae: {            // ex-Patrulheiro de Combate (Caeryn ♥)
      naipe:      'copas',
      tipo:       'passiva',
      nome:       'Patrulheiro de Combate',  // placeholder — renomear
      gatilho:    '',
      descricao:  'Aliados ganham +1 DEF para cada Patrulheiro aliado.',
    },
    cop_patrulheiro_tha: {            // ex-Patrulheiro de Combate (Thalion ♥)
      naipe:      'copas',
      tipo:       'passiva',
      nome:       'Patrulheiro de Combate',  // placeholder — renomear
      gatilho:    '',
      descricao:  'A equipe ganha +10 de vida para cada Patrulheiro aliado.',
    },
    cop_emboscada: {                  // ex-Emboscada Florestal (Caeryn ♥)
      naipe:      'copas',
      tipo:       'passiva',
      nome:       'Emboscada Florestal',  // placeholder — renomear
      gatilho:    '',
      descricao:  'Ativada 1x no início do combate: 20 de dano em todos os inimigos, ignora DEF. (Requer 3 Patrulheiros na equipe.)',
    },

    // ── Espadas — T2 ─────────────────────────────────────────────────────────
    esp_descarga: {                   // ex-Descarga Elétrica (Vance ♠ 3ª)
      naipe:      'espadas',
      nome:       'Descarga Elétrica',
      poder:      5,
      tipo:       'Elétrico',
      alvo:       'inimigos',
      turno:      'sim',
      recarga:    1,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Catastrófico + Ignora Armadura. Atinge todos os inimigos. A definir para T2.',
    },
    esp_corte_preciso: {              // ex-Corte Preciso (Kael Vorn ♠ 2ª)
      naipe:      'espadas',
      nome:       'Corte Preciso',
      poder:      '2/2',
      tipo:       'Cortante',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  '2 golpes. Aplica Sangramento. A melhorar para T2.',
    },
    esp_soco_brutal: {                // ex-Soco Brutal (Varok ♠ 2ª)
      naipe:      'espadas',
      nome:       'Soco Brutal',
      poder:      3,
      tipo:       'Energia',
      alvo:       'unico',
      turno:      'sim',
      recarga:    1,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Aplica Enfraquecido. A melhorar para T2.',
    },
    esp_gorila: {                     // ex-Espírito do Gorila (Varok ♠ 3ª)
      naipe:      'espadas',
      nome:       'Espírito do Gorila',
      poder:      1,
      tipo:       'Terrestre',
      alvo:       'inimigos',
      turno:      'sim',
      recarga:    1,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'Aplica Atordoamento em todos os inimigos. A melhorar para T2.',
    },
    esp_espirito_combate: {           // ex-Espírito de Combate (Kael Vorn ♠)
      naipe:      'espadas',
      tipo:       'passiva',
      nome:       'Espírito de Combate',
      gatilho:    '',
      descricao:  '+1 ATQ a cada 10% de vida perdida.',
    },
    esp_chamado_tropa: {              // ex-Chamado da Tropa (Vance ♠)
      naipe:      'espadas',
      tipo:       'passiva',
      nome:       'Chamado da Tropa',
      gatilho:    '',
      descricao:  'A cada 3 turnos, a Tropa concede ajudas variadas. A definir para T2.',
    },
    esp_patrulheiro: {                // ex-Patrulheiro de Combate (Varok ♠)
      naipe:      'espadas',
      tipo:       'passiva',
      nome:       'Patrulheiro de Combate',
      gatilho:    '',
      descricao:  'A equipe ganha +1 ATQ por Patrulheiro aliado.',
    },

    // ── Ouros — T2 ───────────────────────────────────────────────────────────
    our_azar_sorte: {                  // ex-Azar ou Sorte (Samus ♦)
      naipe:      'ouros',
      nome:       'Azar ou Sorte',
      poder:      null,
      tipo:       'Neutro',
      alvo:       'todos',
      turno:      'sim',
      recarga:    2,
      acao:       'N',
      efeitoPuro: true,
      tags:       [],
      descricao:  'Efeito aleatório benéfico ou maléfico. A definir para T2.',
    },
    our_grifo: {                       // ex-Espírito do Grifo (Samus ♦)
      naipe:      'ouros',
      nome:       'Espírito do Grifo',
      poder:      3,
      tipo:       'Invocação',
      alvo:       'inimigos',
      turno:      'sim',
      recarga:    1,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'A definir para T2.',
    },
    our_genio: {                       // ex-Grande Gênio (Samus ♦)
      naipe:      'ouros',
      nome:       'Grande Gênio',
      poder:      null,
      tipo:       'Melhoria',
      alvo:       'self',
      turno:      'sim',
      recarga:    2,
      acao:       'N',
      efeitoPuro: true,
      tags:       [],
      descricao:  'A definir para T2.',
    },
    our_patrulheiro: {                 // ex-Patrulheiro de Combate (Elowen ♦)
      naipe:      'ouros',
      tipo:       'passiva',
      nome:       'Patrulheiro de Combate',
      gatilho:    '',
      descricao:  'A definir para T2.',
    },

    // ── Paus — T2 ────────────────────────────────────────────────────────────
    pau_pistola: {                     // ex-Disparo Pistola (♣)
      naipe:      'paus',
      nome:       'Disparo Pistola',
      poder:      3,
      tipo:       'Distância',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'A melhorar para T2.',
    },
    pau_guepardo: {                    // ex-Espírito do Guepardo (♣)
      naipe:      'paus',
      nome:       'Espírito do Guepardo',
      poder:      3,
      tipo:       'Invocação',
      alvo:       'unico',
      turno:      'sim',
      recarga:    1,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'A definir para T2.',
    },
    pau_chicote: {                     // ex-Chicote Paralisante (♣)
      naipe:      'paus',
      nome:       'Chicote Paralisante',
      poder:      2,
      tipo:       'Elétrico',
      alvo:       'unico',
      turno:      'sim',
      recarga:    1,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'A definir para T2.',
    },
    pau_reflexivo: {                   // ex-Instinto Reflexivo (♣)
      naipe:      'paus',
      tipo:       'passiva',
      nome:       'Instinto Reflexivo',
      gatilho:    '',
      descricao:  'A definir para T2.',
    },
    pau_decisivo: {                    // ex-Tiro Decisivo (♣)
      naipe:      'paus',
      nome:       'Tiro Decisivo',
      poder:      4,
      tipo:       'Distância',
      alvo:       'unico',
      turno:      'sim',
      recarga:    1,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  'A definir para T2.',
    },
    pau_resgate: {                     // ex-Resgate dos Prisioneiros (♣)
      naipe:      'paus',
      nome:       'Resgate dos Prisioneiros',
      poder:      null,
      tipo:       'Melhoria',
      alvo:       'aliados',
      turno:      'sim',
      recarga:    3,
      acao:       'N',
      efeitoPuro: true,
      tags:       [],
      descricao:  'A refazer completamente para T2.',
    },
    pau_patrulheiro: {                 // ex-Patrulheiro de Combate (Zarae ♣)
      naipe:      'paus',
      tipo:       'passiva',
      nome:       'Patrulheiro de Combate',
      gatilho:    '',
      descricao:  'A definir para T2.',
    },
  };

  // ══════════════════════════════════════════════════════════════════════════
  // LOOKUPS
  // ══════════════════════════════════════════════════════════════════════════

  // Habilidade básica de um arquétipo do CHAR_POOL (ofensivo/defensivo/agil/vigor).
  function getBasico(arquetipoId) {
    return BASICOS[arquetipoId] ?? null;
  }

  // Habilidade da árvore por id de nó. Enquanto o conteúdo não foi adaptado,
  // devolve um esqueleto baseado no label do ATLAS_NOS — a UI não quebra.
  function getHabilidade(id) {
    return HABILIDADES_DATA[id] ?? _esqueleto(id, 'habilidade');
  }

  function getPassiva(id) {
    return PASSIVAS_DATA[id] ?? _esqueleto(id, 'passiva');
  }

  // Resolve o valor de um slot de habilidade para o dado da habilidade.
  //   null            → null
  //   'basico:<arq>'  → básica do arquétipo
  //   '<id do nó>'    → habilidade da árvore
  function resolverHabilidade(slotValue) {
    if (!slotValue) return null;
    if (typeof slotValue === 'string' && slotValue.startsWith('basico:')) {
      return getBasico(slotValue.slice(7));
    }
    return getHabilidade(slotValue);
  }

  function _esqueleto(id, tipo) {
    const no = (typeof ATLAS_NOS !== 'undefined')
      ? ATLAS_NOS.find(n => n.id === id)
      : null;
    if (tipo === 'passiva') {
      return { nome: no ? no.label : id, gatilho: '', descricao: '', _placeholder: true };
    }
    return {
      nome:       no ? no.label : id,
      poder:      0,
      tipo:       '',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      descricao:  '',
      _placeholder: true,
    };
  }

  return {
    BASICOS,
    HABILIDADES_DATA,
    PASSIVAS_DATA,
    PENDENTE_T2,
    getBasico,
    getHabilidade,
    getPassiva,
    resolverHabilidade,
  };

})();
