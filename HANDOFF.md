# Handoff — Fernando Linck portfolio ("Tenebrae")

**Date:** 2026-09-06 · **Repo:** `~/dev/fernando-portfolio` · **Branch:** `lyra`
**Remote:** https://github.com/fernandolinck3/portfolio-nanjin · **Live:** https://nanj.in
**Language:** Fernando writes EN and PT-BR, often in one message; the *product* is PT-BR.
Reply in whichever he used last (last was mixed, leaning PT-BR).

## Read this first

**Thirty ADRs**, several of them reversals — 0001 a 0030, e duas nasceram 0029: a do
formulário virou 0030 em 06/09, porque a do cenário já era citada por nome em cinco arquivos.
`CONTEXT.md` is the glossary. `docs/tickets/README.md` is the board.
`docs/realism-budget.md` is the plan for adding to the room without spending the frame.
This file does not repeat them.

> **Estado em 2026-09-16 — ler este bloco primeiro; o de 06/09 abaixo continua valendo no que não contradiz.**
>
> **O que aconteceu.** Em 15/09 um Codex trabalhou aqui sem commitar e parou quando os créditos
> acabaram. Em 16/09 uma sessão do Claude Code commitou esse trabalho e continuou. O processo que
> o Codex montou está em `AGENTS.md`, `PLAN.md`, `ARCHITECTURE.md`, `DECISIONS.md` e **`TASKS.md`**,
> que é o registro das tarefas, com as evidências de cada uma.
>
> **`lyra` está 71 commits à frente de `origin/lyra`. Nada foi publicado**, e empurrar para `lyra`
> publica o site. Os commits de 16/09: `e9fd2b5` (o trabalho do Codex), `83ccf41` (faceplate e
> aviso de rolagem), `a1a825a` (capas da parede adiadas). Árvore limpa; `check`, 170 testes,
> `build:site` e `verify:site` passam.
>
> **Feito em 16/09, testado no iPhone 13 Pro (Safari) pela rede local.** Para servir ao celular:
> `npm run build:site && npx vite preview --config vite.site.config.ts --host --port 4817`, e no
> celular `http://<IP do Mac>:4817/`.
> - **Tela duplicada do CDJ (TASK-008, T-39):** o visor auxiliar só aparece com o quarto ligado
>   (`ROOM_K > 0` em `visorDeveAparecer`). Ele disse que melhorou; o `?trilho` com visor ainda não
>   foi conferido.
> - **Faceplate lento:** `public/ornament/plate.webp` (486 KB, era PNG de 2,7 MB), carregado primeiro,
>   com `<link rel="preload">` em `prototype/index.html`. O PNG ficou de reserva. Ele confirmou que
>   melhorou.
> - **Abertura lenta (TASK-007):** medido no Mac, o JS antes do primeiro quadro caiu de 3,25 s para
>   1,53 s. As sete capas da parede (`room-decor.js`) eram desenhadas mesmo com o quarto desligado;
>   agora saem em `decor.desenharCapas()`, chamado por `setRoom(true)`. A retícula de
>   `sleeve-art.js` virou padrão. **Ainda não reconferido no celular.** O que sobra são blocos de
>   até 250 ms cada. Método de medição (marcadores antes de cada bloco de topo, build em pasta
>   separada, fonte restaurado com shasum) descrito em `TASKS.md`.
> - **Leitor de projeto no celular:** botão "Role para ler ↓" (`.work-scroll` em `focus.js`, string
>   `workScroll`), some na primeira rolagem. Testado numa página isolada a 390 px, não no site inteiro.
>
> - **Texturas chegando aos poucos no celular (16/09, depois da barra):** medido no Mac, todas as
>   texturas, as faces dos Decks e o HDRI só eram *pedidos* aos ~2,7 s, quando `scene.js` terminava de
>   avaliar. Agora têm `<link rel="preload">` em `prototype/index.html` e começam aos 11 ms, sem
>   download duplicado (terminam aos ~180 ms em localhost, eram ~5,1 s). Decks viraram WebP
>   near-lossless (1,1 MB → 571 KB). **A avaliação do módulo continua ~2 s no Mac**, espalhada: nenhum
>   bloco passa de ~180 ms (maiores: `createAltarProps`, `createBaroque`, que monta a sala mesmo
>   desligada). No celular ele achou "ainda um pouco lento" e decidiu seguir em frente; o próximo passo, se voltar, é montar a sala só no `setRoom(true)`.

