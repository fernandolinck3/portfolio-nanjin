# ADR-0027 — The form speaks to an outside endpoint, and that is not what ADR-0004 forbade

**Date:** 2026-09-01 · **Status:** accepted
**Extends:** ADR-0004 — and writes down the rule ADR-0004 never actually stated

## Context

CONTATO offers a `mailto:` link and nothing else. A `mailto:` opens the visitor's mail client, which
on a phone, for anyone on webmail, opens nothing at all. This is the only conversion on the site and
its primary audience is recruiters, so the failure lands exactly where it costs most.

A form needs somewhere to send. `nanj.in` is GitHub Pages: static hosting, no server, nowhere to
POST. Three routes were researched (`docs/research/contact-form-routes.md`) and two facts settled it.

**ADR-0004's text is not the rule everyone has been citing.** The document is about procedural
geometry and shipping no binary assets. The sentence *"do not add dependencies (ADR-0004)"* exists
only as a **citation** of it, in `HANDOFF.md`'s Cautions and in `docs/analytics/README.md` — never in
the ADR itself. What the rule has actually been charging for is **npm packages**: the precedent is
120 hand-written lines of `zlib` rather than one install. A `fetch()` to a URL adds no package.

**The "own endpoint" route no longer avoids a vendor.** A Cloudflare Worker cannot send mail by
itself; MailChannels terminated its free Workers API on 2024-06-30. The current path is Cloudflare
Email Service (public beta since April 2026) or a third-party sender. So *both* working routes put a
company in the data path, and the choice collapses to effort and account count. `nanj.in`'s
nameservers are Hostinger's `dns-parking.com` with no MX, so that route also begins with a DNS
migration.

## Decision

**The form POSTs JSON to an external endpoint, and the endpoint is configurable rather than named in
the logic.** Web3Forms today: `https://api.web3forms.com/submit`, no SDK, no package — the same shape
as `prototype/track.js`, which pushes to a configurable destination without the code knowing who is
listening.

**And the rule ADR-0004 never wrote, written here in letter:**

> The prohibition is on **packages**. A dependency is something that enters `package.json`, ships in
> the bundle, and has to be audited, updated and trusted forever. A runtime vendor reached by `fetch`
> costs something different and real — **an LGPD decision, not a bundle decision** — and must be
> argued on those terms rather than refused by citing a rule about geometry.

**The access key ships in the markup, on purpose.** Web3Forms documents it as public: *"You do not
need to hide the access key. Access key is public."* It authorises one action — deliver mail to the
address that owns the key — so it is a form identifier, not a credential. Treating it as a secret on
a static site would be theatre; there is nowhere to hide it.

## Verified before deciding, not after

The ticket's own trap is that a form which pretends to send is worse than no form. Web3Forms blocks
some domains and TLDs by default, and `nanj.in` is a four-letter `.in` domain hack — the failure
would have been works-locally, fails-in-production.

So one real submission was sent **from the `nanj.in` origin** before any form code existed:

```
origin:  https://nanj.in
status:  200
body:    { success: true, message: "Form submitted successfully!" }
```

The domain is not blocked. Had it returned 403, the same decision would stand and only the endpoint
would change — Formspree (50/month) or Basin take the identical shape.

## LGPD, and why there is no banner

A form collecting a name and an e-mail processes personal data. The lawful basis here is **art. 7º,
V** — *procedimentos preliminares relacionados a contrato, a pedido do titular* — because the visitor
is the one initiating contact about work. **This is not consent**, so:

- **No consent banner.** Consent is a different basis with different obligations, and reaching for it
  here would be wrong as well as ugly.
- The unresolved analytics-cookie consent question in `docs/analytics/README.md` is **untouched**.
  That one is about cookies and a different basis; this decision does not settle it and must not be
  read as settling it.
- **Art. 33, IX** authorises the international transfer for those same hypotheses, so no standard
  contractual clauses are needed even though the data leaves Brazil.

What is still required, and is built:

- **A notice** (art. 9º): what is collected, where it goes, what it is for. One line beside the form.
- **A retention answer** (art. 15, I): the vendor states it does not store submissions and deletes
  logs containing personal data every two months, so retention becomes Fernando's own mailbox.
- **A contact channel** for data-subject requests. Resolução CD/ANPD nº 2/2022 exempts a natural
  person acting as controller from appointing an *encarregado* provided such a channel exists —
  CONTATO is that channel, which is the module the form lives in.

## Consequences

- The visitor's name and message reach a US-East server run by a company based in India, and then
  Fernando's Outlook. The notice says so plainly rather than burying it.
- **The free tier is 250 submissions/month by secondary sources only** — `web3forms.com/pricing`
  refuses automated reads, so this is unconfirmed against the primary and should be checked in a
  browser before it matters.
- Spam is a honeypot field the API itself understands. The vendor's own docs concede honeypots are
  weakening; if spam arrives, Turnstile is the next step and is free.
- **A failed send must say so on screen.** The API answers with JSON carrying `success`, so there is
  no excuse for a silent failure, and the visible e-mail address stays beside the form as the route
  that works when the form does not.
- If the endpoint is ever swapped, the form's shape does not change — only a URL and a key.
