# Analytics — the events, and the container that reads them

The Unit is one page that never navigates. The default pageview fires once and every
visitor looks identical whether they pressed one Pad and left or read three cases and
wrote an email. **On a single screen the events are the analytics.**

`prototype/track.js` pushes to `dataLayer` and nothing else — no tag, no vendor, no
dependency (ADR-0004). Whether anything listens is decided in the Tag Manager
container, so the code stays true with tracking switched off, and it loads only on
`nanj.in`: a day of pressing every Pad on localhost would otherwise be the dataset.

## The events

| event | fires when | parameters |
| --- | --- | --- |
| `boot_complete` | the opening finishes | `ms` |
| `module_open` | a Pad opens a Module | `module` |
| `item_select` | the cursor **settles** on an item | `module`, `item` |
| `page_turn` | a page of a case is reached | `module`, `item`, `page` |
| `work_open` | a project's case opens | `work` |
| `outbound` | a route leaves the site | `route`, `kind`, `from` |
| `eclipse_found` | the seventh state opens | `face` |

Every event also carries whichever of `utm_source`, `utm_medium`, `utm_campaign`,
`utm_content`, `utm_term` were on the URL.

Two decisions worth keeping:

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
*Existing* → **Merge**, *Rename conflicting tags*. Never *Overwrite* on a container that
already holds anything. Review the preview, then publish.

What it contains:

- **`GA4 — Google tag`** on *Initialization — All Pages*. Opens the session and reads
  the campaign off the URL.
- **`Eventos do objeto`**, one custom-event trigger matching all seven names by regex.
- **`GA4 — evento do objeto`**, one tag using `{{Event}}` as the event name. Seven tags
  collapse into one, and adding an eighth event later means editing the regex rather
  than building a tag.
- **`dl.*`**, a Data Layer variable per parameter.
- **`Event`**, the built-in, declared in `builtInVariable`. Without that declaration the
  import validates with *"A variável desconhecida `Event` foi encontrada em uma tag"* —
  a built-in that is not declared is not *enabled* in the workspace, and the event tag
  references it by name. Any future export that uses a built-in has to declare it too.

**Custom parameters need registering in GA4 to appear in reports.** *Admin → Custom
definitions → Create custom dimension*, one per parameter you want to slice by —
`module`, `item`, `work`, `route`, `face` are the useful ones. Until then the events
arrive and the parameters are invisible in the UI, which looks like data loss and is not.

Expect `eclipse_found` to be rare — it is the hardest thing on the object to reach.
Read it as a ratio against `boot_complete`, never as an absolute count.

## Consent

**There is none, and that is a decision waiting rather than an oversight.** While the
container is empty nothing is set and there is nothing to consent to. The moment a GA4
tag is published it writes a cookie, and LGPD makes consent the honest next step. Three
routes: a banner, GTM's own Consent Mode, or a cookieless analytics tag. Fernando has
not ruled.
