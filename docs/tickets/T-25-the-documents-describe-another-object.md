# T-25 — Two documents describe an object that no longer exists

**Track A · docs only · `SPEC.md`, `CONTEXT.md` · touches no code**

## Goal

The two files every ticket is told to read first are true.

## What is wrong

**1. `SPEC.md:93` states the wrong resolution, and calls it a cap.**

> The Screen texture is 1024 × 576 and draws far smaller on the Plate. These are hard caps, not …

`prototype/screen/render.js:6` is `const W = 320, H = 180`. That is **3.2× off**, and every character
budget in §3 is computed against a resolution the object has never used. Anyone sizing text from that
section is sizing it wrong.

**2. `CONTEXT.md` names Modules that do not ship.** The glossary defines **Rack** as a Part and names
Ident / Now-Next / Method / Out. The shipped Modules are QUEM · PROJETOS · TRAJETO · CRITÉRIOS ·
HABILIDADES · CONTATO. `docs/tickets/README.md` opens its standing rules with *"Read `CONTEXT.md` for
the vocabulary before writing a line. Use the Unit's words"* — so the file that defines the shared
language describes a different object.

**3. The root titles still say Bittencourt.** `CONTEXT.md`, `HANDOFF.md` and `CLAUDE.md` all open
with *"Fer Bittencourt portfolio"*. Open item 9 ruled **Fernando Linck, everywhere** on 2026-08-31 and
the shipped object carries zero occurrences. The docs did not follow. `docs/COMO-FUNCIONA.md:139`
goes further and documents behaviour the code no longer has: *"A tela Quem diz Fernando Bittencourt."*

## Build

1. Correct `SPEC.md:93` to 320 × 180 and re-derive every character budget in §3 against it.
2. Bring `CONTEXT.md` to the shipped Modules. **Rack is not deleted silently** — either it is a Part
   that no longer exists (say so, with the date) or T-13 still intends it (say that instead).
3. Retitle the three root docs to Fernando Linck. Correct `COMO-FUNCIONA.md:139`.
4. Leave `docs/log/` and `docs/archive/` alone. They are history and the old name is correct there.

## Done when

- No number in `SPEC.md §3` disagrees with `render.js`.
- `CONTEXT.md`'s Modules are the Modules.
- No document outside `docs/log/` and `docs/archive/` describes behaviour the object does not have.

## Traps

- **This is the vocabulary file.** Changing a term changes what every future ticket means. If a word
  is genuinely undecided, say it is undecided — do not pick one to make the file tidy.
- **A rename may need an ADR.** The PATH glossary rename is already under *Blocked on Fernando*; do
  not resolve it here as a side effect.
- Docs-only. Do not "fix" code to match a document — the code is the truth and the document is wrong.
