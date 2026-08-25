# Spec — the Tenebrae Unit

What gets built in `src/`. This collapses `CONTEXT.md`, `PRODUCT.md` and the eleven ADRs into
something a fresh agent can implement one ticket at a time. It does not re-argue any of them —
where a decision is already recorded, this file cites it and moves on.

Tickets: `docs/tickets/`. The prototype (`prototype/scene.js`) is the reference implementation for
everything visual and is **not** the build.

## 1. The shape of the thing

One screen. No scroll, no routes. A single instrument — the **Unit**, model *Tenebrae* — standing on
a walnut table in a chapel-like room, rendered in three.js. The visitor operates the Unit's Parts and
moves the camera; the Unit itself never moves (ADR-0001, ADR-0011).

Three layers, in dependency order:

```
  content source   six Modules as typed data, one file, no markup
        │
        ├──────────────▶ DOM truth layer     semantic HTML + real <button> Pads   ADR-0002
        │                      │
        │                      ├──▶ Flat Plate       CSS silkscreen               ADR-0008
        │                      │
        └──────────────▶ Screen renderer     canvas texture inside the 3D Unit
                               │
                          three.js scene     subscribes to state, paints, never owns it
```

The DOM is canonical. The canvas is a render of it. The scene reads state; it does not hold it.

## 2. State

Four values. Everything else is derived.

| State | Range | Owner | Set by |
|---|---|---|---|
| `module` | `0..5` | DOM truth layer | the six Pads |
| `crossfade` | `0..1` | DOM truth layer | the Crossfader |
| `vigil` | `0..1` | DOM truth layer | the two Decks |
| `camera` | `{tilt, yaw, dist}` | scene only | dragging empty space |

`camera` is deliberately scene-local: it changes on every pointer move and nothing in the DOM depends
on it. The other three drive both consumers and must live above them.

Clamps: `tilt ∈ [4°, 74°]`, `yaw ∈ [-42°, 42°]` (ADR-0011). Beyond 74° the procedural geometry stops
holding up; the clamp exists for exactly that reason and is not a stylistic choice.

### 2.1 The Vigil is two channels behind one control

**Spec decision, made here.** `vigil` is one authored value, but it is consumed as two derived
channels:

```ts
const rite = vigil   // interior: the three Candles go out one at a time
const hour = vigil   // exterior: the sky turns from afternoon to night
```

They are identical today and read correctly that way. They are named apart because they answer to
different things — the rite is a liturgy performed on the Altar, the hour is the world outside the
window — and someone will eventually want dusk with the candles still lit, or a dark room at noon.
Splitting them once every consumer reads `vigil` directly is a scene-wide edit; splitting them when
every consumer already reads `rite` or `hour` is changing one line.

Consumers must read `rite` or `hour`, never `vigil`. Ticket T-09.

## 3. Content

Six Modules, exactly six, no seventh and no sub-navigation (ADR-0001, ADR-0009). Every Module fits
one Screen exactly — nothing scrolls and no control browses.

One typed source, four shapes:

```ts
type Module =
  | { kind: 'prose';  title: string; lines: string[]; dim?: string[]; mail?: string }
  | { kind: 'thesis'; title: string; a: Side; b: Side }        // the Crossfader's two ends
  | { kind: 'table';  title: string; head: [string,string,string]; rows: Row[] }
  | { kind: 'steps';  title: string; steps: string[] }
```

| Slot | Module | Shape | Status |
|---|---|---|---|
| 1 | Ident | `prose` | placeholder copy, needs a pass |
| 2 | Now / Next | `thesis` | copy approved in substance; Next side is future-tense throughout (ADR-0005) |
| 3 | Project 001 | `prose` | placeholder copy, needs a pass |
| 4 | Rack | `table` | **blocked on Fernando** — currently renders influences, not tools. T-13 |
| 5 | Method | `steps` | placeholder copy, needs a pass |
| 6 | Out | `prose` + `mail` | contact email is real; treat as PII, keep it out of logs and fixtures |

### 3.1 The Screen budget

