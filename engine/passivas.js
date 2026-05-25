// engine/passivas.js
// Runtime das passivas — registry de funções por gatilho, dispatcher e
// helper de recálculo de stats. Os DADOS das passivas vivem em
// engine/habilidades.js (PASSIVAS_DATA); aqui mora o COMPORTAMENTO.
//
// Cada passiva é registrada com:
//   id        — mesma chave de PASSIVAS_DATA (ex: 'cop_p2')
//   gatilho   — evento que dispara ('ao_passar_rodada', 'recalc_stats',
//                'aliado_atacado', 'ao_causar_dano', 'ao_sofrer_dano', ...)
//   fn        — função (combatente, evento) => void
//
// O motor (combat.js) chama PASSIVAS.disparar(gatilho, combatente, evento)
// nos pontos certos. O dispatcher percorre combatente.passivas (ids) e
// invoca os handlers cujo gatilho casa.

const PASSIVAS = (() => {

  const _registry = new Map();  // id → { gatilho, fn }

  // ══════════════════════════════════════════════════════════════════════════
  // API
  // ══════════════════════════════════════════════════════════════════════════

  function registrar(id, gatilho, fn) {
    _registry.set(id, { gatilho, fn });
  }

  function disparar(gatilho, combatente, evento = {}) {
    if (!combatente || !Array.isArray(combatente.passivas)) return;
    for (const id of combatente.passivas) {
      if (!id) continue;
      const entry = _registry.get(id);
      if (entry && entry.gatilho === gatilho) {
        entry.fn(combatente, evento);
      }
    }
  }

  // Reseta stats para os valores base, aplica modificadores de buffs/debuffs
  // persistentes em c.efeitos, e roda as passivas de gatilho 'recalc_stats'.
  // Chamado no init e quando algo afeta o cálculo (mudança de HP, fim de
  // buff, etc).
  function recalcularStats(combatente) {
    if (!combatente) return;
    combatente.atq = combatente.atqBase;
    combatente.def = combatente.defBase;
    combatente.inc = combatente.incBase;

    // Buffs/debuffs persistentes em c.efeitos modificam stats enquanto ativos
    for (const e of combatente.efeitos ?? []) {
      if (!e || (e.duracao !== undefined && e.duracao <= 0)) continue;
      if (e.tipo === 'buff_atq')   combatente.atq += e.valor;
      if (e.tipo === 'debuff_atq') combatente.atq -= e.valor;
      if (e.tipo === 'buff_def')   combatente.def += e.valor;
      if (e.tipo === 'debuff_def') combatente.def -= e.valor;
    }

    // hearts_adv (vantagem de naipe ♥ vs ♣): dobra ATQ e DEF base
    const heartsAdv = (combatente.efeitos ?? []).find(e => e.tipo === 'hearts_adv' && (e.duracao ?? 1) > 0);
    if (heartsAdv) {
      combatente.atq = combatente.atqBase * 2;
      if (combatente.defBase >= 0) combatente.def = combatente.defBase * 2;
    }

    disparar('recalc_stats', combatente);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // IMPLEMENTAÇÕES — Copas
  // ══════════════════════════════════════════════════════════════════════════

  // cop_p1 — Acúmulo de Poder
  // Ao passar a rodada, ganha 1 carga (máx 2). O gasto das cargas pela
  // próxima habilidade de dano é Fase C.
  registrar('cop_p1', 'ao_passar_rodada', (c) => {
    c._acumulo = Math.min((c._acumulo ?? 0) + 1, 2);
  });

  // cop_p2 — Defender os Fracos
  // Quando um aliado é atacado por habilidade de alvo único que não seja
  // Rápida nem Furtiva, intercepta — vira o defensor.
  // Aguarda Fase C disparar 'aliado_atacado' no momento certo.
  registrar('cop_p2', 'aliado_atacado', (c, ev) => {
    if (ev.alvo === 'unico' && ev.acao !== 'R' && ev.acao !== 'F') {
      ev.defensor = c;
    }
  });

  // cop_p3 — Sou Invencível
  // +1 DEF a cada 10% de vida perdida. Roda em 'recalc_stats', somando
  // sobre o defBase já resetado.
  registrar('cop_p3', 'recalc_stats', (c) => {
    if (!c.pvs) return;
    const pctPerdido = 1 - (c.hp / c.pvs);
    const bonus = Math.max(0, Math.floor(pctPerdido * 10));
    c.def += bonus;
  });

  // ══════════════════════════════════════════════════════════════════════════
  // IMPLEMENTAÇÕES — Espadas
  // ══════════════════════════════════════════════════════════════════════════

  // esp_p1 — Resiliência
  // Quando um aliado é nocauteado, recupera 20% do PVS máximo.
  registrar('esp_p1', 'aliado_nocauteado', (c) => {
    if (!c.pvs) return;
    const cura = Math.floor(c.pvs * 0.2);
    c.hp = Math.min(c.pvs, c.hp + cura);
  });

  // esp_p2 — Novo Level
  // Ao nocautear um inimigo, compra 1 carta extra e ganha rodada extra.
  registrar('esp_p2', 'ao_nocautear_inimigo', (c) => {
    COMBAT.comprarCarta(c, 1);
    if (!c.acaoExtra && !c.efeitos.some(e => e.tipo === 'rodada_extra')) {
      c.efeitos.push({ tipo: 'rodada_extra', duracao: null });
    }
  });

  // esp_p3 — Gladiador
  // Abaixo de 20% de vida: +2 ATQ e +2 DEF permanentes (reavalia a cada recalc).
  registrar('esp_p3', 'recalc_stats', (c) => {
    if (!c.pvs) return;
    if ((c.hp / c.pvs) < 0.2) {
      c.atq += 2;
      c.def += 2;
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // IMPLEMENTAÇÕES — Ouros
  // ══════════════════════════════════════════════════════════════════════════

  // our_p1 — Concentração de Energia
  // Ao passar a rodada: ganha 1 carga (_energiaCargas, sem limite fixo) e causa
  // 1 de dano puro a todos os inimigos.
  // O gasto das cargas ao usar habilidade é feito via modificar_poder em efeitos-habilidades
  // — ou, alternativamente, interceptado em battle.js antes de resolverAcao.
  registrar('our_p1', 'ao_passar_rodada', (c) => {
    c._energiaCargas = (c._energiaCargas ?? 0) + 1;
    const estado = (typeof COMBAT !== 'undefined') ? COMBAT.estado : null;
    if (!estado) return;
    for (const inimigo of estado.combatentes) {
      if (inimigo.lado !== c.lado && inimigo.hp > 0) {
        inimigo.hp = Math.max(0, inimigo.hp - 1);
        recalcularStats(inimigo);
      }
    }
  });

  // our_p2 — Ação Duplicada
  // A cada turno (tick_passivas): 50% de chance de ganhar ação extra Rápida.
  registrar('our_p2', 'tick_passivas', (c) => {
    if (c.acaoExtra) return;   // já usou ação extra neste turno
    if (c.efeitos.some(e => e.tipo === 'acao_rapida')) return;  // já tem pendente
    if (Math.random() < 0.5) {
      c.efeitos.push({ tipo: 'acao_rapida', duracao: null });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // IMPLEMENTAÇÕES — Paus
  // ══════════════════════════════════════════════════════════════════════════

  // pau_p1 — Sorte Grande
  // Início de rodada (tick_passivas): 50% de chance de comprar 1 carta extra.
  registrar('pau_p1', 'tick_passivas', (c) => {
    if (Math.random() < 0.5) {
      COMBAT.comprarCarta(c, 1);
    }
  });

  // pau_p2 — Protetor Instintivo
  // Quando aliado é atacado: 50% de chance de interceptar ataque único normal,
  // 25% de interceptar se Rápido ou Furtivo.
  registrar('pau_p2', 'aliado_atacado', (c, ev) => {
    if (ev.alvo !== 'unico') return;
    const chance = (ev.acao === 'R' || ev.acao === 'F') ? 0.25 : 0.5;
    if (Math.random() < chance) {
      ev.defensor = c;
    }
  });

  // pau_p3 — Inspirar Coragem
  // tick_passivas: renova buff_atq/buff_def de duração 2 em cada aliado vivo.
  // O buff expira se o portador morrer (sem mais ticks). recalcularStats lê
  // buff_atq/buff_def automaticamente — sem modificar stats de terceiros diretamente.
  registrar('pau_p3', 'tick_passivas', (c) => {
    if (c.hp <= 0) return;
    const estado = (typeof COMBAT !== 'undefined') ? COMBAT.estado : null;
    if (!estado) return;
    const origem = `inspirar_${c.id}`;
    for (const aliado of estado.combatentes) {
      if (aliado.lado !== c.lado || aliado === c || aliado.hp <= 0) continue;
      const existentes = aliado.efeitos.filter(e => e._origem === origem);
      if (existentes.length > 0) {
        for (const b of existentes) b.duracao = 2;
      } else {
        aliado.efeitos.push({ tipo: 'buff_atq', valor: 1, duracao: 2, duracaoOriginal: 2, _origem: origem });
        aliado.efeitos.push({ tipo: 'buff_def', valor: 1, duracao: 2, duracaoOriginal: 2, _origem: origem });
        recalcularStats(aliado);
      }
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // IMPLEMENTAÇÕES — Inimigos do Tutorial
  // ══════════════════════════════════════════════════════════════════════════

  // esporos_casulo — Passiva do Casulo do Butter
  // Ao sofrer dano, aplica 1 stack de veneno no atacante.
  registrar('esporos_casulo', 'ao_sofrer_dano', (c, ev) => {
    if (!ev.atacante || ev.danoReal <= 0) return;
    EFEITOS.aplicar('veneno', ev.atacante, c);
  });

  return { disparar, recalcularStats };

})();
