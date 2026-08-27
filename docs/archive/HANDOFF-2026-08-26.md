# Handoff — Fer Bittencourt portfolio ("Tenebrae")

**Date:** 2026-08-26 · **Repo:** `~/Documents/fernando-portfolio`
**Language:** Fernando writes EN and PT-BR; reply in whichever he used last (last was EN).

## Read this first

The paper trail is the point. **Fifteen ADRs** now, four of them reversals. `CONTEXT.md` is the
glossary and it is current. `docs/tickets/README.md` is the board. This file does not repeat them.

**Nothing in this session is committed.** `git status` shows 7 modified and 11 new paths. That is
deliberate — Fernando has not reviewed them — but it means a fresh agent should read the working tree,
not the last commit, to know what the Screen does.

## THE ONE THING THAT WILL WASTE YOUR DAY

**The repo lives in `~/Documents`, which is iCloud-synced, on a disk that is 98% full.**

macOS evicts file *contents* to iCloud when disk is low, leaving `dataless` stubs. Every read then
faults over the network. This session that meant:

- `vite` and `esbuild` hanging with **no output at all** (vite buffers when not on a TTY, so the logs
  look empty while it is actually stalled on a file read)
- `npx vitest run` taking **833 seconds**, of which **624s was standing up jsdom** from `node_modules`
- a twenty-minute window where every file in the repo returned `Operation timed out`
- eventually `ENOSPC` — no space left — which made *every* tool call fail

**Do not run `brctl download .` on this repo.** I did. It queues `node_modules` — thousands of files —
saturates the `bird` daemon, and fills the disk. It turned a slow repo into an unusable one.

Mitigations already in place: `prototype/screen/reaction.test.js` carries
`@vitest-environment node`, which skips jsdom and takes that suite from 833s to ~12s. Add the same
pragma to any new test that does not touch the DOM.

**The real fix is to move the repo out of `~/Documents`** — `~/dev/fernando-portfolio` — and it has
been raised with Fernando twice. It is his call and he has not made it.

## What happened this session

Started on the Screen and the character; that is where it stayed.

1. **Redrew the Wizard's bust** (v2) against three specific faults in v1 — a terminator that was a
   straight line down every row, eyes that were solid blocks, a brim that was a flat plank. Kept v1 as
   `BUST_PREV` behind a workbench toggle. Fernando's verdict: better, still not good enough. Correct
   verdict — ADR-0013 says the placeholder is a placeholder and the real one should be his.
2. **Built the drawing pipeline**, which is the durable result. `sprite-from-png.mjs` turns any PNG
   into a four-tone text sprite; `sheet-to-frames.mjs` does the same for a spritesheet; `png.mjs` is a
   dependency-free PNG decoder on Node's `zlib` (RGB/RGBA, palettes, greyscale, bit depths 1–16).
   `WIZARD-PROMPT.md` is the generator prompt for exploring her look. He installed Aseprite.
3. **Implemented the knob-reaction animation** from a zip in `~/Downloads`. See below.
4. **Named her Lyra** and gave her a speech bubble, one line per Module, in `src/content/modules.ts`.
5. **Made the Vigil choose the Face** and deleted Instrument (ADR-0015).

## The animation, and what its brief got wrong

The brief asked me to read `CLAUDE_HANDOFF.md` and `animation-manifest.json`. **Neither exists** — not
in the zip, not anywhere on the machine. The zip holds exactly two files, and the second is a **GIF
misnamed `.png`**. Frame timing and loop points were never specified; the 5×2 grid was derived from
pixel data.

It also asked for the *knob* interaction. **There is no knob** — ADR-0009 replaced it with two Decks,
and `scene.js:784` says so outright. The canonical funnel is `setVigil()` at `scene.js:1321`.

**The two Screen renderers are disjoint and this is the important structural fact:**

| | |
|---|---|
| `prototype/screen/screen.js` | 320×180 workbench — **has Lyra**, has no Decks |
| `prototype/scene.js` `drawScreen()` | 1024×576 on the 3D Unit — **has the Decks**, draws no figure |

So the reaction is wired in the workbench against a stand-in Vigil slider. **`scene.js` was not
touched** — hooking `setVigil` there would have been dead code. T-04 is the merge point.

## State of the Screen

- **Lyra is the default figure** — ten drawn frames, 28×40, four tones, full figure (ADR-0014 narrows
  ADR-0013's split-at-the-neck to the `drawn` mode only).
- She **breathes at rest** (borrows frame 9, the settle frame, ~4.2s with scatter) and plays the full
  0→9 reaction when the Vigil travels far enough. Reduced motion pins her to frame 0.
- She **speaks** — bubble anchored to her sprite, quiet during a Cast.
- **Grimoire below Vigil 0.94, Cracktro above it.** 0.94 is where `RAMPS[2]` in `scene.js` takes the
  third candle to zero; `LAST_CANDLE_OUT` in `screen.js` is the one place it is written.
- **41 tests passing** across both files (29 in `reaction.test.js` — playback completion, rapid
  retriggering, reduced motion, idle, cleanup; 12 pre-existing in `modules.test.ts`). Verified after
  the Face change and after Lyra's lines were added to the content source.

## Open, in rough order

1. **Cracktro occupies the top 6% of the Vigil.** "The last candle dies" is genuinely near the end of
   the rite, so the night Face is nearly unreachable. Flagged in ADR-0015. If it needs to be commoner,
   move the ramp in `scene.js` — do not pick a prettier number in `screen.js` and let them drift.
2. **Lyra's lines are placeholder-quality.** They describe the object and never claim anything about
   Fernando's experience, which is deliberate (PRODUCT.md). But they are mine, not his.
3. **The full figure is dense at 1×.** 112×112 of soft shading squeezed into 28×40 at four tones.
   Fernando chose it over five bust crops after seeing them side by side. The mechanism is right;
   whether *she reads* is unresolved and the answer is probably redrawing her in Aseprite.
4. **The bubble has not been verified at 1× in both Faces.** It was drawn and built; the disk filled
   before it could be checked on screen.
5. **`CONTEXT.md`'s Part list still says "Jog, Knob"** — both superseded by ADR-0009. Stale.
6. Track A and Track B (`docs/tickets/`) have not moved. T-02 is still the centre of the build and
   `src/App.tsx` is still a placeholder.

## Blocked on Fernando

Unchanged from yesterday: **faceplate artwork** (T-12), **RACK contents** (T-13 — slot 4 still lists
influences, and PRODUCT.md forbids inventing them), **publishing the repo** (T-14). Plus **moving the
repo out of iCloud**, which is now the highest-value thing on the list.

## Cautions

- **Build and show. Descriptions do not land.** Confirmed again today, repeatedly. Every decision that
  stuck was settled by a render — the six crop options in one page beat any amount of explaining.
- **Verify at 1×, not 3×.** The Screen draws ~590px wide on the Plate. Everything looks fine at 3×.
- **Do not add dependencies.** ADR-0004. When Node could not decode a PNG, the answer was 120 lines on
  `zlib`, not a package.
- **He moves fast and reverses himself.** Four ADRs are reversals. When he changes direction, write the
  ADR — do not just change the code, and do not re-litigate the old one.
- **When he asks for something, give him the thing** — not a mode behind a toggle. I put Lyra behind a
  `figure` option and left the old bust as default; he had to tell me she was supposed to *be* the
  character. He was right.
