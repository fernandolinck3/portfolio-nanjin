# Context — Fernando Linck Portfolio ("Tenebrae")

The portfolio is a single physical instrument rendered in real-time WebGL, viewed top-down, on one
screen with no page scroll. It is Fernando's first public project and its own Project 001. This file
is the glossary for that object and its content — no implementation details.

## The object

**Unit**:
The instrument as a whole — the single artifact the visitor sees and operates. Model name *Tenebrae*.
The portfolio is not a page containing a unit; the Unit is the portfolio.
_Avoid_: device, machine, panel, widget, deck

**Part**:
A physical sub-assembly of the Unit — Chassis, Plate, Screen, Pad, Deck, Crossfader. Parts are
the axis the build is organised along: each is designed and polished against its own references.
_Avoid_: component, element, module (Module means content)

**Chassis**:
The Unit's body — the solid slab the Parts are mounted in. Carries proportion, bevel and material.

**Plate**:
The Unit's top face as a designed surface: the grid, labels, hierarchy and ornament that a visitor
reads before touching anything. The faceplate of a eurorack module or boutique pedal.
_Avoid_: faceplate, panel, surface, skin

**Print**:
The silkscreened graphic layer on the Plate — colour only, no relief. Distinct from the engraving,
which is cut into the Plate and catches light.
_Avoid_: decal, texture, albedo, silkscreen

**Tilt**:
The few degrees of damped rotation the Unit follows the pointer with. Bounded so the Unit's sides
and back are never exposed. There is no orbit and no inspect mode.
_Avoid_: orbit, inspect, rotation

**Os seis Módulos**:
QUEM · PROJETOS · TRAJETO · CRITÉRIOS · HABILIDADES · CONTATO — nesta ordem, e são exatamente
seis (ADR-0001). Os nomes vivem em `src/content/modules.ts`; se divergirem daqui, o código está
certo e este arquivo está velho. O ECLIPSE não é um sétimo.

**Screen**:
The display set into the Plate. The only place Module content appears. It is a Part of the Unit, not
a browser viewport — "the screen" never means the visitor's monitor.

## The setting

**Altar**:
What the Unit rests on and everything around it: a slab of black veined marble, an embroidered
linen cloth, and the Candles. Baroque and liturgical rather than occult-satanic — the register is
a side chapel, not a ritual site.
_Avoid_: table, desk, plinth, scene

**Candle**:
One of three gilt candlesticks standing on the Altar. They are the Vigil's visible body: each holds
a live flame and its own light, and they go out one at a time as the Vigil rises, until only the
Screen and the moon are left. Ordered — there is a first to die and a last. They **light the Altar**
— since ADR-0018 they carry a little over half of it, where before they carried 2% and a rig of
directional lights did the work. When a Candle dies the room actually loses that light.
_Avoid_: light, lamp, torch

**Pool**:
What one source lights and no more. The room is lit in pools — the Candles on the Altar, a globe
lamp at each end, Lyra's picture light on the far wall, the moon through the window — with darkness
between them, not a floor of ambient light everywhere (ADR-0018). Anything added to the room has to
bring its own light or stand near something that has one.
_Avoid_: ambient, fill, global illumination

## Content

**Module**:
One of the six content views — Ident, Now/Next, Project 001, Rack, Method, Out. What a Pad selects
and the Screen renders. The Unit has exactly six; there is no seventh and no sub-navigation.
_Avoid_: page, section, tab, slide, view

**Rack** — *o nome, não o Módulo. Ver HABILIDADES.*
The Module holding the tools and technologies Fernando actually works with — the eurorack sense of
a rack: the set of modules you own and patch together. Every entry must be verifiable, ideally
against this Unit itself.
_Avoid_: crate, stack, skills, tech list

> **Não existe um Módulo chamado Rack no objeto** (constatado 2026-09-01, T-25). O slot 5 é
> **HABILIDADES**, e hoje ele lista influências em vez de ferramentas — que é precisamente o que
> T-13 existe para corrigir, e está bloqueado nele. O termo fica aqui porque é o conteúdo que se
> pretende; o nome do Módulo na tela é HABILIDADES.

