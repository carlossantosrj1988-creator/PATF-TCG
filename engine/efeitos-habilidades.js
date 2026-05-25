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

  // ══════════════════════════════════════════════════════════════════════════
  // IMPLEMENTAÇÕES — Espadas
  // ══════════════════════════════════════════════════════════════════════════

  // Golpe de Abate (esp_h1_2)
  // Crítico Alto: 50% de chance de dobrar o dano APÓS a defesa (×2 no dano final líquido).
  registrar('esp_h1_2', 'modificar_dano_final', (c, ev) => {
    if (Math.random() < 0.5) ev.multiplicador = 2;
  });

  // Corte Metamorphosis (esp_h1_5)
  // Ao causar dano, cura 2 de vida do atacante.
  registrar('esp_h1_5', 'ao_causar_dano', (c, ev) => {
    if (!ev.causouDano) return;
    c.hp = Math.min(c.pvs ?? c.hp, c.hp + 2);
  });

  // Redemoinho (esp_h2_2)
  // Ao usar: ativa estado de contra-ataque no personagem.
  // Dura até o início do próximo turno (duracao 2 — decrementado em iniciarRodada).
  registrar('esp_h2_2', 'ao_usar', (c) => {
    c.efeitos = c.efeitos.filter(e => e.tipo !== 'redemoinho_ativo');
    c.efeitos.push({ tipo: 'redemoinho_ativo', duracao: 2, _origem: 'redemoinho' });
  });

  // Atropelar (esp_h3_1)
  // Multiplica o poder por Exposto (×2), Enfraquecido (×2) ou ambos (×4).
  registrar('esp_h3_1', 'modificar_poder', (c, ev) => {
    if (!ev.alvo) return;
    const temExposto     = ev.alvo.efeitos.some(e => e._origem === 'exposto'     && e.duracao > 0);
    const temEnfraquecido = ev.alvo.efeitos.some(e => e._origem === 'enfraquecido' && e.duracao > 0);
    let mult = 1;
    if (temExposto)      mult *= 2;
    if (temEnfraquecido) mult *= 2;
    if (mult > 1) ev.bonusPoder += ev.poderBase * (mult - 1);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // IMPLEMENTAÇÕES — Ouros
  // ══════════════════════════════════════════════════════════════════════════

  // Barragem (our_h1_1)
  // Ao passar a rodada: ganha 1 carga (_barragemCargas, máx 3).
  // Ao usar: gasta 1 carga e sinaliza ação extra de Barragem (_barragemAcaoExtra).
  registrar('our_h1_1', 'ao_passar_rodada', (c) => {
    c._barragemCargas = Math.min((c._barragemCargas ?? 0) + 1, 3);
  });
  registrar('our_h1_1', 'ao_usar', (c) => {
    if ((c._barragemCargas ?? 0) > 0) {
      c._barragemCargas -= 1;
      c._barragemAcaoExtra = true;
    }
  });

  // Feixe de Plasma (our_h1_2)
  // Ignora armadura do alvo: sinaliza evPoder.ignoraArmadura.
  registrar('our_h1_2', 'modificar_poder', (c, ev) => {
    ev.ignoraArmadura = true;
  });

  // Máscara de Faces (our_h2_4)
  // Alterna entre modo Feliz e Triste a cada uso. Aplica stat buff/debuff por 1 rodada.
  registrar('our_h2_4', 'ao_usar', (c) => {
    c._mascaraFeliz = !c._mascaraFeliz;
    const aliados  = (typeof COMBAT !== 'undefined' && COMBAT.estado)
      ? COMBAT.estado.combatentes.filter(x => x.lado === c.lado && x !== c && x.hp > 0)
      : [];
    const inimigos = (typeof COMBAT !== 'undefined' && COMBAT.estado)
      ? COMBAT.estado.combatentes.filter(x => x.lado !== c.lado && x.hp > 0)
      : [];
    if (c._mascaraFeliz) {
      for (const a of aliados) {
        a.efeitos.push({ tipo: 'buff_atq', valor: 1, duracao: 2, duracaoOriginal: 2, _origem: 'masc_feliz' });
        PASSIVAS.recalcularStats(a);
      }
    } else {
      for (const a of inimigos) {
        a.efeitos.push({ tipo: 'debuff_atq', valor: 1, duracao: 2, duracaoOriginal: 2, _origem: 'masc_triste' });
        PASSIVAS.recalcularStats(a);
      }
    }
    c.efeitos.push({ tipo: 'masc_ativa', duracao: 2, duracaoOriginal: 2, _origem: 'mascara_faces' });
  });

  // Elixir da Cura (our_h3_1)
  // Cura todos os aliados no array ev.alvos em (ATQ + 1) de vida.
  registrar('our_h3_1', 'ao_usar', (c, ev) => {
    for (const a of (ev.alvos ?? [])) {
      if (!a || a.hp <= 0) continue;
      a.hp = Math.min(a.pvs ?? a.hp, a.hp + (c.atq ?? 0) + 1);
      PASSIVAS.recalcularStats(a);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // IMPLEMENTAÇÕES — Paus
  // ══════════════════════════════════════════════════════════════════════════

  // Controle Mental (pau_h2_1)
  // Aplica Encantado diretamente no alvo (skill é efeitoPuro, tags não disparam automaticamente).
  registrar('pau_h2_1', 'ao_usar', (c, ev) => {
    const alvo = (ev.alvos ?? [])[0];
    if (alvo) EFEITOS.aplicar('encantado', alvo, c);
  });

  // Prestidigitação (pau_h3_1)
  // Aplica Imagem Espelhada em cada aliado do array ev.alvos.
  registrar('pau_h3_1', 'ao_usar', (c, ev) => {
    for (const a of (ev.alvos ?? [])) {
      if (!a || a.hp <= 0) continue;
      EFEITOS.aplicar('imagem_espelhada', a, c);
    }
  });

  return { disparar };

})();
