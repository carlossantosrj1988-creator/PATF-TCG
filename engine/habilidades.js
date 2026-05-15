// engine/habilidades.js
// Fonte única dos dados de habilidades e passivas.
//
// A estrutura da árvore (posição, naipe, custo) vive em ATLAS_NOS (status.js).
// Aqui mora o CONTEÚDO — nome, tags e descrição — indexado por id.
//
// Schema de uma habilidade:
//   {
//     nome:       string
//     poder:      number            — somado no cálculo de dano
//     tipo:       string            — categoria (Concussivo, Sagrado, ...)
//     alvo:       'unico'|'inimigos'|'aliados'|'self'|'todos'
//     turno:      'sim'|'nao'        — disponível desde o 1º turno?
//     recarga:    number            — rodadas de espera após uso
//     acao:       'N'|'R'|'F'|'L'
//     efeitoPuro: boolean            — habilidade sem dano
//     tags:       string[]           — efeitos que aplica (ex: 'amaciado'),
//                                      ganchos para o sistema de buffs/debuffs
//     acumuloMax: number (opcional)  — habilidade de acúmulo: máximo de
//                                      cargas ganhas ao passar a rodada
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
      poder:      3,
      tipo:       'Cortante',
      alvo:       'unico',
      turno:      'sim',
      recarga:    0,
      acao:       'N',
      efeitoPuro: false,
      tags:       [],
      acumuloMax: 2,
      descricao:  'Acúmulo de Poder: ao passar a rodada, ganha 1 carga. Com 1 carga, ignora a armadura do alvo. Com 2 cargas, atinge todos os inimigos.',
    },
  };

  const PASSIVAS_DATA    = {};

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