Because the Pads are the only navigation, every Module must fit the Screen exactly. Nothing scrolls.
The one exception is Project 001, where the rows of the series are clickable — selection *within* a
Module, never selection *of* one (ADR-0017).

**Work**:
One of the numbered things Fernando has made, counting from this Unit as 001. A Work is an image —
a site, a poster — which is why it cannot live on the Screen and is summoned to the Plinth instead.
_Avoid_: piece, case study, portfolio item, project (Project 001 means the Unit)

**Plinth**:
The stone pedestal standing off the Altar's right shoulder. It is empty until a Work is called to
it, which is what makes calling one an event. The Work stands on it lit from below, and the Screen
becomes its plaque — the image where there is room for it, the words where words are legible.
_Avoid_: pedestal, stand, podium, display

**Summoning**:
The rite that brings a Work to the Plinth. The visitor clicks a Work on the Screen and the room puts
itself out — the Candles gutter, the Plinth takes light, the Work assembles out of motes. Turning
the Sun, or clicking the Screen again, sends it back and hands the Vigil to the visitor. The Vigil is
borrowed for the duration, never kept.
_Avoid_: modal, lightbox, detail view, popup

**Portrait**:
Lyra on the chapel wall, gilt-framed, with her name engraved on a plaque beneath her. A fixture, not
a display: it is hanging there before the visitor touches anything, and a trace of self-illumination
keeps her legible at full Vigil when every Candle is dead. Distinct from the Plinth in kind — a Work
is called and dismissed; she is simply there.
_Avoid_: painting, picture, artwork, portrait of the character

**Flat Plate**:
The Unit rendered as a printed silkscreen in CSS from the DOM truth layer, served where the 3D
cannot be carried — no WebGL, low power, reduced motion. A designed deliverable, not a fallback
screenshot.
_Avoid_: fallback, degraded mode, mobile version

## Controls

**Pad**:
One of the six hot-cue pads. Each selects a Module and lamps to show which is live. The Pads carry
navigation alone — there is no other way to change Module.

**Deck**:
One of the two wheels flanking the Screen. There are exactly two, **Sun** on the right and **Moon**
on the left, and together they are the Vigil: turning the Sun brings the light up, turning the Moon
puts it out. The rite performed with two hands.
_Avoid_: jog, wheel, platter, turntable

**Vigil**:
The 0–1 state of the light, held between the two Decks. At 0 the Unit is fully lit; at 1 every lamp
is out and the Screen's phosphor is the only source in the room. Named for the night watch — the
rite the model name comes from. It is a state, not a control: no single Part owns it.
_Avoid_: bend, dim, brightness, corruption, knob

**Face**:
One of the Screen's complete visual treatments — the same six Modules, a different visual language
throughout. Grimoire is the day Face and Cracktro the night one; Instrument was deleted (ADR-0015).
A Face is authored per Module, not applied as a palette — which is why the Vigil moves the Screen's
colour continuously but swaps its *layout* only at the threshold (ADR-0016). The Vigil chooses the
Face; it never changes which Module is live.
_Avoid_: theme, skin, mode, style

**Lyra**:
The Wizard's name. A constellation and an instrument at once — the Plate carries a celestial
chart and the Unit is a thing you play, so she is named for the one object that is both. Use her name
when she is doing something; use **Wizard** for the role and the sprite.
_Avoid_: the witch, the girl, the character

**Wizard**:
The character who inhabits the Screen. Not chibi — the register is *Symphony of the Night* by way of
the 1-bit portraits on the `character` board: a long face with a pointed chin, tall lashed eyes with
a glint in each, hair falling well past the jaw in continuous locks, a high collar, and hard shadow
down one side of her face. That shadow is the same tenebrism the room is lit by, on a face.

Her **bust** — hat, hair, face, jaw, collar — is drawn by hand. Everything below the shoulders is
generated (ADR-0013). She is in every Module and doing something different in each: presenting,
weighing the two ends of the Crossfader, holding the Unit she made, showing the Rack, reading the
Method, sending the Raven out. The Module is composed around what she is doing; she is never laid
over a layout designed without her.
_Avoid_: witch, chibi, character, avatar, mascot, figure

