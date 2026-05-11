# Sessão 001 — Fundação do Sistema de Contexto + Canvas 1280×720

**Data:** 2026-05-10

---

## Estado de Entrada

- Repositório PATF-TCG já com estrutura inicial montada
- Fluxo TESTE funcionando: Start → Seleção → Time montado
- Tela de tutorial básica construída, mas com bugs visuais:
  - Personagens do time posicionados muito acima
  - Botões `STATUS` e `DESISTIR` sobrepostos pelo ⚙ engrenagem do menu de opções
- Nenhuma estrutura formal de contexto no repositório
- Instruções personalizadas do Claude existiam apenas dentro do chat

---

## O Que Fizemos

- **Diagnosticamos a causa raiz dos bugs do tutorial:** CSS estava sendo criado sem ancoragem em coordenadas de referência. Posicionamentos com `%`, `vh/vw` e px chutados, sem ciência do canvas real do jogo.
- **Definimos a regra do canvas 1280×720** como base universal de toda interface do projeto.
- **Refinamos a redação da regra** após dois ajustes — incluindo "ajuste de tela existente", "modal", "pop-up", "painel" e a noção de **zonas reservadas** por elementos universais (ex: ⚙).
- **Estudamos o Claude Code** como ferramenta complementar ao chat. Conclusão: o Claude Code não substitui o chat, **coexiste** com ele.
- **Desenhamos o fluxo de trabalho híbrido:**
  - Chat (Claude estrategista) decide o quê e como
  - Chat entrega um **prompt detalhado** pra Carlos colar no Claude Code
  - Claude Code (executor) age direto no repositório
- **Criamos a pasta `Claude memory/`** no repositório como santuário do contexto.
- **Migramos os 3 contextos existentes** pra dentro do repositório:
  - `NOVO-DEV-01_contexto-base.md`
  - `PATF-DEV-01_fluxo-game.md`
  - `PATF-DEV-01_roteiro-game.md`
- **Convertemos as instruções personalizadas** do Claude em arquivo `.md` (`PATF-DEV-01_instrucoes.md`) e subimos na `Claude memory/`.
- **Definimos o sistema de contexto modular:**
  - Arquivos **estáveis** na raiz (raramente mudam)
  - Arquivos de **sessão** numerados em `sessoes/` (um por sessão de trabalho)
  - Carlos decide o que mandar em cada sessão nova conforme o peso necessário
- **Criamos o documento `PATF-DEV-01_sistema-contexto.md`** explicando o sistema modular como regra estável.

---

## Decisões Tomadas

- **Canvas 1280×720 é a base universal.** Toda interface (criação ou ajuste) é pensada nesse canvas, com coordenadas exatas convertidas para o renderer universal. Zonas reservadas por elementos fixos (⚙) sempre respeitadas.
- **Pasta `Claude memory/` é o santuário de contexto do projeto.** Vive no repositório, versionada no Git.
- **Sistema de contexto modular:** arquivos estáveis na raiz + arquivos de sessão em `sessoes/`. Sessões nunca são reescritas; estáveis raramente mudam.
- **Hierarquia de papéis Chat/Claude Code:**
  - Chat = estrategista (decide, planeja, conversa, atualiza `.md`)
  - Claude Code = executor (recebe prompt pronto, age no repositório)
  - Carlos é a ponte entre os dois
- **Convenção de nomenclatura de sessões:** `sessao-XXX_titulo-curto.md`, com XXX em 3 dígitos.
- **Ciclo de sessão definido:**
  - Fim: Claude monta o `.md` da sessão; Carlos sobe no GitHub.
  - Início: Carlos manda o `.md` da última sessão (e estáveis se for virada).

---

## Próxima Sessão

- **Ler `screens/renderer/renderer.js`** e validar se ele já suporta a regra do canvas 1280×720.
- **Definir variáveis CSS de escala** no renderer caso ele não as exponha ainda.
- **Refazer o CSS do tutorial** respeitando coordenadas exatas e zonas reservadas (⚙ no topo direito).
- **Corrigir os bugs visuais:** personagens em posição correta, botões `STATUS` e `DESISTIR` fora da zona do ⚙.

---

## Arquivos Tocados

- `Claude memory/Placeholder.txt` — criado (placeholder inicial da pasta)
- `Claude memory/NOVO-DEV-01_contexto-base.md` — adicionado (migração)
- `Claude memory/PATF-DEV-01_fluxo-game.md` — adicionado (migração)
- `Claude memory/PATF-DEV-01_roteiro-game.md` — adicionado (migração)
- `Claude memory/PATF-DEV-01_instrucoes.md` — criado (conversão das instruções personalizadas)
- `Claude memory/PATF-DEV-01_sistema-contexto.md` — criado (regra do sistema modular)
- `Claude memory/sessoes/sessao-001_fundacao-contexto-canvas.md` — criado (este arquivo)

---

*Sessão fechada.*
