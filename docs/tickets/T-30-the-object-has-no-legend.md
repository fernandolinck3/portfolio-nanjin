# T-30 — Nine controls and no legend

**Track B · from the 2026-09-01 critique · `prototype/screen/render.js`, `prototype/plate-art.js`**

## Goal

A visitor who has never seen this object can tell what the two wheels do, without waiting and without
being told twice.

## Why

This is **one problem wearing five numbers.** The critique scored ten heuristics and five of the low
scores are the same defect:

| # | Heuristic | Score | What it actually says |
|---|---|---|---|
| 2 | Match to the real world | 2 | LUA / SOL / TECLAS is invented vocabulary with no legend on the Plate |
| 4 | Consistency | 3 | the two wheels do different jobs and nothing persistent says which |
| 6 | Recognition over recall | 2 | nine controls; the only instruction arrives after 6s of stillness |
| 7 | Flexibility | 3 | twelve real keyboard shortcuts, none announced anywhere |
| 10 | Help | 2 | LYRA's idle line and the overlay footer hint are the whole of it |

**Eleven of the fifteen points lost are here.** It is the largest single block left on the board, and
until this ticket it was the only block with no ticket at all — which is how it stayed invisible: it
never appeared as one finding, so it never looked bigger than the things around it.

The persona that fails is Jordan, the first-timer: *"nine controls, no legend. Turns a wheel on QUEM
and nothing happens, because QUEM has no items. His very first interaction teaches him the controls
are decorative."* That is the worst possible first lesson for an object whose entire argument is that
every control is real.

## The tension this ticket must not resolve by force

The object is deliberately enigmatic and that is not a bug — it is most of why it is memorable, and
`PRODUCT.md` is built on the instrument reading as an instrument. **A legend that explains the object
kills it.** The exact failure mode to avoid is a help panel, a tooltip layer, or an onboarding
overlay: three shapes that would each solve the score and cost the thing the score exists to protect.

What is being asked for is smaller and older than any of those. Real instruments are labelled. A
mixer has LOW / MID / HIGH engraved beside the knobs; a synthesiser has CUTOFF under the dial. The
label is part of the object's own surface and nobody experiences it as help. **The legend this ticket
wants is engraving, not documentation.**

## Build

Nothing here is settled. These are the routes worth rendering before choosing, and this project
decides by looking:

1. **Engrave the Plate.** The Nightwork band and the area around each Deck are the natural home. Two
   words per control, in the face the Plate already uses. Costs nothing at runtime and is the most
   object-native answer.
2. **Label on approach.** The name of a control appears beside it on hover or focus and fades. Keeps
   the resting composition clean and pays the cost only when someone is already reaching.
3. **Make the first turn teach.** Jordan's failure is specifically that QUEM has no items, so the
   wheel does nothing on the Module the visitor lands on. Making the first wheel-turn always produce
   a visible response would fix the worst instance without a single new word.
4. **The shortcuts are a separate surface.** Twelve unannounced shortcuts are not a Plate problem —
   the mirror is the honest place to list them, where they cost the object nothing.

## Done when

- Turning either wheel for the first time produces a response the visitor can see.
- What the two Decks do is answerable without turning them.
- The keyboard shortcuts are discoverable somewhere.
- No help panel, no tooltip layer, no onboarding, and the resting composition is not busier.

## Traps

- **The Screen is a 320×180 buffer** (`render.js:6`) and 8px Silkscreen lands near 10 CSS px at the
  resting framing. A legend drawn *on the Screen* competes with the content for the smallest surface
  the object has. The Plate is 5.6 × 3.28 and mostly empty — that is where the room is.
- **`modules.ts` is the content source** (ADR-0002). Any word a visitor reads goes there, and
  anything the Screen displays changes the mirror in the same commit.
- **T-12 will replace the Plate art** with Fernando's own artwork. Engraving that assumes the current
  De Wit standin will be redrawn — coordinate with the ticket rather than painting over it.
- **This overlaps T-22.** If the resting framing comes in, labels that were illegible become legible
  and part of this problem solves itself. Measure after T-22 moves, not before.
- The critique's own question 2 is worth reading first: *"What is the honest cost of the two Decks?
  They are the largest, most beautiful objects on the Plate, they carry the least information, and
  they are the source of the entire recall problem."* Deleting a wheel is a legitimate answer to this
  ticket and should not be ruled out because it is drastic.

## Source

`.impeccable/critique/2026-09-01T12-00-21Z__nanj-in.md` — heuristics 2, 4, 6, 7 and 10, persona
Jordan, and question 2.