The Screen texture is 1024 × 576 and draws far smaller on the Plate. These are hard caps, not
guidelines — over them, a Module either overflows the Screen or goes illegible:

- `prose` — **4 lines**, ~52 characters each, plus **2 dim lines** at ~58 characters.
- `thesis` — one heading and **4 lines** per side.
- `table` — **5 rows**, three columns.
- `steps` — **6 steps**, one line each.

Any content change is checked at render size, not in the source file. Fine work below ~5px of texture
weight disappears entirely.

### 3.2 What the content may claim

`PRODUCT.md` governs, and it is not negotiable by a nice-sounding sentence. No invented client work,
metrics or credentials. AI, automation and analytics are future-tense everywhere they appear. The
Crossfader can be dragged fully to Next, so the Next copy must stay honest **at its own extreme** —
that is why the honest index mark is engraved and immovable (ADR-0005).

## 4. The Unit

Plate 5.6 × 3.28. Parts, and what each one owes:

| Part | Count | Duty |
|---|---|---|
| Chassis | 1 | the slab everything is mounted in; proportion, bevel, material |
| Plate | 1 | Print (colour, no relief) over Relief (cut metal); carries the Nightwork |
| Screen | 1 | centred; the only place Module content appears; lights itself |
| Pad | 6 | the *only* navigation; real `<button>`s over the 3D; lamped to show which is live |
| Deck | 2 | Moon left, Sun right; together they are the Vigil (ADR-0009) |
| Crossfader | 1 | moves freely; the engraved index mark **must not track it** (ADR-0005) |

The Plate art path is the OBNE move — one full-bleed engraving under a printed control panel. With
art present the ornamental frame switches itself off. Currently standing in with De Wit's
*Planisphaerium coeleste* (1650, public domain); Fernando's own artwork replaces it. T-12.

## 5. The room

Stone floor, panelled walls, a leaded window with a moon behind it, a walnut table, a marble Altar
under linen, three gilt Candles. All procedural (ADR-0004) — no binary assets except the Plate art.

The window earns its place twice: it gives the Moon deck a referent, and moonlight is the one source
the Vigil does not extinguish, so the room goes cold and blue rather than black (ADR-0011).

Known gaps, in order of how much they cost the render: **no shadows anywhere** (T-07), the lancet
window reads rectangular and only the right curtain shows (T-08), no vault, pictures or chandelier
(T-10).

## 6. Reach

| Condition | What is served |
|---|---|
| desktop, WebGL | the Unit |
| narrow, WebGL | the Unit **recomposed**, not scaled — Screen fills the top, Pads at real touch size (ADR-0008) |
| no WebGL · low power · `prefers-reduced-motion` | the **Flat Plate** — the Unit as a printed silkscreen in CSS, rendered from the DOM truth layer |

The Flat Plate is a designed deliverable with its own pass, not a degraded screenshot. It is also
what a recruiter's crawler, find-in-page and applicant tracking system see, which is the whole reason
ADR-0002 exists.

## 7. Out of scope — four reversals a fresh agent will try to "fix"

1. **three.js stays.** It was stripped in July and deliberately brought back. Do not remove it to
   shrink the bundle; that cost was weighed and paid (ADR-0003).
2. **The Crossfader's index mark does not track the fader.** It is load-bearing honesty, not a bug
   (ADR-0005).
3. **The Bend is dead.** No `?bend=`, no melt shader, no visitor-caused corruption anywhere
   (ADR-0006).
4. **Orbit was banned, then un-banned.** The camera moves; the Unit never does; there is no INSPECT
   (ADR-0007 as amended, then ADR-0011).

Also out: route-based navigation, page scroll, a seventh Module, sub-navigation inside a Module, and
any control that browses.

## 8. Blocked on Fernando

- **Faceplate artwork.** He is designing it. `prototype/ornament/README.md` states the drop-in
  requirements. T-12.
- **`RACK` contents.** Must be tools he actually uses; `PRODUCT.md` forbids inventing them. T-13.
- **Publishing the repo.** He chose public on GitHub; nothing has been pushed and nothing should be
  without his go-ahead. T-14.
