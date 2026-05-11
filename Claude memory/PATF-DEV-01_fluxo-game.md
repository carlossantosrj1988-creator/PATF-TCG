# PATF TCG — Fluxo do Jogo
*Documento vivo — atualizar conforme decisões forem tomadas*

---

## Fluxo Principal (Jogo Real)

```
Login Firebase
    ↓
Criação de Personagens (seleção dos 3)
    ↓
Tutorial (5 etapas — personagens ganham forma aqui)
    ↓
Tela Principal
    ├── Survivor (batalha PvE)
    ├── PvP (batalha PvP)
    ├── Status (árvore Atlas + habilidades + passivas)
    └── Equipamentos (equipamentos + relíquias)
```

---

## Fluxo de Teste

```
[Start → Aba Testes]
    ↓
Seleção de 3 Personagens
    ↓
Tela Principal
    ├── Survivor
    ├── PvP
    ├── Status
    └── Equipamentos
```

> Fluxo de teste pula login Firebase e tutorial.
> Acessado via aba TESTES na tela Start.
>
> **Estratégia de desenvolvimento:** todo o jogo será construído
> no fluxo Teste — tela por tela, funcional e jogável.
> Quando completo, cada tela será reposicionada no lugar
> correto do fluxo real.

---

## Telas e Módulos Envolvidos

| Tela / Módulo | Responsabilidade |
|---|---|
| `screens/start` | Ponto de entrada — Login Firebase + aba Testes |
| `screens/select` | Criação dos 3 personagens — seleção + nomeação |
| `screens/tutorial` | Tutorial em 5 etapas com recompensa de pontos — personagens ganham forma aqui |
| `screens/main` | Tela principal — hub de navegação (Survivor / PvP / Status / Equipamentos) |
| `screens/status` | Árvore Atlas + troca de habilidades e passivas |
| `screens/equipamentos` | Equipamentos e relíquias |
| `chars/chars.js` | Dados dos 4 personagens base (pool fixo) |

---

## Seleção de Personagens

- Jogador vê os **4 personagens disponíveis** em formato de seleção
- Cada personagem exibido com:
  - Gradiente visual (placeholder até ter sprites)
  - Stats base: ATQ · DEF · INC · PVS
- Fluxo por rodada:
  1. Escolhe 1 dos 4
  2. Digita o nome do personagem
  3. Confirma e avança
- Repete **3 vezes** até fechar o time
- Pode repetir o mesmo personagem (ex: 3 do mesmo tipo)
- Apresentação acompanhada de texto explicando o conceito do jogo:
  - Card game com 3 personagens
  - Cada um é customizável via Atlas
  - Diferente do padrão — você gerencia 3, não 1

---

## Tutorial

- **5 etapas** sequenciais
- Cada etapa concluída recompensa **pontos**
- Conteúdo cobre:
  - Sistema de naipes (♠ ♥ ♦ ♣)
  - Vantagens e desvantagens de naipe
  - Sistema de pontos
  - Atlas de habilidades e passivas
  - Introdução ao Survivor
- Ao final direciona para a Tela Principal
- Detalhes de cada etapa: **a definir**

---

## Estrutura de Dados do Personagem

### Pool fixo (chars/chars.js)
```js
const CHAR_POOL = [
  { id: 'atq', label: '???', atq: 8, def: 3, inc: 3, pvs: 6 },
  { id: 'def', label: '???', atq: 3, def: 8, inc: 3, pvs: 6 },
  { id: 'inc', label: '???', atq: 4, def: 3, inc: 8, pvs: 5 },
  { id: 'pvs', label: '???', atq: 3, def: 4, inc: 3, pvs: 10 },
];
```
> Labels e valores são placeholder — ajustar após testes.

### Estado de um personagem do jogador
```js
{
  poolId: 'atq',
  nome: '',
  naipe: null,
  naipeSecundario: null,
  naipeAtivo: null,
  passivas: [null, null],
  habilidades: [null, null, null],
  atlas: {}
}
```

### Estado global do jogador
```js
{
  pontos: 0,
  personagens: [ /* 3 objetos acima */ ]
}
```

---

## O Que Ainda Está Aberto

| Tópico | Status |
|---|---|
| Labels dos 4 personagens base | A definir |
| Valores de atributo dos 4 personagens | Placeholder — ajustar após testes |
| Conteúdo das 5 etapas do tutorial | A definir |
| Custo em pontos de cada nó do Atlas | A definir após testes |
| Habilidades e passivas de cada naipe | A criar |
| Estrutura do Survivor | A definir |
| Detalhes do PvP | A definir |
| Estrutura da tela de Status (Atlas + slots) | A definir |
| Estrutura da tela de Equipamentos | Fase futura |
| Relíquias | Fase futura |

---

*Última atualização: 2026-05-10 — fluxo real corrigido, estratégia de desenvolvimento no fluxo Teste definida*
