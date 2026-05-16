// engine/efeitos.js
// Runtime dos efeitos nomeados — registry de funções `aplicar` por id,
// dispatcher e UI de tooltip. Os DADOS dos efeitos vivem em
// engine/efeitos-catalogo.js (EFEITOS_DATA); aqui mora o COMPORTAMENTO.
//
// Habilidades declaram `tags` (ex: tags:['exposto']). Quando uma habilidade
// causa dano, combat.js (resolverAcao) chama EFEITOS.aplicar(tag, alvo, atacante)
// pra cada tag — e cada efeito sabe como se manifestar: push de entrada(s)
// em c.efeitos com tipo/valor/duracao certos. Os módulos existentes
// (recalcularStats, _aplicarDoT, etapa3) já leem c.efeitos pelo `tipo`.
//
// API:
//   registrar(id, aplicar)   — vincula a função aplicar à entrada do catálogo.
//                              Lança aviso se id não está em EFEITOS_DATA.
//   aplicar(id, alvo, atac)  — dispara o efeito.
//   get(id)                  — devolve { nome, categoria, descricao, aplicar }.
//   destacar(texto)          — wrappa nomes de efeitos conhecidos em <span>.
//
// Renovação: se o efeito já está ativo, renova duração; não empilha nova entrada
// e não re-aplica stat (que já está contado em c.efeitos).

const EFEITOS = (() => {

  const _aplicadores = new Map();  // id → fn(alvo, atacante, opts)

  function registrar(id, aplicar) {
    if (!EFEITOS_DATA[id]) {
      console.warn(`[EFEITOS] registrando '${id}' sem entrada no catálogo`);
    }
    _aplicadores.set(id, aplicar);
  }

  function aplicar(id, alvo, atacante, opts) {
    const fn = _aplicadores.get(id);
    if (!fn || !alvo) return false;
    fn(alvo, atacante, opts ?? {});
    return true;
  }

  function get(id) {
    const data = EFEITOS_DATA[id];
    if (!data) return null;
    return { ...data, aplicar: _aplicadores.get(id) ?? null };
  }

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
  // IMPLEMENTAÇÕES — cada efeito do catálogo recebe seu aplicar aqui
  // ══════════════════════════════════════════════════════════════════════════

  // ── Amaciado ──────────────────────────────────────────────────────────────
  // Marca; habilidades de Corte contra o alvo recebem poder dobrado.
  // O dobramento acontece em combat.js resolverAcao (check pela presença do efeito).
  registrar('amaciado', (alvo) => {
    _renovarOuCriar(alvo, 'amaciado', () => {
      alvo.efeitos.push({
        tipo: 'amaciado', duracao: 2, duracaoOriginal: 2, _origem: 'amaciado',
      });
    });
  });

  // ── Exposto ───────────────────────────────────────────────────────────────
  // -50% da DEF base do alvo. Aplica via debuff_def em c.efeitos —
  // recalcularStats já lê esse tipo automaticamente.
  registrar('exposto', (alvo) => {
    const renovou = _renovarOuCriar(alvo, 'exposto', () => {
      const reducao = Math.floor((alvo.defBase ?? alvo.def ?? 0) * 0.5);
      alvo.efeitos.push({
        tipo: 'debuff_def', valor: reducao, duracao: 2, duracaoOriginal: 2,
        _origem: 'exposto',
      });
    });
    if (!renovou) PASSIVAS.recalcularStats(alvo);
  });

  // ── Queimadura ────────────────────────────────────────────────────────────
  // DoT: dano por turno (gatilho 'inicio_rodada' — _aplicarDoT já trata) +
  // -1 DEF persistente enquanto durar.
  registrar('queimadura', (alvo) => {
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
  });

  // ── Resfriamento ──────────────────────────────────────────────────────────
  // DoT + -1 ATQ persistente.
  registrar('resfriamento', (alvo) => {
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
    for (const id in EFEITOS_DATA) {
      const ef = EFEITOS_DATA[id];
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
    const ef = EFEITOS_DATA[id];
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
