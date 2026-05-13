# PATF TCG — Estrutura de Turno e Combate

*Documento de design — definido na sessão 006 (2026-05-13)*

---

## 1. Pré-Combate

### 1.1 Mão Inicial

- O baralho é embaralhado no início de cada batalha
- O jogador compra **10 cartas** aleatórias do baralho
- Dessas 10, **3 serão usadas na fase de iniciativa** (uma por personagem)
- As **7 restantes** ficam na mão e são usadas durante o combate

### 1.2 Fase de Iniciativa

O jogador atribui **1 carta por personagem** como carta de iniciativa.

**Valor final de iniciativa = valor da carta + INC do personagem**

**Valores das cartas para iniciativa:**

| Carta | Valor |
|---|---|
| 2 a 10 | Valor de face |
| J (Valete) | 11 |
| Q (Dama) | 12 |
| K (Rei) | 13 |
| A (Ás) | 14 |
| ★ (Coringa) | 15 |

> Esses valores são exclusivos para o cálculo de iniciativa.
> As cartas especiais têm efeitos próprios no combate — ver documento de cartas.

### 1.3 Desempate de Iniciativa

Quando dois ou mais combatentes têm o mesmo valor final, o desempate ocorre em cascata:

1. **Maior carta** — quem usou a carta de maior valor vai primeiro
2. **Maior INC** — quem tem o status de iniciativa mais alto vai primeiro
3. **50/50** — se ainda empatado, sorteio aleatório define a ordem

### 1.4 Passivas de Entrada

Após a definição da ordem, uma tela exibe as **passivas de entrada** de todos os combatentes.

- Passivas de entrada são passivas que disparam **antes do primeiro turno**
- A tela é **informativa** — o jogador não interage, apenas visualiza o que ativou
- Após a exibição, a ordem de iniciativa é confirmada e o combate começa

---

## 2. Layout da Tela de Batalha

