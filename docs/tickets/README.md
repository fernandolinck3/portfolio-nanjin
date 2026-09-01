# Tickets

Split out of `SPEC.md`. T-15 to T-17 came later, out of a code review on 2026-08-29 — they are
**findings pinned to work that is already planned**, not new work. Each names what absorbs it, so
whoever picks that work up meets the finding instead of rediscovering it. One ticket is one `/implement` run with fresh context — each states its own
traps so it can be picked up without reading the whole thread.

## The graph

```
  A — the build                     B — the scene                  C — blocked on Fernando

  T-01 content source               T-07 shadows                   T-12 faceplate artwork
    ├── T-02 DOM truth layer        T-08 window + curtain          T-13 RACK contents
    │     ├── T-05 flat plate       T-09 vigil → rite/hour         T-14 publish the repo
    │     └── T-04 scene in src/    T-10 vault · pictures · light
    └── T-03 screen reads source    T-11 volvelle deck faces
          └── T-04                        │
                └── T-06 portrait         └── needs a high-res Calendarium Perpetuum
```

Track B is prototype work and lands in `prototype/scene.js`. It is **disjoint from track A** — the
two can run in parallel without touching the same files, right up until T-04 ports the scene across.
T-04 is the merge point and should not start while track B is mid-flight.

## Order

| # | Ticket | Track | Depends on | State |
|---|---|---|---|---|
| T-01 | [Content source](T-01-content-source.md) | A | — | ready |
| T-02 | [DOM truth layer](T-02-dom-truth-layer.md) | A | T-01 | ready after T-01 |
| T-03 | [Screen reads the source](T-03-screen-reads-source.md) | A | T-01 | ready after T-01 |
| T-04 | [Scene into `src/`](T-04-scene-into-src.md) | A | T-02, T-03, track B quiet | later |
| T-05 | [Flat Plate](T-05-flat-plate.md) | A | T-02 | tem um piso desde 2026-09-01 — ver comentário |
| T-06 | [Portrait recomposition](T-06-portrait.md) | A | T-04 | later |
| T-07 | [Shadows](T-07-shadows.md) | B | — | ready — biggest single win |
| T-08 | [The window and the curtains](T-08-window-and-curtains.md) | B | — | ready |
| T-09 | [Split the Vigil](T-09-split-the-vigil.md) | B | — | ready |
| T-10 | [Vault, pictures, chandelier](T-10-vault-pictures-chandelier.md) | B | T-07 | after T-07 |
| T-11 | [Volvelle deck faces](T-11-volvelle-decks.md) | B | — | blocked on a source image |
| T-12 | [Faceplate artwork](T-12-faceplate-artwork.md) | C | Fernando | blocked |
| T-13 | [RACK contents](T-13-rack-contents.md) | C | Fernando | blocked |
| T-14 | [Publish the repo](T-14-publish-the-repo.md) | C | Fernando | blocked |
| T-15 | [Canvas controls need a DOM twin](T-15-canvas-controls-need-a-dom-twin.md) | A | — | **done** — absorbed by T-18 |
| T-16 | [An index that does not fit must say so](T-16-an-index-that-does-not-fit-must-say-so.md) | B | — | absorbed by whichever Module grows first |
| T-17 | [PROJETOS never invites the SUN](T-17-projetos-never-invites-the-sun.md) | B | — | absorbed by the PROJETOS preview |
| T-18 | [The accessible mirror of the LCD](T-18-accessible-mirror.md) | A | — | **done** — branch `espelho` |
| T-19 | [Split the handoff](T-19-split-the-handoff.md) | A | — | done 2026-08-31 |
| T-21 | [Boot in 2–2.5s](T-21-boot-in-two-seconds.md) | B | — | **done 2026-09-01** — 5,90s → 2,42s |
| T-22 | [The Screen is five percent](T-22-the-screen-is-five-percent.md) | B | — | ready — from the 2026-09-01 critique |
| T-23 | [Three holes in the overlay](T-23-the-overlay-has-three-holes.md) | A | T-18 merged | **done 2026-09-01** |
| T-24 | [CONTATO is last, and partly dead](T-24-contato-is-last-and-partly-dead.md) | A | — | ready |
| T-25 | [The documents describe another object](T-25-the-documents-describe-another-object.md) | A | — | ready — docs only |
| T-26 | [The robots still cannot read it](T-26-the-robots-still-cannot-read-it.md) | A | T-18 | **done 2026-09-01** — 465 → 5.745 chars |
| T-27 | [The k in Linck](T-27-the-k-in-linck.md) | B | — | **done 2026-09-01** — no ar |
| T-28 | [A form on CONTATO](T-28-a-form-on-contato.md) | C | Fernando | **done 2026-09-01** — ADR-0027 + formulário |
| T-29 | [O Preview do GTM não conecta](T-29-o-preview-do-gtm-nao-conecta.md) | A | — | precisa do sintoma exato |

## Where T-21 to T-25 came from

A two-axis code review and an Impeccable critique, both run on 2026-09-01 against the shipped site.
They are **findings with a measurement attached**, not new ideas — each names the number that
justifies it so nobody re-argues it from taste. The critique scored the object 25/40 and its P0
(the portfolio serves 214 characters of text to a crawler) is already answered by T-18 on `espelho`,
which is why no ticket here repeats it.

## Standing rules for every ticket

- Read `CONTEXT.md` for the vocabulary before writing a line. Use the Unit's words.
- **Anything that changes what the Screen displays changes the mirror in the same commit.** Put the
  content in `src/content/modules.ts` and both read it; see `CLAUDE.md` and T-18.
- `SPEC.md §7` lists four decisions that look like bugs and are not. Do not fix them back.
- Verify at render size in a real browser, not in a headless still and not in the source file.
- If a ticket changes the Unit's anatomy, update `CONTEXT.md` in the same commit.
