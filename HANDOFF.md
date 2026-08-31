# Handoff — Fer Bittencourt portfolio ("Tenebrae")

**Date:** 2026-08-29 · **Repo:** `~/dev/fernando-portfolio` · **Branch:** `lyra`
**Remote:** https://github.com/fernandolinck3/tenebrae · **Live:** https://nanj.in
**Language:** Fernando writes EN and PT-BR, often in one message; the *product* is PT-BR.
Reply in whichever he used last (last was mixed, leaning PT-BR).

## Read this first

**Twenty-six ADRs**, several of them reversals. `CONTEXT.md` is the glossary.
`docs/tickets/README.md` is the board. `docs/realism-budget.md` is the plan for adding to the room
without spending the frame. This file does not repeat them.

**Everything is committed and deployed.** Sixteen commits on 2026-08-28, working tree clean, and
`origin/lyra` is level with local. Nothing is waiting on a ruling.

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
can drift**. `nanj.in` is canonical; if the Artifact is kept, republish it from the same build (see
the packer note below) whenever Pages moves.

## The goal he actually stated

> *"i need a version online of my portfolio asap"*

**That is done.** It is on his domain, over HTTPS, rebuilt on every push. What the work is *about*
now is the object itself, and the standing brief for that is the long list under *Open*.

## What changed on 2026-08-31 — the project overlay is the architecture he asked for

*Open #1, built and measured in a real tab. `prototype/focus.js` only, plus one line of
`modules.ts`. Everything below is a number read off the running page, not an impression.*

### The header is fixed because the grid has a row that can be zero

The panel was one flex row: the image beside a single column that carried the number, the
title, the summary **and** the case — and that column was the `overflow:auto` element. So
the title scrolled away. Two flicks into Graecus and nothing on screen said which project
was open. A header that scrolls is not a fixed header.

It is now a grid of named areas, and only one of them scrolls:

```
  back   back   back      the way out
  media  head   rail      60% image · 40% title+summary · the indicator
  media  text   rail      the case, and the only scrollport in the panel
```

`head` and `text` share a column, so the rule under the header runs the width of the reading
column and the case hangs off it — the Screen's own relationship between a page and its
header rule, at full size.

**Two grid traps, both hit, both the same mistake on different axes.** A track's automatic
minimum is its content's min-content size, so `1fr` is not a promise of anything:

- The scroll row needs `minmax(0, 1fr)`. Without the `0`, the row takes its size from the
  `overflow:auto` child's *content*, the frame grows, and nothing ever scrolls.
- The columns need `minmax(0, 3fr) minmax(0, 2fr)`. Without them, a stretched plate carrying
  an `aspect-ratio` asked for height × 1.6 of width and took it out of the reading column,
  **which came out 127px wide with the title on four lines.** Measured, not guessed.

The rail's track is a fixed `22px` rather than `auto`, because the rail hides itself on a case
that fits and a collapsing track moved the 60/40 split nine pixels between one project and the
next. All three projects now measure 642 / 428 — 60.0%.

### The scrollbar is drawn now, in the object's vocabulary

The native scrollbar was the one piece of the operating system this object never invited in.
It is gone (`scrollbar-width:none`, `::-webkit-scrollbar` at zero) and a rail took its place:
**one mark per section of the case**, placed at the section's own share of the scroll height,
the current one brass and long, a Silkscreen counter under them. The marks are buttons, so the
rail is also the way to any section.

It is a map, not a thumb — it says how many sections there are and which one is under the eye.
It **hides itself** when the case fits, which is why Miscelânea has no rail: one section, no
overflow, nothing to indicate. Verified: Graecus 6 marks reading `01/06` at the top and `06/06`
at the floor, Portfólio 5, Miscelânea hidden.

### The first fold holds, and it was measured rather than hardcoded

His brief asks for project, context and construction **without scrolling**. Nothing names those
headings in the code — the three projects do not share a section list (Graecus has CONTEXTO and
BLOG, Portfólio has MOTIVO and REFERÊNCIAS), so hardcoding names would silently drop CONSTRUÇÃO
below the fold on one of them. The fold is a *result*: at `scrollTop === 0`, the third section's
last paragraph ends inside the port. Both real cases measure **3 of their sections complete in
the first fold** at 883px tall, 4 at 1192.

### The frame is the work's own shape, and the work has an alt

The image was a `background` in a fixed 16:10 box, which is two bad fits at once: a widescreen
capture left two hundred pixels of nothing under it, and a portrait poster floated small in the
middle of a landscape frame. **Stretching the box to the column only moved that emptiness inside
the border** — it was tried, it looked worse, and that is why the border now belongs to a real
`<img>` capped by the column instead of shaped by it.

Measured: the Graecus capture (1265×712) frames at 642×363, the Miscelânea poster (1080×1350)
at 590×737. Each is framed exactly, no letterbox in either direction. Being an element rather
than a background also gives the work an `alt` — *"Graecus — imagem 3 de 8"* — and until now the
actual work was invisible to a screen reader, which is the wrong thing for the DOM-is-truth half
of this panel to be missing. The counter moved out from on top of the picture and became its
caption.

### The images are shown now, not stepped through blind

His words on the first build: *"as fontes fazem mais sentido e a diagramação, mas a maneira
de interagir com as imagens ainda está ruim."* The fonts and the layout were the two things
that had just changed, so the complaint is precisely about the one thing that had not.

The mechanism: clicking the picture advanced to the next and wrapped, and that was the whole
of what a visitor could do. Eight Graecus captures meant clicking in the dark, one at a time,
with no way back and no idea what was coming — and a counter reading `3 / 8` tells you that
you are lost, it does not help you.

So the images get what the case got: **a map**. Every still is a thumbnail on a strip under
the picture, the current one lit in brass, and any of them is one click away. Same principle
as the section rail, one axis over. The picture still advances on click — that is now a
shortcut through something visible rather than the only way through something that is not.
The strip scrolls sideways when it is wider than the column and keeps the lit thumbnail in
view; it is absent below two images, so Portfólio has none and Miscelânea has three.

It is built once per project rather than once per still. Rebuilding eight thumbnails to
change which one is lit throws away the element the visitor is about to click, and the
strip's scroll position with it.

**The strip is one tab stop, not eight.** Adding it took Graecus from 9 keyboard stops to 18,
all of them between VOLTAR and the writing — reaching the case by keyboard meant nine presses
through pictures of the same project. Roving `tabindex` puts the lit thumbnail in the tab order
and takes the rest out: 11 stops now, and inside the strip the arrows move between *images*
rather than between projects, because with a thumbnail focused that is what a right arrow
plainly means. `focusables()` gained a `tabIndex >= 0` test to match — a `button` matches the
selector whatever its tabindex, so the trap's own list disagreed with the browser's tab order.
The ends were right by luck; they are right by construction now. Verified: first stop VOLTAR,
last a step arrow, Shift+Tab and Tab wrap at both ends, focus returns to the opener on exit.

### The pictures were small, and two different things were making them small

*"as imagens, especialmente de desktop da graecus, ficam bem pequenas com esse layout."*
Right, and the 60/40 was not the cause.

**The frame's cap was.** It was `min(1180px, 86vw)` on a viewport with 1935px of `86vw`
available — 755px left on the table. The cap has a natural stopping point rather than a
taste one: body copy is capped at `62ch`, which measures **564px** here, and
`0.4 × (W − 110) = 564` back-solves to **W = 1520**. Past that the reading column has
reached its own limit and every further pixel lands as dead space beside the prose rather
than on the picture. Measured at 1420 first — the column came out 524, forty short — so the
number is checked from both sides. The Graecus capture goes **642 → 846**, and the first
fold gains a section on the way.

