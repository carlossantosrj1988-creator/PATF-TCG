# PATF TCG — Layout da Tela de Batalha

*Documento de design — definido na sessão 006 (2026-05-13)*

---

## Referência Visual

**Pokémon Red (Game Boy)** — painel de ação fixo e sempre visível na base da tela, campo de batalha acima. Sem popup flutuante para seleção de ações. O jogador sempre sabe onde olhar.

---

## Estrutura Geral

```
┌─────────────────────────────────────────────────────────┐
│  [IC] [IC] [IC] [IC] [IC] [IC]   ← ordem de iniciativa  │
├────────────────────────┬────────────────────────────────┤
│                        │                                │
│   Campo do Jogador     │      Campo do Inimigo          │
│   (esquerda)           │      (direita)                 │
│                        │                                │
│   Expansível           │      Expansível                │
│                        │                                │
├────────────────────────┴────────────────────────────────┤
│                                                         │
│   Painel de Ação — fixo, dividido em 2                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Zonas da Tela

### Barra de Iniciativa (Topo)

- Exibe ícones de todos os combatentes na ordem de ação
- Atualizada em tempo real conforme o turno avança
- Inclui personagens do jogador e do inimigo na mesma fila

### Campo do Jogador (Esquerda)

- Sempre começa com 3 personagens
- Campo livre e expansível — habilidades futuras (ex: necromante) podem gerar combatentes adicionais durante o combate

### Campo do Inimigo (Direita)

- Quantidade variável conforme o encontro
- Também expansível — inimigos podem invocar reforços

### Painel de Ação (Inferior — fixo, dividido em 2)

O conteúdo do painel muda conforme o estado do turno:

**Estado padrão — turno do jogador:**
```
┌─────────────────────────┬───────────────────────────────┐
│      HABILIDADES        │       PASSAR A RODADA         │
└─────────────────────────┴───────────────────────────────┘
```

**Estado habilidades — após clicar em Habilidades:**
```
┌─────────────────────────┬───────────────────────────────┐
│  Skills do personagem   │   Cartas da mão do jogador    │
│  (nome, status,         │                               │
│   recarga)              │                               │
└─────────────────────────┴───────────────────────────────┘
```

**Estado defesa — quando o inimigo ataca:**
```
┌─────────────────────────┬───────────────────────────────┐
│         PASSAR          │   Cartas da mão do jogador    │
└─────────────────────────┴───────────────────────────────┘
```

---

## Popup de Personagem

Ao clicar em qualquer personagem no campo de batalha, abre um popup de status. É informativo — o jogador consulta sem agir.

### Personagens do Jogador

| Elemento | Descrição |
|---|---|
| Nome + naipe ativo | Identificação do personagem |
| Vantagem do naipe | Descrição do que o naipe é forte contra |
| Desvantagem do naipe | Descrição do que o naipe é fraco contra |
| Atributos atualizados | Valores em tempo real — buffs em verde, debuffs em vermelho |
| Vida + barra de vida | Valor máximo e atual em tempo real |
| Passivas slotadas | Descrição completa e detalhada de cada passiva equipada |
| Habilidades slotadas | Descrição completa e detalhada de cada habilidade equipada |
| Efeitos ativos | Buffs e debuffs em vigor com descrição completa e duração em tempo real |

> As descrições de naipe ficam visíveis no popup para que jogadores novos possam consultar durante o combate sem sair da batalha.

### Inimigos (PvE)

Popup existirá, mas com **formato diferente** — a definir. O nível de informação exposta sobre o inimigo é uma decisão de design da sessão correspondente.

### PvP

Ambos os jogadores podem abrir o popup completo um do outro — **transparência total e intencional**. Quem leva uma surra pode inspecionar a build adversária e, eventualmente, tentar replicá-la.

---

*Este documento, junto com os demais da sessão 006, serve de referência completa para a implementação do engine na sessão 007.*