> **Esperando decisão dele (propostas, nada implementado):**
> 1. ~~**Barra de toque**~~ **Feito em 16/09 (`6540a04`), falta ele confirmar no celular:** `syncTouch` em `scene.js`, chamado junto do `syncMirror`; `onIdle` no `focus` avisa quando o voo de saída termina. Proposta original — (`.touch` em `prototype/index.html`, visível com `hover:none` desde a abertura):
>    ele estranhou Anterior/Próximo/Abrir/Voltar já na abertura. Proposta: nada na abertura; os
>    três aparecem com um módulo e uma lista na tela; Voltar só quando há nível para voltar.
> 2. **Recusada por ele em 16/09 — não fazer.** ~~**Setas ‹ › do leitor no celular** (`.work-step`, presas no rodapé, longe da imagem): proposta de
>    tirá-las no celular e trocar de imagem arrastando a foto, mais as miniaturas que já existem.~~
>
> **Pendente sem decisão:** revisão independente da TASK-008; TASK-001 a 003 do `TASKS.md` nunca
> começaram. Os worktrees `tenebrae-contact-task004` e `tenebrae-mobile-task005` e os backups
> `~/dev/backups/portfolio-*-20260915-*` são do Codex e já foram integrados. Não foram apagados.
> O bundle de backup foi refeito em 16/09 depois do último commit.

> **Estado em 2026-09-06.** Este bloco substitui o de 05/09, que dizia dezoito commits e já
> nascia velho. Os parágrafos abaixo dele, sobre tudo estar publicado, **não valem mais.**
>
> **`lyra` está 53 commits à frente de `origin/lyra`, e isso é deliberado.** Ele foi perguntado
> hoje e disse que não quer publicar. O site no ar é `f607fe9`, de 03/09 03:41 — não tem o quarto
> navegável, nem a estação do retrato, nem o oráculo, nem o acervo, nem a Invocação, nem a
> correção da luz. **Não empurre para `lyra` sem ele pedir**: `pages.yml` dispara no push para
> essa branch e só nela, então qualquer outro nome é um push que não publica.
>
> Contra a perda existe **um `git bundle` de 06/09 em `~/dev/backups/`**, com todas as branches
> e worktrees, feito depois do último commit daquele dia. Ele está **no mesmo disco** — que já encheu uma vez — então protege
> contra um `git checkout` errado e não contra o disco. Uma cópia fora daqui é decisão dele.
> Nada refaz esse bundle sozinho: quem trabalhar aqui refaz à mão, depois do último commit.
>
> Árvore limpa e as quatro verificações passam: `npm run check`, `npx vitest run` (**153 testes
> em 3,4s** — eram 140 em 05/09), `npm run build:site` e `npm run verify:site`, este último com
> as duas páginas, 6 Módulos, 22 linhas e ~9.200 caracteres legíveis em cada.
>
> O que a cadeia do quarto tem: o instrumento encolhido para `K = 0,46` (T-32), a mobília em
> quatro grupos (T-33), o anel de seis estações com o pad levando (T-34, metade), e desde 05/09
> as estações **fazem** coisas — o retrato responde perguntas e o acervo abre obras. O que foi
> construído sem ticket está tabelado no fim de `docs/tickets/README.md`, com os commits.
>
> **O quarto navegável vive em `?trilho`, que é bancada e não o caminho do visitante.** A razão é
> medida: a Tela tem 496 px no repouso e cai para perto de 170 px a seis unidades de distância,
> onde fica uma estação. Quem responde a isso é a Plate plana do T-05, promovida de plano B a
> caminho principal — item 4 do T-34, atrás do T-30. Enquanto isso não existir, ligar a viagem em
> `/` entrega um quarto bonito onde não se lê nada.

