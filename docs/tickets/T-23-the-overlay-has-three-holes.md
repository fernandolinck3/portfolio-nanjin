# T-23 — Three holes in the overlay, all of them on the flagship

**Track A · `prototype/focus.js`, `src/content/modules.ts` · COLLIDES WITH `espelho` — read the traps**

## Goal

Opening PROJETOS → Portfólio shows a complete case, in the shape the brief asked for, with no
instruction to click things that do not exist.

## What two reviews found

**1. CONSTRUÇÃO falls below the first fold on Portfólio.** The brief asks for *"project, context and
construction without scrolling."* Portfólio's sections are VISÃO GERAL · MOTIVO · REFERÊNCIAS ·
**CONSTRUÇÃO** · INTERAÇÃO. CONSTRUÇÃO is fourth. The session write-up names this exact hazard —
*"hardcoding names would silently drop CONSTRUÇÃO below the fold on one of them"* — and then reports
"3 sections in the first fold" as the success criterion. Three sections is not the requirement;
**construction in the fold** is the requirement.

**2. The rail hides on a case that needs it.** `focus.js:688`:

```js
rail.hidden = !overflows || heads.length < 2
```

A one-section case that genuinely overflows gets no rail — and no native scrollbar either, because
`scrollbar-width:none` removed it. It scrolls with no indicator of any kind. The brief asked for
*"an indicator in the object's own style rather than a white scrollbar."*

**3. Portfólio opens on an empty 55% column.** `images: []` on case 001, so the media column renders
black under a footer reading *"clique na imagem para ampliar · ← → para percorrer as imagens"* — an
instruction to operate controls for images that do not exist. The flagship project is the one that
opens worst.

## Build

1. Order Portfólio's sections so construction is in the fold, **or** make the fold a result that
   guarantees the three named beats rather than a count of three. Do not hardcode section names —
   the projects do not share a section list, which is the whole reason the hazard note exists.
2. `rail.hidden = !overflows` — and give a single-section case one mark rather than none.
3. When `images` is empty: suppress the media column, suppress the image hint, let the prose run
   full width. Better still, ship 3–4 captures of the Unit itself; `?film` exists and has never run.

## Done when

- All three projects show project, context and construction at `scrollTop === 0`, measured at 883px.
- Every case that overflows has a visible indicator.
- No case instructs the visitor to click an image it does not have.

## Traps

- **`espelho` (T-18) is live in `prototype/focus.js` and `src/`.** It landed the accessible mirror in
  `a911e5f`. **Do not start this ticket until espelho has merged**, or you will both rewrite the same
  file. Rebase onto it, then work.
- **`focus.js` builds its stylesheet inside a template literal.** No backtick may appear inside it,
  including in a CSS comment — this broke the build three times in one session, each time with an
  error pointing at an unrelated line. See `CLAUDE.md`.
- The 60/40 split, the fixed header and the drawn rail are **right** and were measured. This ticket
  fixes three holes in that work; it does not revisit it.
- `focus.exit()` still has three callers (`scene.js:3508`, `:3513`, `:3618`) despite the comment at
  `:3217` claiming single ownership. Not a live bug — but do not add a fourth.
