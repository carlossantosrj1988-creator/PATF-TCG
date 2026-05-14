# PixelLab.ai — Guia Completo de Referência
**Para criação de sprites 8-bit estilo Vampire Survivors**
*Compilado em: maio/2026 | Fonte: pesquisa web extensiva*

---

## Sumário

1. [O que é o PixelLab.ai](#o-que-e)
2. [Interfaces disponíveis](#interfaces)
3. [Ferramentas de geração de imagem](#ferramentas-imagem)
4. [Ferramentas de personagem (Character Creator)](#character-creator)
5. [Sistema de animação](#animacoes)
6. [Editor Pixelorama integrado](#pixelorama)
7. [Plugin Aseprite](#aseprite)
8. [API e SDK](#api-sdk)
9. [MCP / Vibe Coding](#mcp)
10. [Planos, preços e créditos](#precos)
11. [Modelos internos: PixFlux vs BitForge](#modelos)
12. [Dicas de prompt — o que funciona](#prompts)
13. [Opções de geração explicadas](#opcoes)
14. [Workflow recomendado para game dev](#workflow)
15. [Workflow específico: Vampire Survivors / roguelite top-down](#workflow-vs)
16. [Limitações documentadas](#limitacoes)
17. [Comparação com outras ferramentas](#comparacao)
18. [Fontes e referências](#fontes)

---

## 1. O que é o PixelLab.ai {#o-que-e}

PixelLab.ai é uma plataforma de IA especializada em **geração e animação de pixel art para games**. Diferente de ferramentas genéricas (Midjourney, Stable Diffusion), foi construída especificamente para o workflow de desenvolvedores indie, com foco em:

- Sprites prontos para uso em game engines
- Consistência de estilo entre múltiplos assets
- Suporte nativo a spritesheet e animações
- Views direcionais (4 ou 8 direções) para jogos top-down e isométricos
- Tilesets e mapas

**Site oficial:** https://www.pixellab.ai  
**Documentação:** https://www.pixellab.ai/docs  
**API Docs:** https://api.pixellab.ai/v1/docs  
**YouTube:** https://www.youtube.com/@PixelLab_AI  
**Twitter/X:** https://x.com/PixelLabAI  
**GitHub:** https://github.com/pixellab-code

---

## 2. Interfaces disponíveis {#interfaces}

PixelLab oferece **quatro formas** de uso:

### 2.1 Simple Web Creator
- Interface web leve, funciona em desktop e mobile
- Acesso rápido às ferramentas mais comuns
- Menor prioridade de fila em relação à versão Pixelorama
- URL: https://www.pixellab.ai/create

### 2.2 Characters Page (NOVO)
- Creator específico para personagens com sprites direcionais animados
- 4 ou 8 direções com walk cycle automático
- Ideal para game devs que precisam de personagens rápidos
- URL: https://www.pixellab.ai/create-character

### 2.3 PixelLab Pixelorama (Editor in-browser)
- Versão completa do editor Pixelorama rodando no browser com IA integrada
- Requer desktop (sem suporte mobile)
- Mais ferramentas e controle fino
- URL: https://www.pixellab.ai/select-interface

### 2.4 Aseprite Extension
- Plugin para uso dentro do Aseprite local
- Requer Aseprite v1.3.7 ou superior
- A versão trial do Aseprite não suporta plugins
- Instalação: https://www.pixellab.ai/docs/installation

### 2.5 API (para desenvolvedores)
- Acesso programático via REST
- SDKs em Python e JavaScript disponíveis
- MCP (Model Context Protocol) para uso com Claude, Cursor, etc.

---

## 3. Ferramentas de geração de imagem {#ferramentas-imagem}

### 3.1 Create Image (PixFlux) — Geração geral
- Modelo mais geral, melhor compreensão de texto
- Excelente para imagens médias a grandes
- Suporte a: `description`, `negativeDescription`, `textGuidanceScale`, `noBackground`, `outline`, `shading`, `detail`
- Doc: https://www.pixellab.ai/docs/tools/create-image-flux

### 3.2 Create Image (BitForge) — Geração com estilo de referência
- Usa imagem de referência para corresponder ao estilo visual
- Melhor para imagens pequenas a médias
- Ideal para manter consistência de estilo entre múltiplos assets
- Doc: https://www.pixellab.ai/docs/tools/style

### 3.3 Create Large Image
- Para imagens maiores
- Doc: https://www.pixellab.ai/docs/tools/generate-image

### 3.4 Create Images from Style References (Pro)
- Gera múltiplas imagens que correspondem ao estilo visual de referências fornecidas
- Permite adicionar 1+ imagens de referência de estilo
- Opção de fundo transparente
- Texto guia de estilo opcional (ex: "pixel art RPG style", "8-bit retro style")
- Doc: https://www.pixellab.ai/docs/tools/consistent-style

### 3.5 Edit Image (Pro)
- Edição de imagens com instruções em texto
- Doc: https://www.pixellab.ai/docs/tools/edit-image-pro

### Tamanhos de imagem suportados

| Plano | Tamanho máximo |
|-------|---------------|
| Free | 200×200 px |
| Tier 1 (Pixel Apprentice) | 320×320 px |
| Tier 2 (Pixel Artisan) | 400×400 px |

**Tamanhos comuns de sprite:** 16×16, 32×32, 64×64, 128×128, 256×256

**Nota importante:** Resultados são notavelmente melhores em tamanhos maiores. Sprites 16×16 funcionam mas a qualidade cai. Recomendado: mínimo 32×32, ideal 64×64 ou superior.

**Canvas aceitos para animação com esqueleto:** 256×256, 128×128, 64×64, 32×32, 16×16

---

## 4. Ferramentas de personagem (Character Creator) {#character-creator}

### 4.1 Create Instant Character (EXPERIMENTAL)
**O que faz:** Gera um personagem com animação de caminhada de 4 frames em todas as 4 direções, de forma significativamente mais rápida.

**Opções disponíveis:**
- `description` — Descrição do personagem a ser gerado
- `negativeDescription` — O que não deve aparecer na imagem
- `characterSize` — Controla o tamanho do personagem gerado
- `directions` — Cardinal (N, S, L, O) ou Ordinal (NE, NO, SE, SO)
- Configurações de aparência: outline, shading, perspective

**Tempo de processamento:**
- 4 direções: ~2-3 minutos
- 8 direções: ~3-5 minutos

Doc: https://www.pixellab.ai/docs/tools/create-instant-character

### 4.2 Create Character (Full)
**O que faz:** Criação mais completa de personagem com mais controles.

Doc: https://www.pixellab.ai/docs/tools/create-character

### 4.3 Create 8-Directional Sprite (Pro)
**O que faz:** Cria sprite com 8 direções a partir de texto ou referência.

Doc: https://www.pixellab.ai/docs/tools/create-8-rotations-pro

### 4.4 Rotate Tool
**O que faz:** Toma uma imagem de personagem e gera as outras rotações.
- Treinado para gerar 8 views rotacionais
- Pode mudar perspectiva (high top-down → low top-down → side-scroller)
- Funciona melhor com imagem frontal (sul) como referência
- Pode precisar de refinamento em detalhes complexos (chapéus, acessórios)

**Workflow de rotação recomendado:**
1. Gere o personagem de frente (sul)
2. Use essa imagem como referência no Rotate Tool
3. Gere as outras 7 direções
4. Atualize a referência conforme necessário para refinamentos

Doc: https://www.pixellab.ai/docs/tools/rotate  
Tutorial YouTube: https://www.youtube.com/watch?v=ufQ72nGORC0

---

## 5. Sistema de animação {#animacoes}

### 5.1 Animation with Text (básico)
**O que faz:** Gera 4 frames de animação que representam vários tipos de ação para um personagem.

**Frames de saída variam com tamanho do sprite:**
- 32×32 px → 16 frames por requisição
- 128×128 px → 4 frames por requisição

**Modos de conditioning:**
1. Partir de 1 frame idle → gerar 3 frames de animação
2. Partir de 3 frames → criar 1 frame que se encaixa melhor no fluxo
3. Usar primeiro e último frames → gerar 2 frames intermediários (interpolação)

**Tips da documentação:**
- Usar prompts de ação simples: "run", "jump", "attack"
- Gerar várias vezes e escolher os melhores frames
- Reordenar frames para criar ciclo convincente
- Para efeitos especiais grandes, mover o personagem para o lado do canvas para dar mais espaço ao modelo

Doc: https://www.pixellab.ai/docs/tools/animation

### 5.2 Animate with Text (Pro)
**O que faz:** Gera animação a partir de uma única imagem de referência com descrição de ação.
- Mais poderoso que a versão básica
- Suporta: view, direction, action description
- Referências menores podem retornar grade de 16 frames

Doc: https://www.pixellab.ai/docs/tools/animate-with-text-pro

### 5.3 Animate with Skeleton
**O que faz:** Controle preciso de animação via manipulação de esqueleto.

**Quando usar:** Quando precisa de controle preciso dos movimentos ou quando tem frames de animação existentes para referenciar.

**Workflow básico:**
1. Selecionar personagem como imagem de referência
2. Clicar "Set reference" → sistema "estima skeleton" automaticamente
3. Editar o esqueleto manualmente se necessário (a estimativa pode precisar de ajustes)
4. Selecionar template de animação ou definir skeleton manualmente
5. Percorrer os frames editando o skeleton onde necessário

**Duas abordagens principais:**
- **Template Skeleton:** Selecionar template de animação pronto e ajustar
- **Animation to Animation:** Encontrar animação existente que goste e aplicar sobre seu personagem

**Vantagem:** O skeleton salvo como arquivo pode ser reutilizado em outros personagens.

Doc: https://www.pixellab.ai/docs/tools/animate-with-skeleton  
Tutorial YouTube: https://www.youtube.com/watch?v=zBfVT5pwCSs  
Tweet tutorial: https://x.com/PixelLabAI/status/1852744314469679368

### 5.4 Animation to Animation
**O que faz:** Gera frames de animação baseado em descrições, criando animações consistentes — o modelo vê frames anteriores e mantém aparência do personagem ao longo da sequência.

**Workflow iterativo:**
1. Primeira geração sem referência
2. Encontrar um frame que goste
3. Marcar "Use reference image" e definir esse frame como referência
4. Continuar gerando com a referência para manter consistência
5. Repetir até ter a animação completa

**Uso para skeleton:** Encontrar animação que goste → colocar no mesmo projeto → "Set reference" → selecionar frames da animação → "Set animation" → sistema adiciona esqueletos automaticamente.

Doc: https://www.pixellab.ai/docs/tools/animation-to-animation  
Tutorial YouTube: https://www.youtube.com/watch?v=owkamgYVWAs

### 5.5 Create Animated Object/Character (Pro) — Text2Animation
**O que faz:** Gera sprite COMPLETAMENTE NOVO animado a partir de texto — diferente do "Animate with text" que anima uma referência existente.
- Cria tanto o personagem quanto a animação de uma vez
- Ferramenta Pro

Doc: https://www.pixellab.ai/docs/tools/text2animation

### 5.6 Edit Animation (Pro)
**O que faz:** Edita múltiplos frames de animação de uma vez usando instruções em texto.

**Exemplos de uso:**
- Adicionar espada a todos os frames
- Mudar roupa do personagem em toda a animação
- Adicionar chapéu, modificar acessórios

**Parâmetros:**
- Adicionar 2-16 frames via "Add image"
- Descrever o que adicionar/mudar
- Gerar — aplica a edição em todos os frames consistentemente

Doc: https://www.pixellab.ai/docs/tools/edit-animation-pro

### Diferença crucial entre ferramentas de animação

| Ferramenta | Caso de uso |
|-----------|-------------|
| Animation with Text (básico) | Geração rápida de 4 frames, free |
| Animate with Text (Pro) | Animação a partir de referência existente, mais controle |
| Animate with Skeleton | Controle total dos movimentos, reutilizável |
| Animation to Animation | Extensão iterativa de animação existente |
| Create Animated Character (Pro) | Gerar personagem+animação do zero em texto |
| Edit Animation (Pro) | Editar animação existente mantendo consistência |

---

## 6. Editor Pixelorama integrado {#pixelorama}

Pixelorama é um editor de pixel art **gratuito e open-source** integrado diretamente no PixelLab.

**Funcionalidades do editor:**
- Ferramentas perfeitas para pixel: linhas, shading, paletas, modo indexado
- Algoritmos de rotação e escala específicos para pixel art
- Sistema de camadas com clipping masks, group blending, efeitos não-destrutivos
  - Outlines
  - Gradient maps
  - Drop shadows
- Animação frame-a-frame com onion skinning
- Frame tags
- Desenho em tempo real durante reprodução da animação
- Exportação para spritesheets, GIFs e vídeos
- CLI para exportação automatizada em massa

**Limitações:**
- Apenas desktop (sem suporte mobile)

**Recursos de IA no Pixelorama:**
- Geração de imagens (PixFlux, BitForge)
- Inpainting
- Animação com texto
- Animação com esqueleto
- Rotação de personagens

Doc: https://www.pixellab.ai/docs/introduction-pixelorama  
Tutorial YouTube (tilesets + animações): https://www.youtube.com/watch?v=EHh1hVXOj_0

---

## 7. Plugin Aseprite {#aseprite}

**Requisitos:**
- Aseprite v1.3.7 ou superior (versão PAGA — a versão trial não suporta plugins)

**Instalação automática:**
1. Após criar conta, ir na página de conta
2. Baixar a extensão PixelLab
3. Duplo clique no arquivo baixado para instalar
4. Reiniciar Aseprite
5. Autorizar acesso ao `package.json` e internet via websockets

**Instalação manual:**
- Extensions → Add Extension → localizar o arquivo baixado

**Ferramentas disponíveis no plugin:**
- Geração de personagens
- Rotação de personagem (até 8 direções)
- Inpainting para editar arte existente
- Criação de cenas a partir de texto/imagens
- Criação de tilemaps
- Ferramentas de animação (adicionadas em março 2025)
- One-click animation e rotate

Doc: https://www.pixellab.ai/docs/installation

---

## 8. API e SDK {#api-sdk}

### API REST
- **Base URL:** `https://api.pixellab.ai/v1`
- **Documentação interativa:** https://api.pixellab.ai/v1/docs

### Python SDK
```python
pip install pixellab
# ou
poetry add pixellab
```

```python
import pixellab

client = pixellab.Client.from_env_file(".env.development.secrets")
# ou: client = pixellab.Client.from_env()
# ou: client = pixellab.Client(secret="meu-token")

# Gerar imagem com PixFlux
response = client.generate_image_pixflux(
    description="cute dragon",
    image_size={"width": 64, "height": 64},
)
response.image.pil_image()  # retorna PIL image
```

**Métodos disponíveis:**
- `generate_image_pixflux()` — geração geral por texto
- `generate_image_bitforge()` — geração com estilo de referência
- Animação com esqueleto (bi-pedal e quadrúpede)
- Animação com texto
- Inpainting
- Rotação

**Suporte Python:** 3.8 a 3.12  
**GitHub:** https://github.com/pixellab-code/pixellab-python  
**PyPI:** https://pypi.org/project/pixellab/

### JavaScript/TypeScript SDK
```bash
npm install @pixellab-code/pixellab
```

**Parâmetros do `generateImagePixflux()`:**
- `description` (string) — descrição da imagem
- `imageSize` (object) — `{ width: number, height: number }`
- `negativeDescription` (string, opcional) — elementos a excluir
- `textGuidanceScale` (number, opcional) — força da orientação (~8.0 padrão)
- `noBackground` (boolean, opcional) — remover fundo
- `outline` (string, opcional) — estilo de contorno
- `shading` (string, opcional) — tipo de shading (ex: "basic shading")
- `detail` (string, opcional) — nível de detalhe (ex: "medium detail")

**`generateImageBitforge()`:**
- `description` (string)
- `imageSize` (object)
- `styleImage` (Base64Image) — imagem de referência de estilo
- `styleStrength` (number, opcional) — força da influência de estilo (ex: 50.0)
- `noBackground` (boolean, opcional)

**Resposta:**
- `response.image.saveToFile("filename.png")` — salvar para arquivo
- `response.image.dataUrl` — como data URL

**GitHub:** https://github.com/pixellab-code/pixellab-js

---

## 9. MCP / Vibe Coding {#mcp}

PixelLab oferece um servidor MCP (Model Context Protocol) que permite assistentes de IA como Claude, Cursor, Gemini CLI gerarem pixel art diretamente durante o desenvolvimento.

**Configuração:** https://www.pixellab.ai/vibe-coding  
**GitHub:** https://github.com/pixellab-code/pixellab-mcp  
**API MCP endpoint:** `https://api.pixellab.ai/mcp` (Bearer token)

**Assistentes suportados:**
- VS Code, Cursor, Claude Code, Gemini CLI, Zed, Cline
- Claude Desktop, Windsurf, Continue, BoltAI, LM Studio, Perplexity Desktop, Kiro

**Ferramentas MCP disponíveis:**

| Ferramenta | Descrição | Parâmetros principais |
|-----------|-----------|----------------------|
| `create_character` | Personagem pixel art com views direcionais | `description`, `n_directions` (4 ou 8) |
| `animate_character` | Adiciona animações a personagem existente | `character_id`, `animation` (walk/run/idle) |
| `create_topdown_tileset` | Wang tilesets para terrenos seamless | `lower`, `upper` (descrições de terreno) |
| `create_isometric_tile` | Tiles isométricos individuais | `description`, `size` |
| `create_image_pixflux` | Geração avançada de pixel art | `description`, `imageSize` |
| `create_image_bitforge` | Geração com estilo de referência | `description`, `styleImage` |
| `get_balance` | Monitorar créditos da conta | — |
| `get_api_documentation` | Referência completa da API para LLMs | — |

---

## 10. Planos, preços e créditos {#precos}

### Plano Gratuito (Trial)
- **40 gerações rápidas** de graça ao se cadastrar
- Após: **5 gerações diárias mais lentas**
- Imagens até **200×200 px**
- **Sem necessidade de cartão de crédito**
- Inclui acesso às ferramentas básicas

### Planos Pagos

| Tier | Nome | Preço regular | Preço máximo (com desconto por fidelidade) |
|------|------|--------------|------------------------------------------|
| 1 | Pixel Apprentice | ~$12/mês | ~$9/mês |
| 2 | Pixel Artisan | ~$24/mês | ~$22/mês |
| 3 | Pixel Architect | ~$50/mês | — |

**Tier 1 — Pixel Apprentice:**
- Imagens até 320×320 px
- Ferramentas de animação
- Geração de mapas

**Tier 2 — Pixel Artisan:**
- Fila prioritária
- Imagens até 400×400 px
- Acesso antecipado a ferramentas experimentais

**Tier 3 — Pixel Architect:**
- Prioridade máxima
- Até 20 jobs simultâneos
- Funcionalidades de colaboração em equipe

**Desconto por fidelidade:** O preço diminui com meses consecutivos de assinatura.

**Todos os planos pagos incluem licença comercial.**

### Sistema de Créditos
- Ferramentas básicas de geração: **1 crédito por requisição**
- Ferramentas Pro mais recentes/complexas: até **40 créditos por requisição**
- O número de frames retornados varia com o tamanho do sprite (mas o custo em créditos é fixo por geração)

---

## 11. Modelos internos: PixFlux vs BitForge {#modelos}

### PixFlux
- **Uso:** Imagens médias a extra-grandes
- **Ponto forte:** Compreensão de texto avançada
- **Melhor para:** Geração a partir de prompts detalhados
- **Quando usar:** Criar novos assets do zero via texto

### BitForge
- **Uso:** Imagens pequenas a médias
- **Ponto forte:** Correspondência de estilo visual via referência
- **Melhor para:** Manter consistência de estilo com arte existente
- **Quando usar:** Expandir uma biblioteca de assets já criada, garantir que novos sprites combinem com os anteriores

**Regra prática:**
- **Primeiro asset do jogo** → use PixFlux com prompt detalhado
- **Assets subsequentes** → use BitForge com o primeiro asset como referência de estilo

---

## 12. Dicas de prompt — o que funciona {#prompts}

### Estrutura de prompt eficaz para PixelLab

```
[tipo de personagem] + [visual principal] + [equipamento/detalhes] + [pose/ação] + [estilo pixel]
```

**Exemplo documentado (knight):**
```
Ironmark knight in full plate armor, tower shield, longsword, 
red cape with iron fist emblem, heroic stance
```
*Configurações recomendadas junto: 48px, 8 directions, low top-down view, black outline, basic shading, heroic proportions*

### Prompts que funcionam bem por categoria

**Personagens estilo RPG/Roguelite:**
```
pixel art warrior with heavy armor, axe, war helmet, aggressive stance
pixel art dark mage with purple robes, staff with crystal, evil looking
pixel art rogue with daggers, hooded cloak, crouching pose
pixel art skeleton enemy, broken armor, glowing eyes
pixel art slime monster, green gooey body, simple shape
pixel art bat creature, dark wings spread, flying pose
```

**Palavras-chave de estilo que ajudam:**
- `pixel art` (sempre incluir)
- `8-bit style` ou `16-bit style`
- `retro RPG style`
- `GBA style` (Game Boy Advance)
- `NES style`
- `game sprite`
- `top-down view`

**Para consistência de estilo entre personagens:**
```
[descrição do personagem], same art style as reference, consistent pixel palette
```

### Negative Prompts (Negative Description)

**O que evitar nos prompts negativos:**
```
blurry, low quality, realistic, 3D, photo, extra limbs, wrong proportions
```

**Para manter pixel art puro:**
```
smooth gradients, anti-aliasing, high resolution painterly style
```

### Tips de prompt avançados

1. **Manter arquivo de style keywords:** Guarde as palavras-chave de estilo que funcionaram e cole em todos os prompts para consistência.

2. **Ser específico sobre cores:** `red armor`, `blue cloak`, `golden crown` funciona melhor que descrições vagas.

3. **Especificar equipamento:** Quanto mais detalhes de equipamento/visual, melhor o resultado.

4. **Evitar descrições ambíguas:** Ao invés de "looking cool", usar "aggressive stance" ou "battle ready pose".

5. **Para Vampire Survivors/top-down:** Sempre especificar `top-down view` ou `low top-down perspective` para garantir que o personagem seja renderizado no ângulo correto.

6. **Para inimigos simples (alta quantidade em tela):** Descrições mais simples geram sprites mais limpos. Slimes, morcegos, esqueletos — manter curto e direto.

---

## 13. Opções de geração explicadas {#opcoes}

### Perspectiva (Camera View)
- **High top-down:** Olhando de cima em ~35 graus — ideal para mapas world/overworld
- **Low top-down:** Olhando de cima em ~20 graus — ideal para combate, dungeons, estilo Vampire Survivors
- **Side-scroller:** Vista lateral — para platformers

**Para Vampire Survivors:** Use **low top-down**

### Outline (Contorno)
- `selective outline` — contorno seletivo (estilo mais suave)
- `black outline` — contorno preto (estilo mais claro e legível)
- Experimente para encontrar o que melhor se encaixa no estilo do jogo

### Shading (Sombreamento)
- `basic shading` — sombreamento simples (recomendado para 8-bit)
- Outros níveis de detalhe disponíveis

### Detail (Detalhe)
- `medium detail` — bom equilíbrio para sprites de jogo
- Detalhe menor = sprites mais limpos em tamanhos pequenos

### Guidance Weight (Peso de Orientação)
- Controla quanto o modelo segue o prompt
- Muito alto → artefatos, over-saturation
- Valor padrão geralmente equilibrado

### AI Freedom
- Quanto de liberdade criativa a IA tem durante geração
- `AI freedom robust` — versão menos rígida
- Menor freedom = mais fiel à referência

### Init Image Strength (Força da Imagem de Referência)
- **300-400:** Orientação aproximada de formas e cores — bom para sketches de blobs de cor
- **400-600:** Orientação média — criar variações de imagens existentes
- **600-900:** Orientação detalhada — manter estrutura próxima da referência

### Inpainting
**Como funciona:**
1. Uma camada "Inpainting" é criada automaticamente
2. Pintar de preto sobre a área que deseja modificar
3. Criar prompt descrevendo a área completa visível (não apenas o que foi marcado)
4. Gerar — a IA modifica apenas a área marcada, mantendo o resto intacto

**Uso avançado:** Combinar inpainting com init image — modificar levemente a imagem e pintar sobre a área ao redor da mão para adicionar item (ex: fireball, weapon)

---

## 14. Workflow recomendado para game dev {#workflow}

### Passo 1: Criar o "hero asset" de referência
1. Usar PixFlux com prompt detalhado para criar o primeiro personagem
2. Iterar até encontrar o estilo visual desejado
3. Salvar esse sprite como referência mestre de estilo

### Passo 2: Expandir com estilo consistente
1. Usar BitForge com o hero asset como referência de estilo
2. Descrever novos personagens/inimigos
3. O modelo vai manter a paleta e estilo visual

### Passo 3: Criar rotações direcionais
1. Com o sprite frontal (sul) aprovado
2. Usar Rotate Tool para gerar as outras 7 direções
3. Revisar e corrigir detalhes problemáticos (chapéus, acessórios)

### Passo 4: Animar
1. **Opção rápida:** Create Instant Character (já gera animação de 4 frames)
2. **Opção controlada:** Animate with Skeleton para animações precisas
3. **Opção iterativa:** Animation to Animation para expandir animações existentes

### Passo 5: Refinar com inpainting
1. Identificar problemas nos sprites gerados
2. Usar inpainting para corrigir partes específicas
3. Manter as partes boas com init image de força alta (600-900)

### Passo 6: Exportar para o engine
- Via Pixelorama: exportar spritesheet/GIF/vídeo
- Via Aseprite: usar o workflow nativo de spritesheet
- Via API: integrar no pipeline de build do jogo

### Regra do 80/20 recomendada pela comunidade
> "AI handles 80% of the work in 20 seconds. You handle the remaining 20% in a pixel editor."

---

## 15. Workflow específico: Vampire Survivors / roguelite top-down {#workflow-vs}

### Considerações para o estilo Vampire Survivors

**Contexto do gênero:**
- Muitos inimigos simultâneos em tela → sprites **pequenos e legíveis** são essenciais
- Animações simples (2-6 frames) para performance
- Sprites devem ser reconhecíveis mesmo em tamanho pequeno
- View: top-down com leve ângulo (low top-down no PixelLab)

### Configurações recomendadas

**Tamanho:** 32×32 ou 64×64 (dependendo da escala do jogo)
- 32×32 → gera 16 frames por requisição de animação
- 64×64 → mais detalhe, ainda eficiente

**Perspectiva:** `low top-down` (~20 graus)

**Estilo:** `pixel art`, `8-bit style`, `black outline`, `basic shading`

**Direções:** 4 direções suficientes para a maioria dos inimigos Vampire Survivors; 8 para o player principal

### Prompts para inimigos típicos do gênero

**Inimigos básicos (esqueletos, zumbis, etc.):**
```
pixel art skeleton warrior, bone armor, rusty sword, walking, 
top-down view, black outline, 8-bit style
```

```
pixel art zombie, tattered clothes, arms forward, slow moving,
top-down view, 8-bit style, simple design
```

**Inimigos voadores (morcegos, corvos):**
```
pixel art bat creature, dark wings, glowing eyes, flying pose,
top-down view, small size, 8-bit style
```

**Mini-bosses:**
```
pixel art ghost knight, ethereal glow, oversized sword, menacing stance,
top-down view, large sprite, 16-bit style, detailed
```

**Personagem principal (player):**
```
pixel art adventurer, dark hooded cloak, glowing amulet, battle ready,
top-down view, low angle, 8-bit style, black outline, medium detail
```

### Pipeline de animação para Vampire Survivors

**Animações necessárias por personagem:**
1. `walk` — movimento em 4 direções (obrigatório)
2. `attack` ou `idle` — pose de ataque/idle
3. `death` — animação de morte (opcional mas impactante)

**Workflow específico:**
1. Characters Page → criar personagem com 4 direções + walk cycle automático
2. Animate with Text → adicionar animação de ataque
3. Edit Animation Pro → ajustar detalhes (adicionar arma, mudar cor)
4. Export spritesheet via Pixelorama

### Dica de performance para o gênero
> Para jogos estilo Vampire Survivors com muitos inimigos em tela, manter animações com 2 a 6 frames ajuda a reduzir quedas de performance. A ferramenta de animação básica (4 frames por request) é ideal para este caso.

---

## 16. Limitações documentadas {#limitacoes}

### Limitações técnicas
1. **Sprites muito pequenos (16×16):** Possível gerar mas qualidade notavelmente inferior. Resultados melhores a partir de 32×32.

2. **Web Creator tem menos recursos:** Interface simplificada com menos funcionalidades que a versão Pixelorama.

3. **Mobile:** Editor Pixelorama só funciona em desktop.

4. **Detalhes complexos em rotação:** Chapéus, acessórios, cabelos elaborados podem ficar inconsistentes entre rotações.

5. **Sem editor nativo no Simple Web Creator:** Precisa exportar para editor separado para ajustes manuais.

6. **Estimativa de esqueleto não é perfeita:** O sistema "estimate skeleton" sempre vai precisar de algum ajuste manual.

7. **Frames de animação limitados:** A ferramenta básica gera apenas 4 frames (podendo ser 16 para sprites 32×32). Para animações mais fluidas, precisa iterar múltiplas vezes.

### Limitações de plano
- **Plano gratuito:** Apenas 40 gerações rápidas iniciais, depois 5/dia lentas, max 200×200 px
- **Tier 1:** Máximo 320×320 px
- **Sem acesso ao API no plano gratuito** (requer subscription)

### Limitações conhecidas de qualidade
- Resultados variam — pode precisar de várias tentativas para obter o resultado desejado
- O modelo tem viés para certos estilos (sprites isométricos são um ponto forte, mas pode variar)
- Ferramenta ainda marcada como "experimental" em alguns recursos

### Comparação de prioridade de fila
- Plano gratuito → fila mais lenta
- Tier 1 → fila melhorada
- Tier 2 → fila prioritária
- Tier 3 → prioridade máxima, 20 jobs simultâneos

---

## 17. Comparação com outras ferramentas {#comparacao}

### PixelLab.ai vs Midjourney

| Aspecto | PixelLab | Midjourney |
|---------|---------|-----------|
| Especialização | Pixel art para games | Geração geral de imagens |
| Transparência de fundo | Suportada nativamente | Problemática |
| Mixels (pixels misturados) | Evitados pelo modelo | Problema comum |
| Animação | Nativa, integrada | Não suportada |
| Spritesheet | Exportação nativa | Manual/complexo |
| Views direcionais | Automático (4 ou 8) | Manual/prompt trick |
| Preço | $9-50/mês | $10-120/mês |
| Curva de aprendizado | Média (foco em gamedev) | Baixa (geral) |

**Veredicto:** Para assets de jogos pixel art, PixelLab é superior em praticamente todos os aspectos.

### PixelLab.ai vs Leonardo AI

| Aspecto | PixelLab | Leonardo AI |
|---------|---------|------------|
| Pixel art dedicado | Sim | Parcial (modelos específicos) |
| Gerações gratuitas | 40 iniciais + 5/dia | 150/dia |
| Custom LoRA | Não nativo | Sim (Personal AI Trainer) |
| Estilo consistente | Via BitForge + referências | Via custom LoRA treinado |
| Animação | Nativa | Limitada |
| Spritesheet | Nativo | Não nativo |

**Veredicto:** Leonardo tem mais gerações gratuitas e LoRA customizável. PixelLab é melhor para pixel art nativo e animação de sprites.

### PixelLab.ai vs Retro Diffusion

| Aspecto | PixelLab | Retro Diffusion |
|---------|---------|----------------|
| Foco | Gamedev completo | Pixel art geral |
| Animação | Avançada (skeleton, text) | Limitada |
| Game workflow | Completo | Parcial |
| Preço | Subscription | Subscription |

**Veredicto:** PixelLab é mais completo para workflow de gamedev.

### PixelLab.ai vs Sprite-AI.art / AutoSprite

- PixelLab: mais maduro, mais ferramentas, mais comunidade
- Alternativas menores geralmente têm menos qualidade ou menos recursos de animação

### Consenso da comunidade

> "PixelLab is the standout option for game dev — it's the only tool consistently able to generate high quality, style accurate, and usable pixel art game assets."
> — Vários reviewers (2024-2025)

> "The pricing model is extremely fair, the devs are extremely active on their Discord with new features being added, and it's highly recommended for game dev productivity."

> "While general tools like Midjourney and Gemini struggle with things like transparency or 'mixels,' PixelLab can generate pixel perfect images."

---

## 18. Fontes e referências {#fontes}

### Documentação oficial
- [PixelLab.ai — Site principal](https://www.pixellab.ai/)
- [Documentação — Overview](https://www.pixellab.ai/docs)
- [Ways to use PixelLab](https://www.pixellab.ai/docs/ways-to-use-pixellab)
- [Getting Started + Inpainting](https://www.pixellab.ai/docs/getting-started)
- [Create Instant Character](https://www.pixellab.ai/docs/tools/create-instant-character)
- [Create Character](https://www.pixellab.ai/docs/tools/create-character)
- [Create 8-Directional Sprite (Pro)](https://www.pixellab.ai/docs/tools/create-8-rotations-pro)
- [Animation with Text](https://www.pixellab.ai/docs/tools/animation)
- [Animate with Text (Pro)](https://www.pixellab.ai/docs/tools/animate-with-text-pro)
- [Animation to Animation](https://www.pixellab.ai/docs/tools/animation-to-animation)
- [Animate with Skeleton](https://www.pixellab.ai/docs/tools/animate-with-skeleton)
- [Create Animated Object/Character (Pro)](https://www.pixellab.ai/docs/tools/text2animation)
- [Edit Animation (Pro)](https://www.pixellab.ai/docs/tools/edit-animation-pro)
- [Create Image (PixFlux)](https://www.pixellab.ai/docs/tools/create-image-flux)
- [Create Image (BitForge)](https://www.pixellab.ai/docs/tools/style)
- [Create Images from Style References](https://www.pixellab.ai/docs/tools/consistent-style)
- [Rotate Tool](https://www.pixellab.ai/docs/tools/rotate)
- [Rotating a Character (Guide)](https://www.pixellab.ai/docs/guides/rotating-a-character)
- [Character Options](https://www.pixellab.ai/docs/options/character)
- [Animation Options](https://www.pixellab.ai/docs/options/animation)
- [Init Image Options](https://www.pixellab.ai/docs/options/init-image)
- [Guidance Options](https://www.pixellab.ai/docs/options/guidance)
- [Inpainting](https://www.pixellab.ai/docs/options/inpainting)
- [Introduction to Pixelorama](https://www.pixellab.ai/docs/introduction-pixelorama)
- [Aseprite Installation](https://www.pixellab.ai/docs/installation)
- [Create Tileset](https://www.pixellab.ai/docs/tools/create-tileset)
- [Map Tiles Guide](https://www.pixellab.ai/docs/guides/map-tiles)
- [PixelLab API](https://www.pixellab.ai/pixellab-api)
- [API REST Docs](https://api.pixellab.ai/v1/docs)
- [FAQ](https://www.pixellab.ai/docs/faq)

### GitHub/SDKs
- [pixellab-python SDK](https://github.com/pixellab-code/pixellab-python)
- [pixellab-js SDK](https://github.com/pixellab-code/pixellab-js)
- [pixellab-mcp (MCP Server oficial)](https://github.com/pixellab-code/pixellab-mcp)
- [PixelLab-MCP alternativo (flynnsbit)](https://github.com/flynnsbit/PixelLab-MCP)

### Tutoriais YouTube oficiais
- [Tutorial: Generating pixel art characters and animations](https://www.youtube.com/watch?v=ptWw9gkgorQ)
- [Tutorial: How to animate pixel art using a skeleton](https://www.youtube.com/watch?v=zBfVT5pwCSs)
- [Tutorial: Animation to animation](https://www.youtube.com/watch?v=owkamgYVWAs)
- [Tutorial: How to get style consistent images](https://www.youtube.com/watch?v=iBMq3P_Fazk)
- [Tutorial: Generate rotations for characters](https://www.youtube.com/watch?v=ufQ72nGORC0)
- [Tutorial: Generating pixel art tilesets](https://www.youtube.com/watch?v=q9z2Vhpz-Z8)
- [Tutorial: How to make map tiles](https://www.youtube.com/watch?v=1H-1IjSv1wM)
- [Tutorial: How to generate tilesets & animations with Pixelorama](https://www.youtube.com/watch?v=EHh1hVXOj_0)
- [Tutorial: How to Generate & Animate GBA-Style Sprites](https://www.youtube.com/watch?v=moCpjMOOBGk)
- [Tutorial: Map Workshop — Make Maps 10x Faster](https://www.youtube.com/watch?v=O9maOTbLuHQ)
- [Tutorial: Interior Maps for Top-Down Games](https://www.youtube.com/watch?v=qVDkp1baJkU)
- [Tutorial: How to Create Pixel Art Animations](https://www.youtube.com/watch?v=mlCa0UdAhow)
- [Tutorial: Generate pixel art images](https://www.youtube.com/watch?v=Tbmfh4pBPeo)
- [Tutorial: Vampire Survivors-Like 2D Animation Workflow](https://www.youtube.com/watch?v=I6XmhdsUjtE)
- [Tutorial Playlist completa](https://www.youtube.com/playlist?list=PLqxDfnv9FagPWIQo4Jia8SX5CkFX9iuZ2)
- [Canal oficial PixelLab](https://www.youtube.com/@PixelLab_AI)

### Reviews e comparações (terceiros)
- [PixelLab AI Review: The Best AI Tool for 2D Pixel Art Games (jonathanyu.xyz)](https://www.jonathanyu.xyz/2025/12/31/pixellab-review-the-best-ai-tool-for-2d-pixel-art-games/)
- [12 best pixel art generators in 2026 (Sprite-AI)](https://www.sprite-ai.art/blog/best-pixel-art-generators-2026)
- [Best AI Tools for Indie Game Developers (GameDev AI Hub)](https://gamedevaihub.com/best-ai-tools-for-indie-game-developers/)
- [PixelLab — There's An AI For That](https://theresanaiforthat.com/ai/pixellab/)
- [PixelLab — AI Tools Explorer](https://aitoolsexplorer.com/ai-tools/pixellab-pixel-art-game-assets/)
- [PixelLab Reviews (Slashdot 2025)](https://slashdot.org/software/p/PixelLab/)
- [PixelLab Reviews (SourceForge 2026)](https://sourceforge.net/software/product/PixelLab/)
- [PixelLab MCP Server (Glama)](https://glama.ai/mcp/servers/pixellab-code/PixelLab)
- [PixelLab — pixellab · PyPI](https://pypi.org/project/pixellab/)
- [Vibe Coding Vampire Survivors workflow (Toolify AI)](https://www.toolify.ai/ai-news/creating-a-vampire-survivor-clone-with-ai-a-game-dev-adventure-2279530)

### Social
- [Twitter/X oficial PixelLab](https://x.com/PixelLabAI)
- [Tweet: Skeleton tutorial announcement](https://x.com/PixelLabAI/status/1852744314469679368)

---

*Documento compilado como referência permanente para o projeto PATF-TCG.*  
*Última atualização: maio/2026.*
