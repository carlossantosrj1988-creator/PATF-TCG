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
    c._rodadaExtraPending = true;
  });

  // esp_p3 — Gladiadora
  // Abaixo de 20% de vida: +2 ATQ e +2 DEF permanentes (reavalia a cada recalc).
  registrar('esp_p3', 'recalc_stats', (c) => {
    if (!c.pvs) return;
    if ((c.hp / c.pvs) < 0.2) {
      c.atq += 2;
      c.def += 2;
    }
  });

  return { disparar, recalcularStats };

})();
