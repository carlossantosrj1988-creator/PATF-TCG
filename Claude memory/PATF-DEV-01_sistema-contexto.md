# PATF-DEV-01 — Sistema de Contexto

*Documento estável. Define como o contexto do projeto PATF TCG é organizado, mantido e consumido entre sessões.*

---

## Por Que Este Documento Existe

O projeto PATF TCG é construído em sessões intercaladas — às vezes no chat web/mobile (com o Claude estrategista), às vezes no Claude Code (executor no repositório). Para que qualquer instância de Claude entre em qualquer sessão sem perder o fio, o contexto vive no repositório, **organizado de forma modular**.

Sem este sistema, dois problemas aparecem:
- O contexto cresce até virar um arquivo monolítico impossível de carregar
- Cada sessão nova exigiria reexplicar tudo desde o início

Este documento define **como o contexto é dividido, mantido e consumido**.

---

## Estrutura da Pasta `Claude memory/`

```
Claude memory/
├── PATF-DEV-01_instrucoes.md           ← estável — quem o Claude é
├── PATF-DEV-01_sistema-contexto.md     ← estável — este arquivo
├── NOVO-DEV-01_contexto-base.md        ← estável — o projeto base
├── PATF-DEV-01_fluxo-game.md           ← estável — conceito de fluxo
├── PATF-DEV-01_roteiro-game.md         ← estável — conceito de jogo
└── sessoes/
    ├── sessao-001_[titulo].md
    ├── sessao-002_[titulo].md
    └── sessao-XXX_[titulo].md
```

---

## Dois Tipos de Arquivo

### 1. Arquivos Estáveis (raiz da `Claude memory/`)

Raramente mudam. Definem **identidade e bases do projeto**.

| Arquivo | Função |
|---|---|
| `PATF-DEV-01_instrucoes.md` | O "eu" do Claude — identidade, regras absolutas, modificadores |
| `PATF-DEV-01_sistema-contexto.md` | Como o sistema de contexto funciona (este documento) |
| `NOVO-DEV-01_contexto-base.md` | O projeto base — arquitetura, regras, progresso geral |
| `PATF-DEV-01_fluxo-game.md` | Fluxo conceitual do jogo (telas, conexões) |
| `PATF-DEV-01_roteiro-game.md` | Roteiro de criação (regras de jogo, conceitos) |

**Quando atualizar:**
- Mudança estrutural do projeto
- Nova regra absoluta
- Reformulação de conceito do jogo
- Reorganização do sistema de contexto

### 2. Arquivos de Sessão (`sessoes/`)

Um arquivo **por sessão de trabalho**. Registra o que rolou, o que foi decidido, e o que vem a seguir.

**Quando criar:** ao fim de cada sessão produtiva no chat.
**Quando atualizar:** nunca — uma vez fechada, a sessão é histórico.

---

## Template do Arquivo de Sessão

```markdown
# Sessão XXX — [Título Curto]

**Data:** AAAA-MM-DD

---

## Estado de Entrada
[Onde o projeto estava no início da sessão. Pode citar a sessão anterior.]

## O Que Fizemos
- [Lista do que foi construído, ajustado ou diagnosticado]
- [...]

## Decisões Tomadas
- [Decisões novas que viram regra a partir daqui]
- [...]

## Próxima Sessão
- [O que ficou planejado para a próxima sessão]
- [...]

## Arquivos Tocados (se houver)
- [Caminho do arquivo + ação: criado / editado / removido]
- [...]
```

---

## Ciclo de Sessão

### Fim de Sessão (no chat)

1. Carlos sinaliza: *"fechamos a sessão"* ou equivalente
2. Claude monta o `sessao-XXX_[titulo].md` resumindo a sessão
3. Carlos sobe o arquivo no GitHub em `Claude memory/sessoes/`

### Início de Sessão Nova (no chat)

1. Carlos anexa os arquivos relevantes:
   - Sempre: `sessao-XXX.md` da **última sessão** (a mais recente)
   - Opcional: sessão anterior se for continuidade direta
   - Em viradas importantes: arquivos estáveis também
2. Claude lê e entra situado, sem precisar reexplicação

### Sessão no Claude Code

1. Claude Code lê a pasta `Claude memory/` ao iniciar
2. Carlos pode pedir foco específico: *"leia apenas as últimas 3 sessões"*
3. Claude Code executa o prompt recebido com o contexto carregado

---

## Regra de Decisão — O Que Mandar?

**Sessão de continuidade direta:**
- Manda só a `sessao-XXX.md` da última sessão.

**Sessão de retomada após pausa longa:**
- Manda a `sessao-XXX.md` mais recente + o `NOVO-DEV-01_contexto-base.md`.

**Sessão de virada (mudança grande de rumo):**
- Manda os arquivos estáveis + as 2 ou 3 últimas sessões.

**Primeira sessão num novo Claude Code:**
- O Claude Code lê tudo da pasta `Claude memory/` automaticamente.

---

## Princípios

- **Estáveis raramente mudam, sessões nunca são reescritas.**
- **Cada sessão é uma unidade auto-contida** — pode ser lida isoladamente e fazer sentido.
- **Histórico é navegável** — uma decisão antiga é encontrada pelo número e título da sessão onde nasceu.
- **Peso de contexto é decisão do Carlos** — o sistema permite mandar pouco ou muito conforme a necessidade da sessão.
- **Contexto vive no repositório** — não na cabeça do Carlos, não na memória de uma instância de Claude. Vive nos `.md` versionados.

---

## Convenções

- **Nomenclatura de sessões:** `sessao-XXX_titulo-curto.md` (XXX com 3 dígitos: 001, 002, ..., 042).
- **Título curto:** 2 a 5 palavras, lowercase, com hífen. Ex: `sessao-005_canvas-1280x720.md`.
- **Data dentro do arquivo:** AAAA-MM-DD, sempre na linha logo abaixo do título.
- **Ordem cronológica:** numérica crescente — sessão 001 é a mais antiga, a última é a mais nova.

---

*Documento estável. Atualizar apenas se o próprio sistema de contexto mudar.*
