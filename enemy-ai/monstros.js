// enemy-ai/monstros.js
// Dados dos inimigos PvE — mobs, mini-bosses e bosses do PATF TCG.
// Adaptado do roster do jogo antigo, no schema do jogo novo.
//
// Estrutura de cada entrada:
//   {
//     tipo:     'mob' | 'miniboss' | 'boss' | 'boss_spawn'
//     tier:     1 | 2 | 3
//     nome, sub
//     naipe:    '♥' | '♣' | '♦' | '♠' | null
//     atq, def, inc, pvs
//     skills:   [ids no SKILLS abaixo]
//     passivas: [ids — registradas em engine/passivas.js (Layer 2)]
//     weight:   peso pra sorteio (só mob)
//     phase:    fase do boss/miniboss
//     onDeath, spawn:  comportamento especial (bosses)
//   }
//
// O comportamento de cada inimigo (qual habilidade usa, em quem mira)
// vive em enemy-ai/ia.js — Layer 2 do design da IA.

const MONSTROS = (() => {

  // ══════════════════════════════════════════════════════════════════════════
  // SKILLS — templates reutilizáveis das habilidades dos inimigos
  // ══════════════════════════════════════════════════════════════════════════
  //
  // Schema igual habilidade do jogador (engine/habilidades.js).
  // _id é injetado em MONSTROS.get com prefixo 'enemy:'.

  const SKILLS = {
    // ── Tutorial ──
    goblin_granada:  { nome:'Granada Goblin',    poder:3,    tipo:'',             alvo:'unico',    turno:'sim', recarga:0, acao:'N', efeitoPuro:false, tags:[], descricao:'' },
    lobo_mordida:    { nome:'Mordida',            poder:1,    tipo:'',             alvo:'unico',    turno:'sim', recarga:0, acao:'N', efeitoPuro:false, tags:['ignora_armadura'], descricao:'Ignora a DEF do alvo.' },
    butter_sono:     { nome:'Esporos de Sono',    poder:null, tipo:'',             alvo:'inimigos', turno:'sim', recarga:0, acao:'N', efeitoPuro:true,  tags:['atordoamento'], descricao:'Aplica atordoamento em todos os inimigos.' },
    butter_veneno:   { nome:'Esporos Venenosos',  poder:null, tipo:'',             alvo:'inimigos', turno:'sim', recarga:0, acao:'N', efeitoPuro:true,  tags:['veneno'], descricao:'Aplica 1 stack de veneno em todos os inimigos.' },
    demon_pancada:   { nome:'Pancada',            poder:4,    tipo:'Corpo a Corpo',alvo:'unico',    turno:'sim', recarga:0, acao:'N', efeitoPuro:false, tags:[], descricao:'Pancada poderosa.' },
    demon_salto:     { nome:'Salto do Demônio',   poder:1,    tipo:'Corpo a Corpo',alvo:'inimigos', turno:'sim', recarga:0, acao:'N', efeitoPuro:false, tags:[], descricao:'Cai sobre todos os inimigos.' },

    // ── Boss 1 (Rainha Sanguessuga) + cria_t1 ──
    b1_drn: { nome:'Drenar Sangue',          poder:4,    tipo:'Distância',    alvo:'unico',    turno:'sim', recarga:0, acao:'N', efeitoPuro:false, tags:[], descricao:'Causa sangramento no alvo.' },
    b1_enx: { nome:'Enxame Sangrento',       poder:3,    tipo:'Corpo a Corpo',alvo:'inimigos', turno:'nao', recarga:1, acao:'N', efeitoPuro:false, tags:[], descricao:'Causa sangramento em todos os inimigos.' },

    // ── Boss 2 (Yeti Glacial) ──
    b2_pan: { nome:'Pancada Glacial',        poder:6,    tipo:'Corpo a Corpo',alvo:'unico',    turno:'sim', recarga:0, acao:'N', efeitoPuro:false, tags:[], descricao:'Causa dano no alvo. 50% de chance de congelamento.' },
    b2_arr: { nome:'Arrastão de Frio',       poder:6,    tipo:'Corpo a Corpo',alvo:'inimigos', turno:'sim', recarga:0, acao:'N', efeitoPuro:false, tags:[], descricao:'Causa dano em todos os inimigos e aplica resfriamento.' },

    // ── Boss 3 (Vyr'Thas) ──
    b3_ana: { nome:'Análise Tecnológica',    poder:null, tipo:'Melhoria',     alvo:'self',     turno:'sim', recarga:0, acao:'R', efeitoPuro:true,  tags:[], descricao:'Todas as cartas contam como especialidade (♦) por 2 turnos.' },
    b3_bom: { nome:'Bomba Mágica Radioativa',poder:1,    tipo:'Mágico',       alvo:'inimigos', turno:'sim', recarga:0, acao:'N', efeitoPuro:false, tags:[], descricao:'Aplica Queimadura e Radiação em todos os inimigos.' },
    b3_cam: { nome:'Campo de Proteção',      poder:null, tipo:'Melhoria',     alvo:'self',     turno:'sim', recarga:0, acao:'N', efeitoPuro:true,  tags:[], descricao:'Ganha Escudo e Imagem Espelhada.' },
    b3_tel: { nome:'Ataque Telecinético',    poder:10,   tipo:'Energia',      alvo:'unico',    turno:'sim', recarga:0, acao:'N', efeitoPuro:false, tags:[], descricao:'Catastrófico. Ignora toda defesa.' },

    // ── Mobs Tier 1 ──
    vespa_fer:  { nome:'Ferroada Venenosa',  poder:2,    tipo:'Distância',    alvo:'unico',    turno:'sim', recarga:0, acao:'N', efeitoPuro:false, tags:[], descricao:'Causa envenenamento no alvo.' },
    elfo_pun:   { nome:'Puntura',            poder:3,    tipo:'Corpo a Corpo',alvo:'unico',    turno:'sim', recarga:0, acao:'N', efeitoPuro:false, tags:[], descricao:'Ativa Hemorragia: dispara um tick de Sangramento em todos os inimigos.' },

    // ── Mobs Tier 2 ──
    urso_pat:   { nome:'Patada do Urso',     poder:'3/3',tipo:'Corpo a Corpo',alvo:'unico',    turno:'sim', recarga:0, acao:'N', efeitoPuro:false, tags:[], descricao:'Ataque múltiplo. Aplica sangramento no alvo.' },
    urso_mor:   { nome:'Mordida do Urso',    poder:5,    tipo:'Corpo a Corpo',alvo:'unico',    turno:'sim', recarga:0, acao:'N', efeitoPuro:false, tags:[], descricao:'Crítico Alto. Aplica hemorragia.' },
    nef_esmag:  { nome:'Esmagamento Incapacitante', poder:7, tipo:'Corpo a Corpo', alvo:'unico', turno:'sim', recarga:0, acao:'N', efeitoPuro:false, tags:[], descricao:'Causa atordoamento e resfriamento no alvo.' },
    troll_esp:  { nome:'Espancamento Congelante',   poder:7, tipo:'Corpo a Corpo', alvo:'unico', turno:'sim', recarga:0, acao:'N', efeitoPuro:false, tags:[], descricao:'Aplica congelamento no alvo (50% de chance).' },

    // ── Mini Bosses ──
    xama_tra:     { nome:'Transfusão do Flagelo', poder:null, tipo:'Mágico',   alvo:'unico',   turno:'sim', recarga:0, acao:'N', efeitoPuro:true,  tags:[], descricao:'Aplica sangramento no alvo. Para cada Elfo do Culto aliado vivo, remove 20% do HP do elfo e adiciona +1 stack de sangramento no mesmo alvo.' },
    xama_rev:     { nome:'Reviver Morto',         poder:null, tipo:'Melhoria', alvo:'self',    turno:'sim', recarga:0, acao:'N', efeitoPuro:true,  tags:[], descricao:'Ganha buff: se não há aliados vivos, Pacto de Sangue ganha +40% de chance. Dura 2 rodadas.' },
    parede_limpa: { nome:'Purificação Gelada',    poder:null, tipo:'Melhoria', alvo:'aliados', turno:'sim', recarga:0, acao:'N', efeitoPuro:true,  tags:[], descricao:'Remove todos os debuffs de si mesmo ou de um aliado.' },
  };

  // ══════════════════════════════════════════════════════════════════════════
  // DATA — dados dos inimigos, indexados por id
  // ══════════════════════════════════════════════════════════════════════════

  const DATA = {
    // ── Tutorial ────────────────────────────────────────────────────────────

    goblin_fanatico:  { tipo:'mob',     tier:0, nome:'Goblin Fanático',   sub:'Tutorial',              naipe:'♣',  atq:3, def:1, inc:3,  pvs:50,  skills:['goblin_granada'],              passivas:[],               weight:1, iniScript:'maior' },
    lobo_matilha_a:   { tipo:'mob',     tier:0, nome:'Lobo de Matilha α', sub:'Tutorial',              naipe:null, atq:2, def:2, inc:2,  pvs:60,  skills:['lobo_mordida'],                passivas:[],               weight:1, iniScript:'aleatorio' },
    lobo_matilha_b:   { tipo:'mob',     tier:0, nome:'Lobo de Matilha β', sub:'Tutorial',              naipe:null, atq:2, def:2, inc:2,  pvs:60,  skills:['lobo_mordida'],                passivas:[],               weight:1, iniScript:'aleatorio' },
    casulo_butter:    { tipo:'miniboss',tier:0, phase:1, nome:'Casulo do Butter',  sub:'Mini Boss — Tutorial', naipe:null, atq:0, def:5, inc:0,  pvs:75,  skills:[],                              passivas:['esporos_casulo'] },
    butter_venenoso:  { tipo:'miniboss',tier:0, phase:2, nome:'Butter Venenoso',   sub:'Mini Boss — Tutorial', naipe:null, atq:0, def:0, inc:5,  pvs:75,  skills:['butter_sono','butter_veneno'], passivas:[], iniScript:'garantir_primeiro' },
    prisoner_demon:   { tipo:'boss',    tier:0, phase:1, nome:'Prisoner Demon',    sub:'Boss — Tutorial',      naipe:null, atq:5, def:5, inc:-1, pvs:200, skills:['demon_pancada','demon_salto'], passivas:[] },

    // ── Mobs Tier 1 — Floresta Sombria ──────────────────────────────────────

    cria_t1_a: { tipo:'mob', tier:1, nome:'Cria de Sanguessuga α', sub:'Monstro — Floresta Sombria', naipe:null, atq:6, def:5, inc:-2, pvs:50, skills:['b1_drn'], passivas:[], weight:1 },
    cria_t1_b: { tipo:'mob', tier:1, nome:'Cria de Sanguessuga β', sub:'Monstro — Floresta Sombria', naipe:null, atq:6, def:5, inc:-2, pvs:50, skills:['b1_drn'], passivas:[], weight:1 },
    cria_t1_c: { tipo:'mob', tier:1, nome:'Cria de Sanguessuga γ', sub:'Monstro — Floresta Sombria', naipe:null, atq:6, def:5, inc:-2, pvs:50, skills:['b1_drn'], passivas:[], weight:1 },

    vespa_a:   { tipo:'mob', tier:1, nome:'Enxame de Vespas α',    sub:'Monstro — Floresta Sombria', naipe:'♣', atq:1, def:3, inc:6, pvs:40, skills:['vespa_fer'], passivas:['veneno_reacao'], weight:1 },
    vespa_b:   { tipo:'mob', tier:1, nome:'Enxame de Vespas β',    sub:'Monstro — Floresta Sombria', naipe:'♣', atq:1, def:3, inc:6, pvs:40, skills:['vespa_fer'], passivas:['veneno_reacao'], weight:1 },
    vespa_c:   { tipo:'mob', tier:1, nome:'Enxame de Vespas γ',    sub:'Monstro — Floresta Sombria', naipe:'♣', atq:1, def:3, inc:6, pvs:40, skills:['vespa_fer'], passivas:['veneno_reacao'], weight:1 },

    elfo_a:    { tipo:'mob', tier:1, nome:'Elfo do Culto Sangrento α', sub:'Monstro — Floresta Sombria', naipe:'♠', atq:3, def:2, inc:1, pvs:80, skills:['elfo_pun'], passivas:['exposicao_sangue'], weight:1 },
    elfo_b:    { tipo:'mob', tier:1, nome:'Elfo do Culto Sangrento β', sub:'Monstro — Floresta Sombria', naipe:'♠', atq:3, def:2, inc:1, pvs:80, skills:['elfo_pun'], passivas:['exposicao_sangue'], weight:1 },
    elfo_c:    { tipo:'mob', tier:1, nome:'Elfo do Culto Sangrento γ', sub:'Monstro — Floresta Sombria', naipe:'♠', atq:3, def:2, inc:1, pvs:80, skills:['elfo_pun'], passivas:['exposicao_sangue'], weight:1 },

    // ── Mobs Tier 2 — Cavernas de Gelo ──────────────────────────────────────

    urso_t2_a:  { tipo:'mob', tier:2, nome:'Urso Polar das Cavernas α', sub:'Monstro — Cavernas de Gelo', naipe:'♥', atq:4, def:5, inc:1, pvs:100, skills:['urso_pat','urso_mor'], passivas:['furia_polar'], weight:1 },
    urso_t2_b:  { tipo:'mob', tier:2, nome:'Urso Polar das Cavernas β', sub:'Monstro — Cavernas de Gelo', naipe:'♥', atq:4, def:5, inc:1, pvs:100, skills:['urso_pat','urso_mor'], passivas:['furia_polar'], weight:1 },
    urso_t2_c:  { tipo:'mob', tier:2, nome:'Urso Polar das Cavernas γ', sub:'Monstro — Cavernas de Gelo', naipe:'♥', atq:4, def:5, inc:1, pvs:100, skills:['urso_pat','urso_mor'], passivas:['furia_polar'], weight:1 },

    nefilin_t2_a: { tipo:'mob', tier:2, nome:'Nefilin Morto-Vivo α', sub:'Monstro — Cavernas de Gelo', naipe:'♥', atq:6, def:0, inc:-5, pvs:150, skills:['nef_esmag'], passivas:['nefilin_suit'], weight:1 },
    nefilin_t2_b: { tipo:'mob', tier:2, nome:'Nefilin Morto-Vivo β', sub:'Monstro — Cavernas de Gelo', naipe:'♥', atq:6, def:0, inc:-5, pvs:150, skills:['nef_esmag'], passivas:['nefilin_suit'], weight:1 },
    nefilin_t2_c: { tipo:'mob', tier:2, nome:'Nefilin Morto-Vivo γ', sub:'Monstro — Cavernas de Gelo', naipe:'♥', atq:6, def:0, inc:-5, pvs:150, skills:['nef_esmag'], passivas:['nefilin_suit'], weight:1 },

    troll_t2_a: { tipo:'mob', tier:2, nome:'Troll das Terras Nevadas α', sub:'Monstro — Cavernas de Gelo', naipe:'♠', atq:7, def:7, inc:0, pvs:74, skills:['troll_esp'], passivas:['troll_regen'], weight:1 },
    troll_t2_b: { tipo:'mob', tier:2, nome:'Troll das Terras Nevadas β', sub:'Monstro — Cavernas de Gelo', naipe:'♠', atq:7, def:7, inc:0, pvs:74, skills:['troll_esp'], passivas:['troll_regen'], weight:1 },
    troll_t2_c: { tipo:'mob', tier:2, nome:'Troll das Terras Nevadas γ', sub:'Monstro — Cavernas de Gelo', naipe:'♠', atq:7, def:7, inc:0, pvs:74, skills:['troll_esp'], passivas:['troll_regen'], weight:1 },

    // ── Mini Bosses ─────────────────────────────────────────────────────────

    xama_t1:   { tipo:'miniboss', tier:1, phase:1, nome:'Xamã do Culto Sangrento',     sub:'Mini Boss — Floresta Sombria', naipe:'♦', atq:1, def:1, inc:5, pvs:120, skills:['xama_tra','xama_rev'], passivas:['pacto_sangue'] },
    parede_t2: { tipo:'miniboss', tier:2, phase:2, nome:'Parede de Carne Congelada', sub:'Mini Boss — Caverna de Gelo',  naipe:null, atq:0, def:0, inc:0, pvs:238, skills:['parede_limpa'],         passivas:['parede_restricao'] },

    // ── Bosses ──────────────────────────────────────────────────────────────

    boss_t1: { tipo:'boss', tier:1, phase:1, nome:'Rainha Sanguessuga', sub:'Boss — Floresta Sombria',  naipe:null, atq:6,  def:10, inc:-2, pvs:200, skills:['b1_drn','b1_enx'],                       passivas:[], onDeath:'spawn_crias', spawn:{ id:'cria_t1', count:3 } },
    boss_t2: { tipo:'boss', tier:2, phase:2, nome:'Yeti Glacial',       sub:'Boss — Caverna de Gelo',   naipe:'♥', atq:10, def:13, inc:3,  pvs:380, skills:['b2_pan','b2_arr'],                        passivas:[] },
    boss_t3: { tipo:'boss', tier:3, phase:3, nome:"Vyr'Thas",           sub:'Anomalia Cósmica — Templo Arcano', naipe:'♦', atq:7, def:8, inc:7, pvs:300, skills:['b3_ana','b3_bom','b3_cam','b3_tel'],   passivas:[] },

    // ── Boss spawn — template invocado pela Rainha Sanguessuga ──────────────

    cria_t1: { tipo:'boss_spawn', nome:'Cria de Sanguessuga', sub:'Cria — invocada pela Rainha', naipe:null, atq:6, def:5, inc:-2, pvs:50, skills:['b1_drn'], passivas:[] },
  };

  // ══════════════════════════════════════════════════════════════════════════
  // API
  // ══════════════════════════════════════════════════════════════════════════

  // Retorna o inimigo no formato pronto pra COMBAT.init — habilidades resolvidas
  // do registro SKILLS, com _id já marcado pro registry de efeitos/cooldowns.
  function get(id) {
    const m = DATA[id];
    if (!m) return null;
    return {
      ...m,
      id,
      habilidades: (m.skills || []).map(skillId => {
        const tpl = SKILLS[skillId];
        if (!tpl) return null;
        return { ...tpl, _id: 'enemy:' + skillId };
      }).filter(Boolean),
    };
  }

  // Lista ids por tipo e tier (opcional).
  function listar(tipo, tier) {
    return Object.entries(DATA)
      .filter(([_, m]) => m.tipo === tipo && (tier == null || m.tier === tier))
      .map(([id]) => id);
  }

  return { DATA, SKILLS, get, listar };

})();