**And 846 is still 67% of a 1265px screenshot**, whose content is small type. No split of a
two-column layout fixes that, so the panel has a second state: click the picture and the
case, header and rail go away (`display:none`, because the focus trap tests `offsetParent`
and would keep handing Tab to a column nobody can see) and the media area takes the frame.
The strip survives it, so the set is still navigable from inside the enlargement, and the
arrows move images there for the same reason they do inside the strip.

**The picture is capped at its own natural width** — `--nw`, set from the image. A 1265px
capture blown to 1900 is softer than the same capture at 1265, and the 375px mobile still is
honest at 375 rather than impressive at 900. Verified: Graecus enlarges to exactly 1265×713,
100% of native; `graecus-mobile-home` to 375×809, also 100%.

**The source is the ceiling now, and it is his call.** Five of the eight Graecus stills are
**1265×712**, about 88KB each. That is a small capture of a website: 100% of it is as good as
this can ever look, and on a wide monitor the enlargement is already at the limit. Re-exporting
the captures at 2× (2530px) is the only thing that moves it.

### The arrows walk the pictures now

*"só removeria a seta pra trocar de projeto e deixaria ela pra scrollar a imagem dentro da
página."* They stepped between Works, which put the panel's largest and most obvious control
on its least likely action — you open a project to read *that* project, and the set of stills
is the thing you actually want to walk.

So the arrows and the arrow **keys** both move through the images, everywhere in the panel:
two controls with the same shape and different meanings was the bug the arrows themselves
were. They hide entirely on a Work with fewer than two stills (Portfólio has none), and they
are **shown inside the enlargement**, where they used to be hidden back when they meant
"another project" — enlarged is exactly when walking the set matters most.

Changing project keeps the two routes it always had, and both are the object's own: VOLTAR to
the index, or the **LUA**, which is the wheel that selects on that index. `onStep` is still
wired to it and is untouched.

### Back had two owners, and that is why Escape closed two levels

Worth recording because the patch that suggests itself is the wrong one. The panel handled
Escape, and so does `scene.js` — Escape is one of four ways into `moonBack()`, the Unit's own
Back. Both fired, so the first Escape on an enlarged picture closed the enlargement *and* left
the project.

Stopping the event looks like the fix and is not: **which handler runs first depends on where
the key was pressed.** A real press targets the focused element and reaches the window capture
listener first; a synthetic one targets the window, where capture and bubble listeners run in
registration order — and `scene.js` registers at line 3824, long before `createFocus` runs. So
the patch worked under the hand and failed under the probe, which is the worst way for a fix to
be wrong.

A back stack with two owners is the bug. `focus.back()` closes one level and says which one it
closed; `moonBack()` is the only caller; the panel no longer listens for Escape at all. The
enlargement is now a level of the Unit's Back like any other, LCD flash included.

### Mobile is his order, verified at 402×874

Not on a phone — in a same-origin iframe with a real 402px viewport, because the window would
not resize. **This is still not item 7 in *Open*; nobody has held a phone.**

Back sticky at the top (y = 14 before and after a 400px scroll), then the image, then the title
and summary, then the case. The frame itself is the scrollport, the rail is gone with the second
column, and the prev/next arrows leave the edges of the image for a pair of **46×46** targets
above the home indicator. No horizontal scroll, no native scrollbar.

**The enlargement cannot help a landscape capture here, and that is a decision waiting.**
On a 402px phone the picture is already at the viewport's width, so enlarging a 1265px capture
changes nothing but the case going away — measured 363×206 in both states. It does help portrait
stills, which gain the full height. Reading a desktop screenshot on a phone needs panning at
natural width, and that is a touch behaviour nobody can test until item 7 below is done with a
real device in a real hand. Not guessed at.

**One bug caught only here, and only by a portrait image.** `min-height:0` is the desktop rule
that lets the plate shrink inside a fixed row; carried into the mobile grid it let the row
compress the media block below its content, and flex-shrink then took it out of the picture and
the strip together — a 1200×1500 capture came out **146px wide** with the thumbnails crushed to a
19px band. Landscape stills hid it completely, because they never asked for the height. The plate
is `align-self:start; min-height:auto` there now, and the strip and caption are `flex:0 0 auto`,
so a squeeze can only ever fall on the picture. Measured after: 363×206 landscape, 349×436
portrait against a 436px ceiling.

### Two "em breve" removed, both of them promises the object could not keep

- Miscelânea said *"A primeira seleção será publicada em breve"* while three real pieces were
  already in `images`. A gallery that shows work and says the work is coming contradicts itself
  on the same screen. It now says the first pieces are here and the archive is growing. Still
  `empty: true`, still no date, because no date was decided.
- Every other project's case ended with *"Confira o case com mais detalhes — em breve."* There
  is no longer case, no page for it to live on and nothing scheduled. `.work-more` is empty and
  collapses; the slot is still there for a real destination.

### Left alone on purpose

- **Escape, the focus trap and focus returning to the opener were already right** and were not
  touched.
- **The case prose is untouched.** It is in my voice, which is under *Blocked on Fernando*, and
  writing three more cases would add to a pile he has already flagged rather than clear it.
- **Portfólio has no images at all**, so its media column is empty — the flagship project opens
  on a blank 60%. That is content, not layout, and it is part of Open #3.
- `prototype/explode.js` still carries 30 uncommitted lines from the session before this one.

## The analytics, as of 2026-08-31 — checked on this side, still waiting on his

**The container file is correct and nothing blocks the import.** Verified by reading it
rather than by trusting it: the trigger's regex covers every event name `track.js` emits,
every parameter pushed has a `dl.*` variable, every `dl.*` is mapped in the event tag, every
`{{...}}` reference resolves, and `Event` is declared as a built-in. `G-3GV5YJ7VV4` appears
once, in the constant.

**`?track` exists now, and it is how that was checked.** The host guard is right about the
data and was wrong about verification: with it, the only place the events could be seen
firing was production — the one place a mistake costs something. The flag opens the pushes on
any host and cannot pollute anything, because the loader in `index.html` is gated on the same
host, so off `nanj.in` a push reaches an array nobody reads. Same shape as `?turned`
and `?film`.

Seen arriving with their parameters and their UTMs: `module_open`, `item_select`,
`work_open`, `image_step`, `image_open`. **Not seen, and not a fault:** `boot_complete` and
`page_turn` both need the render loop, and rAF does not run in an automated tab;
`eclipse_found` needs the light-key path; `outbound` was left alone deliberately rather than
send his browser to Instagram.

**Two events were added, before the import rather than after it.** The overlay grew an
enlargement and a way to walk the stills today, and nothing reported either — `work_open`
says a case was opened, which is not the same as anyone having *seen* the eight Graecus
captures. `image_open` is the only way to know whether the enlargement was worth building
(read it as a ratio against `work_open`); `image_step` is settled, like `item_select`, so
three arrow presses produce one event naming the still it stopped on. `image` is a **name**,
not an index — `graecus-blog-archive` reads in a report and survives an insertion into the
set. The container went from seven events to nine as one line of regex and one variable,
which is what that design was for.

### The import failed to validate, and the file was wrong rather than the workspace

