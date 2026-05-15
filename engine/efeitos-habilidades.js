// engine/efeitos-habilidades.js
// Runtime dos efeitos INTRÍNSECOS de cada habilidade. Mesma arquitetura
// das passivas, mas o registry é indexado pelo id da habilidade (chave
// de HABILIDADES_DATA ou 'basico:<arquetipo>').
//
// Cada handler é registrado com:
//   habId     — id da habilidade (ex: 'cop_h1_2', 'basico:vigor')
//   gatilho   — 'ao_usar' | 'modificar_poder' | 'ao_causar_dano' | ...
//   fn        — função (combatente, evento) => void
//
// O combat.js chama EFEITOS_HABILIDADES.disparar(hab, gatilho, ...) nos
// pontos certos do fluxo de uso (resolverAcao).

const EFEITOS_HABILIDADES = (() => {

  const _registry = new Map();  // habId → array de { gatilho, fn }

  function registrar(habId, gatilho, fn) {
    if (!_registry.has(habId)) _registry.set(habId, []);
    _registry.get(habId).push({ gatilho, fn });
  }

  function disparar(hab, gatilho, combatente, evento = {}) {
    if (!hab || !hab._id) return;
    const handlers = _registry.get(hab._id);
    if (!handlers) return;
    for (const h of handlers) {
      if (h.gatilho === gatilho) h.fn(combatente, evento);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // IMPLEMENTAÇÕES — Copas
  // ══════════════════════════════════════════════════════════════════════════

  // Golpe Amplo (cop_h1_2)
  // Ao causar dano: ganha 1 DEF até o início da próxima rodada. Não acumulativo.
  registrar('cop_h1_2', 'ao_causar_dano', (c, ev) => {
    if (!ev.causouDano) return;
    if (c.efeitos.some(e => e._origem === 'golpe_amplo')) return;  // não acumulativo
    c.efeitos.push({ tipo: 'buff_def', valor: 1, duracao: 1, _origem: 'golpe_amplo' });
    PASSIVAS.recalcularStats(c);
  });

  // Ódio (cop_h3_1)
  // Ao usar: marca o personagem com 'odio_bonus'. Combat.js incrementa a
  // valor cada vez que o personagem sofre dano e gasta como bônus de
  // poder na próxima habilidade de dano. Dura 1 rodada.
  registrar('cop_h3_1', 'ao_usar', (c) => {
    const existente = c.efeitos.find(e => e.tipo === 'odio_bonus');
    if (existente) {
      existente.duracao = 1;        // renova
    } else {
      c.efeitos.push({ tipo: 'odio_bonus', valor: 0, duracao: 1 });
    }
  });

  // Espírito do Urso Polar (cop_h3_2)
  // Modifica o poder no momento do uso: +3 por debuff ativo no alvo.
  registrar('cop_h3_2', 'modificar_poder', (c, ev) => {
    if (!ev.alvo) return;
    const debuffs = (ev.alvo.efeitos ?? []).filter(e =>
      e.duracao > 0 && typeof e.tipo === 'string' && e.tipo.startsWith('debuff_')
    ).length;
    ev.bonusPoder += 3 * debuffs;
  });

  return { disparar };

})();
