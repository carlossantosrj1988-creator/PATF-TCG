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
//     efeitoPuro: boolean           — habilidade sem dano
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
      descricao:  'Quer conhecer seu inimigo? Olhe para os seus pés enquanto o atropela. — Tah... da Wea...',
    },
  };

  // ══════════════════════════════════════════════════════════════════════════
  // ÁRVORE — habilidades e passivas do Atlas
  // ══════════════════════════════════════════════════════════════════════════
  //
  // Indexadas pelo id do nó em ATLAS_NOS. Preenchidas conforme o catálogo
  // antigo for adaptado — ver game-design/06 e game-design/07.

  const HABILIDADES_DATA = {};
  const PASSIVAS_DATA    = {};

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
      descricao:  '',
      _placeholder: true,
    };
  }

  return {
    BASICOS,
    HABILIDADES_DATA,
    PASSIVAS_DATA,
    getBasico,
    getHabilidade,
    getPassiva,
  };

})();