*"A variável desconhecida Event foi encontrada em uma tag."* The export referenced the
`{{Event}}` built-in and declared it in a `builtInVariable` block precisely to prevent this,
and the README said so. **The declaration does nothing on a Merge**: a built-in is a workspace
setting, not container content, so the importer ignores it and the tag lands pointing at a
variable that is not switched on.

Enabling *Event* by hand under *Variables → Configure* clears it in that workspace and clears
it nowhere else — the next import into a fresh one fails identically. So the event name now
comes from **`dl.event`**, an ordinary Data Layer variable reading `event`, which is container
content, travels with the export and resolves to the same value the built-in reads from. The
`builtInVariable` block is gone.

The rule worth keeping: **an export must not depend on a built-in being enabled at the other
end.** The old note in `docs/analytics/README.md` claimed the opposite and has been corrected.

**What is still his, and only his:**

1. **Import and publish.** *Admin → Import Container →* `docs/analytics/gtm-nanj-in.json` →
   workspace *Existing* → **Merge**. Then publish.

   **Which conflict mode depends on what is already in there, and right now the answer is
   *Overwrite*.** The standing rule is *Rename conflicting tags*, and it exists to protect
   work that came from somewhere else. This container holds nothing but a failed import of
   this same file, so renaming would leave the broken tag in place and add a second one
   beside it. Overwrite replaces the same-named items with the corrected ones, which is the
   whole point of re-importing a fixed export. **Once anything not from this file lives in
   the container, the rule goes back to *Rename*.**

   Confirm the right version landed: the tag's *Event Name* must read `{{dl.event}}`, not
   `{{Event}}`.
2. **Confirm one hit in GA4 Realtime.** Nobody has. Until then the pipe is proven only as far
   as `dataLayer`.
3. **Register the custom dimensions** — `module`, `item`, `work`, `image`, `route`, `face`.
   Until they exist the events arrive and the parameters are invisible in reports, which
   looks exactly like data loss and is not.
4. **Rule on consent.** A published GA4 tag writes a cookie and LGPD makes a banner the honest
   next step. Banner, GTM Consent Mode, or a cookieless tag — unchanged, still unruled.

## What changed on 2026-08-29 — analytics, and one thing waiting on him

`prototype/track.js` pushes seven events to `dataLayer` and nothing else — no tag, no
vendor, no dependency. The Tag Manager container `GTM-PLPVLQH9` is installed and
**verified live on nanj.in**; a real `module_open` was observed arriving with its UTMs
attached. `docs/analytics/README.md` is the taxonomy and the reasoning; the numbers to
know are there, not here.

**The container is empty.** Nothing is recorded yet. `docs/analytics/gtm-nanj-in.json`
is an import ready to go — a Google tag, one regex trigger covering all seven events,
one GA4 event tag using `{{Event}}`, and a Data Layer variable per parameter.

The measurement id is in: `G-3GV5YJ7VV4`, in the `GA4 Measurement ID` constant, which is
the only place it appears. **Nothing is blocking the import** — it has simply not been
imported and published yet, and nobody has confirmed a hit landing in GA4 Realtime.

Two things written down there that are easy to lose:

- **Custom parameters do not appear in GA4 reports until registered as custom
  dimensions.** Until then the events arrive and the parameters are invisible, which
  looks exactly like data loss and is not.
- **Consent is a decision waiting, not an oversight.** Nothing is set while the
  container is empty. A published GA4 tag writes a cookie and LGPD then makes a banner
  the honest next step. He has not ruled between a banner, GTM Consent Mode, and a
  cookieless tag.

## What changed on 2026-08-28, night — the domain, the jog, and six screens

### The jog took three rounds because the mechanism was never broken

Worth reading before touching a wheel, because it is the shape of the whole session's
mistakes. Three times he said the jogs did not work; three times measurement showed every wheel
moving the cursor in every Module that had one. What was wrong was never the mechanism:

1. **Sensitivity.** At `NOTCH` 0.38 a quarter turn was four items, so PROJETOS went 0→2, CRITÉRIOS
   0→4 and HABILIDADES 0→3 in one gesture. You could never land on the item you meant.
2. **The angle-to-centre reading is wrong for a mouse.** Nobody drags in a circle. The same 260px
   drag to the right moved the wheel 0.96 rad from near the top, 1.34 from the upper third and
   **1.95 starting on the centre**, where the radius is nearly zero and a few pixels are most of a
   revolution. `deckTurn` uses the tangential component now, `(r × dp) / |r|²`, with the grip radius
   clamped to 45% of the Deck. The same drag reads 1.00 / 0.58 / 0.01 / −1.00.
3. **Silence at the ends.** `moveSelection` returned bare when clamped, so turning at the top of a
   list moved the platter, spent a detent and changed nothing on screen — indistinguishable from a
   broken wheel. It says `INÍCIO DA LISTA` / `FIM DA LISTA` now.
4. **Direction.** The platter follows the hand exactly; the cursor is deliberately mirrored, so
   clockwise walks *down*, the way a scroll wheel does.

The coast is **visual only** — a thrown wheel keeps turning, because a heavy platter does, but
selecting on momentum is what walked a small flick to the end of a list. And the detent no longer
drags the platter behind the hand: that is how a detent feels under a finger and not how it *looks*
on a screen, where the only visible part is the wheel failing to keep up. He read it as lag; it was
lag.

`__unit.nav()` returns `{ page, sel, sec, pages }`. Use it. Before it existed the only way to see
whether a control had done anything was to read a 320x180 texture out of a screenshot.

### Every Module's index is now the shape it actually is

`m.layout` says what a screen *is*, and four renderers in `render.js` draw it:

- **`list`** — names, nothing above them. PROJETOS has no `lead` at all: three titles say what they
  are, and a paragraph above them pushed the third against the footer.
- **`index`** — a numbered index with every item on screen at once. The numeral is both cursor and
  count, which is what let five criteria fit.
- **`grid`** — the four skill groups as a 2x2 matrix. A column of four is a list of four.
- **`nodes`** — TRAJETO's two blocks **stacked**, spine down the left. Side by side cut CRONOLOGIA
  at 94px, and taking the full panel to fix that put LYRA behind a scrim where she vanished.

A Module with **no items** takes the whole panel (QUEM). Clicking a name **opens** it rather than
selecting it, and a detail page carries `◂ VOLTAR` on the heading's rule, clickable where it is
drawn. `SOL ▸` appears on a selected row that has pages behind it, because the page marks only show
up once you are already on a page — after the discovery.

QUEM leads with **Fernando Bittencourt** in blackletter, the way the opening writes it, then the
positioning, then the five disciplines. Three sizes, so the order of importance reads before a word
does.

### ECLIPSE: a light-key, a door, and a prize that needs no server

- The six lamps **arm** it; taking the fader end to end **fires** it, and the direction picks the
  face — night→day is the SUN, day→night the MOON.
- **It fires once.** A key that works every time is a switch you keep tripping, and the fader is
  also the light. Afterwards the way back in is the sky mark in the Screen's header: it takes a
  ring, breathes, and becomes clickable. `celestial` was already the glyph that means *the light*,
  which is why it is the right thing to promote.
- It arrives and leaves in four overlapping beats over 1.5s; the clock runs on both edges.
- The claim field is gone. It was a real-looking input stamped `SEM SERVIDOR`, honest about having
  no endpoint and reading as unfinished. **There is a prize**: a screenshot sent to the DM. The
  screen ends in a lit control that opens Instagram.

The lamp row also **searches** — a crest travels it, inward from both ends once armed, flaring where
they meet — and a landed detent kicks the whole row for ~180ms, riding the Screen's spill. That is
the *tchum*.

