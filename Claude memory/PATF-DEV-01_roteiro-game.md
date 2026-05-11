# PATF TCG — Roteiro de Criação
*Documento vivo — atualizar conforme decisões forem tomadas*

---

## Visão Geral

Card game mobile, browser-based, HTML/JS com Firebase.
Dois modos de jogo: **Survivor** e **PvP**.
Sem níveis — tudo gira em torno de **pontos** como moeda única e universal.

---

## Personagens

### Seleção Inicial
- Todo novo jogador escolhe **3 personagens** de um pool de **4 opções**
- Os 4 personagens são genéricos — cada um representa um **atributo diferente**
- O jogador pode repetir a escolha (3 do mesmo) ou dividir como quiser
- Os personagens começam **sem naipe definido**

### Atributos Base
- 4 atributos representados pelos 4 personagens disponíveis
- Valores específicos a definir após testes (nerf/buff em jogo funcionando)

---

## Fluxo de Entrada — Novo Jogador

```
Criar conta
    ↓
Escolher 3 personagens (de 4 disponíveis)
    ↓
Tutorial de introdução
    ↓
Ganhar pontos ao completar o tutorial
    ↓
Tutorial direciona para a Tela de Personagens
    ↓
Jogador gasta 1 ponto no Atlas → define o naipe → entra no Survivor
```

---

## Tutorial

- Explica o sistema de naipes (♠ ♥ ♦ ♣)
- Explica vantagens e desvantagens de naipe
- Explica o sistema de pontos
- Ao final, recompensa com pontos e direciona para a Tela de Personagens
- Interativo ou explicativo — a definir

---

## Tela de Personagens

### Estrutura
Ao entrar na tela, o jogador vê seus 3 personagens.
Ao clicar em um personagem, abre o **Perfil**.

### Abas da Tela
- **Status** — acesso ao Perfil de cada personagem
- **Equipamentos** — *a definir (fase futura)*
- **Relíquias** — *a definir (fase futura)*

---

## Perfil do Personagem

### O que aparece
- Status do personagem
- **2 slots de Passivas** — para equipar passivas desbloqueadas no Atlas
- **3 slots de Habilidades** — para equipar habilidades desbloqueadas no Atlas
- **1 slot de Naipe ativo** — alterna entre naipe principal e secundário (quando desbloqueado)
- **Atlas** — árvore central de progressão

---

## Atlas

### Conceito
Árvore de progressão visual estilo Path of Exile.
Posicionada no centro da tela de perfil.
Sem indicação de personagem no centro — o centro é neutro.

### Naipes posicionados como pontos cardeais
```
        ♠ Espadas (Cima)
            |
♥ Copas —— · —— ♦ Ouro
(Esquerda)  |  (Direita)
        ♣ Paus (Baixo)
```

### Primeiro ponto gasto
- Define o **naipe principal** do personagem
- Concede pontos de atributo (valores a definir)
- Atribui a **TAG do naipe** ao personagem
- Abre o **Mapa do Naipe**

### Naipe Secundário
- Desbloqueável gastando pontos (momento a definir)
- Ao desbloquear, o jogador escolhe um segundo naipe — a árvore daquele naipe fica aberta
- Habilidades compradas na árvore do segundo naipe entram permanentemente na lista do personagem
- O jogador pode slottar habilidades e passivas dos **dois naipes** livremente nos 5 slots (2 passivas + 3 habilidades), independente da TAG ativa
- Apenas **uma TAG de naipe ativa por vez** — define vantagens/desvantagens em combate
- O jogador escolhe qual TAG está ativa (naipe principal ou secundário)
- **Vantagem principal:** combinar habilidades de dois naipes diferentes na mesma build

---

## Mapa do Naipe (Tier 1)

Ao definir o naipe, o mapa abre com:

| Categoria | Opções disponíveis |
|---|---|
| Passivas | 3 |
| Habilidades 1 (H1) | 5 |
| Habilidades 2 (H2) | 5 |
| Habilidades 3 (H3) | 5 |

### Categorias de Habilidade

**Passivas**
- Funcionam sozinhas, sem ativação
- Fixas pela descrição — sem nível
- Equipadas nos 2 slots de passiva do perfil

**H1 — Habilidades Básicas**
- Disponíveis no início do turno na maioria dos casos
- Geralmente sem recarga
- Ponto de entrada de qualquer build

**H2 — Habilidades de Utilidade**
- Mais fortes e versáteis que H1
- Ideais para setar combos
- Variam entre disponível no início do turno ou não
- Costumam ter recarga após uso

**H3 — Habilidades Definidoras de Build**
- Definem a complexidade da build
- Podem desbalancear mais pela utilidade do que pelo poder bruto
- Bloqueadas no primeiro turno na maioria dos casos
- Quase sempre têm recarga após uso

### Graus de raridade na árvore
- Habilidades variam de comuns a complexas
- Não é uma regra rígida — é indicação de complexidade
- Posição na árvore não garante raridade

---

## Tier 2 da Árvore (Fase Futura)

- Distante — só relevante em jogo avançado
- Requer gasto de ponto para desbloquear (igual ao primeiro naipe)
- Ao subir, concede mais pontos de atributo específico
- Expande o mapa com:
  - +3 Passivas
  - +5 H1
  - +5 H2
  - +5 H3

---

## Modos de Jogo

### Survivor
- Modo principal — onde o jogo acontece de fato
- Requer naipe definido para entrar
- Fonte principal de pontos

### PvP
- Via Firebase
- Detalhes a definir

---

## Sistema de Pontos

- Moeda única e universal
- Usados para: definir naipe, desbloquear habilidades/passivas na árvore, desbloquear naipe secundário, subir de tier
- Ganhos em: Survivor, PvP, Tutorial (inicial)
- Sem nível — progressão é horizontal pela árvore, não vertical por XP

---

## O Que Ainda Está Aberto

| Tópico | Status |
|---|---|
| Valores de atributo dos 4 personagens | A definir após testes |
| Custo em pontos de cada nó da árvore | A definir após testes |
| Habilidades e passivas de cada naipe | A criar |
| Equipamentos | Fase futura |
| Relíquias | Fase futura |
| Detalhes do PvP | A definir |
| Estrutura do Survivor (fases, inimigos) | A definir |
| Tutorial — interativo ou explicativo | A definir |
| Tier 2 — quando é acessível | A definir |

---

*Última atualização: 2026-05-07 — estrutura base definida, aguardando próximas decisões*
