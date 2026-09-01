# T-28 — A form on CONTATO, and the decision it forces first

**Track C · Open item 6 · `src/content/modules.ts` · NEEDS A RULING BEFORE ANY CODE**

## Goal

A visitor can write to Fernando without leaving the object and without opening a mail client.

## Why this is not just a form

`nanj.in` is **GitHub Pages — static hosting with no backend.** There is nowhere for a form to POST.
That leaves three routes, and they are not equivalent:

| Route | What it costs |
|---|---|
| **`mailto:` link** (today) | Zero. Opens the visitor's mail client. Fails for anyone on webmail, which is most people on a phone. |
| **Third-party endpoint** (Formspree, Web3Forms, Basin) | A real form. But it is an **external dependency**, which is ADR-0004 — *"do not add dependencies"* — and it sends a stranger's name and email to a third party, which is **LGPD**, still unruled. |
| **Own endpoint** (a small worker/function) | Full control, no third party in the data path. But it is the first server this project has ever had, and it has to be paid for and kept alive. |

`HANDOFF.md` already records consent as *"a decision waiting, not an oversight."* A contact form
collects personal data directly, which makes that decision due rather than deferred.

## Build — after the ruling, not before

1. **Fernando picks a route.** Nothing below starts until he does.
2. Add `layout: 'form'` to the CONTATO Module in `modules.ts` — name, email, message, nothing else.
   Every extra field costs completions.
3. The form is **DOM, not canvas.** The Screen is a 320×180 buffer; text entry there is not a real
   input. Use the overlay surface `focus.js` already owns, which is also what makes it accessible for
   free.
4. Success and failure states in the object's own vocabulary. A form that silently fails is worse
   than no form, and this one carries the only conversion on the site.

## Done when

- A visitor with no mail client configured can send a message from a phone.
- The route Fernando chose is written into an ADR, because it reverses or extends ADR-0004.
- A failed send says so, on the Screen, in Portuguese.

## Traps

- **Do not ship a form that pretends to send.** A decorative form on a portfolio is a lie the object
  tells about itself, and everything else here refuses to lie.
- **Spam.** Any public endpoint gets scraped. Whatever route is chosen needs a honeypot at minimum.
- **This does not replace T-24.** The email route and the dead LinkedIn row are separate and cheaper;
  do that first. A form does not help if nobody finds CONTATO.
- **LGPD is not optional here.** A form that collects a name and an email needs a line saying what
  happens to it.
