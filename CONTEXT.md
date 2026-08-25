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

**Flat Plate**:
The Unit rendered as a printed silkscreen in CSS from the DOM truth layer, served where the 3D
cannot be carried — no WebGL, low power, reduced motion. A designed deliverable, not a fallback
screenshot.
_Avoid_: fallback, degraded mode, mobile version

## Controls

**Pad**:
One of the six hot-cue pads. Each selects a Module and lamps to show which is live.

**Jog**:
The large wheel. Digs through the contents of the live Module — the Screen moves, the browser page
never does. Modules may hold more than one Screen's worth; scrolling the Screen is operating the
Unit, not scrolling a webpage.
_Avoid_: scroll wheel, dial, browse

**Vigil**:
The knob, silkscreened VIGIL, and the 0–1 value it holds. It is a light control: at 0 the Unit is
fully lit, at 1 every lamp is out and the Screen's phosphor is the only source in the room. Named
for the night watch — the rite the model name comes from.
_Avoid_: bend, dim, brightness, corruption

**Nightwork**:
The engraving cut into the Plate that is invisible under full light and only becomes legible as the
Vigil rises and the light rakes across it. Ornament that has to be earned by darkness.
_Avoid_: hidden layer, easter egg, second plate

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