### The domain

`nanj.in`, his own, from his handle `@nan._.jin`. DNS at Hostinger, `public/CNAME` in the repo,
HTTPS enforced. **The certificate took hours and needed unsticking**: removing and re-adding the
domain via `gh api -X PUT .../pages -f cname=` (empty, then the domain again) moved it from `none`
to `authorization_pending` and it completed in minutes. If a future domain change stalls, that is
the move.

### The ECLIPSE prize, and the film — both asked for, neither recorded until now

Both arrived in conversation and neither was written down, which made a code review flag them as
scope creep built against no request. The reviewer was right from what the repo said. **His words:**

> temos um premio though, a pessoa me mandar um print ou ir direto pro instagram

> queria fazer uma animação dese modelo pra exportar como vídeo e ser apoio de um story no instagram
> apresentando o release

A request that only exists in a chat log is a request the next reader will treat as invention.

### A film mode, for the release clip

`?film` loads `prototype/film.js` as a separate chunk, pins the render to 1080x1920 via a `FILM`
override on `W()`/`H()`, hides the HUD, runs a scripted cut and records the canvas straight to WebM.
`__unit` gained `press`, `moon`, `sun`, `light`, `eclipse` — the same calls the pointer makes, so a
script can *use* the object rather than pose it.

Two things about framing, learned the hard way:

- **`tilt` runs backwards.** A lower number puts the camera *higher*. Reading it the other way put a
  candlestick across the top third of the first cut.
- **The Plate is 1.84 wide and 9:16 is narrow**, so under about `dist` 4.7 the Screen is cropped at
  the sides. Every shot lives between 4.5 and 5.0, steeply overhead.

**Nobody has recorded it yet.** rAF is throttled in an automated tab, so the clip has to be run by
him in a visible window; the framing numbers come from geometry, not from having watched it.

## What changed on 2026-08-28, afternoon — pages, stars, and a measured jog

All uncommitted, all verified in a real tab.

### Scrolling lasted one build; the Screen pages again (ADR-0025)

**ADR-0024 was superseded the day it was written**, and the file is kept rather than rewritten
because the wrong diagnosis is the useful part. He said the body felt *"cluttered"*; that was read
as *not enough length* and answered with a scrolling column. His next words were *"ele tá em um
espaço muito enclausurado"* — the same complaint, about the same 200px strip.

The constraint was never length. It was **width**: the body has always been what is left beside
LYRA, because every Module until now drew a list next to her.

So: **page 0** is the lead and the item list (where the MOON works); **pages 1..n** are the selected
item's case, one to a screen, in the **full width**, hanging off the header rule. The SUN turns
them; turning back past the first page is the way back to the index, so there is no extra control.

Two things worth not undoing:

- **The renderer paginates, not the content.** A section is up to five 58-character lines, which at
  13px VT323 across the full width wraps to about ten; six rendered lines fit a page. So sections
  flow into as many pages as they measure, a heading always starts a page, and `pageRange()` — the
  count, written by the draw — is what the controller clamps against. Overflow on a case page is now
  structurally impossible.
- **On a page LYRA goes behind a near-solid scrim and her bubble is suppressed.** She is the reason
  the full width exists; bubble text at 12% under body text at 100% is the PROJETOS legibility bug
  again, and a scrim does not save it.

`SCREEN_BUDGET.section` stays a hard cap on the *writing*, and the tests still assert it. It is no
longer a promise that a section fits a screen — the renderer guarantees that — it is a promise that
a section stays a readable unit.

### The ECLIPSE lamps were buried, and the fix is a measurement

They are seven stars now, between the display and the Pad labels. The first cut **did not render at
all**: the Plate's top face is at `y = .352` and the stars topped out at `.3475`. The old slabs got
away with `y: .332` only because bevel plus depth came to `.030` and pushed them proud by accident.
`LED.y` is now the measured face. If a small part vanishes on this object, check it against the
Plate height before checking anything else.

`RESERVES` needs `LED` at module-evaluation time, so the constant lives with `PAD`/`FADER`/`WHEEL`
and only the meshes are built further down.

### The jogs work, and the first test that said otherwise was wrong

Worth recording because it nearly became a bug hunt. A 180° sweep of the MOON changed nothing —
because it was swept in the direction that clamps at item 0. All three SUN inputs and both wheels
verified: MOON selects, SUN turns pages by drag, by wheel over the SUN, and by wheel anywhere on the
object.

`__unit.nav()` was added for this: `{ page, sel, sec, pages }`. Until it existed the only way to see
whether a control had done anything was to read a 320×180 texture out of a screenshot, which is how
a dead wheel could survive a session.

`SUN_NOTCH = 0.68`, nearly double `NOTCH`. One SUN notch used to be 46px of scroll and is now a whole
page; a control should cost about what it moves.

### Smaller, same session

- The footer draws its own cleared band. LYRA stands to the floor of the panel, so on four Modules
  her robe was behind the status line and `CAMADAS 01/04` came out as broken glyphs.
- Page marks live on the footer rule, drawn after the status so its scrim cannot wipe them; the
  `+N` overflow warning shifts left of them.
- The last English LCD strings are Portuguese: `BACK ·` → `VOLTAR ·`, `OPEN ·` → `ABRIR ·`,
  `NIGHT/TWILIGHT/DAY` → `NOITE/CREPÚSCULO/DIA`.
- Turning the SUN in PROJETOS says `APERTE O CENTRO DO SOL PARA ABRIR` instead of `SEM PÁGINAS`,
  because those cases live in the overlay and a reader turning the wheel is reaching for one.

### Two content contradictions found, not touched

- **QUEM has no items**, but LYRA's idle line there is *"A LUA escolhe o item. O SOL revela mais."*
  Both wheels are dead in that Module. `modules.test.ts` asserts every non-CONTATO idle names the
  LUA, so the rule and the content disagree — the test is enforcing the lie.
- The name still differs: the boot screen says **Fernando Bittencourt**, QUEM says **Fernando
  Linck**. Open across several sessions.

## What changed on 2026-08-28, evening — his six-item list

### The wheels have no button, and they have weight (ADR-0026)

Four changes to one control, and they only make sense together.

- **The hub press is gone**, both wheels, and every mention with it — *"remova a necessidade de
  clique das jogs por enquanto e quaisquer menções."* A control that did two unrelated jobs by
  radius is a control you have to be taught. Back is now `Esc`, the touch row, and a click anywhere
  on the Unit while a Work is open; opening is a click on the Screen row, `Enter` on the focused SUN,
  and the touch row.
- **Both platters drift.** They used to drift *against the Vigil* — Sun at `-.04 * (1 - vigil)`,
  Moon at `.04 * vigil` — so the Moon stood perfectly still all day. Exactly what he saw: *"sol está
  certo mas lua não."* Both turn now; the Vigil only decides which leads.
- **A thrown wheel coasts and keeps selecting.** `spin` bleeds off at `FRICTION` per second and
  spends detents the whole way down, so a flick runs a few items on and slows into place.
- **The detent is visible.** Each Deck now holds `turn`, `carry` and `spin`, and the displayed angle
  is `turn - PULL * carry`. Between notches the platter lags the hand and catches up as the notch is
  spent, which is the snap; draining the carry when the coast dies *is* the settle. Nothing else in
  the file writes `group.rotation.y`.