~~**Everything is committed and deployed.** Sixteen commits on 2026-08-28, working tree clean, and
`origin/lyra` is level with local.~~ **Verdade em 28/08 e falso desde 03/09** — ver o bloco acima.
O que continua verdade: nada está esperando uma decisão para *poder* ser construído.

**The site is live on his own domain, over HTTPS.**

> **https://nanj.in**

`.github/workflows/pages.yml` builds and deploys on every push to `lyra`, the repo's default branch.
It runs `npx vitest run` and `npm run verify:site` before uploading — the content tests guard what
the site claims about Fernando, and `verify:site` catches a class of build-only failure described
below. **`public/CNAME` holds the domain**: a deploy that arrives without that file clears the custom
domain silently, so never move or drop it.

DNS is at **Hostinger** (nameservers `dns-parking.com`), four `A` and four `AAAA` records on `@`
pointing at GitHub Pages. `www.nanj.in` resolves and redirects over plain HTTP but **has no
certificate** — GitHub issued one for the apex only. Left alone deliberately; covering `www` means
making it canonical, which is ugly on a four-letter domain. See *Open*.

The Claude Artifact from 2026-08-28 is still live at
`https://claude.ai/code/artifact/cc6c648f-de43-4462-b796-0b099d6740f5` and is a **second copy that
can drift**. `nanj.in` is canonical; if the Artifact is kept, republish it from the same build whenever Pages moves.

## The goal he actually stated

> *"i need a version online of my portfolio asap"*

**That is done.** It is on his domain, over HTTPS, rebuilt on every push. What the work is *about*
now is the object itself, and the standing brief for that is the long list under *Open*.

## The diary lives in `docs/log/`

Every dated *"What changed on …"* section is in **`docs/log/2026-08.md`**, newest first, moved
verbatim. Read it when you need to know why something is the way it is, or when a change you are
about to make looks like one that was already tried. You do not need it to start working.

This file keeps **state and decisions**. Reasoning goes in the commit message — `git log --oneline`
is cheap and nobody loads a commit body into context. Do not write it in both places.

## Where this was left on 2026-09-02, and how to pick it up

**Everything below is committed and deployed.** `origin/lyra` is the live branch; a push to it
builds, tests and deploys to `nanj.in` in about a minute. The working tree is clean and the main
checkout is current — the `explode.js` lines an older session left uncommitted went in as `276c561`.

**The site is now two pages.**

> **https://nanj.in** · **https://nanj.in/en/**

One source produces both. `src/content/page.ts` turns `prototype/index.html` into the page for a
locale; the Vite plugin emits them in `generateBundle`. There is no second `index.html` on disk and
there must never be. `verify:site` asserts both pages on every deploy.

**To read what happened rather than take it on trust**, the commit bodies are long on purpose:

```
git log --oneline -40          the two days, one line each
git show <sha>                 any commit, with the reasoning
```

**What shipped on 2026-09-01**, in order: the handoff split (T-19), the accessible mirror merged and
then pre-rendered (T-18, T-26), the `k` in Linck (T-27), three holes in the overlay (T-23), a contact
form with its ADR (T-28, ADR-0027), a no-GPU fallback, the boot cut to 2,42s (T-21), a consent gate,
the LinkedIn URL, the documents corrected (T-25), and a `schema.org` block.

**What shipped on 2026-09-02**: the candle favicon, the resting framing (T-22), and the English
portfolio (T-31) — machine, chrome and content, in three commits, now indexable.

**One thing wants his eyes**: the consent bar on a phone. It only appears where no answer is stored,
so it takes a private window. The Chrome extension has been down since 2026-09-01 and nothing
automated can reach it.

**Two commands to see it locally:**

