# T-14 — Publish the repo

**Track C · blocked on Fernando**

## Goal

`fernando-portfolio` public on GitHub.

## Status

> **2026-09-16:** done in practice — `origin` is public at github.com/fernandolinck3/portfolio-nanjin and
> `origin/lyra` deploys nanj.in. The paragraph below is the state before that, kept as history.
> Each push to `lyra` still publishes, so the per-push go-ahead below still applies.

He chose "public on GitHub". `gh repo create` was never run and nothing has been pushed.

## Blocked on

His explicit go-ahead, per push. Publishing is outward-facing and irreversible in the way that
matters — the repo is indexed the moment it is public.

## Before the first push

- The commit messages are written to be read, and the ADRs are the paper trail. That is the point:
  the repo *is* Project 001, so the history is part of the deliverable. It holds up. Read it once
  more anyway before it is public.
- His contact email is hard-coded in `prototype/scene.js`. It is his public contact and going public
  is the intent — but confirm that with him rather than assuming it.
- `prototype/ornament/plate.jpg` is a 3840px public-domain derivative with its provenance recorded.
  Fine to ship.
- `docs/archive/` holds the dead July direction, kept deliberately as an anti-reference. Keep it —
  but a `README` in there saying so would stop a visitor reading it as current.
