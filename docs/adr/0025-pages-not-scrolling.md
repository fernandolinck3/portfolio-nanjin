# ADR-0025 — Pages, not scrolling

**Date:** 2026-08-28 · **Status:** accepted · **Supersedes:** ADR-0024 · **Restores:** ADR-0009

## Context

ADR-0024 was written this week and lasted one build. It replaced section paging with a scrolling
column on the strength of one line of feedback about clutter, and the next round of feedback was
about the result:

> Não estou gostando de como o texto está ficando dentro do painel, ele tá em um espaço muito
> enclausurado. Conseguimos fazer que não tenha scroll em nenhuma tela por enquanto, tendo talvez
> páginas diferentes (tipo slides).

The diagnosis in ADR-0024 was wrong, and it is worth saying how rather than quietly reverting.
The complaint it answered was that the text felt cramped. It read that as *not enough room* and
gave the reader more column. But the Screen is 320×180, and the body was the ~200px strip left
beside LYRA; scrolling did not add room, it added *travel* — the same cramped window, now with
something moving through it. The reader got a 98px slot onto a longer column, which is a worse
version of the problem, plus a control to operate.

The actual constraint was never length. It was **width and margins**, both of which were being
spent on a layout that assumed every Module draws a list next to the figure.

## Decision

**Nothing scrolls. A Module is an index and a run of pages, and the SUN turns them.**

- **Page 0** is the lead and the item list. This is the index, and it is where the MOON works.
- **Pages 1..n** are the selected item's case, one page at a time, in the **full width** of the
  panel, hanging from the header rule.

Turning back past the first page returns to the index, so there is no separate "back to the list"
control to learn — the SUN's first turn goes in and its last turn back comes out.

**The renderer paginates, not the content.** A section is not a page: sections are written as up to
five 58-character lines, and at 13px VT323 across the full width a line of that length wraps to
about one and a half. Six *rendered* lines fit a page, so sections flow into as many pages as their
measured length needs, and a new heading always starts a new page. The page count is therefore
known only to the draw, and the controller clamps against what the draw reports — the same contract
the scroll offset had, which is the one part of ADR-0024 worth keeping.

**On a page, LYRA goes behind a scrim and stops talking.** She is why the full width is available
at all: the body could not use it while she stood in the column. A near-solid page over her keeps
her present and keeps the text legible, and her speech bubble is suppressed, because bubble text at
12% under body text at 100% is two paragraphs in one place — the failure ADR-0024 was already
warned about in PROJETOS (*"a lyra atrás tá dificultando a leitura"*).

## What ADR-0009 gets back

All of it, in substance: no scrolling, and no browsing control. The Pads still own Module
navigation, there is still no next/previous for Modules, and every Module still opens on a lead
that needs no wheel.

`SCREEN_BUDGET.section` stays a hard cap on the *writing* — five lines, 58 characters, six sections
— and the tests keep asserting it. It is no longer a promise that a section fits one screen, because
the renderer now guarantees fit by construction; it is a promise that a section stays a readable
unit rather than growing into an essay.

## Consequences

- The SUN's detent is nearly double the MOON's. One notch used to be 46px and is now a whole page,
  and the wrist should cost about what the control moves.
- The three scroll gestures survive unchanged as three ways to turn a page: the wheel over the SUN,
  the wheel anywhere on the object, and dragging the SUN. They still meet in one function.
- A page indicator replaces the scroll indicator: filled dots on the footer rule, one per page plus
  the index. There is nothing continuous left to report.
- Overflow is now structurally impossible on a case page, so the `+N` warning in the corner only
  ever reports a Module whose *index* does not fit — which is what it was for.

## Cost

One day, and one ADR that is now history rather than guidance. The lesson is cheap to state and was
expensive to learn twice this session: **a complaint about how something feels is not a diagnosis.**
"Cluttered" and "enclosed" were the same reader describing the same 200px column, and both times the
fix was to look at the layout, not to add a mechanism.
