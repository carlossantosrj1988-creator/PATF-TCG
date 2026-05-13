// engine/damage.js
// Cálculos de dano, defesa e bônus de naipe.
// Funções puras — recebem dados, retornam valores, não alteram estado.
// Depende de: engine/deck.js (DECK.valorDano)

const DAMAGE = (() => {

  // ── Ciclo de vantagem de naipe ────────────────────────────────────────────
  //
  //  ♥ → ♣ → ♦ → ♠ → ♥
  //  (seta = "é fraco contra")
  //
  //  ♥ vence ♠,  perde para ♣
  //  ♣ vence ♥,  perde para ♦
  //  ♦ vence ♣,  perde para ♠
  //  ♠ vence ♦,  perde para ♥

  const FORTE_CONTRA    = { '♥': '♠', '♣': '♥', '♦': '♣', '♠': '♦' };
  const FRACO_CONTRA    = { '♥': '♣', '♣': '♦', '♦': '♠', '♠': '♥' };

  const MULT_VANTAGEM    = 1.5;
  const MULT_DESVANTAGEM = 0.75;

  // ── Naipe ─────────────────────────────────────────────────────────────────

  // Retorna 1.5 (vantagem), 0.75 (desvantagem) ou 1 (neutro)
  function multiplicadorNaipe(naipeAtacante, naipeAlvo) {
    if (!naipeAtacante || !naipeAlvo) return 1;
    if (FORTE_CONTRA[naipeAtacante] === naipeAlvo)  return MULT_VANTAGEM;
    if (FRACO_CONTRA[naipeAtacante] === naipeAlvo)  return MULT_DESVANTAGEM;
    return 1;
  }

  function temVantagem(naipeAtacante, naipeAlvo) {
    return !!naipeAtacante && FORTE_CONTRA[naipeAtacante] === naipeAlvo;
  }

  function temDesvantagem(naipeAtacante, naipeAlvo) {
    return !!naipeAtacante && FRACO_CONTRA[naipeAtacante] === naipeAlvo;
  }

  // ── Especialidade ─────────────────────────────────────────────────────────

  // Carta do mesmo naipe do personagem → valor de dano dobrado.
  // Só se aplica em dano de ataque — não em efeito puro, não na defesa.
  function valorComEspecialidade(carta, naipePersonagem) {
    const base = DECK.valorDano(carta);
    if (naipePersonagem && carta.naipe && naipePersonagem === carta.naipe) {
      return base * 2;
    }
    return base;
  }

  // ── Cálculo de dano ───────────────────────────────────────────────────────

  // Retorna o dano bruto (antes da defesa).
  //
  // atacante: { atq, naipe }
  // alvo:     { naipe }
  // poder:    valor numérico da habilidade (0 para efeito puro)
  // carta:    objeto de carta usado na ativação
  // ehEfeitoPuro: true = habilidade sem dano (buffs, debuffs, cura, controle)
  //
  function calcularDano(atacante, alvo, poder, carta, ehEfeitoPuro = false) {
    if (ehEfeitoPuro) return 0;

    const valCarta  = valorComEspecialidade(carta, atacante.naipe);
    const danoBase  = atacante.atq + poder + valCarta;
    const mult      = multiplicadorNaipe(atacante.naipe, alvo.naipe);

    return Math.max(0, Math.floor(danoBase * mult));
  }

  // ── Cálculo de defesa ─────────────────────────────────────────────────────

  // carta: objeto de carta usado na defesa, ou null (DEF base)
  function calcularDefesa(defensor, carta = null) {
    const valCarta = carta ? DECK.valorDano(carta) : 0;
    return defensor.def + valCarta;
  }

  // ── Resolução ─────────────────────────────────────────────────────────────

  // Dano real sofrido após a defesa.
  function resolverDano(danoTotal, defesaTotal) {
    return Math.max(0, danoTotal - defesaTotal);
  }

  // ── API pública ───────────────────────────────────────────────────────────

  return {
    calcularDano,
    calcularDefesa,
    resolverDano,
    multiplicadorNaipe,
    temVantagem,
    temDesvantagem,
    valorComEspecialidade,
    FORTE_CONTRA,
    FRACO_CONTRA,
  };

})();