This partly reverses the "detented selector, no coasting" argument that was commented in `scene.js`,
so it is written down: **ADR-0026**. The distinction that survives is *no uncontrolled selection* —
the coast is the hand's own velocity decaying, not a flywheel inventing steps, and the drift never
touches `carry`, so a Unit left alone turns its wheels and selects nothing.

### The ECLIPSE is opened by the light now

The old trigger was a seventh detent past the end of the MOON's list. He could not find it — *"não
consegui fazer o eclipse funcionar"* — and a secret nobody can discover is a bug with a story
attached. The six lamps now only **arm** it; what fires it is taking the fader all the way across,
and the direction picks the face: night → day gives the SUN, day → night gives the MOON. The middle
of the fader is not a band, so drifting around twilight cannot trip it.

The detent going also took its own trap with it: closing ECLIPSE used to leave the cursor on the
position that opened it. `SINAL 07` and `LUA · VOLTAR` are gone from the panel for the same reason —
they named a control that no longer exists.

### QUEM, and the lead as prose

Two fixes to one complaint. `m.lead` now holds **sentences, not lines** — it used to carry text
hand-broken at 58 characters which the Screen then broke again, and two breaks over one paragraph is
what produced *"Experimentos de ponta a ponta: da / pesquisa à / implementação e ao aprendizado."*
`SCREEN_BUDGET.lead.lineChars` became `paraChars: 96`, and a test now rejects a lead entry that
starts mid-sentence.

And **a Module with no items takes the whole panel**, the same treatment as a case page. The strip
beside LYRA exists to leave room for a list; QUEM has no list, so it was spending 120px on nothing
and was both the tightest column on the object and the only one overflowing it (the `+2` in the
corner was real). Paragraphs now have air between them, which is the space he asked for.

### The stars are four-pointed

Five was the wrong reading of the Plate — the artwork's own stars are four-pointed sparks, and a
pentagram in a row of them reads as a different symbol rather than a smaller version of the same one.
`starGeom` takes a point count; `LED.r` went `.0155` → `.0195`.

## What changed on 2026-08-28, morning

Six things he asked for, and three bugs found on the way. All of it is uncommitted.

### The Decks are his artwork now, not a drawing of it

**This is the biggest change in the file and the one most likely to be undone by accident.**

`deck-faces.js` went from 818 lines to 138. It used to draw both wheels procedurally — reeded rim,
medallion band, a rose window for the Sun, pierced tracery for the Moon, all struck onto one void
mask that three maps came off. It is gone. `public/decks/{sun,moon}.png` are crops of
`cross and jogs.png`, and the other two maps are derived from the pixels:

- **height** is luminance. Bone is the brightest thing in the picture, ground the darkest, so
  luminance already *is* the relief.
- **emissive** is derived **differently per wheel**, and this is not an inconsistency. The Sun's is
  `saturation² × value`, because its glass is saturated amber and its stone is near-grey bone — the
  palest pixel on that wheel is bone, which must not glow. The same gate on the Moon returns almost
  nothing, because nothing on it is saturated; the Moon's is `luminance³`, tinted cold by the
  material, because nothing burns *behind* the Moon and what lights is the stone catching what is
  left. Without that split the Moon goes out with the room and `deckGlow` stops meaning anything.

Consequences already handled, listed because each looks like a bug if you meet it cold:

- **The plate carries the whole wheel**, `WHEEL.r * .995`, not `.88`. The crop has its own reeded
  rim; the old inset existed so the metal ring underneath could play that part.
- **The hub mesh is deleted.** The reference draws the boss; a metal cylinder stood on top of it.
- **`bumpScale` 5 → 1.6.** A luminance map off a rendered illustration already contains its own
  shading, and driving it hard doubles every highlight the picture came with.
- **Sun glow gain 0.55 → 2.4.** Only ~1.4% of the new emissive map is strongly lit, against most of
  the old one. That number has now tracked lit area three times and has never been taste.
- **`deckMaps` returns textures immediately and fills them on load.** It is called during module
  evaluation and the scene is built around what it returns, so it cannot await.

**How this happened matters more than the code.** Four passes were spent reproducing the reference in
circle arithmetic — trefoil, then mitsudomoe, then trefoil again — each measurably closer and none of
them his drawing. His verdict: *"its not similar to the design i gave to you at all."* He was right
about the method, not the numbers. **When he gives a reference this specific, use it; do not
reverse-engineer it into geometry.** If a future ticket wants procedural wheels back, that is a real
trade — resolution independence, and tracery that could respond to the Vigil — but it is a decision,
not a cleanup.

### The Vigil no longer stalls, because the shaders are pre-warmed

*"the performance on the vigil (going to night) is affected a lot when one turns the jog."*

`dim()` clears `visible` once a light is dark — ADR-0019, and worth keeping. But the number of
visible lights is part of a material's **program key**, so every Candle going out recompiles every
material in the scene. Measured cold, sweeping the Vigil end to end:

    mean 55.6 ms/frame · worst 963 ms · five rebuilds · 46 → 100 programs

Turning a Deck drives the Vigil, so a jog turn walks straight through all of them. The compiles are
**one-time** — programs are cached by that key — so the whole problem is *when* the bill arrives.
`prewarmStep()` in `scene.js` pays it during the opening, one light configuration per frame. After
it: **mean 0.65 ms, worst 7 ms, no slow frames.**

Two things it got wrong first, both worth not repeating:

- **`renderer.compile()` warms the wrong programs.** It walks the scene against the default
  framebuffer; the frame goes through the composer, into a render target with its own colour space
  and tone mapping, and those are in the key too. It looked like it worked — 128 ms, program count
  up to 98 — and the sweep after it still stalled 4.2 s. The warm has to be a real `post.render()`.
  That is safe: it runs inside the same `frame()` that draws the real one, and the browser
  composites once per frame, so the wrong-Vigil draw is never presented.
- **An even grid of marks misses the thresholds.** Twelve evenly spaced left 875 ms at Vigil .55.
  The marks are found now — walk the Vigil finely with `applyVigil()` alone, which draws nothing,
  and record every distinct set of visible lights. Eight, currently, and it stays right if `RAMPS`
  moves.

`window.__renderer` is exposed for this: `renderer.info.programs.length` is the only way to see a
recompile from outside three. `__unit.prewarm()` runs it to completion by hand, because the frame
loop does not exist in an automated tab.

### The wobble was baked lighting, not the crop

The crop being off centre was real and fixed (below), and it was **not the whole of it** — he said
*"the jog designs are still wobbly"* afterwards. The crops are centred to the pixel and their rims
are round to about two, so the fault was elsewhere.

The reference is a *rendered illustration*. It has a key light from the upper left, a highlight along
that side of the reeding and a cast shadow down the other. Painted into a texture on a platter, that
lighting **turns with the platter** — the light source orbits the wheel once per revolution, and an
object whose highlight orbits it does not read as spinning, it reads as tilting. A photograph of a
lit thing cannot be spun.

`flatten()` in `deck-faces.js` divides it back out: estimate the smooth illumination field with a
wide blur and normalise by it, which is the flat-field correction a telescope does to its own optics.
Measured as the first harmonic of brightness around a ring — literally "which side is brighter" —
at 0.86 and 0.95 of the radius:

| | before | after |
|---|---|---|
| Moon | .189 / .243 | **.060 / .100** |
| Sun | .213 / .385 | **.183 / .171** |

The inner ring barely moves and should not: at 0.72 that is the medallion band, whose asymmetry is
twelve *different* moon phases — real ornament, which is supposed to turn.