```
npm run build:site && npm run preview:site     the real site
                    /en/                        the English page
                    ?flat                       the no-GPU version
                    ?turned                     the phone's rotated frame, on a desktop
                    ?debug                      the workbench dials
                    ?track                      dataLayer pushes on any host
```

## Two agents, two worktrees — read this before editing content

Since 2026-09-02 the work is split, because it collided once: two sessions wrote
`src/content/modules.ts` in the same checkout, one of them mid-flight with five red
tests, and neither could commit without shipping or clobbering the other.

| Where | Branch | Whose |
|---|---|---|
| `~/dev/fernando-portfolio` | `lyra` | SEO, GEO, the build, the mirror, the languages |
| `~/dev/tenebrae-telas` | `telas` | the project screens and the copy |

**Only `lyra` deploys.** `pages.yml` fires on pushes to it and nothing else, so work
on `telas` reaches the site by merge and not by accident. That is the protection: on
2026-09-02 it is what kept a `modules.ts` with seven projects and five failing tests
off the live site.

**Pending, and waiting on him:** he is finishing a pass on the copy with the other
agent. When it lands, this side picks it up for the SEO reading — better search terms
in `description`, in each Module's `hint` and in `llms.txt`. Nothing here should touch
`modules.ts` until that merge.

**One thing needed from him:** a GitHub URL, if he has one. `sameAs` carries Instagram
and LinkedIn; for someone who writes code, GitHub is the strongest signal tying the
identity together — and nobody here invents a profile URL, for the same reason the
LinkedIn row stayed inert for four sessions.

## The two languages, in one paragraph

Content lives in `src/content/modules.ts`, in Portuguese, and **is not translated in place**.
`src/content/en.ts` maps Portuguese to English and `translate()` swaps the leaves. `modules.ts`
resolves the page's language on import off `<html lang>`, so every consumer — `scene.js`,
`render.js`, `flat.js`, `focus.js`, `mirror.js` — keeps importing `MODULES` and gets the right
language without knowing a second one exists. The chrome is different: `src/content/strings.ts`
holds it as `t(pt, en)` pairs, where a missing translation is a compile error. Content has no such
guarantee, so `modules.test.ts` supplies it — a Portuguese sentence with no entry in `en.ts` fails
the suite. **LUA and SOL are deliberately untranslated**: they are the names engraved on the
controls, and T-30 is where that gets revisited.

## The build ships the prototype now

This changed on 2026-08-27 and it is the thing most likely to surprise you.

- `npm run build:site` → `dist-site/`, via `vite.site.config.ts`. **This is the real site.**
- `npm run preview:site` serves the built output.
- `npm run build` still builds the root `index.html` → `src/App.tsx`, which is **eleven lines and
  renders an empty `<main>`**. Every production build before this one was a blank page.

Three things that config needs, each of which fails *only in a deployed build*:

- `publicDir: '../public'` — Vite would look in `prototype/public`; the Works live at the repo root.
- `base: './'` — so the output runs from a subdirectory as well as a domain root.
- Work stills resolve through `BASE_URL` in `focus.js`, because `modules.ts` stores them as
  root-absolute `/works/…`, which would resolve past that subdirectory.

The workbench dials are hidden behind **`?debug`**. They stay in the DOM because `scene.js` binds to
each one by id and throws on the first missing element — do not delete them. Since **T-26** they also
carry `hidden` + `aria-hidden`, because `.ctl{display:none}` hid them from the eye and from nothing
else: `BEVEL 10 / TILE 1.00 / SEED 25` was the built page's entire readable content. The `?debug`
script lifts `aria-hidden` when it opens the row.

**The mirror is pre-rendered into `dist-site/index.html`** (T-26). `vite.site.config.ts` calls
`mirrorIntoPage` from `src/content/mirror.ts` through `transformIndexHtml` — the *same* renderer the
browser uses, run in node — and `prototype/mirror.js` adopts the `<main id="mirror">` it finds instead
of building one. So the static HTML carries the portfolio for everything that runs no JavaScript (an
ATS, a link unfurler, `curl`), and the runtime mirror still follows navigation. The page's only
`<h1>` comes from there. Measured: **469 readable characters before, 5,675 after**; `npm run
verify:site` now asserts six Modules, seventeen rows, one heading and the hidden workbench, because
the property is build-only by construction and no test of the source can see it.

