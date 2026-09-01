# Analytics — the events, and the container that reads them

The Unit is one page that never navigates. The default pageview fires once and every
visitor looks identical whether they pressed one Pad and left or read three cases and
wrote an email. **On a single screen the events are the analytics.**

`prototype/track.js` pushes to `dataLayer` and nothing else — no tag, no vendor, no
dependency (ADR-0004). Whether anything listens is decided in the Tag Manager
container, so the code stays true with tracking switched off, and it loads only on
`nanj.in`: a day of pressing every Pad on localhost would otherwise be the dataset.

**`?track` opens the pushes on any host**, so the taxonomy can be read without shipping to
check it. It is safe because the loader in `index.html` is gated on the same host: off
`nanj.in` there is no container listening, so a push reaches an array nobody reads. It
cannot put a local run into the dataset — only let someone see what a local run *would*
send. Checked this way: `module_open`, `item_select`, `work_open`, `image_step` and
`image_open` all arrive with their parameters and with the UTMs attached, and three arrow
presses through a set produce **one** `image_step`, for the still it stopped on.
`boot_complete` and `page_turn` cannot be seen here — both need the render loop, and rAF
does not run in an automated tab.

## The events

| event | fires when | parameters |
| --- | --- | --- |
| `boot_complete` | the opening finishes | `ms` |
| `module_open` | a Pad opens a Module | `module` |
| `item_select` | the cursor **settles** on an item | `module`, `item` |
| `page_turn` | a page of a case is reached | `module`, `item`, `page` |
| `work_open` | a project's case opens | `work` |
| `image_step` | a still **settles** in the set | `work`, `image` |
| `image_open` | a still is enlarged to full frame | `work`, `image` |
| `outbound` | a route leaves the site | `route`, `kind`, `from` |
| `eclipse_found` | the seventh state opens | `face` |
| `contact_open` | the form is opened | `from` |
| `contact_sent` | a message is actually delivered | `route` |
| `contact_failed` | a send is refused or never lands | `route`, `status` |

Every event also carries whichever of `utm_source`, `utm_medium`, `utm_campaign`,
`utm_content`, `utm_term` were on the URL.

**`contact_sent` is the only conversion this site has.** Everything else measures
attention; that one measures whether attention became a conversation. Read `contact_open`
against it as an abandonment rate, and watch `contact_failed` on its own — a form that
fails silently looks exactly like a visitor who changed their mind, which is why the
failure is an event and not just a message on screen.

Two decisions worth keeping:

**`image` is a name, not an index.** `graecus-blog-archive` reads in a report; `3` does
not, and stops meaning the same thing the moment a still is inserted into the set.

**The two image events answer whether the work is being looked at.** `work_open` says a
case was opened, which is not the same as anyone seeing the eight Graecus captures. The
enlargement exists because 846px is two thirds of a 1265px screenshot, and `image_open`
is the only way to know whether that was worth building — read as a ratio against
`work_open`. `image_step` says *which* capture holds attention.

**Wheel turns are not one event per detent.** A reader crossing a six-item list would
emit six events saying only that a wheel moves. `item_select` reports where the cursor
*stopped*; the steps on the way are dropped by the repeat guard in `track.js`.

**UTMs ride every event, not just the pageview.** GA4 reads them off the URL by itself,
which is enough for the one pageview this site has — but a story link and a bio link
otherwise produce identical `work_open` events with no way to tell which one sent the
reader.

`boot_complete` carries its elapsed time on purpose. The standing brief wants the
opening usable in 2–2.5s and it is about five; a real distribution across real machines
is the only way to know whether the cost is the animation or the shader warm-up.

## The container

`gtm-nanj-in.json` is a Tag Manager export, ready to import into `GTM-PLPVLQH9`.

The measurement id is `G-3GV5YJ7VV4`, already in the `GA4 Measurement ID` constant. It
is the only place it appears: change it there if the property ever changes, not in the
tags.

**To import:** Tag Manager → *Admin* → *Import Container* → choose the file → workspace
*Existing* → **Merge**. Review the preview, then publish.

**Conflict mode is a judgement, not a constant.** *Rename conflicting tags* is the default
and protects work that came from somewhere else. But **re-importing a corrected version of
this same file wants *Overwrite***: renaming leaves the old, wrong tag in place and adds a
second one beside it, and both then fire. Use *Overwrite* only when everything it would
replace came from this file. The moment the container holds anything else, go back to
*Rename*.

What it contains:

- **`GA4 — Google tag`** on *Initialization — All Pages*. Opens the session and reads
  the campaign off the URL.
- **`Eventos do objeto`**, one custom-event trigger matching all twelve names by regex.
  Its own `{{_event}}` is internal to a custom-event trigger and needs nothing enabled.
- **`GA4 — evento do objeto`**, one tag using `{{dl.event}}` as the event name. Twelve tags
  collapse into one, and adding a thirteenth event later means editing the regex rather
  than building a tag. That is not hypothetical, twice over: `image_step` and `image_open`
  went in that way, and so did the three `contact_*` events when the form landed (T-28) —
  one line of regex and, for `status`, one Data Layer variable.
- **`dl.*`**, a Data Layer variable per parameter.
- **`dl.event`**, a Data Layer variable reading `event` — the event tag's name comes from
  this, **not** from the `{{Event}}` built-in.

  That was learned the hard way. The export used to reference the built-in and declare it
  in a `builtInVariable` block, and the import still failed to validate with *"A variável
  desconhecida `Event` foi encontrada em uma tag"*. **The importer does not enable built-ins
  on a Merge** — a built-in is a workspace setting, not container content, so the block was
  ignored and the tag arrived pointing at a variable that was not switched on.

  Enabling *Event* by hand under *Variables → Configure* fixes it in a workspace and fixes
  it nowhere else: the next import into a fresh workspace fails the same way. A Data Layer
  variable is container content, travels with the export, and resolves to the same value —
  `dataLayer.push({ event: 'work_open' })` is where the built-in reads from anyway.
  **The rule: an export must not depend on a built-in being enabled at the other end.**

**Custom parameters need registering in GA4 to appear in reports.** *Admin → Custom
definitions → Create custom dimension*, one per parameter you want to slice by —
`module`, `item`, `work`, `image`, `route`, `face` are the useful ones. Until then the events
arrive and the parameters are invisible in the UI, which looks like data loss and is not.

Expect `eclipse_found` to be rare — it is the hardest thing on the object to reach.
Read it as a ratio against `boot_complete`, never as an absolute count.

## Consent

**There is none, and that is a decision waiting rather than an oversight.** While the
container is empty nothing is set and there is nothing to consent to. The moment a GA4
tag is published it writes a cookie, and LGPD makes consent the honest next step. Three
routes: a banner, GTM's own Consent Mode, or a cookieless analytics tag. Fernando has
not ruled.
