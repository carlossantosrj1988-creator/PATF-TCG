# PATF TCG — Cartas, Cálculos e Vantagens de Naipe

*Documento de design — definido na sessão 006 (2026-05-13)*

---

## 1. O Baralho

- **54 cartas** no total
- **36 cartas numéricas** — A2 a 10 nos 4 naipes (♥ ♣ ♦ ♠)
- **18 cartas especiais** — J, Q, K, A, ★ (distribuídas nos naipes onde aplicável)

---

## 2. Cálculo de Dano

**Dano base = ATQ + PODER da skill + valor da carta**

- **ATQ** — atributo de ataque do personagem
- **PODER** — valor fixo definido na habilidade usada
- **Valor da carta** — valor da carta de ativação escolhida pelo jogador

### Resolução de Defesa

**Dano final = Dano base − Defesa**

- **Defesa com carta:** DEF base + valor da carta de defesa
- **Defesa sem carta (passar):** apenas DEF base do personagem

Se a defesa absorver todo o dano, efeitos condicionais a "causou dano" não ativam.

---

## 3. Bônus de Especialidade (Naipe)

Se o personagem usa uma carta **do mesmo naipe que o seu**, o valor da carta é **dobrado** no cálculo de dano.

**Exemplo:** personagem ♥ usa carta ♥3 → valor 6 no cálculo de dano.

**Não se aplica a:**
- Habilidades de efeito puro (sem dano)
- Defesa (usar carta de defesa do mesmo naipe não dobra o valor)

---

## 4. Vantagens e Desvantagens de Naipe

O ciclo de vantagem segue a ordem:

```
♥ Copas → ♣ Paus → ♦ Ouro → ♠ Espadas → ♥ Copas
```

Cada naipe é forte contra o próximo no ciclo e fraco contra o anterior.

| Naipe | Vantagem contra | Desvantagem contra |
|---|---|---|
| ♥ Copas | ♣ Paus | ♠ Espadas |
| ♣ Paus | ♦ Ouro | ♥ Copas |
| ♦ Ouro | ♠ Espadas | ♣ Paus |
| ♠ Espadas | ♥ Copas | ♦ Ouro |

A detecção de naipe ocorre na **Etapa 3** antes de aplicar o dano — modifica o valor final antes da resolução.

> Os valores exatos de bônus e penalidade de naipe serão definidos após testes de balanceamento.

---

## 5. Cartas Especiais

Cartas especiais são ações independentes — usadas diretamente da mão, fora do fluxo de habilidade.

**Regra geral:** cartas especiais não podem ser usadas durante o fluxo de seleção de habilidade nem durante a defesa, **exceto o J**, que é exclusivo da fase de defesa.

### J — Valete

- **Categoria:** Defesa
- **Uso:** aparece como opção na tela de defesa
- **Efeito:** esquiva da habilidade de ataque — nega o dano completamente

### Q — Dama

- **Categoria:** Buffs/Debuffs
- **Uso:** ativada na Etapa 2 como ação própria
- **Efeito:** remove 1 debuff aleatório de um personagem aliado selecionado

### K — Rei

- **Categoria:** Ataque
- **Uso:** ativada na Etapa 2 como ação própria
- **Efeito:** o próximo ataque de dano do personagem ganha +10 ATQ

### A — Ás

- **Categoria:** Utilidade
- **Uso:** ativada na Etapa 2 como ação própria
- **Efeito:** compra 1 carta do baralho

### ★ — Coringa

- **Categoria:** Especial
- **Uso:** ativada na Etapa 2 como ação própria
- **Efeito:** concede uma rodada extra (resolve na Etapa 4 — sujeito à regra de exclusividade com ação rápida)

---

## 6. Expansão Futura

As 5 cartas especiais acima são o conjunto base do lançamento.

Após o lançamento, novas cartas especiais serão adicionadas ao jogo. Os efeitos das cartas especiais serão trocáveis — cada carta funciona como um slot que pode receber diferentes habilidades. Os efeitos listados acima são os padrões do lançamento inicial.

---

*Próximo documento: tags de habilidade (PODER · TIPO · ALVO · TURNO · RECARGA · AÇÃO) e como skills e passivas entram em batalha.*
