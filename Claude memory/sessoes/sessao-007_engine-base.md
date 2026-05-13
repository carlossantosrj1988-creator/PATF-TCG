# Sessão 007 — Engine base do jogo

**Data:** 2026-05-13

---

## Estado de Entrada

- Sessão 006 entregou os 4 documentos de game design (estrutura de turno, ciclo de rodada, cálculos, tags de habilidade) + layout da tela de batalha
- Pasta `game-design/` completa com 5 arquivos `.md`
- Pasta `engine/` não existia

---

## O Que Fizemos

Criada a pasta `engine/` com 3 arquivos independentes e organizados por responsabilidade:

### engine/deck.js
- Baralho de 54 cartas: 36 numéricas (2-10 × 4 naipes) + 16 especiais (J/Q/K/A × 4 naipes) + 2 coringas (★ sem naipe)
- `criarBaralho()` — retorna array de 54 objetos `{ tipo, valor, naipe, label }`
- `embaralhar(baralho)` — Fisher-Yates, não muta o original
- `comprar(baralho, n)` — retorna `{ cartas, resto }`
- `valorIniciativa(carta)` e `valorDano(carta)` — mapeamento 2-10=face, J=11, Q=12, K=13, A=14, ★=15
- `ehEspecial(carta)` — true para especiais e coringas

### engine/damage.js
- Ciclo de vantagem de naipe: ♥→♣→♦→♠→♥
- `multiplicadorNaipe(naipeAtacante, naipeAlvo)` — 1.5 (vantagem) / 0.75 (desvantagem) / 1 (neutro)
- `temVantagem()` e `temDesvantagem()` — helpers de consulta
- `valorComEspecialidade(carta, naipePersonagem)` — dobra valor se mesma naipe (só no dano de ataque)
- `calcularDano(atacante, alvo, poder, carta, ehEfeitoPuro)` — ATQ + PODER + carta×especialidade × mult de naipe
- `calcularDefesa(defensor, carta)` — DEF + carta (ou só DEF base)
- `resolverDano(danoTotal, defesaTotal)` — dano real sofrido (mínimo 0)

### engine/combat.js
- `criarCombatente(origem, lado)` — monta objeto de combatente com baralho próprio embaralhado
- `init(personagens, inimigos)` — inicializa `BATTLE_STATE` com combatentes de ambos os lados
- `calcularIniciativa(cartasAlocadas)` — ordena por carta+INC com desempate em cascata (carta → INC → sorteio)
- `combatenteAtual()` — quem está agindo agora
- `iniciarRodada(combatente)` — deduz cooldowns/buffs/debuffs, aplica DoT
- `etapa1_verificacoes(combatente)` — verifica `perda_rodada`
- `passarRodada(combatente)` — compra 1 carta
- `etapa3_resolucaoDano(...)` — aplica dano e defesa, atualiza HP, retorna `{ danoReal, causouDano }`
- `etapa4_acaoExtra(combatente, temAcaoRapida, temRodadaExtra)` — controla ação extra (mutuamente exclusiva)
- `etapa5_fimRodada(combatente)` — efeitos de fim de turno
- `avancarCombatente()` — próximo na ordem; retorna true quando o turno fecha
- `adicionarEfeito(combatente, efeito)` — adiciona buff/debuff/DoT
- `verificarFimDeBatalha()` — retorna `'vitoria'|'derrota'|null`

### index.html
- Adicionados os 3 scripts na ordem correta de dependência: `deck → damage → combat`

---

## Decisões Tomadas

- Engine = funções puras + um único objeto de estado (`BATTLE_STATE`), sem acoplamento com a UI
- Cada arquivo tem seções demarcadas com `// ══...` para facilitar `grep -n`
- Combatentes têm baralho próprio (cada um embaralha 54 cartas no init — igual ao jogador e IA)
- Efeitos são objetos `{ tipo, valor, duracao, gatilho }` — extensível por novas habilidades sem tocar no engine
- Etapa 2 (combate real) não está no combat.js — é responsabilidade da tela de batalha orquestrar o fluxo de UI e chamar as funções do engine
- `_aplicarEfeito` (fim de rodada) está como ponto de extensão vazio — será populado conforme as habilidades forem criadas

---

## Próxima Sessão (008)

- **Tela Principal (Hub)** — `screens/main/` com os 4 botões de navegação: Survivor / PvP / Status / Equipamentos
- Tela simples de hub: recebe `PLAYER_STATE` e exibe os 3 personagens + opções
- Conecta o fluxo Teste: Select → Tutorial → **Main** → Survivor

---

## Arquivos Tocados

**Criados**
- `engine/deck.js`
- `engine/damage.js`
- `engine/combat.js`
- `Claude memory/sessoes/sessao-007_engine-base.md` — este arquivo

**Modificados**
- `index.html` — adicionados os 3 scripts da engine
