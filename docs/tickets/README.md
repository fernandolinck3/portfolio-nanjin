# Tickets

Split out of `SPEC.md`. One ticket is one `/implement` run with fresh context — each states its own
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
| T-05 | [Flat Plate](T-05-flat-plate.md) | A | T-02 | ready after T-02 |
| T-06 | [Portrait recomposition](T-06-portrait.md) | A | T-04 | later |
| T-07 | [Shadows](T-07-shadows.md) | B | — | ready — biggest single win |
| T-08 | [The window and the curtains](T-08-window-and-curtains.md) | B | — | ready |
| T-09 | [Split the Vigil](T-09-split-the-vigil.md) | B | — | ready |
| T-10 | [Vault, pictures, chandelier](T-10-vault-pictures-chandelier.md) | B | T-07 | after T-07 |
| T-11 | [Volvelle deck faces](T-11-volvelle-decks.md) | B | — | blocked on a source image |
| T-12 | [Faceplate artwork](T-12-faceplate-artwork.md) | C | Fernando | blocked |
| T-13 | [RACK contents](T-13-rack-contents.md) | C | Fernando | blocked |
| T-14 | [Publish the repo](T-14-publish-the-repo.md) | C | Fernando | blocked |

## Standing rules for every ticket

- Read `CONTEXT.md` for the vocabulary before writing a line. Use the Unit's words.
- `SPEC.md §7` lists four decisions that look like bugs and are not. Do not fix them back.
- Verify at render size in a real browser, not in a headless still and not in the source file.
- If a ticket changes the Unit's anatomy, update `CONTEXT.md` in the same commit.
