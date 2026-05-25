// screens/battle/battle.js
// Tela de batalha — esqueleto funcional: layout, iniciativa, turno básico.
// Depende de: engine/deck.js, engine/damage.js, engine/combat.js, chars/chars.js
//
// Seções:
//   INIMIGOS DE TESTE   — templates placeholder por etapa do tutorial
//   ESTADO              — variáveis privadas da tela
//   INIT                — init(), distribuição de mão, alocação de iniciativa
//   RENDER              — _renderizar()
//   TOPBAR              — _criarTopbar()
//   CAMPO               — _criarCampo(), _criarCharSlot()
//   PAINEL              — _criarPainel()
//   TURNO               — _passarRodada(), _turnoInimigo(), _vencer()
//   API PÚBLICA

const BATTLE = (() => {

  // ══════════════════════════════════════════════════════════════════════════
  // VISUAL POR NAIPE
  // ══════════════════════════════════════════════════════════════════════════

  // Gradiente e borda por naipe — aplicados inline nos slots do campo e na topbar
  const GRAD_NAIPE = {
    '♥': { bg: 'linear-gradient(160deg, #4a0808, #180303)', borda: '#6b000055' },
    '♣': { bg: 'linear-gradient(160deg, #083a08, #030f03)', borda: '#1a5c1a55' },
    '♦': { bg: 'linear-gradient(160deg, #3a2800, #120e00)', borda: '#7a5c0055' },
    '♠': { bg: 'linear-gradient(160deg, #080e28, #030510)', borda: '#1a2a4a55' },
  };
  const GRAD_NEUTRO = { bg: 'linear-gradient(160deg, #1e1e2e, #0d0d18)', borda: '#ffffff18' };

  // ══════════════════════════════════════════════════════════════════════════
  // ESTADO
  // ══════════════════════════════════════════════════════════════════════════

  let _onVitoria         = null;
  let _onDerrota         = null;
  let _pontos            = 0;   // pontos da etapa — exibido na tela de fim
  let _aguardando        = false;  // evita double-fire no turno do inimigo
  let _cartasAdicionais  = [];     // cartas escolhidas para hits adicionais (null = pular)
  let _hitAdicionalIdx   = 0;      // quantos hits adicionais já foram configurados
  let _alvosParaExecutar = null;   // alvos guardados enquanto coleta cartas adicionais
  // Estado do painel — máquina de estados do fluxo de uso de habilidade:
  // 'etapa1' → 'sel_habilidade' → 'sel_carta' → 'sel_alvo' (ou auto-resolve)
  let _estadoPainel      = 'etapa1';
  let _passarConfirmando = false;
  let _etapaAtual        = 0;  // índice da etapa atual (usado para detectar boss)
  let _habSel            = null;  // habilidade selecionada no fluxo de uso
  let _cartaSel          = null;  // carta selecionada
  let _cartaSelIdx       = -1;    // índice da carta na mão (pra remover via combat.js)
  let _defesaPendente    = null;  // { atacante, decisao, alvoPlayer, dano, onResolve }
  let _defesaSel         = null;  // { tipo: 'passar' | 'carta', idx? } — dupla confirmação
  let _especialPendente  = null;  // { carta, idx } — carta especial em uso (ex: Q aguardando alvo)
  let _statusPopupChar   = null;  // personagem sendo mostrado no popup de status (live update)
  let _isTutorial        = false; // batalha do tutorial — exibe popups explicativos
  let _tutorialIniVisto  = false; // tutorial de iniciativa já foi mostrado
  let _tutorialBatVisto  = false; // tutorial de batalha já foi mostrado
  let _cenarioBackground = null;  // URL da imagem de fundo do campo (null = gradiente padrão)

  // ── Log de batalha — persiste entre renders ───────────────────────────────
  const _LOG_MAX    = 40;
  const _LOG_VIS    = 6;   // linhas visíveis de uma vez
  const _logEntries = [];  // { msg, tipo }

  function _logUI(msg, tipo = 'info') {
    _logEntries.push({ msg, tipo });
    if (_logEntries.length > _LOG_MAX) _logEntries.shift();
    // Live-update do painel de log se já estiver na tela
    const lista = document.getElementById('battle-log-lista');
    if (lista) _renderizarLog(lista);
  }

  function _renderizarLog(listaEl) {
    listaEl.innerHTML = '';
    const ultimas = _logEntries.slice(-_LOG_VIS);
    for (const e of ultimas) {
      const div = document.createElement('div');
      div.className = `blog-linha ${e.tipo}`;
      div.textContent = e.msg;
      listaEl.appendChild(div);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ANIMAÇÕES — shake/lunge de slot + floats de dano estilo RPG
  // ══════════════════════════════════════════════════════════════════════════

  const _ANIM_DUR = 260; // ms do lunge do atacante antes de resolver dano

  // Adiciona classe de animação ao slot do combatente; remove após duração.
  function _animarSlot(charId, cls, durMs = 550) {
    const slot = document.querySelector(`.battle-char-slot[data-id="${charId}"]`);
    if (!slot) return;
    slot.classList.remove('atacando', 'recebendo-dano');
    void slot.offsetWidth; // força reflow para reiniciar animation
    slot.classList.add(cls);
    setTimeout(() => slot.classList.remove(cls), durMs);
  }

  // Cria texto flutuante de dano/cura/esquiva em posição fixa sobre o slot.
  // Usa position:fixed + body para não ser cortado por overflow:hidden do campo.
  function _floatTexto(charId, texto, tipo = 'dano') {
    const slot = document.querySelector(`.battle-char-slot[data-id="${charId}"]`);
    if (!slot) return;
    const rect = slot.getBoundingClientRect();

    const el = document.createElement('div');
    el.className = `battle-float ${tipo}`;
    el.textContent = texto;
    el.style.left = (rect.left + rect.width / 2) + 'px';
    el.style.top  = (rect.top  + rect.height * 0.15) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  // Flash dourado no sprite/card do atacante quando vantagem de naipe ativa.
  function _flashVantagem(charId) {
    const slot = document.querySelector(`.battle-char-slot[data-id="${charId}"]`);
    if (!slot) return;
    const target = slot.querySelector('.battle-char-sprite') || slot.querySelector('.battle-char-grad');
    if (!target) return;
    target.classList.remove('vantagem-flash');
    void target.offsetWidth;
    target.classList.add('vantagem-flash');
    setTimeout(() => target.classList.remove('vantagem-flash'), 820);
  }

  // ── Ícones canvas de extra (acao_rapida / rodada_extra) ──────────────────────
  // Gera um ícone circular colorido com símbolo centralizado via canvas.
  // Cache por chave para não redesenhar a cada render.
  const _iconeExtraCache = {};
  function _iconeExtraUrl(cor, simbolo) {
    const key = cor + simbolo;
    if (_iconeExtraCache[key]) return _iconeExtraCache[key];
    const SIZE = 22;
    const cv   = document.createElement('canvas');
    cv.width   = SIZE;
    cv.height  = SIZE;
    const ctx  = cv.getContext('2d');
    // Círculo de fundo
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.fillStyle = cor === 'verde' ? '#22aa55' : '#cc3333';
    ctx.fill();
    // Símbolo centralizado
    ctx.font         = '13px serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(simbolo, SIZE / 2, SIZE / 2 + 1);
    _iconeExtraCache[key] = cv.toDataURL();
    return _iconeExtraCache[key];
  }

  function _iconeExtraHtml(cor, simbolo, titulo) {
    const url = _iconeExtraUrl(cor, simbolo);
    return `<img src="${url}" class="bchar-ef-canvas" title="${titulo}" width="18" height="18">`;
  }

  // Gera HTML de ícones de efeitos ativos (buff/debuff) para o slot do campo.
  function _efeitosIconsHtml(c) {
    const _SIM = {
      dot: '🔥', frozen: '❄', stun: '⊗',
      buff_atq: '↑', debuff_atq: '↓',
      buff_def: '▲', debuff_def: '▽',
      rei_atq_bonus: '♛', odio_bonus: '⊕',
      amaciado: '⬇', encantado: '✦',
      hearts_adv: '❤', clubs_furtivo: '🌿',
      imagem_espelhada: '◈', derretar_armadura: '⚗',
      congelado: '❄', radiacao: '☢', estatica: '⚡',
      critico: '💥',
    };

    const partes = [];

    // Efeitos ativos — inclui duracao: null (instantâneos) e duracao > 0 (duração)
    // acao_rapida e rodada_extra são renderizados via canvas abaixo — skip aqui
    for (const e of (c.efeitos ?? [])) {
      if (e.tipo === 'acao_rapida' || e.tipo === 'rodada_extra') continue;
      if (e.duracao !== null && (e.duracao ?? 1) <= 0) continue;
      const cls   = _classeEfeito(e);
      const label = _efeitoLabel(e);
      const sim   = _SIM[e.tipo] ?? '●';
      const durTxt = e.duracao !== null ? ` (${e.duracao}t)` : '';
      partes.push(`<span class="bchar-ef-icon ${cls}" title="${label}${durTxt}">${sim}</span>`);
    }

    // Ícones canvas de estado extra — verde (pendente) ou vermelho (bloqueado)
    const temAcaoRapida   = (c.efeitos ?? []).some(e => e.tipo === 'acao_rapida');
    const temRodadaExtra  = (c.efeitos ?? []).some(e => e.tipo === 'rodada_extra');
    if (temAcaoRapida) {
      partes.push(_iconeExtraHtml('verde', '⚡', 'Ação Rápida disponível'));
    } else if (c._acaoRapidaGasta) {
      partes.push(_iconeExtraHtml('vermelho', '⚡', 'Ação Rápida usada — sem mais extras este turno'));
    }
    if (temRodadaExtra) {
      partes.push(_iconeExtraHtml('verde', '✨', 'Rodada Extra disponível'));
    } else if (c._rodadaExtraGasta) {
      partes.push(_iconeExtraHtml('vermelho', '✨', 'Rodada Extra ativa/gasta — sem mais extras este turno'));
    }

    return partes.join('');
  }

  // ── Cor por tipo de habilidade — banner e glow ───────────────────────────────
  const _TIPO_COR = {
    'Fogo':             '#ff6030', 'Elétrico':         '#60c0ff',
    'Frio':             '#80e8ff', 'Energia':          '#c080ff',
    'Corporal':         '#e8c04c', 'Cortante':         '#e8e8e8',
    'Corte e Contusão': '#e8e8e8', 'Perfurante':       '#c0e860',
    'Distância':        '#80c0ff', 'Invocação':        '#a060e0',
    'Químico':          '#80e880', 'Ácido':            '#80e880',
    'Mágico':           '#e080ff', 'Cura':             '#60e8a0',
    'Encanto':          '#e060c0', 'Melhoria':         '#c0c060',
    'Suporte':          '#c0c060', 'Terrestre':        '#c08040',
    'Concussivo':       '#e8a040', 'Sagrado':          '#ffe080',
    'Psíquico':         '#d080ff', 'Radiação':         '#80ff80',
    'Explosão':         '#ff8844',
  };

  // ── Skill banner — overlay com nome da habilidade ────────────────────────────
  // Retorna Promise; resolve após o banner fechar (~1150ms). Pausa o fluxo.
  function _showSkillBanner(hab, atacante) {
    return new Promise(resolve => {
      const screen = document.getElementById('screen-battle');
      if (!screen) { console.warn('[banner] screen-battle não encontrado'); resolve(); return; }

      const overlay = document.getElementById('battle-skill-banner');
      if (!overlay) { console.warn('[banner] battle-skill-banner não encontrado'); resolve(); return; }

      console.log('[banner] exibindo:', hab.nome);

      const nameEl  = overlay.querySelector('#bsb-name');
      const subEl   = overlay.querySelector('#bsb-sub');
      const content = overlay.querySelector('#bsb-content');
      if (!nameEl || !content) { resolve(); return; }

      const cor = _TIPO_COR[hab.tipo] ?? '#c9a84c';

      nameEl.textContent = hab.nome;
      nameEl.style.color = cor;
      subEl.textContent  = (atacante.nome + (hab.tipo ? ' — ' + hab.tipo : '')).toUpperCase();
      subEl.style.color  = cor;
      overlay.style.setProperty('--bsb-color', cor);

      // Reset
      overlay.style.opacity    = '0';
      content.style.animation  = 'none';
      void content.offsetWidth;

      // Fade in + entrada elástica
      overlay.classList.add('ativo');
      requestAnimationFrame(() => {
        overlay.style.transition = 'opacity 200ms ease';
        overlay.style.opacity    = '1';
        content.style.animation  = 'bsb-in 350ms cubic-bezier(0.2,1.4,0.4,1) forwards';
      });

      // Estrelas ao redor do nome
      const vfx = document.getElementById('battle-vfx-layer');
      if (vfx) {
        const cx = screen.offsetWidth  / 2;
        const cy = screen.offsetHeight / 2;
        const sims = ['★','✦','✧','⭐','⚡','💥'];
        for (let i = 0; i < 8; i++) {
          setTimeout(() => {
            const el = document.createElement('div');
            const angle = (i / 8) * Math.PI * 2;
            const dist  = 80 + Math.random() * 100;
            const sx = cx + Math.cos(angle) * dist;
            const sy = cy + Math.sin(angle) * dist;
            const sz = 16 + Math.random() * 22;
            el.style.cssText = `position:absolute;left:${sx}px;top:${sy}px;font-size:${sz}px;color:${cor};text-shadow:0 0 12px ${cor},0 0 24px ${cor};transform:translate(-50%,-50%);animation:bsb-star 700ms ease forwards;pointer-events:none;z-index:9997`;
            el.textContent = sims[Math.floor(Math.random() * sims.length)];
            vfx.appendChild(el);
            setTimeout(() => el.remove(), 800);
          }, i * 40 + 100);
        }
        // Raios horizontais
        for (let r = 0; r < 3; r++) {
          setTimeout(() => {
            const el = document.createElement('div');
            const ry = cy + (r - 1) * 30;
            const w  = 60 + Math.random() * 120;
            const side = Math.random() > 0.5 ? 1 : -1;
            const rx = cx + side * (150 + Math.random() * 100);
            el.style.cssText = `position:absolute;left:${rx}px;top:${ry}px;width:${w}px;height:3px;background:linear-gradient(90deg,transparent,${cor},transparent);box-shadow:0 0 8px ${cor};transform:translate(-50%,-50%);animation:bsb-ray 500ms ease forwards;pointer-events:none;z-index:9997`;
            vfx.appendChild(el);
            setTimeout(() => el.remove(), 600);
          }, r * 80 + 50);
        }
      }

      // Hold 900ms → fade out 250ms → resolve
      setTimeout(() => {
        content.style.animation  = 'bsb-out 250ms ease forwards';
        overlay.style.transition = 'opacity 250ms ease';
        overlay.style.opacity    = '0';
        setTimeout(() => {
          overlay.classList.remove('ativo');
          overlay.style.opacity = '';
          resolve();
        }, 250);
      }, 900);
    });
  }

  // ── Float de dano com contagem animada e escala por valor ────────────────────
  // Conta de 1 até finalVal em ~900ms; tamanho cresce de 22px (≤5) até 80px (≥50).
  function _floatDanoContado(charId, finalVal, tipo = 'dano') {
    const slot = document.querySelector(`.battle-char-slot[data-id="${charId}"]`);
    if (!slot) return;
    const rect = slot.getBoundingClientRect();

    const COR_TIPO = { 'dano': '#ff4040', 'dano-sinerg': '#66ddff', 'dano-vantagem': '#ffcc33' };
    const color = COR_TIPO[tipo] ?? '#ff4040';

    function _fs(v) {
      const n = Math.abs(Number(v)) || 0;
      if (n <= 5)  return 22;
      if (n >= 50) return 80;
      return Math.round(22 + (n - 5) / 45 * 58);
    }
    function _shadow(fs) {
      const r1 = fs > 40 ? 50 : fs > 22 ? 30 : 16;
      const r2 = fs > 40 ? 90 : fs > 22 ? 60 : 32;
      const r3 = fs > 40 ? 140 : fs > 22 ? 90 : 48;
      return `0 2px 12px rgba(0,0,0,1),0 0 ${r1}px ${color},0 0 ${r2}px ${color}88,0 0 ${r3}px ${color}44`;
    }

    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height * 0.15;

    const f = document.createElement('div');
    const startFs = _fs(Math.min(1, finalVal));
    f.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;color:${color};font-size:${startFs}px;text-shadow:${_shadow(startFs)};font-family:'Cinzel',serif;font-weight:900;pointer-events:none;z-index:9000;transform:translateX(-50%);white-space:nowrap;transition:font-size 0.08s ease`;
    f.textContent = '-' + Math.min(1, finalVal);
    document.body.appendChild(f);

    const TOTAL_MS = 900;
    const isBig    = finalVal >= 20;
    const animName = isBig ? 'float-subir-big' : 'float-subir';
    const animDur  = isBig ? '2.0s' : '1.4s';
    const removMs  = isBig ? 2100 : 1400;

    if (finalVal <= 1) {
      f.style.animation = `${animName} ${animDur} ease forwards`;
      setTimeout(() => f.remove(), removMs);
      return;
    }

    const steps  = finalVal - 1;
    const stepMs = TOTAL_MS / steps;
    let current  = 1;
    const interval = setInterval(() => {
      current++;
      const fs = _fs(current);
      f.style.fontSize   = fs + 'px';
      f.style.textShadow = _shadow(fs);
      f.textContent = '-' + current;
      if (current >= finalVal) {
        clearInterval(interval);
        f.style.animation = `${animName} ${animDur} ease forwards`;
        setTimeout(() => f.remove(), removMs);
      }
    }, stepMs);

    setTimeout(() => { clearInterval(interval); f.remove(); }, TOTAL_MS + removMs + 200);
  }

  // ── Screen shake com flash branco e VFX por nível de dano ────────────────────
  function _screenShake(dmg) {
    const screen = document.getElementById('screen-battle');
    if (!screen) return;
    const flash = document.getElementById('battle-screen-flash');
    const vfx   = document.getElementById('battle-vfx-layer');

    const lvl = dmg >= 50 ? 4 : dmg >= 40 ? 3 : dmg >= 30 ? 2 : 1;
    const cls = lvl >= 3 ? 'battle-shake-insane' : lvl === 2 ? 'battle-shake-heavy' : 'battle-shake-med';
    const dur = lvl >= 3 ? 750 : lvl === 2 ? 600 : 450;

    screen.classList.remove('battle-shake-med', 'battle-shake-heavy', 'battle-shake-insane');
    void screen.offsetWidth;
    screen.classList.add(cls);
    setTimeout(() => screen.classList.remove(cls), dur);
    if (lvl >= 3) {
      setTimeout(() => {
        screen.classList.remove(cls); void screen.offsetWidth; screen.classList.add(cls);
        setTimeout(() => screen.classList.remove(cls), dur);
      }, dur - 100);
    }

    if (flash) {
      const op = lvl === 4 ? 0.55 : lvl === 3 ? 0.38 : lvl === 2 ? 0.22 : 0.12;
      flash.style.transition = 'none';
      flash.style.opacity = op;
      setTimeout(() => {
        flash.style.transition = `opacity ${lvl >= 3 ? '0.6s' : '0.35s'} ease`;
        flash.style.opacity = '0';
      }, 80);
    }

    if (!vfx) return;

    const cx = screen.offsetWidth  / 2;
    const cy = screen.offsetHeight / 2;
    const cors = ['#ff4040','#ff8820','#ffdd00','#ffffff'];
    const cor  = cors[lvl - 1];

    if (lvl >= 2) _spawnVfxParticles(cx, cy, cor, lvl >= 3 ? 16 : 10);

    if (lvl >= 3) {
      const sc = lvl >= 4 ? 12 : 7;
      for (let i = 0; i < sc; i++) {
        setTimeout(() => {
          const sx = cx + (Math.random() - 0.5) * 300;
          const sy = cy + (Math.random() - 0.5) * 300;
          const sz = lvl >= 4 ? 24 + Math.random() * 28 : 16 + Math.random() * 20;
          _spawnVfxStar(sx, sy, cor, sz, 600 + Math.random() * 400);
        }, i * 60);
      }
    }

    if (lvl >= 4) {
      _spawnVfxMegaPulse(cx, cy, '#ffffff');
      setTimeout(() => _spawnVfxMegaPulse(cx, cy, cor), 150);
      for (let j = 0; j < 6; j++) {
        setTimeout(() => {
          const sx = cx + (Math.random() - 0.5) * 200;
          const sy = cy + (Math.random() - 0.5) * 200;
          _spawnVfxStar(sx, sy, '#ffffff', 32 + Math.random() * 24, 800);
        }, j * 80);
      }
    }
  }

  function _spawnVfxStar(x, y, color, size, dur) {
    const vfx = document.getElementById('battle-vfx-layer');
    if (!vfx) return;
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;left:${x}px;top:${y}px;font-size:${size}px;color:${color};text-shadow:0 0 12px ${color},0 0 24px ${color};transform-origin:center;animation:vfx-star-spin ${dur}ms ease forwards;pointer-events:none`;
    el.textContent = ['★','✦','✧','⭐','💥','✨'][Math.floor(Math.random() * 6)];
    vfx.appendChild(el);
    setTimeout(() => el.remove(), dur + 100);
  }

  function _spawnVfxParticles(cx, cy, color, count) {
    const vfx = document.getElementById('battle-vfx-layer');
    if (!vfx) return;
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      const angle = (i / count) * Math.PI * 2;
      const dist  = 80 + Math.random() * 120;
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist;
      const sz = 6 + Math.random() * 10;
      const d  = 500 + Math.random() * 400;
      el.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:${sz}px;height:${sz}px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color};--px:${px}px;--py:${py}px;animation:vfx-particle-out ${d}ms ease forwards;pointer-events:none`;
      vfx.appendChild(el);
      setTimeout(() => el.remove(), d + 100);
    }
  }

  function _spawnVfxMegaPulse(cx, cy, color) {
    const vfx = document.getElementById('battle-vfx-layer');
    if (!vfx) return;
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,${color}cc 0%,${color}44 40%,transparent 70%);transform-origin:center;animation:vfx-mega-pulse 0.8s ease forwards;pointer-events:none`;
    vfx.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  // Captura HP de todos os combatentes para comparar depois do resolve.
  function _capturaHP() {
    const snap = {};
    for (const c of COMBAT.estado.combatentes) snap[c.id] = c.hp;
    return snap;
  }

  // Mostra floats + shake para todos os combatentes que sofreram dano ou cura.
  function _mostrarResultados(hpAntes) {
    for (const c of COMBAT.estado.combatentes) {
      const antes = hpAntes[c.id] ?? c.hp;
      const diff  = antes - c.hp;          // positivo = tomou dano
      const cura  = c.hp - antes;          // positivo = foi curado
      if (diff > 0) {
        _animarSlot(c.id, 'recebendo-dano');
        _floatTexto(c.id, `-${diff}`, 'dano');
      } else if (cura > 0) {
        _floatTexto(c.id, `+${cura}`, 'cura');
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════════════════════════════════

  // Mapa de naipe (chave em português, igual NAIPES_DATA) → símbolo
  const _NAIPE_SIM = { ouro: '♦', copas: '♥', espadas: '♠', paus: '♣' };

  // Retorna símbolo de naipe do combatente (aceita 'copas' ou '♥')
  function _naipeSim(c) { return _NAIPE_SIM[c?.naipe] ?? c?.naipe ?? null; }

  // opts: { etapaIdx, pontos, inimigos: [resolvedMonster, ...], onVitoria, onDerrota, tutorial }
  function init(opts = {}) {
    _onVitoria         = opts.onVitoria ?? null;
    _onDerrota         = opts.onDerrota ?? null;
    _pontos            = opts.pontos    ?? 0;
    _aguardando        = false;
    _estadoPainel      = 'etapa1';
    _passarConfirmando = false;
    _etapaAtual        = opts.etapaIdx ?? 0;
    _habSel            = null;
    _cartaSel          = null;
    _cartaSelIdx       = -1;
    _defesaPendente    = null;
    _defesaSel         = null;
    _especialPendente  = null;
    _statusPopupChar   = null;
    _isTutorial        = opts.tutorial  ?? false;
    _tutorialIniVisto  = false;
    _tutorialBatVisto  = false;
    _cenarioBackground = opts.background ?? null;
    _logEntries.length = 0; // limpa log da batalha anterior

    const inimigos = opts.inimigos ?? [];

    const personagens = PLAYER_STATE.personagens.map((p, i) => {
      const sim = _NAIPE_SIM[p.naipe] ?? _NAIPE_SIM[p.naipeAtivo] ?? null;
      return { ...p, id: `${p.poolId}_${i}`, naipe: sim, naipeAtivo: sim };
    });

    COMBAT.init(personagens, inimigos);
    _distribuirMao(10);
    _telaIniciativa(); // jogador escolhe cartas antes da batalha começar
  }

  function _distribuirMao(n) {
    // Time jogador: mão compartilhada
    const estado = COMBAT.estado;
    const { cartas, resto } = DECK.comprar(estado.baralhoJogador, n);
    estado.maoJogador     = cartas;
    estado.baralhoJogador = resto;

    // Inimigos: cada um compra individualmente
    for (const c of estado.combatentes.filter(x => x.lado === 'inimigo')) {
      const { cartas: ci, resto: ri } = DECK.comprar(c.baralho, n);
      c.mao     = ci;
      c.baralho = ri;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TUTORIAL DA BATALHA — popups explicativos na primeira batalha do tutorial
  // ══════════════════════════════════════════════════════════════════════════

  const _TUTORIAL_INI = [
    {
      titulo: 'A mão do time',
      texto:  'Ao iniciar a batalha, são compradas <strong>10 cartas</strong> do deck — essa é a mão compartilhada do seu time. Cada carta tem um valor que vai influenciar a ordem de ação e o poder de ataque.',
    },
    {
      titulo: 'Bônus de naipe',
      texto:  'Cada carta tem um naipe: ♥ ♣ ♦ ♠. Se a carta usada no ataque tiver o <strong>mesmo naipe do personagem</strong>, o valor dela é <strong>dobrado</strong>. Usar as cartas certas nos personagens certos faz diferença.',
    },
    {
      titulo: 'Distribuição de cartas',
      texto:  'Clique em uma carta da mão — ela ficará selecionada. Depois clique no personagem que vai usá-la. Você decide quem recebe qual carta, sem restrição.',
    },
    {
      titulo: 'Confirmar',
      texto:  'Repita para cada personagem. Quando estiver satisfeito, confirme. A ordem de ação é calculada pela carta escolhida somada à iniciativa de cada personagem — quem tiver o maior valor age primeiro.',
    },
  ];

  const _TUTORIAL_BAT = [
    {
      titulo: 'O painel de combate',
      texto:  'À esquerda: dois botões — <strong>Habilidades</strong> para atacar e <strong>Passar</strong> para encerrar o turno. À direita: sua mão está <strong>sempre visível</strong>. Você enxerga todas as suas cartas antes de decidir qualquer coisa.',
    },
    {
      titulo: 'Deck e mão',
      texto:  'O número de cartas no <strong>deck</strong> (🂠) e na <strong>mão</strong> (✋) aparecem na topbar. O limite da mão é <strong>10 cartas</strong> — se passar disso, as excedentes são descartadas automaticamente antes de comprar novas.',
    },
    {
      titulo: 'Turno',
      texto:  'O contador de turno mostra em qual rodada a batalha está. Quanto mais turnos passam, mais os efeitos acumulam — fique de olho.',
    },
    {
      titulo: 'Ordem de iniciativa',
      texto:  'A barra central mostra a sequência de ação de todos os combatentes. Você sempre sabe quem age a seguir — use isso a seu favor.',
    },
    {
      titulo: 'Personagem no campo',
      texto:  'Clique em qualquer personagem no campo para abrir o status completo: habilidades equipadas, passivas ativas, buffs e debuffs em tempo real. Tudo atualizado a cada turno.',
    },
    {
      titulo: 'Tags e ícones',
      texto:  'Nas descrições de habilidades você verá termos destacados como <strong>Queimadura</strong>, <strong>Exposto</strong>, <strong>Enfraquecido</strong>. Clique neles para ver o que fazem. Quando um personagem estiver sob efeito, o ícone aparecerá no slot — clique para ver o efeito e sua duração.',
    },
    {
      titulo: 'Cartas especiais',
      texto:  'Cartas especiais ficam visíveis na mão o tempo todo e podem ser usadas a qualquer momento — <strong>exceto após escolher uma habilidade</strong>, quando só cartas normais são aceitas para potencializá-la.<br><br><strong>Q — Dama:</strong> Remove penalidades de um aliado.<br><strong>K — Rei:</strong> +50% de poder no próximo ataque.<br><strong>A — Ás:</strong> Compra 1 carta extra do deck.<br><strong>★ — Coringa:</strong> Concede uma rodada extra.<br><br><strong>J — Valete:</strong> Aparece na mão mas está reservado para a fase defensiva. Quando o inimigo atacar, clique no Valete para <strong>esquivar</strong> do ataque.',
    },
  ];

  function _mostrarTutorialSequencial(passos, onFim) {
    const screen = document.getElementById('screen-battle');
    let passo = 0;

    function renderPasso() {
      const anterior = document.getElementById('battle-tutorial-overlay');
      if (anterior) anterior.remove();

      const dados  = passos[passo];
      const total  = passos.length;
      const ultimo = passo === total - 1;

      const el = document.createElement('div');
      el.id = 'battle-tutorial-overlay';
      el.innerHTML = `
        <div id="battle-tut-bg"></div>
        <div id="battle-tut-box">
          <div id="battle-tut-step">${passo + 1} / ${total}</div>
          <div id="battle-tut-titulo">${dados.titulo}</div>
          <div id="battle-tut-texto">${dados.texto}</div>
          <button id="battle-tut-btn">${ultimo ? 'ENTENDIDO ▶' : 'PRÓXIMO →'}</button>
        </div>
      `;
      screen.appendChild(el);

      el.querySelector('#battle-tut-btn').addEventListener('click', () => {
        if (ultimo) {
          el.remove();
          if (onFim) onFim();
        } else {
          passo++;
          renderPasso();
        }
      });
    }

    renderPasso();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INICIATIVA — fase de seleção → revelação → combate
  // ══════════════════════════════════════════════════════════════════════════

  const _COR_INI = { '♥': '#e06060', '♣': '#5ac880', '♦': '#e8c050', '♠': '#7aade8' };

  // Tela de seleção: clicar na carta auto-atribui ao primeiro char sem carta.
  function _telaIniciativa() {
    let screen = document.getElementById('screen-battle');
    if (!screen) {
      screen = document.createElement('div');
      screen.id = 'screen-battle';
      document.getElementById('game-container').appendChild(screen);
    }
    screen.innerHTML = '';
    screen.style.display = 'block';

    const estado    = COMBAT.estado;
    const jogadores = estado.combatentes.filter(c => c.lado === 'jogador');
    const maoShared = estado.maoJogador;

    // picks: charId → { idx, carta }
    const picks = {};

    const tela = document.createElement('div');
    tela.id = 'battle-ini-tela';

    // ── Header ──
    const header = document.createElement('div');
    header.id = 'battle-ini-header';
    header.innerHTML = `
      <div class="battle-ini-titulo">⚔ ESCOLHA DE INICIATIVA</div>
      <div class="battle-ini-sub">Clique em uma carta — ela vai para o próximo personagem sem carta</div>
    `;
    tela.appendChild(header);

    // ── Linhas de personagens ──
    const charsDiv = document.createElement('div');
    charsDiv.id = 'battle-ini-chars';
    tela.appendChild(charsDiv);

    // ── Mão compartilhada ──
    const maoDiv = document.createElement('div');
    maoDiv.id = 'battle-ini-mao';
    tela.appendChild(maoDiv);

    // ── Contador de progresso ──
    const lblProgresso = document.createElement('div');
    lblProgresso.id = 'battle-ini-progresso';
    tela.appendChild(lblProgresso);

    // ── Botão confirmar ──
    const btnConfirmar = document.createElement('button');
    btnConfirmar.id          = 'battle-ini-btn-confirmar';
    btnConfirmar.textContent = 'CONFIRMAR INICIATIVA →';
    btnConfirmar.addEventListener('click', () => {
      if (Object.keys(picks).length < jogadores.length) {
        btnConfirmar.classList.add('shake');
        setTimeout(() => btnConfirmar.classList.remove('shake'), 500);
        return;
      }
      tela.remove();
      _confirmarIniciativa(picks);
    });
    tela.appendChild(btnConfirmar);

    screen.appendChild(tela);

    // ── Render helpers ──
    function _renderChars() {
      charsDiv.innerHTML = '';
      for (const c of jogadores) {
        const cor          = _COR_INI[c.naipe] ?? '#888';
        const { bg, borda } = GRAD_NAIPE[c.naipe] ?? GRAD_NEUTRO;
        const pick         = picks[c.id];

        const row = document.createElement('div');
        row.className   = 'battle-ini-char-row' + (pick ? ' com-carta' : '');
        row.dataset.charId = c.id;

        if (pick) {
          const corCarta  = _COR_INI[pick.carta.naipe] ?? '#c9a84c';
          const cartaNaipe = pick.carta.naipe ?? '★';
          const cartaVal   = DECK.valorIniciativa(pick.carta);
          const total      = cartaVal + c.inc;
          const bicInner = (typeof CHAR_SPRITE !== 'undefined' && CHAR_SPRITE.MAP[c.poolId])
            ? `<img class="csp-img fill" src="${CHAR_SPRITE.MAP[c.poolId]}" draggable="false" alt="">`
            : `<span class="bic-card-naipe" style="color:${cor}">${c.naipe ?? '?'}</span>`;
          row.innerHTML = `
            <div class="bic-card" style="background:${bg}; border-color:${borda};">
              ${bicInner}
              <span class="bic-card-nome">${c.nome}</span>
            </div>
            <span class="bic-inc">INC +${c.inc}</span>
            <div class="bic-slot atribuida">
              <span class="bic-formula">
                <span style="color:${corCarta}">${pick.carta.valor}${cartaNaipe}</span>
                <span class="bic-formula-plus">(+${c.inc})</span>
                = <strong>${total}</strong>
              </span>
              <button class="bic-limpar">✕</button>
            </div>
          `;
          row.querySelector('.bic-limpar').addEventListener('click', e => {
            e.stopPropagation();
            delete picks[c.id];
            _renderChars();
            _renderCards();
            _atualizarConfirmar();
          });
        } else {
          const bicInner2 = (typeof CHAR_SPRITE !== 'undefined' && CHAR_SPRITE.MAP[c.poolId])
            ? `<img class="csp-img fill" src="${CHAR_SPRITE.MAP[c.poolId]}" draggable="false" alt="">`
            : `<span class="bic-card-naipe" style="color:${cor}">${c.naipe ?? '?'}</span>`;
          row.innerHTML = `
            <div class="bic-card" style="background:${bg}; border-color:${borda};">
              ${bicInner2}
              <span class="bic-card-nome">${c.nome}</span>
            </div>
            <span class="bic-inc">INC +${c.inc}</span>
            <div class="bic-slot vazio">— escolha uma carta —</div>
          `;
        }
        charsDiv.appendChild(row);
      }
    }

    function _renderCards() {
      maoDiv.innerHTML = '';
      const usados = new Set(Object.values(picks).map(p => p.idx));
      maoShared.forEach((carta, idx) => {
        const cor   = _COR_INI[carta.naipe] ?? '#c9a84c';
        const naipe = carta.naipe ?? '★';
        const used  = usados.has(idx);
        const btn   = document.createElement('button');
        btn.className    = 'battle-ini-carta' + (used ? ' usada' : '');
        btn.dataset.idx  = idx;
        btn.innerHTML    = `
          <span class="ini-carta-naipe-top" style="color:${cor}">${naipe}</span>
          <span class="ini-carta-val">${carta.valor}</span>
        `;
        if (!used) {
          btn.addEventListener('click', () => {
            // Remove atribuição anterior desta carta, se houver
            for (const [cid, p] of Object.entries(picks)) {
              if (p.idx === idx) { delete picks[cid]; break; }
            }
            // Atribui ao primeiro char sem carta
            const semCarta = jogadores.find(c => picks[c.id] === undefined);
            if (!semCarta) return;
            picks[semCarta.id] = { idx, carta };
            _renderChars();
            _renderCards();
            _atualizarConfirmar();
          });
        }
        maoDiv.appendChild(btn);
      });
    }

    function _atualizarConfirmar() {
      const feitos  = Object.keys(picks).length;
      const prontos = feitos >= jogadores.length;
      btnConfirmar.classList.toggle('pronto', prontos);
      lblProgresso.textContent = `${feitos} / ${jogadores.length} personagens`;
      lblProgresso.classList.toggle('pronto', prontos);
    }

    _renderChars();
    _renderCards();
    _atualizarConfirmar();

    if (_isTutorial && !_tutorialIniVisto) {
      _tutorialIniVisto = true;
      _mostrarTutorialSequencial(_TUTORIAL_INI, null);
    }
  }

  // Aplica picks do jogador, auto-aloca inimigo, calcula ordem e revela.
  function _confirmarIniciativa(picks) {
    const alocadas = new Map();
    const estado   = COMBAT.estado;

    // Remove cartas escolhidas da mão compartilhada (índices decrescentes para não deslocar)
    const idxsRemover = Object.values(picks).map(p => p.idx).sort((a, b) => b - a);
    for (const idx of idxsRemover) {
      estado.maoJogador.splice(idx, 1);
    }
    for (const [charId, pick] of Object.entries(picks)) {
      alocadas.set(charId, pick.carta);
    }

    // Aloca carta de iniciativa para cada inimigo.
    // iniScript controla o critério: 'maior' (boss/goblin), 'aleatorio' (lobo),
    // 'garantir_primeiro' (butter_venenoso), ou padrão = menor (mob/miniboss).
    for (const c of estado.combatentes.filter(x => x.lado === 'inimigo')) {
      if (!c.mao.length) continue;
      const script   = c.iniScript;
      const ehBoss   = c.tipo === 'boss';
      let escolhido  = 0;
      let cartaIni;

      if (script === 'aleatorio') {
        escolhido = Math.floor(Math.random() * c.mao.length);
        cartaIni  = c.mao[escolhido];
      } else if (script === 'garantir_primeiro') {
        // Calcula a maior iniciativa jogador já alocada
        let maxJogador = 0;
        for (const [charId, carta] of alocadas) {
          const comb = estado.combatentes.find(x => x.id === charId);
          if (comb && comb.lado === 'jogador') {
            const ini = DECK.valorIniciativa(carta) + (comb.inc ?? 0);
            if (ini > maxJogador) maxJogador = ini;
          }
        }
        // Escolhe a menor carta que ainda supera maxJogador; fallback = maior da mão
        escolhido = -1;
        let melhorSupera = Infinity;
        c.mao.forEach((carta, i) => {
          const ini = DECK.valorIniciativa(carta) + (c.inc ?? 0);
          if (ini > maxJogador && ini < melhorSupera) { escolhido = i; melhorSupera = ini; }
        });
        if (escolhido === -1) {
          c.mao.forEach((carta, i) => {
            if (DECK.valorIniciativa(carta) > DECK.valorIniciativa(c.mao[escolhido === -1 ? 0 : escolhido])) escolhido = i;
          });
          if (escolhido === -1) escolhido = 0;
        }
        cartaIni = c.mao[escolhido];
      } else {
        // Boss ou 'maior': maior carta; demais: menor carta
        const querMaior = ehBoss || script === 'maior';
        c.mao.forEach((carta, i) => {
          const v  = DECK.valorIniciativa(carta);
          const vB = DECK.valorIniciativa(c.mao[escolhido]);
          if (querMaior ? v > vB : v < vB) escolhido = i;
        });
        cartaIni = c.mao[escolhido];
      }

      c.mao = c.mao.filter((_, i) => i !== escolhido);
      alocadas.set(c.id, cartaIni);
    }

    COMBAT.calcularIniciativa(alocadas);
    _revelarOrdem();
  }

  // Cinemática de iniciativa — sequência completa: verificação → rattle → ordem definida.
  async function _revelarOrdem() {
    const screen = document.getElementById('screen-battle');
    const estado = COMBAT.estado;
    const ordem  = estado.ordem;

    const overlay = document.createElement('div');
    overlay.id = 'battle-ini-revelar';
    overlay.innerHTML = `
      <div id="battle-ini-rev-bg"></div>
      <div id="battle-ini-rev-content">
        <div id="battle-ini-rev-titulo"></div>
        <div id="battle-ini-rev-lista"></div>
        <div id="battle-ini-rev-divider"></div>
      </div>
    `;
    screen.appendChild(overlay);

    const titleEl = overlay.querySelector('#battle-ini-rev-titulo');
    const lista   = overlay.querySelector('#battle-ini-rev-lista');
    const divider = overlay.querySelector('#battle-ini-rev-divider');

    const _delay = ms => new Promise(r => setTimeout(r, ms));

    // ── Fase 1: VERIFICANDO COMBATENTES ──
    titleEl.textContent = 'VERIFICANDO COMBATENTES...';
    titleEl.classList.add('show');
    await _delay(600);

    // Jogadores primeiro, depois inimigos
    const todos = [
      ...estado.combatentes.filter(c => c.lado === 'jogador'),
      ...estado.combatentes.filter(c => c.lado === 'inimigo'),
    ];
    const rowEls = {}; // charId → DOM row

    for (const c of todos) {
      const cor      = _COR_INI[c.naipe] ?? '#888';
      const ladoCls  = c.lado === 'jogador' ? 'jogador' : 'inimigo';
      const row      = document.createElement('div');
      row.className  = `battle-cine-row ${ladoCls}`;
      row.id         = `cine-row-${c.id}`;
      row.innerHTML  = `
        <span class="cine-row-suit" style="color:${cor}">${c.naipe ?? '?'}</span>
        <span class="cine-row-name">${c.nome.toUpperCase()}</span>
        <span class="cine-row-right" id="cine-score-${c.id}">—</span>
      `;
      lista.appendChild(row);
      rowEls[c.id] = row;

      await _delay(50);
      row.classList.add('show');
      await _delay(200);

      const scoreEl = document.getElementById(`cine-score-${c.id}`);
      if (scoreEl) { scoreEl.textContent = '✔'; scoreEl.className = 'cine-row-right confirm'; }
      await _delay(60);
    }

    await _delay(300);

    // ── Fase 2: ROLANDO INICIATIVA ──
    titleEl.classList.remove('show');
    await _delay(250);
    titleEl.textContent = 'ROLANDO INICIATIVA...';
    titleEl.classList.add('show');
    await _delay(400);

    for (const c of todos) {
      const entry   = ordem.find(e => e.id === c.id);
      if (!entry) continue;
      const scoreEl = document.getElementById(`cine-score-${c.id}`);
      if (!scoreEl) continue;

      scoreEl.className = 'cine-row-right roll';
      for (let i = 0; i < 5; i++) {
        scoreEl.textContent = Math.floor(Math.random() * 20) + 1;
        await _delay(55);
      }
      const total = entry.cartaIniciativa
        ? DECK.valorIniciativa(entry.cartaIniciativa) + entry.inc
        : entry.inc;
      scoreEl.textContent = total;
      await _delay(90);
    }

    await _delay(450);

    // ── Fase 3: Re-ordenar linhas + badges ──
    ordem.forEach((entry, rank) => {
      const rowEl = rowEls[entry.id];
      if (!rowEl) return;
      lista.appendChild(rowEl);

      if (rank === 0) {
        const scoreEl = document.getElementById(`cine-score-${entry.id}`);
        if (scoreEl) scoreEl.className = 'cine-row-right first';
        rowEl.style.borderColor = '#c9a84c';
        rowEl.style.background  = 'rgba(201,168,76,0.07)';
      }

      const badge = document.createElement('span');
      badge.className   = 'cine-order-badge';
      badge.textContent = '#' + (rank + 1);
      rowEl.appendChild(badge);
      setTimeout(() => badge.classList.add('show'), 100 * rank);
    });

    await _delay(250);
    divider.classList.add('show');

    // ── Fase 4: ORDEM DE TURNO DEFINIDA ──
    titleEl.classList.remove('show');
    await _delay(280);
    titleEl.textContent   = 'ORDEM DE TURNO DEFINIDA';
    titleEl.style.animation = 'cine-pulse-gold 2s infinite';
    titleEl.classList.add('show');
    await _delay(1400);

    // Fade out
    overlay.style.transition = 'opacity 0.5s ease';
    overlay.style.opacity    = '0';
    await _delay(500);
    overlay.remove();

    const primeiro = COMBAT.combatenteAtual();
    if (primeiro) _iniciarTurno(primeiro);
    _renderizar();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  function _renderizar() {
    // Fim de batalha tem prioridade sobre tudo
    let resultado = COMBAT.verificarFimDeBatalha();
    if (resultado) { _fimDeBatalha(resultado); return; }

    if (_isTutorial && !_tutorialBatVisto) {
      _tutorialBatVisto = true;
      _mostrarTutorialSequencial(_TUTORIAL_BAT, null);
    }

    // Pula combatentes que morreram no meio do turno — corpo não tem rodada.
    // Se pular pra um novo vivo, inicia o turno dele (iniciarRodada é idempotente).
    let atual = COMBAT.combatenteAtual();
    let pulou = false;
    while (atual && atual.hp <= 0) {
      COMBAT.avancarCombatente();
      pulou = true;
      resultado = COMBAT.verificarFimDeBatalha();
      if (resultado) { _fimDeBatalha(resultado); return; }
      atual = COMBAT.combatenteAtual();
    }
    if (pulou && atual) _iniciarTurno(atual);

    let screen = document.getElementById('screen-battle');
    if (!screen) {
      screen = document.createElement('div');
      screen.id = 'screen-battle';
      document.getElementById('game-container').appendChild(screen);
    }
    screen.innerHTML = '';
    screen.style.display = 'block';

    screen.appendChild(_criarTopbar());
    screen.appendChild(_criarCampo());
    screen.appendChild(_criarPainel());
    screen.appendChild(_criarBtnDebug());

    // VFX layer + flash + skill banner — recriados a cada render
    const vfxLayer = document.createElement('div');
    vfxLayer.id = 'battle-vfx-layer';
    screen.appendChild(vfxLayer);

    const flashEl = document.createElement('div');
    flashEl.id = 'battle-screen-flash';
    screen.appendChild(flashEl);

    const banner = document.createElement('div');
    banner.id = 'battle-skill-banner';
    banner.innerHTML = '<div id="bsb-bg"></div><div id="bsb-content"><div id="bsb-name"></div><div id="bsb-sub"></div></div>';
    screen.appendChild(banner);

    // Se o turno atual é do inimigo, agenda a ação automática
    if (atual && atual.lado === 'inimigo' && !_aguardando) {
      _aguardando = true;
      setTimeout(_turnoInimigo, 900);
    }

    // Live-update do popup de status, se estiver aberto
    if (_statusPopupChar) _mostrarStatusPersonagem(_statusPopupChar);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TOPBAR
  // ══════════════════════════════════════════════════════════════════════════

  function _criarTopbar() {
    const bar    = document.createElement('div');
    bar.id = 'battle-topbar';

    const estado = COMBAT.estado;
    const turno  = Math.max(1, estado.turno);
    const jogador0 = estado.combatentes.find(c => c.lado === 'jogador');
    const inimigo0 = estado.combatentes.find(c => c.lado === 'inimigo');

    // ── Esquerda: turno + deck + mão do jogador ──
    const esq = document.createElement('div');
    esq.className = 'battle-topbar-esq';
    esq.innerHTML = `
      <span class="topbar-turno">TURNO ${turno}</span>
      <span class="topbar-deck">🂠 ${estado.baralhoJogador.length}</span>
      <span class="topbar-mao">✋ ${estado.maoJogador.length}</span>
    `;

    // ── Centro: fila de iniciativa circular ──
    const centro = document.createElement('div');
    centro.className = 'battle-topbar-centro';

    const inner = document.createElement('div');
    inner.className = 'battle-ini-inner';

    const idx    = estado.indiceAtual;
    const ordem  = estado.ordem;
    const feitos  = ordem.slice(0, idx);
    const fila    = ordem.slice(idx); // fila[0] = ativo

    // Fila (ativo + próximos)
    fila.forEach((c, i) => {
      const estado_ = i === 0 ? 'ativo' : 'proximo';
      inner.appendChild(_criarIniSlot(c, estado_, idx + i + 1));
    });

    // Separador
    if (feitos.length > 0 && fila.length > 0) {
      const sep = document.createElement('div');
      sep.className = 'ini-separator';
      inner.appendChild(sep);
    }

    // Feitos (invertidos — mais recente perto do separador)
    [...feitos].reverse().forEach((c, i) => {
      inner.appendChild(_criarIniSlot(c, 'feito', idx - i));
    });

    centro.appendChild(inner);

    // ── Direita: deck do inimigo ──
    const dir = document.createElement('div');
    dir.className = 'battle-topbar-dir';
    dir.innerHTML = `
      <span class="topbar-deck-label">INIMIGO</span>
      <span class="topbar-deck-ini">🂠 ${inimigo0?.baralho.length ?? 0}</span>
    `;

    bar.appendChild(esq);
    bar.appendChild(centro);
    bar.appendChild(dir);
    return bar;
  }

  function _criarIniSlot(c, estado_, pos) {
    const corNaipe = {
      '♥': '#e06060', '♣': '#5ac880', '♦': '#e8c050', '♠': '#7aade8',
    }[c.naipe] ?? '#c9a84c';

    const slot = document.createElement('div');
    slot.className = `battle-ini-slot ${estado_}`;
    slot.dataset.lado = c.lado;
    slot.innerHTML = `
      <div class="ini-avatar">
        <span class="ini-naipe" style="color:${corNaipe}">${c.naipe ?? '?'}</span>
        <span class="ini-pos">${pos}</span>
      </div>
    `;
    return slot;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CAMPO
  // ══════════════════════════════════════════════════════════════════════════

  // Coordenadas JRPG (estilo MAA): posição absoluta em % do campo.
  // Mais ao fundo (top menor) = escala menor (efeito de profundidade).
  const JRPG_POS = {
    jogador: [
      { left: '10%', top: '68%', scale: 1.00 },
      { left: '20%', top: '68%', scale: 1.00 },
      { left: '30%', top: '68%', scale: 1.00 },
    ],
    inimigo: [
      { left: '70%', top: '68%', scale: 1.00 },
      { left: '80%', top: '68%', scale: 1.00 },
      { left: '90%', top: '68%', scale: 1.00 },
    ],
  };

  function _criarCampo() {
    const campo = document.createElement('div');
    campo.id = 'battle-field';

    if (_cenarioBackground) {
      campo.classList.add('has-bg');
      campo.style.setProperty('--battle-bg-url', `url('${_cenarioBackground}')`);
    }

    // Glow central animado
    const glow = document.createElement('div');
    glow.className = 'battle-field-glow';
    campo.appendChild(glow);

    const esq = document.createElement('div');
    esq.id = 'battle-field-left';
    esq.className = 'battle-field-lado';

    const dir = document.createElement('div');
    dir.id = 'battle-field-right';
    dir.className = 'battle-field-lado';

    // Índices separados por lado para mapear para JRPG_POS
    let iJogador = 0, iInimigo = 0;
    for (const c of COMBAT.estado.combatentes) {
      const isAtivo = COMBAT.combatenteAtual()?.id === c.id;
      const idx     = c.lado === 'jogador' ? iJogador++ : iInimigo++;
      const slot    = _criarCharSlot(c, idx, isAtivo);
      if (c.lado === 'jogador') esq.appendChild(slot);
      else                      dir.appendChild(slot);
    }

    campo.appendChild(esq);
    campo.appendChild(dir);

    // Log de batalha — canto inferior esquerdo do campo
    const logPanel = document.createElement('div');
    logPanel.id = 'battle-log-panel';
    const logLista = document.createElement('div');
    logLista.id = 'battle-log-lista';
    _renderizarLog(logLista);
    logPanel.appendChild(logLista);
    campo.appendChild(logPanel);

    return campo;
  }

  function _criarCharSlot(c, idx, isAtivo) {
    const { bg } = GRAD_NAIPE[c.naipe] ?? GRAD_NEUTRO;
    const hpPct  = Math.max(0, Math.min(100, (c.hp / c.pvs) * 100));
    const hpCor  = hpPct > 60 ? '#55cc88' : hpPct > 30 ? '#e8c050' : '#cc5555';
    const morto  = c.hp <= 0;

    const corNaipe = {
      '♥': '#e06060', '♣': '#5ac880', '♦': '#e8c050', '♠': '#7aade8',
    }[c.naipe] ?? '#c9a84c';

    // Posição JRPG
    const pos   = (JRPG_POS[c.lado] ?? JRPG_POS.inimigo)[idx]
               ?? (JRPG_POS[c.lado] ?? JRPG_POS.inimigo).at(-1);
    const scale = pos.scale;

    const slot = document.createElement('div');
    slot.className = 'battle-char-slot'
      + (isAtivo ? ' ativo' : '')
      + (morto   ? ' morto' : '');
    slot.dataset.id   = c.id;
    slot.dataset.lado = c.lado;
    slot.style.left      = pos.left;
    slot.style.top       = pos.top;
    slot.style.zIndex    = idx + 1;
    slot.style.transform = `translate(-50%, -50%) scale(${scale})`;

    const spriteSrc = (typeof CHAR_SPRITE !== 'undefined') ? (CHAR_SPRITE.MAP[c.poolId ?? ''] ?? null) : null;
    const efHtml    = _efeitosIconsHtml(c);

    if (spriteSrc) {
      // ── Modo sprite: imagem pixel art ──
      slot.innerHTML = `
        <div class="battle-char-grad sprite-mode">
          <img class="battle-char-sprite" src="${spriteSrc}" draggable="false" alt="${c.nome}">
        </div>
        <div class="battle-char-nome-sprite" style="color:${corNaipe}bb">${c.nome}</div>
        <div class="battle-char-hp-row">
          <div class="battle-char-hp-bar">
            <div class="battle-char-hp-fill" style="width:${hpPct}%;background:${hpCor}"></div>
          </div>
          <div class="battle-char-hp-txt">${c.hp}/${c.pvs}</div>
        </div>
        ${efHtml ? `<div class="battle-char-efeitos-row">${efHtml}</div>` : ''}
      `;
    } else {
      // ── Fallback card (inimigos sem sprite) ──
      const atqCls = c.atq > (c.atqBase ?? c.atq) ? 'up' : c.atq < (c.atqBase ?? c.atq) ? 'down' : '';
      const defCls = c.def > (c.defBase ?? c.def) ? 'up' : c.def < (c.defBase ?? c.def) ? 'down' : '';
      slot.innerHTML = `
        <div class="battle-char-grad" style="background:${bg};">
          <span class="battle-char-naipe" style="color:${corNaipe}">${c.naipe ?? '?'}</span>
          <div class="battle-char-nome">${c.nome}</div>
        </div>
        <div class="battle-char-hp-row">
          <div class="battle-char-hp-bar">
            <div class="battle-char-hp-fill" style="width:${hpPct}%;background:${hpCor}"></div>
          </div>
          <div class="battle-char-hp-txt">${c.hp}/${c.pvs}</div>
        </div>
        <div class="battle-char-stats">
          <div class="bcs-item"><span class="bcs-l">ATQ</span><span class="bcs-v ${atqCls}">${c.atq}</span></div>
          <div class="bcs-item"><span class="bcs-l">DEF</span><span class="bcs-v ${defCls}">${c.def}</span></div>
          <div class="bcs-item"><span class="bcs-l">HP</span><span class="bcs-v">${c.hp}</span></div>
        </div>
        ${efHtml ? `<div class="battle-char-efeitos-row">${efHtml}</div>` : ''}
      `;
    }

    // Clicável como alvo quando o fluxo está em 'sel_alvo' (habilidade alvo único)
    if (_estadoPainel === 'sel_alvo' && _habSel) {
      const atacante = COMBAT.combatenteAtual();
      if (_alvoValido(c, _habSel, atacante)) {

        slot.classList.add('selecionavel');
        slot.addEventListener('click', () => _confirmarAlvo([c]));
      }
    }
    // Clicável como aliado quando carta especial Q (Dama) está aguardando alvo
    else if (_estadoPainel === 'sel_alvo_especial' && _especialPendente?.carta?.valor === 'Q') {
      const atacante = COMBAT.combatenteAtual();
      if (c.lado === atacante.lado && c.hp > 0) {
        slot.classList.add('selecionavel');
        slot.addEventListener('click', () => _resolverDama(c));
      }
    }
    // Fora de seleção: clique abre popup de status do personagem (informativo).
    else {
      slot.style.cursor = 'pointer';
      slot.addEventListener('click', () => _mostrarStatusPersonagem(c));
    }

    return slot;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAINEL
  // ══════════════════════════════════════════════════════════════════════════

  // Re-renderiza só o painel (sem recriar o campo e topbar).
  function _renderizarPainel() {
    const screen = document.getElementById('screen-battle');
    if (!screen) return;
    const velho = document.getElementById('battle-panel');
    if (velho) velho.remove();
    screen.appendChild(_criarPainel());
  }

  function _criarPainel() {
    const painel = document.createElement('div');
    painel.id = 'battle-panel';

    // ── Defesa pendente: interrompe o fluxo normal ──
    if (_defesaPendente) {
      painel.appendChild(_criarPainelDefesaEsq());
      painel.appendChild(_criarPainelDefesaDir());
      return painel;
    }

    const atual = COMBAT.combatenteAtual();

    // ── Turno do inimigo ──
    if (!atual || atual.lado === 'inimigo') {
      painel.innerHTML = `
        <div class="battle-inimigo-turno">
          <div class="battle-inimigo-turno-titulo">⚔ TURNO DO INIMIGO</div>
          <div class="battle-inimigo-turno-sub">${atual?.nome ?? ''} está agindo...</div>
        </div>
      `;
      return painel;
    }

    // ── Etapa 1: esq=HABILIDADES+PASSAR, dir=mão completa (especiais clicáveis) ──
    if (_estadoPainel === 'etapa1') {
      painel.appendChild(_criarPainelBotoesEtapa1());
      painel.appendChild(_criarPainelSelEspecial(atual));
      return painel;
    }

    // ── Sel especial: mão da carta (só especiais clicáveis; J grayed — defesa-only) ──
    if (_estadoPainel === 'sel_especial') {
      painel.appendChild(_criarPainelInfoEspecial());
      painel.appendChild(_criarPainelSelEspecial(atual));
      return painel;
    }

    // ── Sel alvo especial: aguarda clique num aliado (Q remove debuff) ──
    if (_estadoPainel === 'sel_alvo_especial') {
      painel.appendChild(_criarPainelResumoEspecial());
      painel.appendChild(_criarPainelInfo('Toque num aliado.'));
      return painel;
    }

    // ── Sel habilidade: lista habilidades (esq) + mão completa (dir, especiais clicáveis) ──
    if (_estadoPainel === 'sel_habilidade') {
      painel.appendChild(_criarPainelSelHab(atual));
      painel.appendChild(_criarPainelSelEspecial(atual));
      return painel;
    }

    // ── Sel carta: ficha da habilidade (esq) + só cartas normais clicáveis (dir) ──
    if (_estadoPainel === 'sel_carta') {
      painel.appendChild(_criarPainelHabDetalhe(_habSel));
      painel.appendChild(_criarPainelMaoNormais(atual));
      return painel;
    }

    // ── Sel alvo: resumo da seleção + aguarda clique num personagem do campo ──
    if (_estadoPainel === 'sel_alvo') {
      painel.appendChild(_criarPainelResumo(_habSel, _cartaSel));
      painel.appendChild(_criarPainelInfo('Toque num alvo no campo.'));
      return painel;
    }

    // ── Sel carta adicional: escolha de carta para hits extras (opcional) ──
    if (_estadoPainel === 'sel_carta_adicional') {
      painel.appendChild(_criarPainelCartaAdicionalEsq());
      painel.appendChild(_criarPainelCartaAdicionalDir(atual));
      return painel;
    }

    return painel;
  }

  // ── Painel esquerdo para seleção de carta de hit adicional ──
  function _criarPainelCartaAdicionalEsq() {
    const div = document.createElement('div');
    div.id = 'battle-panel-habs';
    div.classList.add('detalhe');
    const hitNum    = _hitAdicionalIdx + 2;
    const totalHits = _totalHits(_habSel);
    div.innerHTML = `
      <div class="battle-defesa-titulo" style="color:#c9a84c;">⚔ ATAQUE ${hitNum} DE ${totalHits}</div>
      <div class="battle-defesa-info">
        Opcional — escolha uma carta para potencializar ou pule.
      </div>
    `;
    const btnPular = document.createElement('button');
    btnPular.className   = 'battle-btn-hab';
    btnPular.textContent = '↪ PULAR';
    btnPular.style.marginTop = '8px';
    btnPular.addEventListener('click', () => _escolherCartaAdicional(null, -1));
    div.appendChild(btnPular);
    return div;
  }

  // ── Painel direito para seleção de carta de hit adicional ──
  function _criarPainelCartaAdicionalDir(atual) {
    const div = document.createElement('div');
    div.id = 'battle-panel-cartas';
    const mao = COMBAT.estado.maoJogador;
    let temCarta = false;
    mao.forEach((carta, i) => {
      if (DECK.ehEspecial(carta)) return;
      temCarta = true;
      const corCarta = _COR_INI[carta.naipe] ?? '#c9a84c';
      const el = document.createElement('button');
      el.className = 'battle-carta';
      el.dataset.naipe = carta.naipe ?? '';
      el.innerHTML = `<span class="carta-valor" style="color:${corCarta}">${carta.valor}</span><span class="carta-naipe-icon" style="color:${corCarta}">${carta.naipe ?? '★'}</span>`;
      el.addEventListener('click', () => _escolherCartaAdicional(carta, i));
      div.appendChild(el);
    });
    if (!temCarta) {
      div.innerHTML = `<div class="battle-mao-vazia">SEM CARTAS — APENAS PULE</div>`;
    }
    return div;
  }

  // ── Painel esquerdo de etapa1: HABILIDADES + PASSAR ──
  function _criarPainelBotoesEtapa1() {
    const div = document.createElement('div');
    div.id = 'battle-panel-habs';

    const btnHab = document.createElement('button');
    btnHab.id        = 'battle-btn-habilidades';
    btnHab.className = 'battle-btn-hab';
    btnHab.textContent = '⚔  HABILIDADES';
    btnHab.addEventListener('click', () => {
      _estadoPainel = 'sel_habilidade';
      _renderizar();
    });

    const btnPassar = document.createElement('button');
    btnPassar.id        = 'battle-btn-passar';
    btnPassar.className = 'battle-btn-hab';
    btnPassar.style.color       = '#8899aa';
    btnPassar.style.borderColor = '#ffffff12';
    btnPassar.textContent = '⏭  PASSAR';
    btnPassar.addEventListener('click', () => _handlePassar(btnPassar));

    div.appendChild(btnHab);
    div.appendChild(btnPassar);
    return div;
  }

  // ── Painel esquerdo: lista das habilidades equipadas (selecionável) ──
  function _criarPainelSelHab(combatente) {
    const div = document.createElement('div');
    div.id = 'battle-panel-habs';

    const habs = combatente.habilidades ?? [null, null, null];
    habs.forEach((hab, i) => {
      const btn = document.createElement('button');
      btn.className = 'battle-btn-hab' + (!hab ? ' vazio' : '');
      if (hab) {
        const cd = combatente.cooldowns[hab._id] ?? 0;
        btn.textContent = cd > 0 ? `${hab.nome} (${cd})` : hab.nome;
        if (cd > 0) {
          btn.disabled = true;
          btn.classList.add('em-recarga');
        } else {
          btn.addEventListener('click', () => {
            _habSel = hab;
            _estadoPainel = 'sel_carta';
            _renderizar();
          });
        }
      } else {
        btn.textContent = `— SLOT ${i + 1} VAZIO —`;
        btn.disabled = true;
      }
      div.appendChild(btn);
    });

    const voltar = document.createElement('button');
    voltar.className   = 'battle-btn-voltar';
    voltar.textContent = '← VOLTAR';
    voltar.addEventListener('click', () => {
      _estadoPainel = 'etapa1';
      _renderizar();
    });
    div.appendChild(voltar);

    return div;
  }

  // ── Painel direito: mão de cartas (clicável ou somente visual) ──
  function _criarPainelMaoView(combatente, clicavel) {
    const div = document.createElement('div');
    div.id = 'battle-panel-cartas';

    const mao = combatente.lado === 'jogador' ? COMBAT.estado.maoJogador : (combatente.mao ?? []);
    if (!mao || mao.length === 0) {
      div.innerHTML = `<div class="battle-mao-vazia">—</div>`;
      return div;
    }

    const naipeSinerg = _naipeSim(combatente);
    mao.forEach((carta, i) => {
      const ehNormal = carta.tipo === 'numerica';
      const ehSinerg = naipeSinerg && carta.naipe === naipeSinerg && ehNormal;
      const corCarta = _COR_INI[carta.naipe] ?? '#c9a84c';
      const el = document.createElement('button');
      el.className = 'battle-carta' + (clicavel ? '' : ' nao-clicavel') + (ehSinerg ? ' sinergica' : '');
      el.dataset.naipe = carta.naipe ?? '';
      el.innerHTML = `<span class="carta-valor" style="color:${corCarta}">${carta.valor}</span><span class="carta-naipe-icon" style="color:${corCarta}">${carta.naipe ?? '★'}</span>`;
      if (clicavel) {
        el.addEventListener('click', () => {
          _cartaSel    = carta;
          _cartaSelIdx = i;
          const alvosAuto = _calcularAlvosAuto(_habSel, combatente);
          if (alvosAuto) {
            _confirmarAlvo(alvosAuto);
          } else {
            _estadoPainel = 'sel_alvo';
            _renderizar();
          }
        });
      } else {
        el.disabled = true;
      }
      div.appendChild(el);
    });

    return div;
  }

  // ── Painel direito (sel_carta): só cartas normais clicáveis; especiais/J grayed ──
  function _criarPainelMaoNormais(combatente) {
    const div = document.createElement('div');
    div.id = 'battle-panel-cartas';

    const mao = combatente.lado === 'jogador' ? COMBAT.estado.maoJogador : (combatente.mao ?? []);
    if (!mao || mao.length === 0) {
      div.innerHTML = `<div class="battle-mao-vazia">—</div>`;
      return div;
    }

    const naipeSinerg = _naipeSim(combatente);
    mao.forEach((carta, i) => {
      const ehEspecial = carta.tipo === 'especial' || carta.tipo === 'coringa' || carta.valor === 'J';
      const ehSinerg   = naipeSinerg && carta.naipe === naipeSinerg && !ehEspecial;
      const corCarta   = _COR_INI[carta.naipe] ?? '#c9a84c';
      const el = document.createElement('button');
      el.className = 'battle-carta' + (ehEspecial ? ' nao-clicavel' : '') + (ehSinerg ? ' sinergica' : '');
      el.dataset.naipe = carta.naipe ?? '';
      el.innerHTML = `<span class="carta-valor" style="color:${corCarta}">${carta.valor}</span><span class="carta-naipe-icon" style="color:${corCarta}">${carta.naipe ?? '★'}</span>`;
      if (ehEspecial) {
        el.disabled = true;
      } else {
        el.addEventListener('click', () => {
          _cartaSel    = carta;
          _cartaSelIdx = i;
          const alvosAuto = _calcularAlvosAuto(_habSel, combatente);
          if (alvosAuto) {
            _confirmarAlvo(alvosAuto);
          } else {
            _estadoPainel = 'sel_alvo';
            _renderizar();
          }
        });
      }
      div.appendChild(el);
    });

    return div;
  }

  // ── Painel esquerdo: ficha completa da habilidade selecionada + ← VOLTAR ──
  function _criarPainelHabDetalhe(hab) {
    const div = document.createElement('div');
    div.id = 'battle-panel-habs';
    div.classList.add('detalhe');

    const ALVO_LABEL = { unico: 'Único', inimigos: 'Inimigos', aliados: 'Aliados', self: 'Si próprio', todos: 'Todos' };
    const ACAO_LABEL = { N: 'Normal', R: 'Rápida', F: 'Furtiva', L: 'Lenta' };

    const poderTxt = hab.efeitoPuro ? 'EFEITO' : (hab.poder ?? 0);
    const alvoTxt  = ALVO_LABEL[hab.alvo] || hab.alvo || '—';
    const acaoTxt  = ACAO_LABEL[hab.acao] || hab.acao || '—';
    const recTxt   = hab.recarga ?? 0;
    const turnoTxt = hab.turno === 'nao' ? 'NÃO' : 'SIM';

    div.innerHTML = `
      <div class="battle-hab-detalhe-nome">${hab.nome}</div>
      <div class="battle-hab-detalhe-ficha">
        <span><b>PODER</b> ${poderTxt}</span>
        <span><b>TIPO</b> ${hab.tipo || '—'}</span>
        <span><b>ALVO</b> ${alvoTxt}</span>
        <span><b>TURNO</b> ${turnoTxt}</span>
        <span><b>RECARGA</b> ${recTxt}</span>
        <span><b>AÇÃO</b> ${acaoTxt}</span>
      </div>
      <div class="battle-hab-detalhe-desc">${EFEITOS.destacar(hab.descricao || '—')}</div>
    `;

    const voltar = document.createElement('button');
    voltar.className   = 'battle-btn-voltar';
    voltar.textContent = '← VOLTAR';
    voltar.addEventListener('click', () => {
      _habSel       = null;
      _estadoPainel = 'sel_habilidade';
      _renderizar();
    });
    div.appendChild(voltar);

    return div;
  }

  // ── Painel esquerdo modo resumo: habilidade (+ carta) + ← VOLTAR ──
  function _criarPainelResumo(hab, carta) {
    const div = document.createElement('div');
    div.id = 'battle-panel-habs';

    const linhaHab = document.createElement('div');
    linhaHab.className = 'battle-resumo-linha';
    linhaHab.innerHTML = `<span class="battle-resumo-l">HABILIDADE</span><span class="battle-resumo-v">${hab.nome}</span>`;
    div.appendChild(linhaHab);

    if (carta) {
      const corCarta = _COR_INI[carta.naipe] ?? '#c9a84c';
      const linhaCarta = document.createElement('div');
      linhaCarta.className = 'battle-resumo-linha';
      linhaCarta.innerHTML = `<span class="battle-resumo-l">CARTA</span><span class="battle-resumo-v" style="color:${corCarta}">${carta.label}</span>`;
      div.appendChild(linhaCarta);
    }

    const voltar = document.createElement('button');
    voltar.className   = 'battle-btn-voltar';
    voltar.textContent = '← VOLTAR';
    voltar.addEventListener('click', () => {
      // Resumo é usado só em sel_alvo — volta pra sel_carta liberando a carta
      _cartaSel     = null;
      _cartaSelIdx  = -1;
      _estadoPainel = 'sel_carta';
      _renderizar();
    });
    div.appendChild(voltar);

    return div;
  }

  // ── Painel direito modo info: texto centrado (ex: "Toque num alvo") ──
  function _criarPainelInfo(texto) {
    const div = document.createElement('div');
    div.id = 'battle-panel-cartas';
    div.innerHTML = `<div class="battle-mao-vazia">${texto}</div>`;
    return div;
  }

  // ── Especial esquerda (sel_especial): texto de orientação + ← VOLTAR ──
  function _criarPainelInfoEspecial() {
    const div = document.createElement('div');
    div.id = 'battle-panel-habs';
    div.classList.add('detalhe');

    div.innerHTML = `
      <div class="battle-defesa-titulo" style="color:#c9a84c;">✦ CARTA ESPECIAL</div>
      <div class="battle-defesa-info">
        Escolha uma carta especial pra usar.<br>
        <span style="color:#888;font-size:9px;">J fica pra defesa.</span>
      </div>
    `;

    const voltar = document.createElement('button');
    voltar.className   = 'battle-btn-voltar';
    voltar.textContent = '← VOLTAR';
    voltar.addEventListener('click', () => {
      _estadoPainel = 'etapa1';
      _renderizar();
    });
    div.appendChild(voltar);

    return div;
  }

  // ── Especial direita: cartas da mão — só Q/K/A/★ clicáveis (J é defesa-only) ──
  function _criarPainelSelEspecial(combatente) {
    const div = document.createElement('div');
    div.id = 'battle-panel-cartas';

    const mao = COMBAT.estado.maoJogador;
    if (!mao || mao.length === 0) {
      div.innerHTML = `<div class="battle-mao-vazia">Mão vazia.</div>`;
      return div;
    }

    const naipeSinerg = _naipeSim(combatente);
    mao.forEach((carta, i) => {
      const ehJ        = carta.valor === 'J';
      const ehEspecial = carta.tipo === 'especial' || carta.tipo === 'coringa';
      const clicavel   = ehEspecial && !ehJ;
      const ehSinerg   = naipeSinerg && carta.naipe === naipeSinerg && !ehEspecial && !ehJ;
      const corCarta   = _COR_INI[carta.naipe] ?? '#c9a84c';

      const el = document.createElement('button');
      el.className = 'battle-carta' + (clicavel ? '' : ' nao-clicavel') + (ehSinerg ? ' sinergica' : '');
      el.dataset.naipe = carta.naipe ?? '';
      el.innerHTML = `<span class="carta-valor" style="color:${corCarta}">${carta.valor}</span><span class="carta-naipe-icon" style="color:${corCarta}">${carta.naipe ?? '★'}</span>`;
      if (clicavel) {
        el.addEventListener('click', () => _usarEspecial(carta, i));
      } else {
        el.disabled = true;
      }
      div.appendChild(el);
    });

    return div;
  }

  // ── Especial esquerda (sel_alvo_especial): resumo da carta + ← VOLTAR ──
  function _criarPainelResumoEspecial() {
    const div = document.createElement('div');
    div.id = 'battle-panel-habs';
    div.classList.add('detalhe');

    const c = _especialPendente?.carta;
    const corCarta = _COR_INI[c?.naipe] ?? '#c9a84c';

    div.innerHTML = `
      <div class="battle-defesa-titulo" style="color:#c9a84c;">✦ CARTA ESPECIAL</div>
      <div class="battle-defesa-info">
        Usando <strong style="color:${corCarta}">${c?.label ?? '?'}</strong>
      </div>
    `;

    const voltar = document.createElement('button');
    voltar.className   = 'battle-btn-voltar';
    voltar.textContent = '← VOLTAR';
    voltar.addEventListener('click', () => {
      _especialPendente = null;
      _estadoPainel = 'sel_especial';
      _renderizar();
    });
    div.appendChild(voltar);

    return div;
  }

  // ── Defesa esquerda: atacante + alvo atual + dano + PASSAR (dupla confirmação) ──
  function _criarPainelDefesaEsq() {
    const div = document.createElement('div');
    div.id = 'battle-panel-habs';
    div.classList.add('detalhe');

    const { atacante, alvoAtual, dano, total, fila } = _defesaPendente;
    const corAt = _COR_INI[atacante.naipe] ?? '#cc7777';

    // Conta posição atual na fila (1-based). fila.length é o que SOBRA depois
    // do atual ter sido tirado, então: posicao = total - fila.length.
    const tituloSufixo = total > 1 ? ` ${total - fila.length}/${total}` : '';

    div.innerHTML = `
      <div class="battle-defesa-titulo">⚠ DEFENDER${tituloSufixo}</div>
      <div class="battle-defesa-info">
        <span style="color:${corAt}">${atacante.nome}</span>
        ataca <strong>${alvoAtual.nome}</strong>
      </div>
      <div class="battle-defesa-dano">Causará <strong>${dano}</strong> de dano</div>
    `;

    const passarSel = _defesaSel && _defesaSel.tipo === 'passar';
    const btnPassar = document.createElement('button');
    btnPassar.id        = 'battle-btn-passar';
    btnPassar.className = 'battle-defesa-passar' + (passarSel ? ' confirmando' : '');
    btnPassar.textContent = passarSel ? '⏭ CONFIRMAR PASSAR' : '⏭ PASSAR (sem defesa)';
    btnPassar.addEventListener('click', () => _selecionarDefesa({ tipo: 'passar' }));
    div.appendChild(btnPassar);

    return div;
  }

  // ── Defesa direita: cartas da mão (clica → seleciona → clica de novo → confirma) ──
  // J = esquiva total (clicável). Outros especiais (Q/K/A/★) = sem efeito defensivo (grayed).
  // Cartas já reservadas por jogadores anteriores na mesma área ficam grayed.
  function _criarPainelDefesaDir() {
    const div = document.createElement('div');
    div.id = 'battle-panel-cartas';

    const mao = COMBAT.estado.maoJogador;
    if (!mao || mao.length === 0) {
      div.innerHTML = `<div class="battle-mao-vazia">Sem cartas — clica em PASSAR</div>`;
      return div;
    }

    const reservadas = new Set(
      Object.values(_defesaPendente.defesasColetadas).filter(c => c)
    );

    mao.forEach((carta, i) => {
      const sel         = _defesaSel && _defesaSel.tipo === 'carta' && _defesaSel.idx === i;
      const reservada   = reservadas.has(carta);
      const ehJ         = carta.valor === 'J';
      // Outros especiais (Q/K/A/★) não têm efeito defensivo — ficam grayed
      const ehOutroEsp  = !ehJ && DECK.ehEspecial(carta);
      const bloqueada   = reservada || ehOutroEsp;

      const el = document.createElement('button');
      el.className = 'battle-carta'
        + (sel      ? ' selecionada' : '')
        + (bloqueada ? ' nao-clicavel' : '');
      el.dataset.naipe = carta.naipe ?? '';

      // Label especial para J (esquiva) e outros especiais (sem efeito)
      const extraLabel = ehJ
        ? `<span class="carta-def-label esquiva">ESQUIVA</span>`
        : ehOutroEsp
          ? `<span class="carta-def-label sem-efeito">SEM EFEITO</span>`
          : '';

      el.innerHTML = `<span class="carta-valor">${carta.label}</span>${extraLabel}`;

      if (bloqueada) {
        el.disabled = true;
      } else {
        el.addEventListener('click', () => _selecionarDefesa({ tipo: 'carta', idx: i }));
      }
      div.appendChild(el);
    });

    return div;
  }

  // ── Helpers de multi-hit ─────────────────────────────────────────────────
  function _ehMultiHit(hab) {
    return typeof hab?.poder === 'string' && hab.poder.includes('/');
  }
  function _totalHits(hab) {
    if (!_ehMultiHit(hab)) return 1;
    return hab.poder.split('/').length;
  }

  // Após selecionar alvo: se multi-hit, coleta cartas adicionais; senão executa direto.
  function _confirmarAlvo(alvos) {
    if (_ehMultiHit(_habSel) && _totalHits(_habSel) > 1) {
      _alvosParaExecutar = alvos;
      _cartasAdicionais  = [];
      _hitAdicionalIdx   = 0;
      _estadoPainel      = 'sel_carta_adicional';
      _renderizar();
    } else {
      _executarAcao(alvos);
    }
  }

  // Jogador escolheu (ou pulou) a carta do hit adicional atual.
  function _escolherCartaAdicional(carta, idx) {
    if (carta !== null && idx >= 0) {
      COMBAT.estado.maoJogador.splice(idx, 1);
      COMBAT.estado.descarteJogador.push(carta);
      _cartasAdicionais.push(carta);
    } else {
      _cartasAdicionais.push(null);
    }
    _hitAdicionalIdx++;
    if (_hitAdicionalIdx < _totalHits(_habSel) - 1) {
      _renderizar();   // mais hits a configurar
    } else {
      _executarAcao(_alvosParaExecutar, [..._cartasAdicionais]);
    }
  }

  // ── Cálculo de alvos / executor ───────────────────────────────────────────

  // Retorna array de alvos quando a habilidade tem alvo automático,
  // ou null quando precisa de clique no campo.
  function _calcularAlvosAuto(hab, atacante) {
    const estado = COMBAT.estado;
    switch (hab.alvo) {
      case 'inimigos':
        return estado.combatentes.filter(c => c.lado !== atacante.lado && c.hp > 0);
      case 'aliados':
        return estado.combatentes.filter(c => c.lado === atacante.lado && c.hp > 0);
      case 'self':
        return [atacante];
      case 'todos':
        return estado.combatentes.filter(c => c.hp > 0);
      case 'unico':
      default:
        return null;
    }
  }

  // Para alvo 'unico' (clicável), atacante quer um inimigo vivo.
  function _alvoValido(c, hab, atacante) {
    if (!c || c.hp <= 0) return false;
    if (hab.alvo === 'unico') return c.lado !== atacante.lado;
    return false;
  }

  function _executarAcao(alvos, cartasAdicionais = []) {
    const atacante = COMBAT.combatenteAtual();
    if (!atacante || !_habSel) return;

    // Limpa estado de multi-hit
    _alvosParaExecutar = null;

    const hab = _habSel;
    _logUI(`⚔ ${atacante.nome} usa ${hab.nome}`, 'atk');

    const temSinerg = !hab.efeitoPuro && !!_cartaSel && _cartaSel.naipe === atacante.naipe;
    const temVantag = !hab.efeitoPuro && alvos.some(a => DAMAGE.temVantagem(atacante.naipe, a.naipe));

    _showSkillBanner(hab, atacante).then(() => {
      _animarSlot(atacante.id, 'atacando');

      setTimeout(() => {
        const hpAntes = _capturaHP();
        COMBAT.resolverAcao(atacante, hab, _cartaSelIdx, alvos, null, cartasAdicionais);

        const hits = COMBAT.estado.ultimosHits;

        if (hits.length > 1) {
          // ── Multi-hit: animação sequencial por hit ──
          _renderizar();
          let i = 0;
          function _proximoHit() {
            if (i >= hits.length) {
              if (temVantag) {
                _flashVantagem(atacante.id);
                setTimeout(() => _floatTexto(atacante.id, '▲ NAIPE', 'vantagem-naipe'), 120);
              }
              for (const alvo of alvos) {
                const danoTotal = (hpAntes[alvo.id] ?? 0) - alvo.hp;
                if (danoTotal > 0) _logUI(`💥 ${alvo.nome} recebeu ${danoTotal} de dano (${hits.length} hits)`, 'dmg');
              }
              setTimeout(() => _processarContraAtaques(() => _verificarEtapa4(atacante)), 600);
              return;
            }
            const hit = hits[i++];
            if (hit.danoReal > 0) {
              _animarSlot(hit.alvoId, 'recebendo-dano');
              const tipo = temVantag ? 'dano-vantagem' : temSinerg ? 'dano-sinerg' : 'dano';
              _floatDanoContado(hit.alvoId, hit.danoReal, tipo);
              _floatTexto(hit.alvoId, `${i}º ATQ`, 'sistema');
              _screenShake(hit.danoReal);
            }
            setTimeout(_proximoHit, 500);
          }
          _proximoHit();

        } else {
          // ── Single hit: comportamento atual ──
          let totalDano = 0;
          for (const c of COMBAT.estado.combatentes) {
            const antes = hpAntes[c.id] ?? c.hp;
            const diff  = antes - c.hp;
            const cura  = c.hp - antes;
            if (diff > 0) {
              _animarSlot(c.id, 'recebendo-dano');
              const ehAlvo = alvos.some(a => a.id === c.id);
              let tipo = 'dano';
              if (ehAlvo && temVantag) tipo = 'dano-vantagem';
              else if (ehAlvo && temSinerg) tipo = 'dano-sinerg';
              _floatDanoContado(c.id, diff, tipo);
              if (ehAlvo) totalDano += diff;
            } else if (cura > 0) {
              _floatTexto(c.id, `+${cura}`, 'cura');
            }
          }
          if (totalDano > 0) _screenShake(totalDano);
          if (temVantag) {
            _flashVantagem(atacante.id);
            setTimeout(() => _floatTexto(atacante.id, '▲ NAIPE', 'vantagem-naipe'), 120);
          }
          for (const alvo of alvos) {
            const dano = (hpAntes[alvo.id] ?? 0) - alvo.hp;
            if (dano > 0) _logUI(`💥 ${alvo.nome} recebeu ${dano} de dano`, 'dmg');
          }
          setTimeout(() => _processarContraAtaques(() => _verificarEtapa4(atacante)), 600);
        }
      }, _ANIM_DUR);
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CARTAS ESPECIAIS — Q/K/A/★ usadas como ação própria do jogador
  // ══════════════════════════════════════════════════════════════════════════

  // Tira a carta da mão compartilhada e manda pro descarte.
  function _consumirEspecialDaMao(idx) {
    const mao = COMBAT.estado.maoJogador;
    const carta = mao.splice(idx, 1)[0];
    if (carta) COMBAT.estado.descarteJogador.push(carta);
    return carta;
  }

  // Dispatcher: identifica a especial e roteia. Q vai pra alvo; resto resolve.
  // K/A/Q/★ são INSTANTÂNEAS — não consomem o turno. Pode usar quantas quiser.
  function _usarEspecial(carta, idx) {
    const c = COMBAT.combatenteAtual();
    if (!c) return;

    if (carta.valor === 'Q') {
      // Q precisa de alvo aliado — vai pra sel_alvo_especial, consome depois
      _especialPendente = { carta, idx };
      _estadoPainel = 'sel_alvo_especial';
      _renderizar();
      return;
    }

    // K, A, ★ resolvem como ação rápida (sem avançar turno)
    _consumirEspecialDaMao(idx);
    if (carta.valor === 'K') {
      // Rei: +10 de bônus no próximo ataque (valor fixo do efeito do Rei)
      c.efeitos.push({ tipo: 'rei_atq_bonus', valor: 10, duracao: 1 });
    } else if (carta.valor === 'A') {
      // Ás: compra 1 carta do baralho compartilhado
      COMBAT.comprarCarta(c, 1);
      _floatTexto(c.id, '✦ CARTA +1', 'carta-comprada');
    } else if (carta.valor === '★') {
      // Coringa: concede rodada extra via efeito (bloqueado se acaoExtra já ativo).
      if (!c.acaoExtra && !c.efeitos.some(e => e.tipo === 'rodada_extra')) {
        c.efeitos.push({ tipo: 'rodada_extra', duracao: null });
        _floatTexto(c.id, '✨ RODADA EXTRA!', 'vantagem-naipe');
      }
    }

    // Instantânea: volta pra etapa1 sem avançar turno
    _estadoPainel      = 'etapa1';
    _habSel            = null;
    _cartaSel          = null;
    _cartaSelIdx       = -1;
    _especialPendente  = null;
    _passarConfirmando = false;
    _renderizar();
  }

  // Q — Dama: remove TODOS os efeitos negativos do aliado escolhido (instantânea).
  // Chamado quando o jogador clica num aliado em sel_alvo_especial.
  function _resolverDama(alvoAliado) {
    const c = COMBAT.combatenteAtual();
    if (!c || !_especialPendente) return;
    _consumirEspecialDaMao(_especialPendente.idx);

    // Remove todos os efeitos negativos do aliado
    const _NEGATIVOS = new Set(['dot', 'frozen', 'stun', 'amaciado', 'encantado',
      'derretar_armadura', 'estatica', 'imagem_espelhada']);
    alvoAliado.efeitos = (alvoAliado.efeitos ?? []).filter(e =>
      !e.tipo.startsWith('debuff_') && !_NEGATIVOS.has(e.tipo)
    );
    PASSIVAS.recalcularStats(alvoAliado);

    _especialPendente = null;

    // Instantânea: volta pra etapa1 sem avançar turno
    _estadoPainel      = 'etapa1';
    _habSel            = null;
    _cartaSel          = null;
    _cartaSelIdx       = -1;
    _passarConfirmando = false;
    _renderizar();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STATUS POPUP — clica no personagem em batalha para inspeção informativa
  // ══════════════════════════════════════════════════════════════════════════

  // Ciclo de vantagem de naipe (espelha damage.js / naipes-mecanicas)
  const _NAIPE_VENCE = { '♥': '♣', '♣': '♦', '♦': '♠', '♠': '♥' };
  const _NAIPE_PERDE = { '♥': '♠', '♣': '♥', '♦': '♣', '♠': '♦' };
  const _NAIPE_NOME  = { '♥': '♥ Copas', '♣': '♣ Paus', '♦': '♦ Ouro', '♠': '♠ Espadas' };

  // Rótulo humano de um efeito ativo (usa nome do registry quando possível)
  function _efeitoLabel(e) {
    const map = {
      dot:               '🔥 Dano por turno',
      buff_atq:          '↑ +ATQ',          debuff_atq:        '↓ −ATQ',
      buff_def:          '▲ +DEF',          debuff_def:        '▽ −DEF',
      frozen:            '❄ Congelado',     stun:              '⊗ Atordoado',
      amaciado:          '⬇ Amaciado',      encantado:         '✦ Encantado',
      hearts_adv:        '❤ Vantagem Copas',
      clubs_furtivo:     '🌿 Furtivo (Paus)',
      imagem_espelhada:  '◈ Imagem Espelhada',
      derretar_armadura: '⚗ Armadura Derretida',
      congelado:         '❄ Congelado',
      radiacao:          '☢ Radiação',
      estatica:          '⚡ Estática',
      queimadura:        '🔥 Queimadura',
      resfriamento:      '❄ Resfriamento',
      enfraquecido:      '↓ Enfraquecido',
      exposto:           '▽ Exposto',
      odio_bonus:        '⊕ Ódio',
      rei_atq_bonus:     '♛ Bônus de Rei',
      // Instantâneas
      rodada_extra:      '♦ Rodada Extra',
      acao_rapida:       '⚡ Ação Rápida',
      critico:           '💥 Crítico',
    };
    if (map[e.tipo]) return map[e.tipo];
    if (typeof EFEITOS_DATA !== 'undefined' && EFEITOS_DATA[e.tipo]?.nome) {
      return EFEITOS_DATA[e.tipo].nome;
    }
    return e.tipo;
  }

  function _classeEfeito(e) {
    if (e.tipo.startsWith('buff'))   return 'buff';
    if (e.tipo.startsWith('debuff')) return 'debuff';
    if (e.tipo === 'dot' || e.tipo === 'frozen' || e.tipo === 'stun') return 'debuff';
    // Instantâneas são buffs
    if (e.tipo === 'rodada_extra' || e.tipo === 'acao_rapida' || e.tipo === 'critico') return 'buff';
    return 'neutro';
  }

  // Renderiza (ou re-renderiza) o popup de status pro combatente c.
  // Re-chamado em _renderizar se _statusPopupChar estiver setado (live update).
  function _mostrarStatusPersonagem(c) {
    _statusPopupChar = c;
    const existente = document.getElementById('battle-status-popup');
    if (existente) existente.remove();

    const screen = document.getElementById('screen-battle');
    if (!screen || !c) return;

    const corNaipe  = _COR_INI[c.naipe] ?? '#c9a84c';
    const naipeLbl  = _NAIPE_NOME[c.naipe] ?? '— sem naipe';
    const venceN    = c.naipe ? _NAIPE_VENCE[c.naipe] : null;
    const perdeN    = c.naipe ? _NAIPE_PERDE[c.naipe] : null;

    const atqCls = c.atq > (c.atqBase ?? c.atq) ? 'up' : c.atq < (c.atqBase ?? c.atq) ? 'down' : '';
    const defCls = c.def > (c.defBase ?? c.def) ? 'up' : c.def < (c.defBase ?? c.def) ? 'down' : '';
    const incCls = c.inc > (c.incBase ?? c.inc) ? 'up' : c.inc < (c.incBase ?? c.inc) ? 'down' : '';

    const hpPct = Math.max(0, Math.min(100, (c.hp / c.pvs) * 100));
    const hpCor = hpPct > 60 ? '#55cc88' : hpPct > 30 ? '#e8c050' : '#cc5555';

    // Habilidades slotadas
    const habsHtml = (c.habilidades || []).map((h, i) => {
      if (!h) return `<div class="bsp-skill vazio">— slot ${i + 1} vazio —</div>`;
      const cd = c.cooldowns[h._id] ?? 0;
      const tag = cd > 0 ? ` <span class="bsp-skill-cd">recarga ${cd}</span>` : '';
      return `
        <div class="bsp-skill">
          <div class="bsp-skill-nome">${h.nome}${tag}</div>
          <div class="bsp-skill-desc">${EFEITOS.destacar(h.descricao || '—')}</div>
        </div>`;
    }).join('');

    // Passivas slotadas
    const passivasHtml = (c.passivas || []).map((pid, i) => {
      if (!pid) return `<div class="bsp-passiva vazio">— slot ${i + 1} vazio —</div>`;
      const p = HABILIDADES.getPassiva(pid);
      return `
        <div class="bsp-passiva">
          <div class="bsp-passiva-nome">${p.nome}</div>
          <div class="bsp-passiva-desc">${EFEITOS.destacar(p.descricao || '—')}</div>
        </div>`;
    }).join('');

    // Efeitos ativos — cards com descrição + flags de estado
    const _efeitoCard = (cls, nome, desc, duracao) => {
      const durHtml = duracao != null
        ? `<span class="bsp-efeito-dur">${duracao}t</span>`
        : '';
      return `
        <div class="bsp-efeito ${cls}">
          <div class="bsp-efeito-header">
            <span class="bsp-efeito-nome">${nome}</span>${durHtml}
          </div>
          ${desc ? `<div class="bsp-efeito-desc">${desc}</div>` : ''}
        </div>`;
    };
    const efRows = [];

    for (const e of (c.efeitos || [])) {
      // duracao: null = instantânea (ativa até consumo); duracao > 0 = duração normal
      if (e.duracao !== null && (e.duracao ?? 0) <= 0) continue;
      const cls  = _classeEfeito(e);
      const nome = _efeitoLabel(e)
        + (e.valor !== undefined ? ` <span class="bsp-efeito-val">(${e.valor > 0 ? '+' : ''}${e.valor})</span>` : '');
      const desc = (typeof EFEITOS_DATA !== 'undefined' && EFEITOS_DATA[e.tipo])
        ? EFEITOS_DATA[e.tipo].descricao : '';
      efRows.push(_efeitoCard(cls, nome, desc, e.duracao));
    }

    // Bloqueios de extras (flags de estado — não são efeitos)
    if (c._acaoRapidaGasta) {
      efRows.push(_efeitoCard('debuff', '⚡✗ Ação Rápida (gasta)',
        'Ação rápida usada neste turno. Sem novas ações ou rodadas extras.', null));
    }
    if (c._rodadaExtraGasta) {
      efRows.push(_efeitoCard('debuff', '♦✗ Rodada Extra (ativa/gasta)',
        'Rodada extra em curso ou já usada neste turno. Sem novos extras.', null));
    }
    if ((c._acumulo ?? 0) > 0) {
      efRows.push(_efeitoCard('buff',
        `⚗ Acúmulo de Poder: ${c._acumulo} carga(s)`,
        'Cargas acumuladas ao passar rodada. Usadas na próxima habilidade de dano.', null));
    }
    if ((c._energiaCargas ?? 0) > 0) {
      efRows.push(_efeitoCard('buff',
        `⚡ Energia: ${c._energiaCargas} carga(s)`,
        'Cargas de energia acumuladas ao passar rodada. Potencializam a próxima habilidade.', null));
    }

    const efeitosHtml = efRows.length === 0
      ? '<div class="bsp-empty">Sem efeitos ativos.</div>'
      : efRows.join('');

    const popup = document.createElement('div');
    popup.id = 'battle-status-popup';
    popup.innerHTML = `
      <div id="battle-status-overlay"></div>
      <div id="battle-status-box">
        <button class="bsp-fechar" aria-label="Fechar">×</button>
        <div class="bsp-cabecalho">
          <span class="bsp-naipe" style="color:${corNaipe}">${c.naipe ?? '?'}</span>
          <div class="bsp-cab-nome">
            <div class="bsp-nome">${c.nome}</div>
            <div class="bsp-naipe-label" style="color:${corNaipe}aa">${naipeLbl}</div>
          </div>
        </div>
        ${venceN ? `
          <div class="bsp-vantagens">
            <div class="bsp-vant"><span class="bsp-tag-vant">VANTAGEM</span> contra <strong style="color:${_COR_INI[venceN] ?? '#888'}">${venceN}</strong></div>
            <div class="bsp-desv"><span class="bsp-tag-desv">DESVANTAGEM</span> contra <strong style="color:${_COR_INI[perdeN] ?? '#888'}">${perdeN}</strong></div>
          </div>` : ''}
        <div class="bsp-stats">
          <div class="bsp-stat"><span class="bsp-stat-l">ATQ</span><span class="bsp-stat-v ${atqCls}">${c.atq}</span></div>
          <div class="bsp-stat"><span class="bsp-stat-l">DEF</span><span class="bsp-stat-v ${defCls}">${c.def}</span></div>
          <div class="bsp-stat"><span class="bsp-stat-l">INC</span><span class="bsp-stat-v ${incCls}">${c.inc}</span></div>
        </div>
        <div class="bsp-hp">
          <div class="bsp-hp-bar"><div class="bsp-hp-fill" style="width:${hpPct}%;background:${hpCor}"></div></div>
          <div class="bsp-hp-txt">${c.hp} / ${c.pvs}</div>
        </div>
        <div class="bsp-secao">
          <div class="bsp-secao-titulo">HABILIDADES</div>
          ${habsHtml || '<div class="bsp-empty">Sem habilidades equipadas.</div>'}
        </div>
        <div class="bsp-secao">
          <div class="bsp-secao-titulo">PASSIVAS</div>
          ${passivasHtml || '<div class="bsp-empty">Sem passivas equipadas.</div>'}
        </div>
        <div class="bsp-secao">
          <div class="bsp-secao-titulo">EFEITOS ATIVOS</div>
          <div class="bsp-efeitos-lista">${efeitosHtml}</div>
        </div>
      </div>
    `;

    screen.appendChild(popup);

    const fechar = () => { popup.remove(); _statusPopupChar = null; };
    popup.querySelector('.bsp-fechar').addEventListener('click', fechar);
    popup.querySelector('#battle-status-overlay').addEventListener('click', fechar);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INICIAR / FINALIZAR TURNO
  // ══════════════════════════════════════════════════════════════════════════

  // Inicia o turno de um combatente: Início (deduce + DoT, once) + Etapa 1
  // (tick passivas + recalc + stun check). iniciarRodada é idempotente
  // (não dispara duas vezes pro mesmo turno).
  function _iniciarTurno(c) {
    if (!c || c.hp <= 0) return;
    COMBAT.iniciarRodada(c);
    COMBAT.rodarEtapa1(c);
    // (Se podeAgir for false por stun, ainda assim deixamos o turno seguir;
    // o resto da lógica de pular ação fica pra A.2 quando Congelado/Atordoado
    // existirem como efeitos registrados.)
  }

  // Processa a fila de contra-ataques/ataques em conjunto com feedback visual,
  // depois chama callback (normalmente _finalizarTurno). Cada entrada tem:
  //   { contraAtacante, alvo, tipo: 'contra' | 'conjunto' }
  function _processarContraAtaques(callback) {
    const fila = COMBAT.estado.contraAtaquesPendentes.splice(0);
    if (fila.length === 0) { callback(); return; }

    let i = 0;
    function _proximo() {
      if (i >= fila.length) { callback(); return; }

      const { contraAtacante, alvo, tipo } = fila[i++];

      // Pula se o atacante foi nocauteado antes de chegar sua vez na fila
      if (!contraAtacante || contraAtacante.hp <= 0) { _proximo(); return; }
      const hab = (contraAtacante.habilidades ?? []).find(h => h && !h.efeitoPuro);
      if (!hab) { _proximo(); return; }

      const rotulo  = tipo === 'contra' ? '↩ CONTRA-ATAQUE!' : '⚔ ATAQUE CONJUNTO!';
      const logTag  = tipo === 'contra' ? '↩' : '⚔';
      _floatTexto(contraAtacante.id, rotulo, 'vantagem-naipe');
      _animarSlot(contraAtacante.id, 'atacando');
      _logUI(`${logTag} ${contraAtacante.nome} (${hab.nome}) → ${alvo.nome}`, 'atk');

      setTimeout(() => {
        if (alvo.hp <= 0) { _renderizar(); setTimeout(_proximo, 300); return; }

        const hpAntes = _capturaHP();
        COMBAT.executarContraAtaque(contraAtacante, alvo);

        for (const cc of COMBAT.estado.combatentes) {
          const diff = (hpAntes[cc.id] ?? cc.hp) - cc.hp;
          if (diff > 0) {
            _animarSlot(cc.id, 'recebendo-dano');
            _floatDanoContado(cc.id, diff, 'dano');
            _logUI(`💥 ${cc.nome} recebeu ${diff} de dano`, 'dmg');
          }
        }

        _renderizar();
        setTimeout(_proximo, 450);
      }, _ANIM_DUR);
    }

    _proximo();
  }

  // Finaliza o turno: roda etapa5 (fim de rodada), avança combatente e renderiza.
  // ── Etapa 4 — Verifica ação extra antes de finalizar o turno ────────────────
  // Se o combatente tem acao_rapida ou rodada_extra (e não está bloqueado),
  // consome o efeito, re-roda Etapa 1 e devolve o controle ao jogador/IA.
  // Caso contrário, finaliza o turno normalmente.
  function _verificarEtapa4(c) {
    if (!c.acaoExtra) {
      const idxRapida = c.efeitos.findIndex(e => e.tipo === 'acao_rapida');
      const idxExtra  = c.efeitos.findIndex(e => e.tipo === 'rodada_extra');
      const idx       = idxRapida >= 0 ? idxRapida : idxExtra;

      if (idx >= 0) {
        const tipo = c.efeitos[idx].tipo;
        c.efeitos.splice(idx, 1);
        c.acaoExtra = true;
        if (tipo === 'acao_rapida') {
          c._acaoRapidaGasta = true;
          _floatTexto(c.id, '⚡ AÇÃO RÁPIDA!', 'vantagem-naipe');
        } else {
          c._rodadaExtraGasta = true;
          _floatTexto(c.id, '✨ RODADA EXTRA!', 'vantagem-naipe');
        }
        // Re-roda Etapa 1 (passivas tick + recalc + stun check)
        COMBAT.rodarEtapa1(c);
        _habSel        = null;
        _cartaSel      = null;
        _cartaSelIdx   = -1;
        _estadoPainel  = 'etapa1';
        _aguardando    = false;
        _renderizar();
        // Se for inimigo, agenda o turno extra da IA
        if (c.lado === 'inimigo') setTimeout(_turnoInimigo, 900);
        return;
      }
    }
    _finalizarTurno(c);
  }

  function _finalizarTurno(c) {
    const turnoAntes = COMBAT.estado.turno;
    COMBAT.etapa5_fimRodada(c);

    // Rodada extra pendente — efeito instantâneo rodada_extra (duracao: null)
    const estado = COMBAT.estado;
    for (const cb of estado.combatentes) {
      const idx = cb.efeitos.findIndex(e => e.tipo === 'rodada_extra');
      if (idx >= 0 && cb.hp > 0) {
        cb.efeitos.splice(idx, 1);        // consome o efeito
        cb.acaoExtra         = true;      // bloqueia novos extras neste turno
        cb._rodadaExtraGasta = true;      // ícone vermelho de rodada extra
        const jaTemExtra = estado.ordem.slice(estado.indiceAtual + 1).includes(cb);
        if (!jaTemExtra) estado.ordem.splice(estado.indiceAtual + 1, 0, cb);
        _floatTexto(cb.id, '♦ +RODADA!', 'vantagem-naipe');
      }
    }

    COMBAT.avancarCombatente();
    if (COMBAT.estado.turno > turnoAntes) {
      _logUI(`── TURNO ${COMBAT.estado.turno} ──`, 'turno');
    }
    const proximo = COMBAT.combatenteAtual();
    if (proximo) _iniciarTurno(proximo);
    _aguardando        = false;
    _estadoPainel      = 'etapa1';
    _habSel            = null;
    _cartaSel          = null;
    _cartaSelIdx       = -1;
    _especialPendente  = null;
    _passarConfirmando = false;
    _renderizar();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TURNO
  // ══════════════════════════════════════════════════════════════════════════

  // Confirmação no próprio botão: 1º clique muda visual, 2º clique executa.
  function _handlePassar(btn) {
    if (!_passarConfirmando) {
      _passarConfirmando = true;
      btn.textContent = '⏭ CONFIRMAR?';
      btn.classList.add('confirmando');
      // Auto-cancela em 3s se não houver 2º clique
      setTimeout(() => {
        if (_passarConfirmando) {
          _passarConfirmando = false;
          btn.textContent = '⏭  PASSAR';
          btn.classList.remove('confirmando');
        }
      }, 3000);
    } else {
      _passarConfirmando = false;
      _passarRodada();
    }
  }

  function _passarRodada() {
    const c = COMBAT.combatenteAtual();
    if (!c || c.lado !== 'jogador') return;
    // iniciarRodada já foi chamado em _iniciarTurno quando o turno começou.
    COMBAT.passarRodada(c);
    _floatTexto(c.id, '✦ CARTA +1', 'carta-comprada');
    _verificarEtapa4(c);
  }

  function _criarBtnDebug() {
    const frag = document.createDocumentFragment();

    const vencer = document.createElement('button');
    vencer.id          = 'battle-btn-debug-vencer';
    vencer.textContent = '[ vencer ]';
    vencer.addEventListener('click', _vencer);
    frag.appendChild(vencer);

    const perder = document.createElement('button');
    perder.id          = 'battle-btn-debug-perder';
    perder.textContent = '[ perder ]';
    perder.addEventListener('click', () => _fimDeBatalha('derrota'));
    frag.appendChild(perder);

    return frag;
  }

  // Turno do inimigo: IA decide; se for ataque de dano em jogador (alvo único),
  // mostra a tela de defesa antes de resolver. Outros casos resolvem direto.
  // iniciarRodada já foi chamado em _iniciarTurno quando o turno começou.
  function _turnoInimigo() {
    const c = COMBAT.combatenteAtual();
    if (!c || c.lado !== 'inimigo') {
      _aguardando = false;
      return;
    }

    const decisao = IA.decidir(c);
    if (!decisao || !decisao.hab) {
      COMBAT.passarRodada(c);
      _verificarEtapa4(c);
      return;
    }

    _logUI(`⚔ ${c.nome} usa ${decisao.hab.nome}`, 'atk');

    const alvosPlayer    = decisao.alvos.filter(a => a.lado === 'jogador' && a.hp > 0);
    const ehAtaqueComDef = !decisao.hab.efeitoPuro && alvosPlayer.length > 0;
    const temVantagIni   = !decisao.hab.efeitoPuro && decisao.alvos.some(a => DAMAGE.temVantagem(c.naipe, a.naipe));

    _showSkillBanner(decisao.hab, c).then(() => {
      _animarSlot(c.id, 'atacando');

      setTimeout(() => {
        if (ehAtaqueComDef) {
          _iniciarDefesa(c, decisao, alvosPlayer);
        } else {
          const hpAntes = _capturaHP();
          COMBAT.resolverAcao(c, decisao.hab, decisao.cartaIdx, decisao.alvos);

          let totalDano = 0;
          for (const cc of COMBAT.estado.combatentes) {
            const antes = hpAntes[cc.id] ?? cc.hp;
            const diff  = antes - cc.hp;
            const cura  = cc.hp - antes;
            if (diff > 0) {
              _animarSlot(cc.id, 'recebendo-dano');
              _floatDanoContado(cc.id, diff, 'dano');
              totalDano += diff;
            } else if (cura > 0) {
              _floatTexto(cc.id, `+${cura}`, 'cura');
            }
          }
          if (totalDano > 0) _screenShake(totalDano);

          if (temVantagIni) {
            _flashVantagem(c.id);
            setTimeout(() => _floatTexto(c.id, '▲ NAIPE', 'vantagem-naipe'), 120);
          }
          for (const alvo of decisao.alvos) {
            const dano = (hpAntes[alvo.id] ?? 0) - alvo.hp;
            if (dano > 0) _logUI(`💥 ${alvo.nome} recebeu ${dano} de dano`, 'dmg');
          }
          setTimeout(() => _processarContraAtaques(() => _verificarEtapa4(c)), 600);
        }
      }, _ANIM_DUR);
    });
  }

  // Configura a tela de defesa: vira uma fila de alvos jogador (1 ou mais).
  // Cada confirmação avança pro próximo. Quando a fila esvazia, resolve.
  function _iniciarDefesa(atacante, decisao, alvosPlayer) {
    _defesaPendente = {
      atacante, decisao,
      fila:              [...alvosPlayer],  // alvos restantes pra defender
      total:             alvosPlayer.length,
      alvoAtual:         null,
      dano:              0,
      defesasColetadas:  {},                // alvoId → cartaObj ou null
    };
    _avancarFilaDefesa();
  }

  // Tira o próximo alvo da fila e prepara a tela. Quando fila vazia, resolve.
  function _avancarFilaDefesa() {
    if (!_defesaPendente) return;
    if (_defesaPendente.fila.length === 0) {
      const { atacante, decisao, defesasColetadas } = _defesaPendente;
      const defesas = Object.keys(defesasColetadas).length > 0 ? defesasColetadas : null;

      // Captura HP antes do resolve para mostrar floats
      const hpAntes = _capturaHP();

      _defesaPendente = null;
      _defesaSel      = null;
      COMBAT.resolverAcao(atacante, decisao.hab, decisao.cartaIdx, decisao.alvos, defesas);

      // Floats de dano e log pós-defesa
      let totalDanoDef = 0;
      for (const alvo of decisao.alvos) {
        const dano = (hpAntes[alvo.id] ?? 0) - alvo.hp;
        if (dano > 0) {
          _animarSlot(alvo.id, 'recebendo-dano');
          _floatDanoContado(alvo.id, dano, 'dano');
          _logUI(`💥 ${alvo.nome} recebeu ${dano} de dano`, 'dmg');
          totalDanoDef += dano;
        } else {
          const cartaDef = defesas?.[alvo.id];
          if (cartaDef?.valor === 'J') {
            _floatTexto(alvo.id, 'ESQUIVA!', 'esquiva');
            _logUI(`✨ ${alvo.nome} esquivou com o Valete!`, 'info');
          } else if (hpAntes[alvo.id] !== undefined) {
            _floatTexto(alvo.id, 'BLOQUEADO', 'bloqueado');
          }
        }
      }
      if (totalDanoDef > 0) _screenShake(totalDanoDef);

      setTimeout(() => _processarContraAtaques(() => _verificarEtapa4(atacante)), 600);
      return;
    }

    _defesaPendente.alvoAtual = _defesaPendente.fila.shift();

    // Recalcula dano potencial pro alvo atual
    const cartaAtaque = (_defesaPendente.atacante.lado === 'jogador'
      ? COMBAT.estado.maoJogador
      : _defesaPendente.atacante.mao)[_defesaPendente.decisao.cartaIdx];
    _defesaPendente.dano = DAMAGE.calcularDano(
      _defesaPendente.atacante,
      _defesaPendente.alvoAtual,
      _defesaPendente.decisao.hab.poder ?? 0,
      cartaAtaque,
      _defesaPendente.decisao.hab.efeitoPuro,
    );

    _defesaSel = null;
    _renderizar();
  }

  // Processa um clique no painel de defesa — dupla confirmação.
  function _selecionarDefesa(novaSel) {
    if (!_defesaPendente || !_defesaPendente.alvoAtual) return;
    const igual = _defesaSel
      && _defesaSel.tipo === novaSel.tipo
      && _defesaSel.idx === novaSel.idx;
    if (igual) {
      // Confirma — registra escolha (objeto da carta, não índice — splice
      // por referência em resolverAcao evita bug com múltiplos alvos)
      const cartaObj = novaSel.tipo === 'carta'
        ? COMBAT.estado.maoJogador[novaSel.idx]
        : null;
      _defesaPendente.defesasColetadas[_defesaPendente.alvoAtual.id] = cartaObj;
      _avancarFilaDefesa();
    } else {
      _defesaSel = novaSel;
      _renderizar();
    }
  }

  // Botão de debug — atalho direto para a tela de vitória.
  function _vencer() {
    _fimDeBatalha('vitoria');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FIM DE BATALHA — tela de resultado (vitória / derrota)
  // ══════════════════════════════════════════════════════════════════════════

  function _fimDeBatalha(resultado) {
    const screen = document.getElementById('screen-battle');
    if (!screen) return;
    screen.innerHTML = '';
    screen.style.display = 'block';

    const ehVitoria = resultado === 'vitoria';
    const jogadores = COMBAT.estado.combatentes.filter(c => c.lado === 'jogador');

    const cards = jogadores.map(c => {
      const cor    = _COR_INI[c.naipe] ?? '#888';
      const { bg } = GRAD_NAIPE[c.naipe] ?? GRAD_NEUTRO;
      const vivo   = c.hp > 0;
      const hpPct  = Math.max(0, Math.min(100, (c.hp / c.pvs) * 100));
      const fimInner = (typeof CHAR_SPRITE !== 'undefined' && CHAR_SPRITE.MAP[c.poolId])
        ? `<img class="csp-img fill" src="${CHAR_SPRITE.MAP[c.poolId]}" draggable="false" alt="">`
        : `<span class="battle-fim-char-naipe" style="color:${cor}">${c.naipe ?? '?'}</span>`;
      return `
        <div class="battle-fim-char${vivo ? '' : ' morto'}">
          <div class="battle-fim-char-card" style="background:${bg};">
            ${fimInner}
            <span class="battle-fim-char-nome">${c.nome}</span>
          </div>
          <div class="battle-fim-char-hp-bar">
            <div class="battle-fim-char-hp-fill" style="width:${hpPct}%"></div>
          </div>
          <div class="battle-fim-char-hp-txt">${vivo ? `${c.hp}/${c.pvs}` : 'CAÍDO'}</div>
        </div>`;
    }).join('');

    const overlay = document.createElement('div');
    overlay.id = 'battle-fim';
    overlay.className = ehVitoria ? 'vitoria' : 'derrota';
    overlay.innerHTML = `
      <div id="battle-fim-bg"></div>
      <div id="battle-fim-content">
        <div id="battle-fim-titulo">${ehVitoria ? '⚔ VITÓRIA' : '💀 DERROTA'}</div>
        <div id="battle-fim-chars">${cards}</div>
        ${ehVitoria
          ? `<div id="battle-fim-pontos">+${_pontos} PTS</div>`
          : `<div id="battle-fim-sub">Seu time foi derrotado.</div>`}
        <button id="battle-fim-btn">${ehVitoria ? 'CONTINUAR →' : '← VOLTAR AO MAPA'}</button>
      </div>
    `;
    screen.appendChild(overlay);

    overlay.querySelector('#battle-fim-btn').addEventListener('click', () => {
      screen.style.display = 'none';
      screen.innerHTML = '';

      // Sincroniza HP de volta pro PLAYER_STATE
      if (typeof sincronizarHpPosBatalha === 'function') {
        sincronizarHpPosBatalha(COMBAT.estado.combatentes);
      }

      // Verifica game over: todos os personagens com hpAtual = 0
      const todosCalidos = PLAYER_STATE.personagens.length > 0 &&
        PLAYER_STATE.personagens.every(p => p.hpAtual <= 0);

      if (todosCalidos) {
        if (typeof gameOver === 'function') gameOver();
        window.irParaTela('screen-gameover');
        if (typeof GAMEOVER !== 'undefined') GAMEOVER.init();
        return;
      }

      if (ehVitoria) { if (_onVitoria) _onVitoria(); }
      else           { if (_onDerrota) _onDerrota(); }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // API PÚBLICA
  // ══════════════════════════════════════════════════════════════════════════

  return { init };

})();