**This contradicts ADR-0002 and T-02**, which say `src/` owns the DOM truth layer. It was flagged to
Fernando and he has not ruled. **No ADR is written.** If he blesses it, write one; if he wants `src/`
to own it, T-02 is the ticket and the prototype is the reference implementation.

## What you can actually verify with

The Chrome extension is connected. **The single most expensive lesson of the last session is here.**

### rAF is dead in an automated tab

An automated tab is a *hidden* tab. `document.visibilityState === 'hidden'` and
**`requestAnimationFrame` fires 0 times per second.** Measured, not assumed.

This means the scene renders a few frames at load and then freezes. A screenshot will show a Unit
that looks basically right with a **blank Screen**, and it is very tempting to read that as a bug. It
is not. Half a session went into chasing it before `visibilityState` was checked.

**Do not debug a frozen scene. Drive it by hand instead:**

```js
const u = window.__unit
u.introStep(1)            // land the opening without waiting for it
u.setBoot(1)              // finish the Screen's power-on
u.setCam({ tilt: 4, dist: 4.0 })
u.render()                // draws exactly one frame — no rAF involved
```

`__unit.render()` exists for precisely this and updates the matrices first, because the last frame's
matrices cannot be trusted in a throttled tab.

### Canvas work needs no scene at all

`prototype/deck-fit/` draws the Deck and control maps straight onto a plain page. Canvas draws
**synchronously**, so throttling is irrelevant and you see the actual texture at full resolution
rather than a 190px disc on a Plate. Every proportion in the last session was fitted there. It is the
same instinct as `prototype/light-fit/`; use it, and extend it when you add a new drawn part.

### Everything else still true

- **`npm run check`** bundles both entry points through esbuild in about a second. Run it before
  handing anything over. It has caught duplicate declarations that would have killed the scene.
- **It will not catch anything geometric.** A mesh facing the wrong way is valid code.
- **`npx vitest run`** — 153 tests, ~3,4s (eram 41 quando esta linha foi escrita).
- **Arithmetic is verification.** The opening tilt was found by projecting the candlestick's top into
  NDC, not by looking at it.

## State of the object

- **Plate** 5.94 × 3.26. **Decks** r .93 at x ±1.99. **Screen opening** 1.84 × 1.035.
  **Pads** .23 at .28 pitch. All in the `PROPORTIONS` block near the top of `scene.js`.
- **The room is hidden.** `setRoom(false)` hides room *meshes only, never the Group* — hiding the
  Group would kill the lights inside it. Target was 60fps; measured ~90 with the room off.
- **Lights are not culled by three.** Every visible light compiles into the shader and is evaluated by
  every lit fragment regardless of intensity. `dim(light, 0)` sets `visible = false` for this reason.
  A light at intensity 0 costs full price. This was the whole of ADR-0019.
- **Post is `RenderPass → OutputPass → grade`.** GTAO and bloom are **out of the chain**, not turned
  down — a pass costs what it costs whether or not its output is used. `lift` is `0x000000`; any lift
  at all is a raised black point, which is what "the fog" was, twice.
- **The opening** (`intro.js`): `OPEN` tilt 18 / dist 6.4, `REST` tilt 6 / dist 5.6, straight on
  (yaw 0). `TRAVEL` 3.0, `BOOT` 5.2, `HOLD` 0.7 — camera and boot run on separate clocks so changing
  one does not change the other. Plays every load; a click skips it.
- **Focus** (`focus.js`): clicking a Work zooms the camera until the Screen fills the frame, then a
  DOM panel cross-fades over it. **This reverses ADR-0017** (the plinth). The Screen is 320×180 and
  photographs of posters turn to mush upscaled 4.7×; the DOM holds the content instead, which is
  ADR-0002 and also makes the Works indexable and readable on a phone.