Two failed versions, both instructive:

- **Leave the square corners in the blur** and the field near the rim is dragged toward the black
  Plate around the wheel, so the correction divides by far too little exactly where the reeding is.
  The rim came out *more* lopsided than uncorrected.
- **Fill the corners with a flat average** and the opposite happens: a constant dominates a 72px blur
  that close to the edge, the field flattens to it, and the gain lands on 1 — no correction at all
  where it is needed most. The fix is to extend the disc **radially**, each corner pixel taking the
  rim pixel at its own angle.

`bumpScale` was also still being driven to **4 → 9** by `applyVigil`, a line written for the old
drawn height map. On a luminance map off an illustration that doubles every highlight the picture
came with; it is 1.2 → 2.6 now.

### The navigation model was rebuilt (2026-08-28)

    Pads choose the Module. Moon chooses the Item. Sun explores the Item.
    Crossfader changes the light. LCD explains the action.

**The two swaps are the whole change.** The Decks used to drive the Vigil and the Crossfader used to
blend NOW/NEXT's thesis. Freeing the wheels is what let them take *different* jobs — while they were
a matched pair pushing one number in opposite directions, "Moon selects and Sun opens" had nowhere to
live. Freeing NOW/NEXT is what let both its lists be on screen at once, which the brief requires and
a control whose whole job was hiding one of them made impossible.

- **`modules.ts` has one shape now**, not four `kind`s: a `lead` that is always on screen, plus
  `items`, each with `sections`. `SCREEN_BUDGET` was re-cut per-part — the Screen carries a lead and
  at most one section, so ADR-0009 gets easier to keep, not harder.
- **Order is IDENT · WORKS · PATH · METHOD · NOW/NEXT · OUT**, asserted in the tests because
  reordering the array silently rewrites the argument the Unit makes.
- **Decks are detented selectors.** `NOTCH` is 0.35 rad and `jogCarry` holds the remainder; momentum
  and `spin` are gone. Clamped at both ends, not wrapped — a list with no edges cannot be counted.
- **Deck hubs are a radius test**, not a mesh. The boss is painted into the artwork; a hub mesh would
  have been a second boss on the first.
- **The plinth is unreachable.** `summon.js` and the rite still exist and nothing calls them — the
  overlay in `focus.js` is the one way a Work opens. Retiring the code is a separate decision.
- **Ambient has a 6% floor** at full Vigil. This deliberately softens the tenebrism, which argued for
  linear-to-zero; the brief asks for a readability floor and this is a portfolio before it is a
  painting. The room past the Unit still goes to nothing — `skyLight` and `wallWash` have their own
  curves.
- `__unit.paintScreen()` exists for the same reason `render()` does. **Do not inspect the Screen by
  importing `render.js` from the console** — you get a second module instance with its own selection
  state and read it while the scene drives the first. That produced a confident wrong answer once.

**Three bugs the first pass shipped**, all found by him and all worth the shape they took:

- **`pick()` returns the object, not the intersection.** `deckHubHit` reached for `hit.object` on a
  value that already *was* the object, threw on every wheel press, and killed the drag before it
  started — so both Decks did nothing at all. `lastPick` holds the whole intersection now, set where
  the answer is still in hand.
- **`screenRowAt` named a Module by an id that no longer exists** (`project-001`), and the unified
  body never called `drawWorks`, which was the only thing filling `workRows`. Between them the Screen
  went from the most obvious control on the object to inert. Rows are registered where they are
  drawn now, which is the only place that can stay true. Clicking a row selects **and** opens: a
  named project on a screen is a more specific selection than turning a wheel to it.
- **The painting vanished at night.** `E` carried the Print alone, so labels stayed legible on black
  and the artwork did not exist. The whole face goes into the glow map at low alpha now, composited
  `lighter` so the Print stays the brightest thing on it — the painting keeps a little of the light
  it was given, which is what the rest of the Print already did. Fixing this with room light instead
  would have flattened the tenebrism and lit the Altar with it.

**Content Fernando still owes**, structured and visibly empty rather than invented:

- WORKS: `CHALLENGE`, `DECISIONS`, `RESULT` per project. Declared as gaps; the tests assert they stay
  declared, so filling one is a content edit and deleting one is deliberate.
- PATH: `DETAIL` per role, and dates. **The order is his, not sorted** — the rows carry no dates, and
  sorting would mean deciding which of his jobs came last.
- METHOD: the six steps are the generic process the brief says to avoid. He was asked twice and said
  it does not matter; they stand in, with an empty `WHY` on each.
- `NOW_NEXT_UPDATED` is `null` and renders as a "set in modules.ts" state.

### There is a freecam in the workbench

`?debug` → **FREECAM**. Drag to orbit, wheel to dolly, shift-drag to pan the pivot, click again to
put the camera back. The readout beside it prints the angle in a form that pastes straight into
`__unit.setCam({...})`, which is the point as much as the flying is — the reason to fly the camera in
here is almost always to *find* a framing, and one you cannot read off has to be found again next
session.

`ORBIT` is still `const false` and still means what it meant: the shipped Unit has one angle, and
that is a decision. Freecam is a separate flag that only widens the clamps while it is on, so the
visitor's camera is untouched — verified: with it off, dragging empty space still skips the opening
and leaves yaw at 0. Enabling it skips the opening first, because two things steering one transform
is not a camera, and turning it off returns to the resting view rather than to a half-played flight.

### The faceplate painting is flat

*"remove the bevel and depthness of the faceplat painting."*

`ornamentMask()` used to push `ART` through as a shallow height field, on the argument that the
painting should read as printed on metal that has texture rather than as a flat sticker. What it
produced was every edge in the picture bevelled and every mass standing proud of its background — a
mountain range in embossed tin. The `useArt()` branch draws nothing now, so in art mode the mask is
empty and the derived normal map is flat.

The reference agrees: on the Old Blood pedal the artwork is **screen-printed**, dead flat, and the
only things with edges you can feel are the parts. Depth belongs to the machining, not the picture.

The Plate is not featureless — `roughnessMap` still carries the handled finish, `metalnessMap` still
drops the ink to a dielectric so its colour reads as colour rather than as a tint on a reflection,
and the clearcoat is still lacquer over metal. `reliefMaps()` and the `bevel`/`depth` dials are all
still wired, and the engraved band comes back with its relief the moment the painting is switched
off.

### The Unit lights itself at night

*"on vigil things are too dark. i feel the display could have some light (projecting to the cdj) and
the buttons and crossfader aswell."*

The Screen's `glow` already grew with the Vigil, but only the Plate, Chassis and rim had opted into
its layer — all that light was landing on three surfaces. The Decks, Pads and Crossfader opt in now,
which costs **no new light**: `glow` is one point light already in the scene, so the light count and
every program key are unchanged, which after the pre-warm business is the property that matters.
ADR-0020's discipline holds — it reaches the Unit's own top surface and nothing else.

The Pads' lamps and the Crossfader's now scale by `1 + vigil * 2.6`. A lit control is only lit
*relative to* what is around it, and at the end of the rite there is nothing around it; real ones do
the opposite, and the darker the booth the more the panel is the only thing you can see. The fader
cap also has its own emissive off its own map, so the bone lights and the groove stays dark.

### Wobble, third pass — and the fix was not the crop

*"the jog designs arent centered ... when the user spins de jog, it feels wobbly."* Two separate
causes, and the second is the one that mattered.

