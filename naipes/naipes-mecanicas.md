# PATF TCG — Mecânicas de Naipe

---

## Ciclo de Vantagem

```
♥ COPAS → ♣ PAUS → ♦ OURO → ♠ ESPADAS → ♥ COPAS
```

Leitura: A → B significa A tem **vantagem** sobre B.

| Naipe       | Vence       | Perde para  |
|-------------|-------------|-------------|
| ♥ Copas     | ♣ Paus      | ♠ Espadas   |
| ♣ Paus      | ♦ Ouro      | ♥ Copas     |
| ♦ Ouro      | ♠ Espadas   | ♣ Paus      |
| ♠ Espadas   | ♥ Copas     | ♦ Ouro      |

---

## Regra Geral

- Sem relação no ciclo (naipes iguais ou sem vantagem/desvantagem) → **neutro**, sem bônus ou penalidade.
- Desvantagem → **sem penalidade explícita** — o adversário é que recebe o bônus.
- Cada naipe tem seu próprio **tipo de efeito** — não é um sistema único, cada um funciona diferente.

---

## Mecânica de Cada Naipe

### ♥ Copas — "O Tank Enraivecido"

**Referência de design:** Tank que fica com raiva quando briga com Paus.

**Gatilho:** ♥ causa OU recebe dano de ♣  
**Beneficiário:** sempre ♥  
**Efeito:** ATQ e DEF atuais finais são **×2**  
**Duração:** 2 turnos  
**Acumulativo:** não — não pode duplicar o bônus já ativo  
**Renovável:** sim — se o efeito já está ativo e ocorre nova interação com ♣, o contador reseta para 2 turnos  

> Identidade: normalmente um tank (alta DEF), mas o confronto com ♣ o transforma em ameaça ofensiva também.

---

### ♣ Paus — "O Furtivo"

**Gatilho base:** ♣ recebe dano de ♦  
**Beneficiário:** sempre ♣  

**Efeito ao ser atingido por ♦:**
1. ♣ **contra-ataca** usando H1 equipada + opção de jogar uma carta para dano adicional
2. ♣ ganha (ou renova) a condição **Furtivo** por 2 rodadas

**Condição Furtivo:**
- Enquanto ativa: ♣ passa a contra-atacar **qualquer** personagem/inimigo que causar dano nele (não só ♦)
- O contra-ataque em Furtivo usa o mesmo mecanismo: H1 + carta opcional
- **Furtivo só renova** se ♣ receber dano de ♦ novamente — outros atacantes não renovam
- Furtivo tem efeitos adicionais a definir na engine e nas habilidades

**Dependências de engine:**
- Timing e resolução do contra-ataque (ordem de iniciativa)
- Mecânica de "jogar carta para dano" no contra-ataque
- Definição completa do estado **Furtivo** (outros efeitos além do contra-ataque expandido)

> ⚠️ Mecânica parcial — contra-ataque e Furtivo dependem da engine de combate e das habilidades para serem totalmente especificados.

> Identidade: o mais complexo dos quatro. Em estado normal, é um contra-atacante especializado em ♦. Uma vez em Furtivo, vira uma ameaça para qualquer atacante.

---

### ♦ Ouro — "A Rodada Extra"

**Gatilho:** ♦ causa OU recebe dano de ♠  
**Beneficiário:** sempre ♦  
**Efeito:** ganha uma **rodada extra**  
**Regras da rodada extra:** dependem da engine de combate — mesmo mecanismo do ★ Coringa  

> ⚠️ Mecânica parcial — o comportamento completo ("o que é uma rodada extra") só pode ser finalizado após a engine de turnos estar construída.

---

### ♠ Espadas — "O Detonador"

**Referência de design:** Scrapper vs Bruiser (Marvel Avengers Alliance).

**Gatilho:** ♠ causa dano em um alvo ♥  
**Beneficiário:** o dano causado por ♠  
**Efeito:** dano final (após todos os cálculos) é **×2**  
**Duração:** não aplicável — é um multiplicador por hit, sempre ativo  
**Acumulativo:** não se aplica  
**Renovável:** não se aplica  
**Em área (AoE):** cada alvo ♥ individualmente recebe ×2 no cálculo final. Alvos não-♥ tomam dano normal.  

> Identidade: especialista em eliminar Copas. Puro multiplicador de dano — sem buff, sem duração, sem estado. A engine só checa: "alvo é ♥? ×2."

---

## Especialidade de Carta

Quando o jogador joga uma carta do **mesmo naipe do personagem**, o valor da carta é **dobrado**.

> Definido nas regras base (CardGame_Regras_v1_2). Confirmar se aplica ao valor bruto da carta ou ao bônus total.

---

*Arquivo de design — preencher antes de codificar `naipes/naipes.js`*
