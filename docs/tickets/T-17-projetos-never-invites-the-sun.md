# T-17 — PROJETOS never invites the SUN

**Track B · absorbed by the PROJETOS preview (Open item 5)**

## Goal

The Module with the longest writing behind it tells the reader there is something behind it.

## What a review found

`SOL ▸` — the invitation added because *"não fica claro que o usuário pode scrollar pra ler os
textos"* — is gated on `pageMax > 0` (`prototype/screen/render.js`). And a few lines above:

```js
const sections = (item && m.id !== 'projects') ? item.sections : []
```

PROJETOS keeps its cases in the overlay, so its items have no pages, so `pageMax` is zero, so the
invitation never draws. The one Module whose items carry the most text is the one that offers no
hint at all.

## Why it is not a quick fix

Open item 5 already asks for the SUN to reveal a short preview of the selected project. Once it
does, `pageMax` stops being zero and the invitation appears on its own. Fixing the gate now would be
undone by that work.

## When it lands

Turning the SUN in PROJETOS shows a preview, and the row says so before it is turned.