**The crop was out, and the tool was part of why.** `sips --cropOffset` semantics had been *assumed*
rather than verified across several passes. `scratchpad/crop.py` does it with explicit arithmetic —
decode, crop a square about a given centre, box-filter, encode — so the centre is a number in the
call rather than an argument order to be right about. Re-fitted **over the whole wheel** rather than
the rim band alone, because whole-wheel agreement is what perceived wobble actually is: the Moon was
3px out and **the Sun was 8px**. Residual after re-cutting is 2–3px of a 256px radius, where the
metric's minimum is shallow enough that further iteration just chases noise.

**But the larger cause was that the flat-field had been switched off.** It divides the picture's own
baked lighting back out, and without it a painted highlight orbits the wheel once per revolution —
which reads as wobbling rather than spinning. It had been disabled on a measurement that was real and
answered the wrong question: correcting the whole image made the **outermost** ring more lopsided, so
it looked like a net loss. That ring is the reeding — two hundred identical teeth, where a first
harmonic is mostly aliasing and nothing is legible enough to read as wobble anyway.

It now applies at 0.75 through the ornament and fades to nothing across `FADE` before the reeding.
Measured on the rings the eye tracks: Sun 0.183 → 0.061 and 0.275 → 0.101; Moon 0.117 → 0.058.

**Some residual is the artwork and always will be.** The Moon's medallion band carries twelve
*different* phase discs, so it is not rotationally symmetric by design; it measures 0.70 raw at that
ring and correction cannot help, because there is nothing wrong with it.

**The lesson worth keeping: optimising one number over the whole image hid this.** The wheel is not
one surface, and the ring that measures loudest is not the ring anyone looks at.

### New wheel art (2026-08-28, second pass)

`moonjog.png` and `sunjog.png` replace the crops taken out of `cross and jogs.png`. They are rendered
square, one wheel each, flat on, under light with almost no direction in it — and that single
property invalidated two corrections that had been earning their keep:

- **`RECENTRE` is zero on both.** The old Moon's triskele sat 5px off the centre its own rim wanted.
  Fitting the rim band and the inner figure separately on the new art puts them **1px apart on the
  Moon and 4px on the Sun**, out of a 590px radius — the Sun's is a third of a pixel at render size,
  and correcting it would cost more in resampling softness than it buys.
- **The flat-field is off.** It halved the outer ring's lopsidedness on the old plate crop, where a
  baked highlight turned with the platter. On the new renders there is no gradient to divide out, and
  measured it makes the **outermost ring worse** — 0.257 → 0.414 on the Moon, 0.210 → 0.367 on the
  Sun — because a 72px blur and a polar edge-clamp invent a slope near the rim where the picture had
  none. Both are kept in the code with the numbers written down, because they are the fix if the art
  is ever re-lit or re-cropped from a plate again. **A correction left switched on because it once
  helped is how a pipeline fills up with them.**

Fitting the rim: brightness does not find the edge on these (the reeded rim is *darker* than the
interior). Detail density does — angular standard deviation per radius collapses where the wheel
stops. Both come out at r = 590, identical, which is the check.

Relief was halved throughout on *"two much bevel and depth"*: normal strength 3.4 → 1.7, `normalScale`
0.75–1.5 → 0.45–0.85, `DISH` 0.006 → 0.0025, chamfer softened. The trap is setting a normal map by
whether the relief is *visible*: these are photographs of carved stone and **the carving is already in
the albedo**. The map's only job is to make it answer the room's light as the platter turns. Doubling
up reads as wax.

Load cost per deck is ~290ms — fetch 45, derive 79, blur 75, Sobel ~75 — about where it was, since
the flat-field's six blur passes came out as the normal map's two went in.

### The Decks are turned parts now, and the Moon's art was re-centred

Two asks: *"still not perfectly centered. is this a problem with the image ive gave you"* and
*"a little bit of bevel or indentation so they dont feel too flat or just a baked texture."*

**Yes, it was the image — on the Moon only.** Measuring each zone's own best centre separately: the
rim is dead centre, and the triskele inside it wants to sit **5px higher** — 2% of the radius. They
are not concentric in the drawing, so no crop can satisfy both, and the crop is fitted to the *rim*
because that is the longest, highest-contrast, most rotationally symmetric feature and the one whose
eccentricity shows most. `RECENTRE` in `deck-faces.js` slides the inner content back, on a smoothstep
falloff that reaches zero at r = 0.72 — so the reeding and the medallion band are untouched **by
construction**, not by luck. Measured after: the core's best offset went from (0, −5) to (2, 0). The
Sun disagrees by 2px, which is the limit of the measurement, and is left alone.

**Flatness had two causes, both fixed.**

- `bumpMap` derives its slope from screen-space derivatives, so the carving got vaguer the further
  away the wheel was — which is exactly the distance it is normally seen from. `normalFrom()` builds
  a real tangent-space normal map by Sobel over the height, blurred one pixel first because the
  source is a *photograph* and un-blurred grain becomes facets: hammered rather than carved.
- The face was a `CylinderGeometry` cap — one plane, one normal, identical light everywhere.
  `latheDeck()` gives it a profile: a chamfer round the rim, a step, and a 0.6% dish. The chamfer is
  what pays, being a ring of surface at a different angle that catches a highlight the flat cap could
  not — and one that *moves* as the platter turns.

Two traps in that, both already paid for:

- **`LatheGeometry` takes its profile's winding as its triangles' winding.** Written the natural way —
  face first, then down the side — the whole thing comes out inside-out and the face is
  backface-culled. It does not look missing when that happens, which is what makes it slow to spot:
  the polished ring underneath shows through and a Deck reads as a blank chrome disc with a specular
  dot. Same class as the Plate's `rotateX(-90)`.
- **A lathe generates its own UVs from arc length**, which smears the artwork into a bullseye. They
  are rewritten from each vertex's own x/z — the cylinder-cap mapping — which is what keeps the
  image's inscribed circle on the platter.

`applyVigil` was also still writing `bumpScale` after the material moved to `normalMap`. Setting a
property a material does not read costs nothing and reports nothing, so the Vigil had quietly stopped
deepening the carving at all. It drives `normalScale` now, 0.75 → 1.5.

### The Deck crops had to be fitted, not eyeballed

*"the arts are not centered on the circle of the jogs, causing them do wobble."* The first cut was
placed by eye and the Moon's was **20px out — 8% of the radius**: invisible in a still, unmistakable
once the platter turns.

Reading the edge off a screenshot cannot do better, and edge-detection is worse — it locks onto the
Plate's ornament outside the wheel. What works is minimising the complaint itself: every ring on the
wheel is rotationally symmetric about the true centre, so search for the centre that minimises
mean |I(p) − I(rot(p))|. Both wheels then measure **r = 253**, identical to the pixel, which is the
check — they are the same object drawn twice, and any fit returning two different radii has found
something else. Source centres: Moon (348, 421), Sun (1420, 422), in `cross and jogs.png` at its
native 1774×887.

### The Crossfader tracks the hand

It had mass: a spring to the pointer, momentum on release, a periodic detent well, a lean. Every part
was real physics and the whole was wrong — *"the crossfade sucks, it just should be a real crossfader
physic feeling, not bounce"* — because **a fader is not a free body**. Your fingers are on it the
whole time it moves. It now follows 1:1, the six beads capture it within 4.5% of the travel, and
letting go leaves it exactly where you left it.

The follow is a **time constant** (`FOLLOW_TAU`, 20ms), not a per-second survival fraction. The
fraction form reads as though small means fast: `1e-7` sounds instantaneous and is 24% of the gap per
frame, which is four frames of lag on something under your finger.

