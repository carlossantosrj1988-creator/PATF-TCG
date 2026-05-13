# PATF TCG — Ciclo de Rodada e Turno

*Documento de design — definido na sessão 006 (2026-05-13)*

---

## Definições

### Turno

O estado completo do combate após todos os combatentes agirem uma vez.

- O turno só fecha quando o último da ordem de iniciativa agiu
- Serve como contador de etapas do combate
- **No início de cada turno:** jogador e inimigo compram 1 carta do baralho

### Rodada

A vez de um único personagem agir. Dividida em 5 etapas sequenciais.

---

## Estrutura da Rodada

```
INÍCIO DA RODADA
      ↓
  ETAPA 1 — Verificações pré-ação
      ↓
  ETAPA 2 — Combate
      ↓
  ETAPA 3 — Resolução de dano
      ↓
  ETAPA 4 — Ação rápida / Rodada extra
      ↓
  ETAPA 5 — Fim de turno
      ↓
PRÓXIMO PERSONAGEM NA ORDEM DE INICIATIVA
```

---

## Início da Rodada

Antes das etapas, no momento em que a rodada do personagem começa:

- Durações de **cooldown**, **buffs** e **debuffs** são deduzidas em **1**
- Efeitos de **DoT** (dano ao longo do tempo) são calculados e aplicados
- Tudo ocorre **uma única vez** — duração deduzida e DoT ativado juntos, sem dupla contagem

---

## Etapa 1 — Verificações Pré-Ação

Antes do personagem agir, o jogo realiza duas verificações em ordem:

**a) Verificação de contadores e marcadores**
- Contadores e marcadores aplicados por habilidades, passivas ou outros efeitos são verificados
- O resultado alimenta as lógicas das etapas seguintes

**b) Verificação de perda de rodada**
- Verifica se algum efeito ativo impede o personagem de agir completamente
- Se sim, o personagem pula direto para a Etapa 5 sem passar pelas etapas intermediárias

---

## Etapa 2 — Combate

Após as verificações da Etapa 1, o personagem ganha controle para agir.

O jogador escolhe entre:

### Habilidade

Fluxo em 3 etapas com opção de voltar em cada uma:

1. **Seleciona a habilidade** — lista as skills slotadas com status (disponível / em recarga)
2. **Seleciona a carta** — escolhe 1 carta da mão para ativar a habilidade
3. **Seleciona o alvo** — confirma e executa

Toda habilidade obrigatoriamente requer 1 carta como ativação — seja de dano ou de efeito puro.

### Carta Especial

Cartas especiais (J, Q, K, A, ★) podem ser usadas diretamente como ação própria, clicando nelas para ativar seu efeito.

**Regra:** cartas especiais **não podem ser usadas** durante o fluxo de seleção de habilidade nem durante a defesa — a menos que a descrição da própria carta especifique o contrário.

### Passar a Rodada

O personagem não age. O jogador compra 1 carta do baralho como recompensa.
Efeitos vinculados a "passar a rodada" resolvem na Etapa 5.

---

## Etapa 3 — Resolução de Dano

Após a defesa resolver, o dano e os efeitos são processados na seguinte ordem:

1. **Detecção de naipe** — vantagens e desvantagens de naipe são verificadas antes de aplicar o dano, modificando o valor final
2. **Gatilho de efeitos em ordem** — todos os efeitos da habilidade, passivas e naipe ativam na sequência
3. **Condição de dano** — efeitos que exigem "causou dano" como gatilho só disparam se houver dano real após a defesa. Se a defesa absorveu tudo, esses efeitos não ativam
4. **Habilidade de efeito puro** — se a habilidade não causa dano, seu efeito é computado e aplicado aqui

---

## Etapa 4 — Ação Rápida / Rodada Extra

Verificações de ação adicional após a resolução de dano:

### Ação Rápida
- Concedida por habilidades específicas
- Quando ativada: o jogo retorna para a **Etapa 2** em vez de encerrar a rodada

### Rodada Extra
- Concedida por naipes (ex: ♦), passivas ou outros efeitos
- Quando ativada: o jogo retorna para a **Etapa 2** em vez de encerrar a rodada

### Regras Comuns

**Mesma condição de código** — ação rápida e rodada extra compartilham o mesmo gatilho interno.

**Mutuamente exclusivas** — apenas uma pode ocorrer por personagem por turno:
- Usou ação rápida → não pode ganhar rodada extra neste turno
- Ganhou rodada extra → não pode ganhar ação rápida neste turno

**Durante a ação extra:**
- Habilidades com TAG de ação extra ainda podem ser usadas se estiverem disponíveis
- A TAG dessas habilidades é tratada como **normal** durante a ação extra — não dispara outra ação adicional
- Garante que o ciclo não se repete indefinidamente

---

## Etapa 5 — Fim de Turno

Ativa após a resolução completa da rodada **ou** quando o personagem passa a rodada.

- Efeitos de habilidades e passivas com gatilho de fim de turno resolvem aqui
- Passivas vinculadas ao ato de passar a rodada também ativam nesta etapa
  - Exemplo: *"ao passar a rodada, compre uma carta adicional"*
- Efeitos de recuperação ou acúmulo resolvem aqui
  - Exemplo: *"no final do turno, ganhe 5 de vida"*

**Ordem interna:**
- Alguns efeitos ativam no **início** da Etapa 5
- Outros ativam no **final** da Etapa 5
- A descrição da habilidade ou passiva especifica em qual momento ela resolve

Após a Etapa 5, a rodada do personagem está encerrada. O jogo passa para o próximo combatente na ordem de iniciativa.

---

*Próximo documento: cálculo de dano e defesa, vantagens de naipe em combate, cartas especiais.*