- **Content** is real: `src/content/modules.ts` holds six Modules (IDENT, NOW/NEXT, WORKS, PATH,
  METHOD, OUT) and six real Works with stills in `public/works/`.
- **The Decks are `cross and jogs.png` itself**, cropped — see `docs/log/2026-08.md`. The
  descriptions of drawn rims, medallion bands and phase discs that used to sit here describe code
  that no longer exists. `control-faces.js` still draws the Pads and Crossfader.

## Bugs worth remembering, because this class recurs

*(The first four are from the drawn Deck faces, which no longer exist. They are kept because the
**class** of each recurs and three of them have already recurred elsewhere in this object.)*

- **A drawing function named for what it is not.** `sunVoids`/`moonVoids` drew the tracery and the
  code treated those shapes as the *holes*, so the wheel came out pale with petal-shaped bites in it
  for months. When a name and a use disagree, the use is usually the bug.
- **A geometry change is a lighting change.** Correcting that polarity quadrupled the lit area, and
  the Sun washed out to flat cream. The emissive gain had to drop 1.5 → 0.55. Same light,
  redistributed — not a taste adjustment.
- **`slab()` is an `ExtrudeGeometry`**, and its UV generator emits **shape coordinates in world
  units**, not 0..1. Map a texture naively onto a 0.23-wide Pad and it samples a 0.23-wide sliver and
  comes out one flat colour. `fit()` in `control-faces.js` remaps it.
- **A shape that shears is invisible as a void and obvious as a bar.** `petal()`'s flanks are offset
  by a fraction that grows with radius. Fine as a hole; eight of them as *bars* around a hub read as
  a turbine, because every blade leans the same way. `leaf()` is mirrored by construction.
- **A mesh can be perfect and invisible.** `plateGeom()` bakes its own `rotateX(-90°)`; a leftover
  `face.rotation.x` faced the printed layer at the floor, where it was backface-culled.
- **`metalness: .85` makes albedo a reflection tint, not colour.** Printed colour needed a
  `metalnessMap` dropping the ink to a dielectric before it appeared at all.

### The build is not the dev server, and it bit three times in one day

This is now the most productive place to look when something is wrong only in production:

- **The built page loaded nothing.** Vite injects the module script immediately after the first
  *literal* occurrence of the root element's tag in the source — and the comment above it contained
  that tag, so the script was injected **inside the comment**. No console error, no build warning,
  invisible in development because the dev server injects nothing. The first Pages deploy was blank.
  `npm run verify:site` now strips comments from `dist-site/index.html` and asserts a module script
  survives, and checks the charset is inside the first 1024 bytes. It runs in the workflow.
- **The Plate artwork never shipped.** `prototype/ornament/plate.png` sat under Vite's `root` but
  `publicDir` is `../public`, so the dev server served it and `dist-site/` never contained it. Every
  build fell back to the procedural vine, and *the console said so on every load* —
  `no ornament artwork; using the procedural vine`. It was read past.
- **The page had no `<meta name="viewport">` at all.** A phone laid it out at a 980px virtual width
  and scaled down, which is most of "tudo muito pequeno" on mobile, and fed the rotated frame a
  width that was not the device's.

Two more from the same day, different class:

- **A TDZ in a module-scope list.** The glow-layer array reached forward to `ledMeshes`, declared
  1200 lines later. `ReferenceError` before the first frame, whole scene dead. Module-scope arrays
  that name things run at import time.
- **`fetch` is blocked under an Artifact's CSP**, and `scene.js` probes for the faceplate with a
  `HEAD` request before touching the image — right against a real server, fatal there. If something
  works on Pages and not in the Artifact, look for a probe.

## A fila, em 2026-09-07

Ordem para quem pegar isto numa sessão nova. Os quatro primeiros são bem definidos; o resto está em
`docs/specs/fechar-a-versao-do-quarto.md`, e a ordem de trabalho está em
`docs/agents/como-trabalhar-neste-projeto.md`.