### The Pads stay black

All six keys wear one face in every state. The bone selected-face is gone; the state is in the lamp,
which changes **hue** — cold ember to gold — not just brightness. Two things that were not obvious:

- The LED texture is painted **white**. It is an emissive *map*, multiplied by the material's colour,
  so any hue baked in is a hue the material can only darken — which is why the old selected Pad had
  to go *dim*.
- The ring round the Pad's foot is deliberately quieter than the bar in its head. At equal intensity
  it is a cream halo the width of the key, and a black key inside a pale outline reads as a pale key,
  which is the exact thing he asked to remove.

`HOT CUE` and `CROSSFADE` are gone with their Print reserve; Pad labels have 15px of air under the
baseline instead of 6, and the reserve grew with it or the ornament fills the padding back in.

### Two bugs found on the way

- **`public/` had never resolved in the dev server.** `npm run prototype` was a bare
  `vite prototype` with no config, so Vite took `publicDir` to be `prototype/public`, which does not
  exist. Every Work still on the Screen was 404ing to the SPA fallback and coming back as
  `index.html` wearing a `.png` name. It went unnoticed because the *built* site has the override.
  The script now runs `vite --config vite.site.config.ts`, so dev and the build cannot disagree.
- **`deck-fit/index.html` asked for `pm.lit`**, which no longer exists, and threw.

### Still open from this session

- **He has not seen the image-based Decks.** Everything above was verified in an automated tab; his
  judgement is the thing missing. Show him first.
- The Sun's rosette and the Moon's triskele are now exactly his reference, which also means the
  wheels no longer change with the Vigil beyond glowing — the tracery cannot open or close.

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
each one by id and throws on the first missing element — do not delete them.

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
- **`npx vitest run`** — 41 tests, ~17s.
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
- **The Decks are `cross and jogs.png` itself**, cropped — see the 2026-08-28 section. The
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

## Open

**His standing brief, given 2026-08-28 and mostly not started.** It is long and specific; this is the
part to work from, not from taste.

1. ~~**The project overlay's architecture.**~~ **Done 2026-08-31** — see the section above. Every
   part of the brief is built and measured: 60/40, the fixed header, three sections in the first
   fold, the drawn indicator, and his mobile order. The one thing it does not close is item 7
   below: the phone layout was verified in a 402px iframe, not in a hand.
2. **The accessible mirror of the LCD.** *The biggest real gap in the project.* The controls have
   accessible names but the live content lives only in the canvas. Needs a semantic HTML mirror of
   the current state — active Module, selected item, page title, shown content, position, available
   action — with short announcements for state changes rather than re-reading everything. The canvas
   stays visually sovereign; the HTML becomes the accessible representation of the same state.
3. **Per-project case content.** Portfolio should present the system as the project — boot, modules,
   decks, LYRA, interactions, ECLIPSE, and **it has no images at all**, so the overlay opens it on an
   empty media column. Graecus should tie the eight captures to the WordPress build. ~~Miscelânea
   must stop saying the content is coming "em breve"~~ — done 2026-08-31, along with the same promise
   under every other case. The prose itself is still mine, which is why it is still under *Blocked on
   Fernando* rather than here.
4. **Boot in 2–2.5s.** The opening is about five. Keep the ritual, make the content usable sooner,
   and run the full animation only on the first visit of a session.
5. **PROJETOS: the SUN should reveal a short preview** of the selected project — one factual line,
   optionally a small monochrome image — with pressing the Screen opening the full case. Today the
   SUN just moves the cursor there, because those items have no pages.
6. **CONTATO hierarchy.** Email primary, Instagram secondary, LinkedIn only if a real URL exists.
   Location and language in the footer. MOON selects the route, SUN executes it.
7. **Mobile, on a real device.** The rotated frame works — the pointer mapping is verified end to
   end via `?turned`, which forces it on a desktop — but nobody has held a phone. Touch targets are
   46px and safe-area insets are respected; that is not the same as having tested it.
8. **Record the film.** `?film` is built and never run. It needs a visible window; the framing
   numbers come from geometry, not from watching it.

**Older, still open:**

9. **Two names on one object — smaller than it looks.** QUEM and the boot screen both say
   **Fernando Bittencourt** (`modules.ts:399`). What still says **Fernando Linck** is the `<title>`,
   the meta description, the Open Graph tags, and the LinkedIn row's display label
   (`modules.ts:705`) — which has no `act` anyway, because he has never given the URL. The email is
   `fernandolinck@outlook.com`. He was asked; he ruled on QUEM and not on the rest. Do not guess —
   it is identity, not layout.
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

## Blocked on Fernando

- **The LinkedIn URL.** `modules.ts` has the name "Fernando Linck" and no link. Instagram has both.
- **The PATH glossary rename** — needs his word, and a `CONTEXT.md` entry when it lands.
- **RACK contents** (T-13) — slot 4 still lists influences, not tools. Blocked four sessions.
- **His own voice.** QUEM, CRITÉRIOS and Lyra's lines are mine. They are honest and they are not his.
  The ECLIPSE copy is mine too, and it is the most *written* thing on the object.
- **The Graecus captures are in** (six site screenshots, `public/works/graecus-*.jpg`), and the case
  section describes them. That one is closed.

## Cautions

- **Build and show. Descriptions do not land.** Every decision that stuck was settled by a render or a
  reference image, never by a paragraph. He said *"i dont understand"* to a wall of text, once.
- **He answers with images.** Check `~/Downloads` when he mentions a reference. Verify the file is
  what it claims — a `.png` was a GIF once — and read the whole thing before assuming which parts
  apply.
- **His references carry more than he asks for.** The faceplate's 1.82 aspect answered a proportions
  problem he had not raised. `cross and jogs.png` was given for three controls and also settled the
  Decks' whole palette. Measure them; crop them with `sips` and look properly.
- **Do not open his browser without asking** — but *do* ask. Four rounds of blind performance fixes
  achieved nothing; twenty minutes of measuring in a real tab found the cause.
- **The Chrome extension gives out.** Screenshots start timing out, then `javascript_tool` loses the
  tab, and creating a fresh tab is what recovers it. It happened perhaps a dozen times on
  2026-08-28. Budget for it: prefer one probe that returns numbers over five that return pictures,
  and never let a verification plan depend on a long sequence of screenshots.
- **rAF fires zero times in an automated tab.** Drive the scene with `__unit.step(t)` then
  `__unit.render()`, and read state with `__unit.nav()`. Anything timing-based — the opening, the
  ECLIPSE transition, the film — cannot be observed here at all and has to be handed to him.
- **Give him the thing, not a toggle.** Confirmed three times now.
- **Do not add dependencies** (ADR-0004). When Node could not decode a PNG the answer was 120 lines of
  `zlib`, not a package.
- **He moves fast and reverses himself.** When he changes direction, write the ADR — do not just
  change the code, and do not re-litigate the old one.
- **When he says something is broken, believe him and go find the mechanism.** Every "it's missing"
  and "it's black" has been a real, specific, findable bug — never a taste disagreement. The one
  exception is worth knowing: *"the hover is slow"* was not lag, it was a change of 0.048 in lightness
  on a near-black pad. A response you cannot see and a response that has not happened look identical.
- **The disk.** It has hit 100% before and produced `ENOSPC` with a twenty-minute window where every
  tool call failed. `~/Library/Caches` is the first place to look.