```
┌─────────────────────────────────────────────────────────┐
│  [ÍCONE] [ÍCONE] [ÍCONE] [ÍCONE] [ÍCONE] [ÍCONE]       │  ← Barra de iniciativa (ordem de ação)
├────────────────────────┬────────────────────────────────┤
│                        │                                │
│  Personagens           │  Personagens                   │
│  do Jogador            │  do Inimigo                    │
│  (esquerda)            │  (direita)                     │
│                        │                                │
│  Campo expansível      │  Campo expansível               │
│                        │                                │
├────────────────────────┴────────────────────────────────┤
│                                                         │
│  Painel de Ação — dividido em 2                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Topo:** barra com ícones de todos os combatentes na ordem de iniciativa, atualizada em tempo real.

**Campo esquerdo:** personagens do jogador. Sempre começa com 3, mas o campo é livre para expandir — habilidades futuras (ex: necromante) podem gerar mais combatentes.

**Campo direito:** personagens do inimigo. Também expansível.

**Painel inferior:** área de ação fixa, sempre visível, dividida em 2 seções. O conteúdo muda conforme o estado do turno.

---

## 3. Turno do Jogador

Quando chega a vez de um personagem do jogador, o painel inferior exibe:

```
┌─────────────────────────┬───────────────────────────────┐
│       HABILIDADES       │        PASSAR A RODADA        │
└─────────────────────────┴───────────────────────────────┘
```

### 3.1 Passar a Rodada

- O personagem **não age** neste turno
- Como recompensa, o jogador **compra 1 carta** do baralho
- Funciona como descanso — sacrifica ação, ganha gás para os próximos turnos

### 3.2 Habilidades — Fluxo de Ataque

Ao clicar em Habilidades, o painel inferior muda para:

```
┌─────────────────────────┬───────────────────────────────┐
│  Skills do personagem   │   Cartas da mão do jogador    │
│  (com status e recarga) │                               │
└─────────────────────────┴───────────────────────────────┘
```

O jogador executa **3 etapas em sequência**, com opção de **voltar** em cada uma:

**Etapa 1 — Selecionar a habilidade**
- Lista as habilidades slotadas do personagem
- Cada habilidade exibe: nome, descrição básica, status (disponível / em recarga)
- Ao selecionar, aparece opção de fechar/cancelar na própria habilidade
- Pode voltar para o menu Habilidades / Passar a Rodada

**Etapa 2 — Selecionar a carta**
- O jogador escolhe 1 carta da mão direita para usar junto com a habilidade
- **Toda habilidade obrigatoriamente requer 1 carta para ser ativada** — seja de dano ou de efeito puro
- Pode voltar e trocar a habilidade selecionada

**Etapa 3 — Selecionar o alvo**
- O jogador toca no alvo da habilidade no campo de batalha
- A ação é confirmada e executada
- Pode voltar e trocar a carta selecionada

> **A carta tem dupla função:**
> - **Ativação** — obrigatória para qualquer habilidade funcionar
> - **Valor de dano** — para habilidades de dano, o valor da carta entra no cálculo (ATQ + PODER + valor da carta)
>
> Estratégia: cartas de valor baixo são guardadas para ativar habilidades de efeito puro (onde o valor não importa). Cartas de valor alto são reservadas para maximizar dano.

---

## 4. Defesa

Quando o inimigo ataca um personagem do jogador, a **tela de defesa** é exibida:

```
┌─────────────────────────────────────────────────────────┐
│  [Atacante] causará X de dano                           │
├─────────────────────────┬───────────────────────────────┤
│        PASSAR           │   Cartas da mão do jogador    │
└─────────────────────────┴───────────────────────────────┘
```

### 4.1 Defender com Carta

1. Jogador clica na carta que quer usar como defesa
2. Jogador clica novamente para **confirmar** (dupla confirmação)
3. Resolução: **DEF base + valor da carta = defesa total**

### 4.2 Passar (Defesa Base)

1. Jogador clica em Passar
2. Jogador clica novamente para **confirmar** (dupla confirmação)
3. Resolução: apenas **DEF base** do personagem

> A dupla confirmação na defesa existe para evitar clique acidental — a tela aparece de forma reativa e o jogador pode tocar sem intenção.
>
> No ataque, a confirmação é o próprio fluxo de 3 etapas com retorno disponível — estados diferentes, UX diferentes.

### 4.3 Habilidades de Efeito Puro

Habilidades que não causam dano (buffs, debuffs, cura, controle) **não geram tela de defesa**. O efeito resolve diretamente — não há dano para ser defendido.

---

## 5. A IA

### 5.1 Estrutura

A IA tem o **próprio baralho** e opera com o mesmo sistema do jogador:
- Participa da iniciativa pelas mesmas regras (carta + INC)
- Tem uma mão de cartas que usa para ativar habilidades e defender
- Age com skill + carta + alvo como qualquer combatente

### 5.2 Dois Layers

**Layer 1 — Conhecimento universal (herda do jogo)**
A IA conhece as regras do mundo: cálculos de dano, vantagens de naipe, o que cada carta faz, como a iniciativa funciona. Esse conhecimento é automático — a IA sabe porque o jogo sabe.

**Layer 2 — Comportamento próprio (scriptado)**
Como a IA age com esse conhecimento é definido pelo designer. Exemplo: uma IA ♥ sabe que é forte contra ♣ — o script define se ela prioriza atacar personagens ♣ ou não. A decisão é dela, dentro do roteiro definido.

### 5.3 Regras Internas vs Engine

- O jogador é controlado pelo engine — o que é proibido é bloqueado em código
- A IA se controla pelo script — edge cases são resolvidos dentro do comportamento dela, não pelo engine
- Isso elimina bugs de estado sem precisar de safeguards adicionais no motor do jogo

### 5.4 Defesa da IA

A IA não exibe tela de defesa. Suas decisões defensivas (usar carta ou passar) são resolvidas automaticamente pelo script, com base na mão disponível e nas regras de comportamento definidas.

---

## 6. Popup de Personagem em Batalha

Clicar em qualquer personagem durante o combate abre um **popup de status**. O popup é informativo — o jogador consulta sem agir.

### 6.1 Personagens do Jogador

Conteúdo completo:

- **Nome do personagem + naipe ativo**
- **Vantagem do naipe** — descrição do que o naipe é forte contra
- **Desvantagem do naipe** — descrição do que o naipe é fraco contra
- **Atributos atualizados** — valores em tempo real, buffs em verde, debuffs em vermelho
- **Vida + barra de vida** — valor máximo e valor atual em tempo real
- **Passivas slotadas** — com descrição completa e detalhada de cada uma
- **Habilidades slotadas** — com descrição completa e detalhada de cada uma
- **Efeitos ativos** — lista de buffs/debuffs em vigor, com descrição completa e duração em tempo real

> As descrições de naipe (vantagem/desvantagem) ficam visíveis no popup para que jogadores novos possam consultar durante a batalha, sem precisar sair do combate.

### 6.2 Personagens do Inimigo (PvE)

Popup existirá, mas com **formato diferente** — a definir. O nível de informação exposta sobre o inimigo é uma decisão de design separada.

### 6.3 PvP

Ambos os jogadores podem ver o popup completo um do outro — **transparência total e intencional**. Se um jogador está perdendo para uma build específica, ele pode inspecionar os detalhes e, eventualmente, tentar replicá-la.

---

*Próximo documento: cálculo de dano e defesa detalhado, vantagens de naipe em combate, cartas especiais.*
