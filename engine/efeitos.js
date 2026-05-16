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
    nome:       'Amaciado',
    categoria:  'debuff_marca',
    descricao:  'Habilidades de Corte recebidas têm o poder dobrado por 2 turnos.',
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
    nome:       'Exposto',
    categoria:  'debuff_stat',
    descricao:  'DEF base do alvo reduzida em 50% por 2 turnos.',
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
    nome:       'Queimadura',
    categoria:  'debuff_dot',
    descricao:  '10 de dano por turno + -1 DEF por 2 turnos.',
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
    nome:       'Resfriamento',
    categoria:  'debuff_dot',
    descricao:  '10 de dano por turno + -1 ATQ por 2 turnos.',
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

  // ══════════════════════════════════════════════════════════════════════════
  // UI — destaque clicável de tags nas descrições
  // ══════════════════════════════════════════════════════════════════════════

  // Recebe um texto qualquer (descricao de habilidade, passiva, etc.) e
  // devolve HTML com cada nome de efeito conhecido envolvido num <span>
  // clicável. Use em qualquer lugar que renderize descrição.
  function destacar(texto) {
    if (!texto) return '';
    let r = String(texto);
    for (const [id, ef] of _registry) {
      if (!ef.nome) continue;
      const escaped = ef.nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`\\b${escaped}\\b`, 'g');
      r = r.replace(re, `<span class="efeito-tag" data-id="${id}">${ef.nome}</span>`);
    }
    return r;
  }

  // ── Tooltip global (única instância, anexada ao body) ─────────────────────

  let _tooltipEl = null;

  function _fecharTooltip() {
    if (_tooltipEl) { _tooltipEl.remove(); _tooltipEl = null; }
  }

  function _abrirTooltip(tagEl) {
    _fecharTooltip();
    const id = tagEl.dataset.id;
    const ef = _registry.get(id);
    if (!ef) return;
    const tip = document.createElement('div');
    tip.className = 'efeito-tooltip';
    tip.innerHTML = `
      <button class="efeito-tooltip-close" aria-label="Fechar">×</button>
      <div class="efeito-tooltip-nome">${ef.nome}</div>
      <div class="efeito-tooltip-desc">${ef.descricao}</div>
    `;
    document.body.appendChild(tip);
    // Posiciona próximo ao tag (fixed = viewport-relative, alinha com transform do canvas)
    const rect = tagEl.getBoundingClientRect();
    const w    = tip.offsetWidth;
    const h    = tip.offsetHeight;
    let left   = rect.left;
    let top    = rect.bottom + 6;
    // Mantém dentro do viewport
    if (left + w > window.innerWidth - 8)  left = window.innerWidth - w - 8;
    if (top  + h > window.innerHeight - 8) top  = rect.top - h - 6;
    if (left < 8) left = 8;
    if (top  < 8) top  = 8;
    tip.style.left = left + 'px';
    tip.style.top  = top  + 'px';
    _tooltipEl = tip;
  }

  // Listener global — uma vez na vida da página.
  document.addEventListener('click', (e) => {
    const tag = e.target.closest('.efeito-tag');
    if (tag) { _abrirTooltip(tag); return; }
    if (e.target.closest('.efeito-tooltip-close')) { _fecharTooltip(); return; }
    if (_tooltipEl && !_tooltipEl.contains(e.target)) _fecharTooltip();
  });

  return { registrar, aplicar, get, destacar };

})();
