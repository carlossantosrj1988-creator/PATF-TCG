# PATF TCG — Tags de Habilidade

*Documento de design — definido na sessão 006 (2026-05-13)*

---

## Visão Geral

Toda habilidade do jogo é descrita por um conjunto de tags. As tags definem o comportamento da habilidade no combate — como ela age, quem afeta, quando está disponível e como interage com o sistema.

---

## Tags

### PODER

Valor numérico que complementa o cálculo de ataque, cura ou proteção.

- Habilidades de dano, cura ou proteção exibem `PODER: X`
- Habilidades de efeito puro exibem `EFEITO` no lugar — sem valor numérico

**No cálculo de dano:** ATQ + PODER + valor da carta

---

### TIPO

Tag de categoria que identifica a natureza da habilidade.

- Serve como identificador para interações do sistema
- Pode gerar bônus, vantagens ou desvantagens específicas para aquela categoria
- Exemplo: uma passiva que concede bônus contra habilidades de um tipo específico usa essa tag como condição

> Os valores de TIPO serão definidos conforme as habilidades forem criadas.

---

### ALVO

Define o escopo do alvo da habilidade.

| Valor | Descrição |
|---|---|
| `Alvo único` | Afeta um único combatente selecionado |
| `Área` | Afeta múltiplos combatentes numa área |
| `Aliados` | Afeta todos os personagens aliados |
| `Inimigos` | Afeta todos os personagens inimigos |
| `Si próprio` | Afeta apenas o personagem que usou a habilidade |

---

### TURNO

Define se a habilidade está disponível desde o início do combate.

| Valor | Comportamento |
|---|---|
| `SIM` | Disponível a partir do 1º turno |
| `NÃO` | Começa com 1 rodada de recarga — não pode ser usada no 1º turno |

---

### RECARGA

Define quantas rodadas o personagem precisa esperar para reusar a habilidade após ativá-la.

- Contado em rodadas do próprio personagem
- A dedução de recarga ocorre no **Início da Rodada** (antes da Etapa 1)
- Habilidades sem recarga ficam disponíveis na rodada seguinte

---

### AÇÃO

Define a condição de ação da habilidade. Quatro tipos:

#### N — Normal
Sem condição especial. A habilidade funciona dentro do fluxo padrão do turno.

#### R — Rápida
Após completar a ação, o personagem pode agir novamente neste turno.
- Dispara o mecanismo de **Ação Rápida** da Etapa 4
- Sujeita à regra de exclusividade: se o personagem já ganhou uma Rodada Extra neste turno, a Ação Rápida não ativa — e vice-versa
- Durante a ação extra, habilidades com AÇÃO `R` ainda podem ser usadas se disponíveis, mas a TAG é tratada como `N`

#### F — Furtiva
A habilidade não dispara bônus ou vantagens de nenhum tipo.
- Exemplo: o bônus de especialidade de naipe (carta do mesmo naipe → valor dobrado) não se aplica
- Outros bônus e vantagens condicionais também são ignorados durante essa ação

#### L — Lenta
A habilidade tem recarga de 2 rodadas após uso.
- Normalmente aplicada como debuff que altera a condição de ação de uma habilidade
- Quando uma habilidade recebe esse debuff, o jogo reconhece a condição `L` e aplica a recarga de 2 rodadas automaticamente

---

## Exemplo de Leitura de Habilidade

```
Nome da Habilidade
──────────────────────────────────────
PODER     12
TIPO      Magia
ALVO      Alvo único
TURNO     NÃO
RECARGA   2
AÇÃO      N
──────────────────────────────────────
Descrição: [texto da habilidade]
```

```
Nome da Habilidade
──────────────────────────────────────
EFEITO
TIPO      Controle
ALVO      Inimigos
TURNO     SIM
RECARGA   3
AÇÃO      F
──────────────────────────────────────
Descrição: [texto da habilidade]
```

---

*Próximo documento: como skills e passivas entram em batalha — slots, condições de ativação e interações.*
