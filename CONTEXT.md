# Context — Fer Bittencourt Portfolio ("Tenebrae")

The portfolio is a single physical instrument rendered in real-time WebGL, viewed top-down, on one
screen with no page scroll. It is Fernando's first public project and its own Project 001. This file
is the glossary for that object and its content — no implementation details.

## The object

**Unit**:
The instrument as a whole — the single artifact the visitor sees and operates. Model name *Tenebrae*.
The portfolio is not a page containing a unit; the Unit is the portfolio.
_Avoid_: device, machine, panel, widget, deck

**Part**:
A physical sub-assembly of the Unit — Chassis, Plate, Screen, Pad, Jog, Knob, Crossfader. Parts are
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
Screen is burning. Ordered — there is a first to die and a last.
_Avoid_: light, lamp, torch

## Content

**Module**:
One of the six content views — Ident, Now/Next, Project 001, Rack, Method, Out. What a Pad selects
and the Screen renders. The Unit has exactly six; there is no seventh and no sub-navigation.
_Avoid_: page, section, tab, slide, view

**Rack**:
The Module holding the tools and technologies Fernando actually works with — the eurorack sense of
a rack: the set of modules you own and patch together. Every entry must be verifiable, ideally
against this Unit itself.
_Avoid_: crate, stack, skills, tech list

Because the Pads are the only navigation, every Module must fit the Screen exactly. Nothing scrolls.

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
throughout. Grimoire, Cracktro and Instrument are the three drawn. A Face is authored per Module,
not applied as a palette. The visitor changes it; it never changes which Module is live.
_Avoid_: theme, skin, mode, style

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

**Now / Next**:
The thesis the Crossfader carries. *Now* is what is demonstrable today — frontend, marketing.
*Next* is the stated direction — AI, automation, analytics — always future-tense, never claimed as
experience. See ADR-0005.