1. **As citações literais.** O `CLAUDE.md` proíbe citar o dono do repositório em qualquer coisa
   commitada, e a árvore tem **177 ocorrências** do padrão, das quais **156 já publicadas**, em 44
   arquivos — comentários, ADRs, tickets e diário. Limpar a árvore é mecânico e barato; limpar o
   histórico é reescrita com force-push, e essa decisão é dele e é a **mesma janela** que a
   separação das notas privadas já pedia. Fazer a árvore, deixar o histórico decidido junto.
2. **A capa do acervo.** Cinco desenhos estão em `?` → `/capa-fit/`, mais uma camada de matéria
   (grão, retícula, anel do disco, desgaste, brilho, vinco) e uma fileira de controle sem ela. A
   escolha é dele e se decide na tira de cem pixels. Se nenhum servir, o caminho ainda não tentado é
   o vocabulário do próprio objeto — 1 bit, dither, a linguagem da Tela — que também é a ponte para
   o registro `?lofi`, sobre o qual ele levantou a dúvida e não decidiu.
3. **A vitrola modelada.** Dois GLB estão em `~/Downloads`: `50s_record_player_cabinet.glb` (11 MB,
   console dos anos 50) e `vintage_record_player.glb` (13 MB, vitrola de corneta com pavilhão de
   latão — a que conversa com o quarto). Ambos CC-BY, exigem crédito em `public/mobilia/CREDITS.md`.
   **Nenhum entra como está**: o quarto inteiro são 4,5 MB. Precisa de decimação e texturas para
   512/1024 — ferramenta de linha de comando não é dependência de runtime, então a ADR-0004 não
   proíbe.
4. **A pesquisa de assets e da referência basement.studio** foi encomendada em 2026-09-07 e o
   arquivo cai em `docs/research/`. Ler antes de baixar mais modelo.

## Open

**His standing brief, given 2026-08-28 and mostly not started.** It is long and specific; this is the
part to work from, not from taste.

1. ~~**The project overlay's architecture.**~~ **Done 2026-08-31** — see `docs/log/2026-08.md`. Every
   part of the brief is built and measured: 60/40, the fixed header, three sections in the first
   fold, the drawn indicator, and his mobile order. The one thing it does not close is item 7
   below: the phone layout was verified in a 402px iframe, not in a hand.
2. ~~**The accessible mirror of the LCD.**~~ **Done 2026-09-01** (T-18, then T-26). Every word is
   real HTML, built from `modules.ts` by one renderer run at build time and adopted at runtime — not
   a second copy. Written into `dist-site/index.html` before any script runs, so it reaches a reader
   that never executes JavaScript. **465 readable characters became 5.827**, there is one `<h1>`, and
   a `schema.org` `Person` block says who he is rather than leaving Google to guess. `verify:site`
   asserts the structure on every deploy, so this cannot silently regress.
3. **Per-project case content.** Portfolio should present the system as the project — boot, modules,
   decks, LYRA, interactions, ECLIPSE, and **it has no images at all**, so the overlay opens it on an
   empty media column. Graecus should tie the eight captures to the WordPress build. ~~Miscelânea
   must stop saying the content is coming "em breve"~~ — done 2026-08-31, along with the same promise
   under every other case. The prose itself is still mine, which is why it is still under *Blocked on
   Fernando* rather than here.
4. ~~**Boot in 2–2.5s.**~~ **Done 2026-09-01** (T-21). **5,90s → 2,42s**, measured by driving the
   opening a frame at a time in `intro.test.js`, because `rAF` cannot be used to time anything here.
   The four beats are untouched — only the dwell went. A repeat load in the same session plays at
   0.42x rather than skipping, so whoever is building this still sees it. `TOQUE PARA PULAR` appears
   after ~1.2s, because a click always ended the opening and nothing ever said so.
5. **PROJETOS: the SUN should reveal a short preview** of the selected project — one factual line,
   optionally a small monochrome image — with pressing the Screen opening the full case. Today the
   SUN just moves the cursor there, because those items have no pages.