**Raven**:
The Wizard's familiar, perched on the brim of her hat. It is the only thing allowed to move across
the content — when the Module changes it takes off, crosses the Screen to look at what arrived, and
comes back. It has moods, not needs: nothing it does can be neglected and nothing it does asks the
visitor for anything, because a creature that needed feeding would compete with the Module for
attention.
_Avoid_: pet, tamagotchi, companion, bird

**Cast**:
The transition between Modules. The Wizard raises her hand and throws a spell: a dithered front
sweeps out from her palm across the Screen with sparks running ahead of it, and the new Module types
itself on behind it. Modules do not cut or fade — she changes them.
_Avoid_: transition, wipe, animation

**Gauge**:
The small sky in the corner of the Screen: one body crossing a short track, a rayed sun at first
light and a crescent moon by the time the last Candle dies. It is the Screen reading the Vigil out
loud, so the night is visible coming rather than arriving in one frame.
_Avoid_: clock, meter, indicator, sun/moon icon

**Niche**:
The shallow lancet recess the Wizard stands in — lit back wall, jambs, a floor she has weight on and
a shadow at her feet. It is how the Module accounts for her: without it she is composited over
whatever space the copy left, which is the difference between a figure in a composition and a sprite
on a page.
_Avoid_: alcove, frame, box, container

**Nightwork**:
The engraving cut into the Plate that is invisible under full light and only becomes legible as the
Vigil rises and the light rakes across it. Ornament that has to be earned by darkness.
_Avoid_: hidden layer, easter egg, second plate

**Relief**:
The Plate's ornament as cut metal rather than printed line: a coverage mask, blurred into a height
field so each mark ramps from surface to floor, then differentiated into a normal map. What makes
the engraving catch light on its bevel walls.
_Avoid_: bump map, texture, embossing

**Crossfader**:
The horizontal fader carrying the Now↔Next thesis. It moves freely and re-weights what the Screen
shows, but the honest position is engraved on the Plate as an index mark that never moves.
_Avoid_: slider, fader (bare)

## Content truth

**Project 001**:
The Unit itself, treated as Fernando's first public project. Work is numbered from here; 002 and
onward join the same series.

**Now / Next** — *a regra, não mais um Módulo nem o Crossfader.*
*Now* is what is demonstrable today — frontend, marketing. *Next* is the stated direction — AI,
automation, analytics — always future-tense, never claimed as experience. See ADR-0005 and
`PRODUCT.md`.

> **O Crossfader não carrega mais esta tese** (2026-08-28): ele virou a luz, de noite a dia
> (`scene.js`, `wantVigil = 1 - xfVal`). E **não existe mais um Módulo Now/Next** — ele não
> sobreviveu à reescrita da navegação. O que sobrevive é a regra de tempo verbal acima, que é de
> conteúdo e vale em qualquer Módulo que fale de direção.

**Mirror** (o espelho):
The Screen's content as semantic HTML, in the document, in step with the canvas. Not a fallback and
not a second design — the *same state expressed twice*: once as pixels for the eye, once as markup
for a screen reader, for find-in-page and for a crawler. All six Modules are in it at all times,
not only the live one, because a search does not fire your events. It lives in `src/content/mirror.ts`
(the markup) and `prototype/mirror.js` (the node, the state and the announcements), and it renders
from `modules.ts` — the same file the Screen reads. The canvas stays visually sovereign.
_Avoid_: fallback, a11y layer, alt text, text version, no-JS version

**The mirror rule**:
Anything that changes what the Screen displays changes the mirror in the same commit — and the way
to obey that is to put the content in `modules.ts`, so that both read it and neither has to be
remembered. **If the mirror and the Screen can disagree, the work is not done.** Silent drift is the
failure mode of the whole idea: the person who would notice that the mirror lost a section is the
one person who cannot see the Screen. See T-18, and the drift test in `src/content/modules.test.ts`.
