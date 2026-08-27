# Works are summoned to the plinth, and the Screen becomes their plaque

A Work — a poster, a site — is **selected by clicking its row on the Screen**, inside the PROJECTS
Module. The room then **performs the rite by itself**: the Candles gutter out, a plinth beside the
Altar takes light, and the Work assembles standing on it. The Screen stops being a list and becomes
that Work's plaque. Clicking the Screen again, or touching the Sun, sends it back.

Separately and permanently, **Lyra hangs on the wall** in a gilt frame with an engraved plaque.

## The constraint that forced this

The Screen is a 1024x576 texture that draws around 590px on the Plate, seen at an angle, in four
tones. Fernando: *"we need to consider that they cant be shown on a small display, there needs to be
some kinda of interaction."*

He is right, and it kills the three options that were on the table before he said it — featured work,
list of rows, Rack-absorbs-them — because all three kept the image on the Screen. Any of them shows
the visitor a thumbnail of something they cannot read, and then asks them to take the work seriously.

## The decision, and what it costs

**The Work leaves the Unit.** The image goes where there is room for it; the words stay where words
are legible. That division is the whole idea, and it turns the Screen's smallness from a problem into
an assignment — it is a caption panel, and it is very good at that.

**The Vigil acquires a job.** Until now darkness only changed how things looked, which is why
ADR-0015 and ADR-0016 both had to keep arguing about whether the top of the Vigil's travel was worth
reaching. Now you put the light out *in order to see something*, the way you kill the house lights
for a slide. Fernando's framing: *"a vibe that the user is mixing some kinda of magic on the cdj and
it appears on the wall or in some kind of pedestal."*

**The cost is that `CONTEXT.md` said there is no sub-navigation.** That is now false, and the ADR is
here rather than a quiet edit because it is a real reversal. The defence is narrow and should stay
narrow: the Pads still own Module navigation and nothing else selects a Module (ADR-0009 stands).
What is new is selection *within* one Module. If that starts spreading — a second Module growing a
clickable list — the rule has failed and this should be reconsidered rather than extended.

**The rite borrows the Vigil; it does not take it.** `restore` remembers where the visitor had it and
the banishment hands it back. The Decks own the Vigil, and a scripted moment that kept what it
borrowed would be stealing the instrument out of the visitor's hands. It also has to survive being
interrupted, which is why touching the Sun banishes rather than fighting the rite for control of the
same number.

## Why the pedestal and not the wall

Both were built and looked at. Fernando: *"I like the pedestal idea, but a painting on the wall like
beatrice from umineko would be nice."*

The wall projection worked, but it wanted the wall for two incompatible things. A Work is called and
dismissed; a portrait is a fixture. Had both lived on the wall, the summoning would have read as *the
painting changed* rather than *something arrived*, and the portrait would have had to keep getting
out of the way of the posters.

Giving each its own surface makes both stronger. The plinth is empty until you call something to it,
which is what makes calling something feel like an event. The portrait is hanging there before the
visitor touches anything.

## The portrait

Beatrice's portrait in the Ushiromiya mansion is never summoned and never dismissed — it is simply
always there, and the room is different because it is on the wall. The Wizard until now existed only
inside the Screen, which made her a graphic the Unit draws rather than someone whose room the visitor
has walked into. The portrait fixes that for the cost of one canvas and four gilt bars.

It does not go out when the room does. At full Vigil every Candle is dead and an unlit painting would
be a black rectangle, so a trace of self-illumination keeps her legible — the last thing left in the
room besides the Screen is her, which is the only reason a portrait is worth hanging.

## Consequences

- **`CONTEXT.md` needs Plinth, Summoning and Portrait**, and its no-sub-navigation sentence needs
  correcting. Same commit.
- **The art is all placeholder.** The five sheets are drawn in code and four carry a PLACEHOLDER
  stamp across the face; 001 is the only real one and the only one unstamped. The portrait is a
  tenebrist stand-in — ADR-0013 says the real character art is Fernando's. None of this may ship
  as-is (T-14).
- **Reduced motion arrives instantly rather than cancelling.** The summoning is not decoration that
  can be dropped: without it there is no way to see a Work at all. What goes is the travel.
- **The Screen is now a pick target**, but off a row it still falls through to the camera drag, so it
  does not become a dead patch in the middle of the Unit.
- **`prototype/scene.js` and the workbench have drifted further apart.** The Screen in `scene.js` now
  renders a Module the workbench does not know about, while the workbench still owns Lyra and the
  Faces. T-04 has more to reconcile than it did.
- **Undecided: what the Crossfader does inside PROJECTS.** It carries Now/Next and nothing else
  (ADR-0005), so it is idle here. Leaving it idle is fine; giving it a job is not this ADR's call.
