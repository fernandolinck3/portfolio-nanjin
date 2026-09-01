# T-24 — The way to reach him is sixth of six, and a third of it does nothing

**Track A · Open item 6 · `src/content/modules.ts`, `prototype/screen/render.js`**

## Goal

The primary call to action is reachable without knowing the object, and every row that looks like it
acts, acts.

## Why

`PRODUCT.md` states the primary CTA plainly: *"Invite the visitor to contact Fernando about a job
opportunity, freelance project, or relevant collaboration."*

Today CONTATO is Pad 6 of 6 and **nothing at rest signals it exists**. A recruiter who spends thirty
seconds leaves with a good impression of the maker and no way to contact him. That is the whole
funnel failing at the last step.

Worse, the **LINKEDIN row is styled identically to the two rows that act, and has no `act`.** It is a
false affordance on the one Module where trust matters most. A labelled row that does nothing teaches
the visitor that the object lies — and it is the only place on the site that does.

## Build

1. **Hierarchy** (Open item 6): email primary, Instagram secondary, LinkedIn **only if a real URL
   exists**. Location and language to the footer. MOON selects the route, SUN executes it.
2. **Delete the LinkedIn row** until the URL arrives. It is under *Blocked on Fernando* and has been
   for several sessions. An absent row is honest; a dead row is not.
3. **Signal contact at rest** without adding a Part: lamp the CONTATO Pad differently, or print the
   email in the Plate's Nightwork band.

## Done when

- A visitor who never turns a wheel can find a way to contact Fernando.
- Every row on CONTATO either acts or is not there.
- No new Part, no seventh Module.

## Traps

- **The email is real; do not invent the rest.** `PRODUCT.md` prohibits unverified claims, and the
  LinkedIn URL is Fernando's to supply. Do not guess a profile URL.
- **`modules.ts` is the content source** (ADR-0002). Do not add a second literal in `render.js` — the
  name already lives in six literals across five files and that is a known defect.
- Printing the email on the Plate makes it scrapeable. Flag that to Fernando as a decision rather
  than making it for him.
