# Duas referências, lidas no código-fonte

Pesquisa. Nada foi construído; nenhum arquivo de código foi tocado.

Referências: **[basement.studio](https://basement.studio/)** e
**[leonardomoreira.com.br](https://leonardomoreira.com.br/)**, ambas em 2026-09-02.

## Recomendação

**Três coisas para construir, nesta ordem, e nenhuma delas é estética.**

1. **A revelação da rota (item 6 do *Open*).** O Leonardo resolve o mesmo problema — uma
   interface diegética que não diz o que se pode fazer nela — com **uma string**: a
   `<meta name="description">` termina em *"Type 'whoami'."*, e dentro do objeto existe um
   comando `cheat` (`brief:"the discoverable easter eggs"`) que **lista os segredos**. Ele não
   confia na descoberta; ele publica o mapa. O Tenebrae hoje não diz em lugar nenhum que
   CONTATO existe. O pulso lento na lâmpada continua certo — mas a lição barata é a outra: uma
   frase, no lugar onde a pessoa já está olhando.
2. **O 404 em personagem.** `nanj.in/naoexiste` devolve **a página cinza padrão do GitHub
   Pages** — a única tela do domínio que não é o objeto. O 404 do Leonardo é uma tela de BIOS
   Award: `Boot record on this path .......... MISSING`. Custa um `public/404.html`.
3. **O espelho para máquina, com endereço próprio (faixa `lyra`).** O basement tem um botão
   **Human · Machine** fixo no rodapé que leva a `/ai/home`: HTML puro, ASCII-art, pares
   chave-valor, indexável — mais um *twin* Markdown de **toda** página (`.md` na URL ou
   `Accept: text/markdown`), um `sitemap.md` e um `llms.txt` que documenta o esquema inteiro.
   O `llms.txt` do Tenebrae já existe e já é bom; falta o endereço navegável e o botão.

## Método, e o que não foi visto

A extensão do Chrome está fora desde 2026-09-01. **Nenhum dos dois sites foi visto rodando.**
Tudo abaixo saiu de `curl` sobre o HTML, os bundles e os assets, lido com `grep`/Python.

- **[M]** = medido no código-fonte ou nos cabeçalhos HTTP. Reprodutível.
- **[I]** = inferido do código. Plausível, não verificado na tela.

Nada aqui descreve movimento, ritmo ou som — essas são exatamente as coisas que a leitura de
fonte não alcança, e é onde a leitura mente com mais confiança.

## As duas não são a mesma coisa

| | leonardomoreira.com.br | basement.studio |
|---|---|---|
| Gênero | portfólio pessoal | site de agência |
| Relação com o Tenebrae | **irmão** — resolve os mesmos problemas | **outro gênero** — transferível em ofício, não em estrutura |
| Superfície | uma tela, canvas em tela cheia, sem scroll | multi-página, scroll, 3D por cima do DOM |
| Stack **[M]** | Astro, 1 bundle de 522 KB, canvas 2D + shader WebGL | Next.js, three.js + react-three-fiber + leva, Sanity CMS, Sentry |
| Peso 3D **[M]** | zero (tudo é texto desenhado) | 13 `.glb` + 19 `.ktx2` = **10,35 MB** |
| Conteúdo legível no HTML **[M]** | **nenhum** (canvas + `aria-label="DHARMA OS"`) | nav, `<h1>`, 79 `alt`, `schema.org` Organization |
| Idiomas | inglês só | inglês só |

O Leonardo é a comparação que importa. O basement é de onde se rouba técnica.

---

# Parte 1 — leonardomoreira.com.br

Um PC de 1996 inteiro dentro de um `<canvas>`: POST da BIOS Award → boot do Linux → *DHARMA
OS*, um desktop com terminal, notepad, visualizador de imagens, configurações e três jogos.

## Arquitetura **[M]**

- **Duas camadas de canvas.** Um contexto `2d` desenha *todo* o texto e a UI (`getContext("2d")`
  15×, `imageSmoothingEnabled` 8×, `devicePixelRatio` 14×). Esse canvas vira textura de um
  **shader WebGL** que faz barril, CRT, bloom, scanline e reage ao mouse
  (`uniform2f(n.mouse, …)`, `uniform1f(n.crtStrength, …)`).
- **O texto só redesenha quando muda.** O estado do mundo tem um `needsRedraw`; o `rAF` roda
  para o shader, mas a camada cara é *event-driven*. **[I]** É o motivo de um simulador de OS
  inteiro caber num laptop sem ventoinha.
- **A força do efeito é por rota.** O splash do boot recebe `crtStrength` alto, o `tty` recebe
  menos; acima de 2000 px de tela os três parâmetros escalam por até 1,8×. **[M]**
- **Tipografia por linhas, não por breakpoint.** Desktop: `max(16, min(25, floor(h/dpr/34))) * dpr`
  — o corpo é o que faz caber ~34 linhas. Handheld: a conta é por **colunas** (~58). **[M]**
- **Fonte de graça.** `VT323` do Google Fonts, com `"Px437"` como fallback *local* — quem tem a
  fonte de DOS instalada vê a de verdade. Nenhum arquivo de fonte próprio é servido (`/fonts/…`
  dá 404). **[M]**
- **O sistema de arquivos persiste.** `localStorage`, teto de **256 KB** no total e **64 KB** por
  arquivo. O que o visitante escreve no notepad continua lá depois do reload. **[M]**
- **CSP no `<meta>`**, `object-src 'none'`, `form-action 'none'`. **[M]**

## O modo handheld é um aparelho diferente, não um layout **[M]**

```
min(window.innerWidth, window.innerHeight) < 700   →  handheld
```

E aí:

- as dimensões vêm de **`visualViewport`**, não de `innerWidth` — é a única API que encolhe
  quando o teclado sobe;
- as rotas mudam de identidade: `handheld-boot`, `handheld-home`, `handheld-panic`. Não é o
  desktop reflowado, é outra máquina;
- o `handheld-home` tem uma seção **"Find me"** com os links, renderizada direto no canvas;
- no HTML: `interactive-widget=resizes-content`, `touch-action:none`, `overscroll-behavior:none`,
  `env(safe-area-inset-bottom)`, `cursor:none` dentro do canvas.

Isso é o item 7 do *Open* respondido por outra pessoa. As quatro declarações CSS/meta são
copiáveis hoje; a decisão de fazer do celular **outro aparelho** é a parte cara — e o Tenebrae
já flerta com ela no `?turned`.

## O que ele faz com o conteúdo

- **105 comandos** com `brief` (o `help` é gerado da própria tabela): `ls`, `cat`, `grep`, `find`,
  `tree`, `chmod`, `dmesg`, `top`, `man`… e `whoami`, que é a página *sobre* — imprime primeiro
  a linha do usuário e a versão, e só então `I build games, software, and…` — a mesma frase da
  `<meta name="description">`. **[M]**
- **Isca em três camadas:** comandos visíveis (`fortune`, `joke`, `cowsay`), comandos ocultos
  (`42`, `xyzzy`, `matrix`, `dharma`, `108`, `execute 4 8 15 16 23 42`), e o `cheat`, que aparece
  depois do Konami e **imprime a lista inteira**. **[M]**
- **Lore como estrutura**, não como enfeite: DHARMA/LOST organiza o filesystem, as estações, os
  temas (`Clankers`, `Cream Minimal`, `BIOS`, `DHARMA`, `1996`) e o kernel panic (que termina em
  `(just kidding — your session is fine, press any key)`).
- **Uma coisa real no meio da simulação:** `metar` e `taf` buscam meteorologia de aeroporto de
  verdade a partir de um código ICAO. É a piada que prova que a máquina funciona — e amarra no
  negócio dele (FLYT Sim, simulação de voo).
- **O 404 fica em personagem** e faz `<meta http-equiv="refresh" content="6;url=/">`.
- **O banner de cookie espera 13 s** (`800 ms` fora do modo CRT) para não colidir com o boot. **[M]**

## Onde ele perde

- **Zero conteúdo legível fora do canvas.** Para um leitor de tela, um ATS, um `curl` ou um
  desdobrador de link, o site é `aria-label="DHARMA OS"` e nada mais. Ele compensa com uma
  `description` boa e um `schema.org` `Person` denso (`knowsAbout`, `worksFor` com as duas
  empresas) — metadado no lugar de conteúdo. **[M]**
- **Sem `llms.txt`** (404). **[M]**
- **Só inglês**, para um portfólio brasileiro.
- **522 KB de bundle** para chegar ao primeiro pixel; nenhum code-split visível. **[M]**

---

# Parte 2 — basement.studio

Um escritório 3D único onde a navegação é **voar a câmera** entre pontos de vista nomeados.

## Payload **[M]**

| | |
|---|---|
| `.glb` | 13 arquivos, 8,0 MB (`officeItems` 2,67 MB · `office` 2,41 MB · `character-model` 1,02 MB) |
| `.ktx2` | 19 arquivos, 2,4 MB — **todos lightmaps** (`bake-00-lightmap`, `bake-Chairs-lightmap`, …) |
| **3D total** | **10,35 MB** |
| JS pré-carregado | 31 chunks, **3,0 MB** |
| Libs | three.js, react-three-fiber, **leva**, Sanity, Sentry, @vercel/analytics |

## As cinco técnicas que valem para o Tenebrae

**1. A luz é assada, não calculada.** 19 lightmaps KTX2, `lightMap` 75 ocorrências, `aoMap` 67.
Um escritório inteiro com sombra e AO e quase nenhuma luz em runtime. **[M]** — É a resposta
direta ao que a ADR-0019 descobriu na marra (*toda luz visível compila no shader e é avaliada
por todo fragmento*): quem não quer pagar a luz, assa a luz. O `docs/realism-budget.md` é o lugar
disso.

**2. `BatchedMesh` e `InstancedMesh`** (26 e 20 ocorrências) — as cadeiras, as pessoas, os carros
lá fora saem em poucas draw calls. **[M]**

**3. A cena é dado, não código.** O Sanity entrega **nove cenas**, cada uma com câmera e
**correção de cor própria**: **[M]**

| cena | posição | fov | `targetScrollY` | bloom | saídas |
|---|---|---|---|---|---|
| `home` | 6.26, 1.16, −7.57 | 64.65 | −0.1 | 0.15 | **7** |
| `services` | 6, 1.53, −10.21 | 55 | 0.8 | 0.15 | 1 |
| `showcase` | 7.03, 4.89, −12.66 | 29.39 | 2.89 | 0.15 | 2 |
| `people` | 2.41, 5.29, −28.77 | 60.84 | 4.23 | 0.15 | 2 |
| `blog` | 12.3, 4.27, −16.49 | 45.74 | 3.9 | 0.15 | 3 |
| `lab` | 2.96, 1.05, −12.89 | 35.11 | 0 | **0** | 2 |
| `basketball` | 5.2, 1.65, −7.7 | 50 | 0 | 0.15 | 2 |
| `doom` | 8.154, 1.236, −13 | 45 | 1.236 | **0** | 0 |
| `404` | 8.76, 1.13, −13 | **20** | −1.5 | **0** | 0 |

Todas compartilham `contrast 1 · brightness .31 · exposure .54 · gamma .73 · vignette .8/.75`;
**o que muda por cena é o bloom e o enquadramento.** O Tenebrae já tem um `grade` no fim da
cadeia e já tem `PROPORTIONS` e as constantes de `intro.js` — a ideia transferível é **tratar
enquadramento e correção como dado por Módulo**, não como constante global.

**4. A navegação é um mesh com nome.** Cada saída é uma `tab`: um mesh do GLB
(`Basketball_Home_Left_Hover`), uma rota (`home`), um rótulo de hover (**"Go Back Home"**,
"Play Basketball", "Go to Showcase") e uma escala de indicador. **[M]** Duas consequências:
o objeto declara para onde cada coisa leva **antes do clique**, e a `home` tem **sete** saídas
declaradas — o mapa inteiro visível do ponto de partida. É o item 5 do *Open* (a prévia no SUN)
com uma resposta mais barata: **rótulo no hover antes de comprometer a câmera.**

**5. O boot roda fora da thread principal.** Um `new Worker({type:"module"})` recebe
`transferControlToOffscreen()` e desenha a tela de carregamento enquanto a thread principal
engole 10 MB de GLB; mensagens `offscreen-canvas-loaded` e `loading-transition-complete`
fecham o ciclo. **[M]** — Relevante para o T-21: o custo do boot não é só duração, é **quem
está travado durante ele**.

## E a instrumentação, que é a parte que ninguém copia **[M]**

Breadcrumbs do Sentry na categoria `canvas.boot`, com `atSec` por marco (`worker-spawned`,
`offscreen-ready`) e, junto, o perfil da máquina: `hardwareConcurrency`, `deviceMemory`, `dpr`,
`viewport`, `connection.effectiveType`, `downlink`, `rtt`, `saveData`, `usedJSHeapSize`.
Eles medem o boot **em produção, por classe de aparelho**. Aqui a lição já foi paga duas vezes
(*medir antes de otimizar*); eles a têm como infraestrutura.

## A camada para máquina — o achado com maior alavancagem **[M]**

- `<nav aria-label="Site mode">` fixo no rodapé, dois botões: **Human** (atual) · **Machine**
  → `/ai/home`.
- `/ai/{página}` para as oito páginas: HTML puro, ASCII-art do nome, índice das outras, e o
  conteúdo em pares chave-valor (`name`, `aka`, `founded`, `location`, `area_served`,
  `services`, `clients`, `knows_about`).
- **Twin Markdown de tudo:** `.md` na URL, ou `Accept: text/markdown`. `sitemap.md` lista as
  páginas e os 29 posts.
- `llms.txt` com um parágrafo `>` de resumo, "Key pages" com uma linha por página, e a
  explicação do esquema `.md`.
- `robots.txt` **nomeia** `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `Claude-User`
  com `Allow: /` e nega `/api/` e `/studio`.

O `robots.txt` do `nanj.in` tem quatro linhas e um sitemap. O `llms.txt` já existe e já está
melhor que o de muita agência. O que falta é a **rota navegável** e o **botão** — e o botão é
metade do valor, porque é o que diz ao humano cético que a versão em texto existe.

---

# Parte 3 — o que cai em cada item do *Open*

| Item do *Open* | Referência | Ação concreta | Custo |
|---|---|---|---|
| **6 — CONTATO não se anuncia** | Leo: `Type 'whoami'` na `description` + comando `cheat` | uma frase em repouso na tela dizendo o que se pode apertar; e um "o que dá para fazer aqui" acessível pelo próprio objeto | baixo |
| **7 — celular** | Leo: `visualViewport`, `interactive-widget`, `touch-action`, `overscroll-behavior` | **conferido no repo:** já existem `viewport-fit=cover` e as `safe-area-inset`; **faltam as quatro**. `interactive-widget=resizes-content` é a que mexe com o teclado sobre o formulário — mas o bug do formulário **já foi corrigido** (montar em `document.body`), e essa meta muda o viewport visual da página inteira: **testar contra `?turned` antes**, não aplicar às cegas | baixo |
| **7 — celular, a parte cara** | Leo: rotas `handheld-boot` / `handheld-home` / `handheld-panic` | tratar o celular como **outro aparelho**, não outro layout — o `?turned` já é meio caminho | alto |
| **5 — prévia no SUN** | basement: `tabHoverName` por mesh | rótulo ao passar sobre o Work antes de comprometer a câmera | médio |
| **T-21 — boot** | basement: OffscreenCanvas em worker; Leo: `needsRedraw` | medir *quem trava* durante o boot, não só quanto dura | médio |
| **`realism-budget.md`** | basement: 19 lightmaps assados, `BatchedMesh` | assar a luz **estática** do quarto — ver a ressalva abaixo, **não é drop-in** | alto, e é o caminho certo |
| **Faixa `lyra` (SEO/GEO)** | basement: `/ai/*` + `.md` + `sitemap.md` + `robots` nominal | rota `/ai/` + botão Humano · Máquina + `robots.txt` nominal | baixo |
| **novo — não está no *Open*** | Leo: BIOS `MISSING` | `public/404.html` em personagem; hoje é a página cinza do GitHub Pages | baixo |
| **`?debug`** | basement usa **leva** | nada a fazer: a fileira de dials já é isso, e é mais barata | — |

## A ressalva do lightmap, antes que alguém comece por ela

O basement assa um escritório **estático**: geometria fixa, luzes fixas, câmera voando entre
pontos de vista fixos. O Tenebrae não é isso — as Velas **morrem uma a uma conforme a Vigília
sobe**, e o `CONTEXT.md` é explícito: *quando uma Vela morre, o quarto perde aquela luz de
verdade*. Um lightmap só não representa isso.

A técnica continua certa, mas em duas partes: **assar apenas a contribuição estática** do quarto
(paredes, chão, o retrato, os globos) e **manter as Velas dinâmicas**; ou assar um conjunto por
estado da Vigília e cruzar entre eles. Qualquer das duas é trabalho de verdade. É o item mais
caro da fila — começar por ele com a premissa errada custa sessões.

# Parte 4 — onde o Tenebrae já está na frente

Isto é para **parar de re-litigar**, não para comemorar.

1. **Conteúdo legível sem JavaScript.** O espelho pré-renderizado (T-26) coloca o portfólio
   inteiro no HTML estático. O Leonardo, com uma execução tecnicamente mais ambiciosa, entrega
   **zero** — o objeto dele é inacessível a um leitor de tela, a um ATS e a um `curl`. O
   basement chegou à mesma conclusão que o Tenebrae, por outro caminho (DOM real + 3D por cima).
   *O caminho está certo. Não é preciso decidir de novo.*
2. **Peso.** `nanj.in`: HTML 42,9 KB + 9 KB de JS de entrada; a cena são **915 KB** carregados
   depois. O basement: **10,35 MB** só de 3D, mais 3,0 MB de JS. Duas ordens de grandeza. **[M]**
3. **Duas línguas**, com o teste que falha se uma frase não for traduzida. Nenhum dos dois tem.
4. **`llms.txt` de verdade**, escrito para ser lido, não gerado.
5. **Um fallback desenhado** (`?flat`), não uma degradação.

## Fila sugerida

`public/404.html` em personagem → a frase que revela a rota (item 6) → `/ai/` + botão
Humano · Máquina → `robots.txt` nominal → rótulo de hover nos Works (item 5) → assar a luz.

As quatro primeiras cabem numa sessão. A última é o `realism-budget.md` inteiro.

---

**Nota de método.** O "conteúdo legível" do `nanj.in` medido aqui (17.296 caracteres, tirando
as tags no braço) **não é comparável** aos 5.675 do `HANDOFF.md`, que usa outra contagem. O
número que vale é o do `verify:site`.

---

# Segunda rodada — 2026-09-02, com o browser vivo

A primeira rodada foi lida no fonte porque a extensão do Chrome estava fora. Ela voltou, e
esta parte é **[V]** — visto rodando, em janela em foco, 1440×900.

**Uma medida que vale guardar:** numa aba automatizada o Chrome reporta
`visibilityState: "hidden"` e **`requestAnimationFrame` dispara 0 vezes em 2 s** — medido no
próprio `basement.studio`, não só aqui. A aba precisa estar **em foco na frente** para qualquer
site WebGL animar. O `HANDOFF.md` já dizia isso do Tenebrae; é do navegador, não do objeto.

## O que só aparece olhando

**O basement não persegue realismo. Ele mistura duas camadas que não combinam — e é isso que
faz a identidade.** Embaixo, um quarto escuro iluminado em poças, com luz assada. Em cima,
tudo que é tela, letreiro ou emissivo é desenhado em **dither ordenado de 1 bit** — xadrez duro,
preto e branco, sem meio-tom. O letreiro de neon "basement." é um contorno quadriculado. Os
quadros na parede são vídeos ditherizados. O logo do DHARMA no Leonardo também é dither.

Isso importa para a pergunta do PlayStation mais do que qualquer coisa que eu tinha lido no
fonte: **a referência que ele mandou não é PS1, é meia-tom de impressão.** E "impressão" é
exatamente o vocabulário que o `CONTEXT.md` já usa para a Plate — **Print**, a camada
serigráfica. Registro compatível, não emprestado.

**O Leonardo boota em ~28 segundos** — POST da BIOS, LILO, login do DHARMA OS — e não pede
desculpa por isso: o boot **é** o conteúdo, cada linha é legível e tem piada. O Tenebrae cortou
o dele para 2,42 s (T-21) tratando boot como custo. As duas decisões estão certas para produtos
diferentes; o que não dá é ter os 28 segundos *sem* o conteúdo.

**E a resposta ao item 6 estava na tela o tempo todo, não na `<meta>`.** Assim que o prompt
aparece, o objeto diz, em ciano e amarelo sobre o preto:

```
Type help for commands · startx or F11 launches the UI · F12 reboots
```

e repete a mesma linha, apagada, **fixa na borda de baixo da tela**, para sempre. Duas camadas:
uma vez com destaque no momento certo, e uma permanente e discreta que nunca some. Nada de
pulso, nada de piscar. É a coisa mais barata e mais eficaz das duas referências.

## As funcionalidades do basement que valem para cá

- **O Lab é um fliperama, e a UI mora na tela dele.** Lista de experimentos com link `SOURCE`
  em cada linha, um painel `PREVIEW`, três coisas jogáveis, `LABS V1.0` no rodapé — e em volta,
  modelados: manches, botões, caneca de café, lata de Red Bull, e um post-it com `↑↑↓↓←→←→ⓐⓑ`.
  **É o Tenebrae feito por outra gente**, e prova que conteúdo denso numa tela dentro da cena
  funciona **desde que a câmera enquadre a tela apertado**. O `focus.js` já faz isso.
- **O Showcase é uma vitrine iluminada por prateleira.** Cada trabalho é um objeto físico —
  um shape de skate, uma bolsa, um pôster, uma maleta — em nicho de madeira com LED embaixo.
  É o **Plinth** do `CONTEXT.md`, só que permanente em vez de invocado. Vale a comparação
  honesta: o deles não tem o evento da Invocação, e por isso não tem o momento.
- **Contador de gente online no cromo** (`Online (26)`, que mudou para 27 e 24 entre capturas).
- **Minigames como cena de primeira classe** (basquete, DOOM), com rota e enquadramento
  próprios — não escondidos como brinquedo.

## A questão gráfica, que é a prioridade

### Não é "PS1", são três eixos separados — e eles têm custos e riscos diferentes

O erro é tratar "estética PS1" como uma coisa só. São três, e só uma delas é sobre performance:

| eixo | o que é | o que custa | risco de registro |
|---|---|---|---|
| **A · resolução interna** | renderizar em alvo pequeno e ampliar | **devolve frame** | nenhum |
| **B · quantização** | dither ordenado, paleta reduzida | ~nada (um passe) | **baixo — combina com Print** |
| **C · assinatura de console** | snap de vértice, warp afim de textura, sem z-buffer | ~nada (vertex shader) | **alto** |

E vale saber o que cada console fez, porque a escolha muda o resultado:

- **PS1** — sem z-buffer (polígonos brigam e piscam), **vértices em grade inteira** (o wobble),
  **mapeamento afim** (a textura nada nos polígonos grandes), 15 bits de cor com dither, 320×240.
  Resultado: *crocante, instável, sujo*.
- **N64** — tem z-buffer e correção de perspectiva, mas cache de textura de 4 KB e filtro
  bilinear: *borrado, macio, com neblina para esconder distância*. É o oposto do PS1.
- **Saturn** — quadriláteros e **sem transparência real**: usa malha xadrez no lugar. É de onde
  vem o "screen door".
- **Dreamcast/PS2** — limpo; o "look PS2" é mais pós-processamento do que artefato.

**A recomendação:** o Tenebrae é um objeto litúrgico, não um console. O eixo **C** puxa o
registro para nostalgia de videogame e é o que mais arrisca virar piada — deixa por último e
atrás de flag. Os eixos **A** e **B** são outra conversa: **A** é orçamento puro e **B** é o
Print que o glossário já descreve.

### O argumento que fecha: o quarto está apagado

Do `realism-budget.md`, medido: **15 luzes = 87% do frame**, resolução escala linear a
~4 ms/Mpix, orçamento 8 ms. E do `scene.js`, linha 4935: **`setRoom(false)`** — o Altar, o
retrato da Lyra e os móveis estão modelados e **desligados**, porque não cabiam.

Iluminação é paga **por pixel iluminado**. Então:

| | Mpix | custo estimado |
|---|---|---|
| hoje, 1512×856 | 1,29 | ~5,2 ms |
| metade linear (756×428) | 0,32 | **~1,3 ms** |

Isso não é economizar por economizar: **os ~4 ms que sobram são o preço do quarto.** O caminho
de baixa resolução é o que permite *acender* o que hoje está apagado — e é justamente o que a
solução de lightmap do basement **não** resolveria aqui, porque as Velas morrem uma a uma e
precisam continuar dinâmicas.

Dito de outro jeito: a pergunta não é "vale a pena parecer PS1?". É **"vale a pena trocar
pixels por luz?"** — e o `realism-budget.md` já respondeu que sim, só não tinha proposto o
câmbio.

### Como testar, no idioma que o repo já fala

O projeto já tem a forma certa: `prototype/deck-fit/` e `prototype/light-fit/` são páginas
isoladas onde uma peça é ajustada sem a cena inteira em volta. O teste é **`prototype/lofi-fit/`**:

1. a cena real renderizada num `WebGLRenderTarget` com **escala de resolução** em slider
   (1.0 → 0.25), lado a lado com a saída de hoje;
2. o passe de quantização com **força de dither** e **profundidade de paleta** em slider,
   partindo de 0 — em 0 tem que ser pixel a pixel igual ao de hoje;
3. e, em cima de tudo, **a bancada de medição da ADR-0019** — `renderer.render()` em laço
   apertado, `readPixels` de um pixel para forçar a GPU a terminar, ms por combinação. Não
   `requestAnimationFrame`, pelo motivo medido no topo desta seção.

O teste tem que responder duas perguntas na mesma tela: *fica bom?* e *quanto devolve?*. E tem
uma terceira, que só aparece medindo: **em que escala o texto da Screen deixa de ser legível.**
Esse é o limite real do eixo A, não o gosto — a Screen é 320×180 e é onde mora o conteúdo.

**O eixo C fica de fora desta bancada, de propósito.** Snap de vértice e warp afim são uma
mudança por material, não um passe — e são justamente os dois que leem como *console* em vez
de como *impressão*. Entram numa decisão própria, depois de A e B terem sido julgados.

**Construído em 2026-09-02:** `prototype/lofi-fit/index.html` (bancada), a quantização dentro
do `GradeShader` em `post.js`, `__unit.setLofi()` e a flag `?lofi` em `scene.js`.

### Como aplicar sem perder o que já funciona

Tudo isso é **aditivo e reversível**, e é assim que tem que entrar:

- atrás de uma flag de URL, como `?debug`, `?flat` e `?turned` já são — **`?lofi`**;
- o `PIXEL_RATIO` da linha 92 e os níveis de qualidade da 4416 **já são a alavanca do eixo A**;
  não é código novo, é alcance novo;
- a quantização entra no fim da cadeia existente (`RenderPass → OutputPass → grade`), que já
  tem grade e grão desde a ADR-0021;
- nada disso toca o espelho, o `?flat`, as duas línguas, o `verify:site` ou o conteúdo;
- se perder, some um arquivo e um parâmetro.

**A ordem:** A medido primeiro (é o único que devolve frame) → só então B com o Print como
referência → C por último, e só se ele quiser.

## Som — o par press/release é o achado, não a trilha

Medido: basement **45 arquivos, 7,14 MB**, com `PositionalAudio` e `AudioListener`; Leonardo,
um sistema operacional inteiro, **praticamente mudo**.

O que vale copiar não é a quantidade: é que **todo controle tem `press` e `release` separados**
(`arcade-button-0-press` / `-release`, `blog-lamp-0-pull` / `-release`, portas com `open` e
`close`). É isso que faz um botão ter curso e um interruptor ter peso — e é a coisa mais barata
de acertar num objeto que é um **instrumento**. Um Pad do Tenebrae com um clique só é um botão
de site; com dois é hardware.

Antes de trilha, três sons: **Pad press, Pad release, e o giro do SOL/LUA** (eles têm
`knobTurning`). Com corte no primeiro gesto do visitante, porque autoplay de áudio é bloqueado
até haver interação — e com um jeito visível de desligar.

**A CDJ que mixa** fica depois, e o bloqueio dela não é técnico: é o que se pode distribuir.
Composição própria resolve o direito e vira argumento de portfólio; as quatro faixas do
basement pesam 2,36 MB, contra 915 KB da cena inteira do Tenebrae hoje — a trilha pesaria
**mais que o objeto**. Se a mixagem entrar, o caminho barato é **dois stems em loop, curtos, com
crossfade**, não um app de DJ.
