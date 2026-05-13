# Sessão 006 — Documentação completa de jogabilidade

**Data:** 2026-05-13

---

## Estado de Entrada

- Tela de Status com Atlas concluída (sessão 005)
- `naipes/naipes.js` criado com `NAIPES_DATA`, bônus de naipe, custo progressivo
- Regras base do jogo existiam apenas como resumo no contexto base
- Nenhuma documentação detalhada de mecânicas existia no repositório

---

## O Que Fizemos

- Criada a pasta `game-design/` no repositório
- Definidas e documentadas todas as mecânicas base do jogo em 4 arquivos

### 01_estrutura-de-turno.md
- Fluxo pré-combate: mão de 10 cartas, fase de iniciativa, valores J/Q/K/A/★ para iniciativa, regras de desempate em cascata, passivas de entrada
- Layout da tela de batalha: barra de iniciativa no topo, campo expansível (jogador esquerda / inimigo direita), painel de ação fixo dividido em 2
- Turno do jogador: fluxo de ataque em 3 etapas (skill → carta → alvo) com voltar em cada etapa, passar a rodada compra 1 carta
- Dupla função da carta: ativação obrigatória + valor de dano
- Defesa: tela reativa com dupla confirmação, DEF+carta ou DEF base, habilidades de efeito puro sem defesa
- Estrutura da IA: baralho próprio, layer de conhecimento universal + layer de comportamento scriptado, sem tela de defesa
- Popup de personagem em batalha: conteúdo completo (nome, naipe, atributos, vida, passivas, habilidades, efeitos ativos), variação para monstros (a definir) e PvP (transparência total)

### 02_ciclo-de-rodada.md
- Definição de **Turno** (todos agiram uma vez, compra 1 carta no início)
- Definição de **Rodada** (vez de um único personagem, 5 etapas)
- Início da Rodada: cooldowns/buffs/debuffs deduzidos, DoT ativa — tudo uma vez
- Etapa 1: verificação de contadores/marcadores e de perda de rodada
- Etapa 2: combate — habilidade ou passar a rodada; cartas especiais como ação própria; regra de bloqueio de cartas especiais no fluxo de habilidade e defesa
- Etapa 3: resolução de dano — naipe detectado primeiro, efeitos disparam em ordem, condição de dano para efeitos condicionais
- Etapa 4: ação rápida e rodada extra — mesma condição de código, mutuamente exclusivas, retornam para Etapa 2, TAG conta como Normal durante a ação extra
- Etapa 5: fim de turno — efeitos de fim de turno, passivas de passar a rodada, ordem interna (início/fim da etapa)

### 03_cartas-e-calculos.md
- Cálculo de dano: ATQ + PODER + valor da carta
- Resolução de defesa: dano − (DEF + carta ou DEF base)
- Bônus de especialidade: carta do mesmo naipe do personagem → valor dobrado (só no dano de ataque)
- Ciclo de vantagem de naipe: ♥ → ♣ → ♦ → ♠ → ♥
- Cartas especiais: J (esquiva na defesa), Q (remove debuff), K (+10 ATQ no próximo ataque), A (compra carta), ★ (rodada extra)
- Nota de expansão: efeitos das cartas especiais serão trocáveis após o lançamento

### 04_tags-de-habilidade.md
- PODER: valor numérico ou `EFEITO` para efeito puro
- TIPO: categoria para identificação e interações
- ALVO: Alvo único / Área / Aliados / Inimigos / Si próprio
- TURNO: SIM (disponível no 1º turno) / NÃO (começa com 1 rodada de recarga)
- RECARGA: rodadas até reusar após ativar
- AÇÃO: N (Normal) / R (Rápida) / F (Furtiva) / L (Lenta)

---

## Decisões Tomadas

- Iniciativa usa carta + INC — sem aleatoriedade escondida, jogador escolhe qual carta alocar
- Toda habilidade obrigatoriamente usa 1 carta como ativação
- Cartas especiais são ações independentes — bloqueadas no fluxo de habilidade e defesa, exceto J que é exclusivo da defesa
- Ação rápida e rodada extra compartilham a mesma condição de código e são mutuamente exclusivas
- Bônus de especialidade não se aplica em efeito puro nem em defesa
- IA tem baralho próprio e opera pelo mesmo sistema, comportamento scriptado com dois layers
- PvP tem popup completo bilateral — transparência intencional para descoberta de builds
- Tags de AÇÃO têm 4 tipos: N / R / F / L

---

## Próxima Sessão (007)

- **Engine base do jogo** — primeira sessão de implementação do motor
- Conectar tudo que foi documentado nas sessões 006 em código
- Conforme as screens forem sendo criadas, o engine cresce junto com elas
- Escopo exato definido no início da sessão 007

---

## Arquivos Tocados

**Criados**
- `game-design/01_estrutura-de-turno.md`
- `game-design/02_ciclo-de-rodada.md`
- `game-design/03_cartas-e-calculos.md`
- `game-design/04_tags-de-habilidade.md`
- `Claude memory/sessoes/sessao-006_documentacao-jogabilidade.md` — este arquivo
