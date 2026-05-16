// engine/efeitos.js
// Registry de buffs/debuffs nomeados (Amaciado, Exposto, Queimadura, etc.).
//
// Habilidades declaram `tags` (ex: tags:['exposto']). Quando uma habilidade
// causa dano, combat.js (resolverAcao) chama EFEITOS.aplicar(tag, alvo, atacante)
// pra cada tag — e cada efeito sabe como se manifestar: push de entrada(s)
// em c.efeitos com tipo/valor/duracao certos. Os módulos existentes
// (recalcularStats, _aplicarDoT, etapa3) já leem c.efeitos pelo `tipo`.
//
// Cada efeito implementa:
//   categoria   : 'debuff_dot' | 'debuff_stat' | 'debuff_marca' | 'buff_*' | ...
//   descricao   : texto humano (UI futura)
//   aplicar(alvo, atacante, opts) : empilha entrada(s) em alvo.efeitos OU renova
//
// Renovação: se o efeito já está ativo, renova duração; não empilha nova entrada
// e não re-aplica stat (que já está contado em c.efeitos).

const EFEITOS = (() => {

  const _registry = new Map();  // id → { categoria, descricao, aplicar }

  function registrar(id, def) { _registry.set(id, def); }

  function aplicar(id, alvo, atacante, opts) {
    const ef = _registry.get(id);
    if (!ef || !alvo) return false;
    ef.aplicar(alvo, atacante, opts ?? {});
    return true;
  }

  function get(id) { return _registry.get(id); }

  // Helper: renova duração se o efeito já existe no alvo (mesmo _origem);
  // senão chama criar() pra empilhar a entrada nova. Retorna true se renovou.
  function _renovarOuCriar(alvo, origem, criar) {
    const ja = alvo.efeitos.find(e => e._origem === origem && (e.duracao ?? 0) > 0);
    if (ja) {
      for (const e of alvo.efeitos) {
        if (e._origem === origem) e.duracao = e.duracaoOriginal ?? e.duracao;
      }
      return true;
    }
    criar();
    return false;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // IMPLEMENTAÇÕES — efeitos iniciais (A.1)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Amaciado ──────────────────────────────────────────────────────────────
  // Marca; habilidades de Corte contra o alvo recebem poder dobrado.
  // 2 turnos, renovável.
  // O dobramento acontece em combat.js resolverAcao (check pela presença do efeito).
  registrar('amaciado', {
    categoria: 'debuff_marca',
    descricao: 'Habilidades de Corte recebidas têm o poder dobrado por 2 turnos.',
    aplicar(alvo) {
      _renovarOuCriar(alvo, 'amaciado', () => {
        alvo.efeitos.push({
          tipo: 'amaciado', duracao: 2, duracaoOriginal: 2, _origem: 'amaciado',
        });
      });
    },
  });

  // ── Exposto ───────────────────────────────────────────────────────────────
  // -50% da DEF base do alvo por 2 turnos. Aplica via debuff_def em c.efeitos —
  // recalcularStats já lê esse tipo automaticamente.
  registrar('exposto', {
    categoria: 'debuff_stat',
    descricao: 'DEF base do alvo reduzida em 50% por 2 turnos.',
    aplicar(alvo) {
      const renovou = _renovarOuCriar(alvo, 'exposto', () => {
        const reducao = Math.floor((alvo.defBase ?? alvo.def ?? 0) * 0.5);
        alvo.efeitos.push({
          tipo: 'debuff_def', valor: reducao, duracao: 2, duracaoOriginal: 2,
          _origem: 'exposto',
        });
      });
      if (!renovou) PASSIVAS.recalcularStats(alvo);
    },
  });

  // ── Queimadura ────────────────────────────────────────────────────────────
  // DoT: 10 dano por turno (gatilho 'inicio_rodada' — _aplicarDoT já trata) +
  // -1 DEF persistente enquanto durar. 2 turnos, renovável.
  registrar('queimadura', {
    categoria: 'debuff_dot',
    descricao: '10 de dano por turno + -1 DEF por 2 turnos.',
    aplicar(alvo) {
      const renovou = _renovarOuCriar(alvo, 'queimadura', () => {
        alvo.efeitos.push({
          tipo: 'dot', valor: 10, gatilho: 'inicio_rodada',
          duracao: 2, duracaoOriginal: 2, _origem: 'queimadura',
        });
        alvo.efeitos.push({
          tipo: 'debuff_def', valor: 1, duracao: 2, duracaoOriginal: 2,
          _origem: 'queimadura',
        });
      });
      if (!renovou) PASSIVAS.recalcularStats(alvo);
    },
  });

  // ── Resfriamento ──────────────────────────────────────────────────────────
  // DoT: 10 dano por turno + -1 ATQ persistente. 2 turnos, renovável.
  registrar('resfriamento', {
    categoria: 'debuff_dot',
    descricao: '10 de dano por turno + -1 ATQ por 2 turnos.',
    aplicar(alvo) {
      const renovou = _renovarOuCriar(alvo, 'resfriamento', () => {
        alvo.efeitos.push({
          tipo: 'dot', valor: 10, gatilho: 'inicio_rodada',
          duracao: 2, duracaoOriginal: 2, _origem: 'resfriamento',
        });
        alvo.efeitos.push({
          tipo: 'debuff_atq', valor: 1, duracao: 2, duracaoOriginal: 2,
          _origem: 'resfriamento',
        });
      });
      if (!renovou) PASSIVAS.recalcularStats(alvo);
    },
  });

  return { registrar, aplicar, get };

})();