6. **CONTATO — half done.** A form is built and live (T-28, ADR-0027), the LinkedIn URL arrived on
   2026-09-01 and the row acts, and both addresses are real `<a href>` in the static HTML. **What is
   left is discovery, not hierarchy:** nothing at rest says the route exists, and a visitor can spend
   thirty seconds and leave with no way to reach him. His own suggestion, to build: a slow pulse on
   the CONTATO lamp after ~20s of it not having been opened, stopping for good once it is. A breath,
   not a blink — a blink reads as an alarm and nothing here is urgent. **The order stays**: CONTATO
   closing the six is right, and moving it was never the ask.
7. **Mobile, on a real device — and it has now found its first bug.** He held a phone on
   2026-09-01 and the form came up sideways: it was mounted inside `#frame`, which a portrait phone
   rotates 90°, and a transformed element is the containing block for everything in it, fixed
   overlays included. Looking at a turned object is the design; typing into one is not, because the
   keyboard arrives in the device's orientation. Fixed — the form, the mirror and the consent bar all
   live on `document.body` now. **Still unseen on a phone:** the consent bar,
   and whether the case overlay reads well turned (left alone deliberately — it is reading, not
   typing, so rotating with the object is coherent).
8. **Record the film.** `?film` is built and never run. It needs a visible window; the framing
   numbers come from geometry, not from watching it.

**Older, still open:**

9. ~~**Two names on one object.**~~ **Ruled 2026-08-31: Fernando Linck, everywhere.** He was asked
   directly and chose the name the domain, the email and the metadata already used. Applied in the
   four places that disagreed: `modules.ts` (QUEM), `prototype/screen/render.js` (the boot screen's
   `NAME`), and the root `index.html`'s title and description — that last one is the dormant `src/`
   entry, changed so it cannot ship the old name if `T-04` ever lands. `prototype/index.html` already
   said Linck in every tag and was not touched. **Nothing on the object says Bittencourt any more.**

   Still open beside it: the LinkedIn row has a label and **no URL**, so it does not act. And the
   root `index.html` positions him as *"frontend developer with a marketing perspective"* while the
   shipped page says *"growth, CRO e experiências digitais"* — two different self-descriptions in one
   repo. Only one of them ships today. Not touched: it is positioning, which is his.
10. **`www.nanj.in` has no certificate.** It resolves and redirects over plain HTTP; over HTTPS it
    hits GitHub's `*.github.io` cert and warns. Covering it means making `www` canonical, which is
    ugly on a four-letter domain. Deliberate, and his call.
11. **Write the ADR for shipping `prototype/`** — or unpick it into `src/` (T-02). Needs his ruling.
12. **`src/App.tsx` is still eleven lines.** T-02 has not moved in four sessions.
13. **One gap left against `cross and jogs.png`**: the Pad row is six separate wells where the
    reference has one continuous brass tray with dividers.
14. **The clipped back candlestick** at the tight framing. Three options were offered, none chosen.
15. **Two models undecided.** He said Grimoire and Cracktro "should be two different models, cause I
    really love them both." The Unit is pinned to Grimoire; Cracktro is unwired but intact in
    `render.js`. **No ADR** — it would reverse 0012, 0015 and 0016 and needs his decision, not a
    guess. Suggestion on the table: ship Tenebrae as Grimoire, make Cracktro Project 002.
16. **Lyra's bubble** is plain. He asked for ornamental. The covering-text half is fixed.

## Blocked on Fernando · Cautions

Estas duas seções saíram para um repositório **privado** em 2026-09-02.

Elas guardavam notas de trabalho **sobre Fernando** — como ele responde, o que já
custou tempo, e quais textos do portfólio ainda não são a voz dele. Nada disso é
produto, e este repositório é público e está linkado do perfil dele no GitHub.

Quem estiver trabalhando aqui e precisar delas: `~/dev/nanjin-notas`.
