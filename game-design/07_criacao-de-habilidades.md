# PATF TCG — Criação de Habilidades e Passivas

*Documento de design — definido na sessão 013 (2026-05-14)*

Define **como** habilidades e passivas nascem, são nomeadas e registradas no PATF TCG. As tags que descrevem cada habilidade estão em `04_tags-de-habilidade.md`. O catálogo herdado do jogo antigo está em `06_catalogo-habilidades-passivas.md`.

---

## Identidade — Paródia e Homenagem

O PATF TCG é um **jogo sério** — mecânica de verdade, profundidade real — mas com **temática de paródia e homenagem**. É um tributo a tudo que o criador curte: games, cultura pop, animes, desenhos.

- As referências são **reconhecíveis, não cópias diretas** — o jogador sacou de onde veio, mas é coisa nova.
- Vale para personagens, inimigos, cenários — e **vale para as habilidades**.
- Esse poço de referências alimenta a nomenclatura: os nomes nascem dele.

> Alinhado com a temática definida na sessão 012 — *Vampire Survivors* como referência de "jogo sério com sátira e homenagem", pixel art 8-bit, sistema de cosplay por naipe.

---

## Princípio de Nomenclatura

- **Não há sistema de equipamento.** O personagem não "tem uma espada e usa golpes de espada". Habilidades não são identidade de classe — são livres, qualquer personagem pode carregar qualquer habilidade do seu naipe.
- Por isso o **nome pode ter sabor de arma ou elemento** — "Corte de Espadas", "Flecha Impactante", "Faísca Arcana" — sem prender o personagem a um arquétipo. O nome dá sabor, não restringe.
- **Tom de referência:** feitiços e mágicas instantâneas de card games (Magic: The Gathering, Hearthstone) + habilidades de ARPG (Path of Exile, Torchlight Infinity, Diablo 2).
- **Paródia e homenagem** (ver seção acima): o nome pode acenar para games, animes, desenhos e cultura pop que o criador curte — reconhecível, nunca cópia direta.
- Nome curto, evocativo, que comunica a sensação da habilidade.

---

## Os Dois Fluxos de Criação

### Fluxo A — Adaptação (do catálogo antigo)

A habilidade **já existe** — efeito e característica estão definidos no `06_catalogo-habilidades-passivas.md`.

> **Ordem:** característica/efeito → **nome** que combina → naipe + categoria

O nome segue a função. *"Já sei o que ela faz — agora dou o nome certo."*
É o fluxo principal agora: adaptar as 54 habilidades e 28 passivas herdadas.

### Fluxo B — Criação do Zero

A habilidade **ainda não existe**.

> **Ordem:** **nome** → descrição que define o que ela é → tags

A função segue o nome. *"Gostei do nome — agora descubro o que ele faz."*
Entra quando o catálogo antigo se esgota e o jogo cresce com conteúdo novo.

---

## Anatomia de uma Habilidade

Cada habilidade é descrita pelos campos (detalhe completo em `04_tags-de-habilidade.md`):

| Campo | O que define |
|---|---|
| Nome | identidade, dá o sabor |
| Poder | valor fixo somado no cálculo de dano/cura/proteção |
| Tipo | categoria da habilidade — base para interações |
| Alvo | Único · Inimigos · Aliados · Si próprio · Todos |
| Turno | disponível desde o 1º turno (SIM) ou começa em recarga (NÃO) |
| Recarga | rodadas de espera após usar |
| Ação | N (normal) · R (rápida) · F (furtiva) · L (lenta) |
| Efeito puro | habilidade sem dano (buff/debuff/cura/controle) — sim/não |
| Descrição | o efeito em texto |

**Onde os dados vivem:** `engine/habilidades.js` (planejado) — indexado pelo `id` do nó do Atlas. `ATLAS_NOS` (em `status.js`) guarda só a estrutura da árvore; o conteúdo da habilidade vive separado.

---

## Habilidades Básicas

Cada arquétipo do `CHAR_POOL` (Vigor, Ofensivo, Defensivo, Ágil) nasce com **sua própria habilidade básica** equipada no slot de H1.

- Todas têm a mesma mecânica: poder 3, sem efeito, perfil básico. Muda só **nome, tipo e descrição**.
- **Não estão no Atlas nem no mostruário** — são *starters*, não se compram.
- **Via única:** ao trocar a básica por uma H1 comprada na árvore, ela some para sempre. O slot mostra um aviso antes da troca.
- Existem para o tutorial ser jogável desde o começo.
- Dados em `engine/habilidades.js` → `BASICOS` (indexado pelo id do arquétipo).

---

## Ordem de Trabalho

1. **Definir as 4 básicas** — uma por arquétipo do `CHAR_POOL`
2. **Esgotar o Fluxo A** — adaptar e renomear o catálogo antigo, distribuindo por naipe e categoria (H1 / H2 / H3 / Passivas)
3. **Registrar** cada habilidade pronta em `engine/habilidades.js`
4. **Religar** Status (popups, slots) e Batalha para lerem dos dados
5. **Fluxo B** entra depois, para conteúdo novo além do catálogo

---

*Documento vivo — atualizar conforme o processo evoluir.*
