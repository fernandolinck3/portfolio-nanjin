# The Vigil chooses the Face, and Instrument is gone

Two Faces remain, and the visitor no longer picks between them. **Grimoire is the day face** and holds
while any Candle is still alight. **Cracktro is the night face** and takes over once the last Candle
dies and the Screen's phosphor is the only source left in the room. **Instrument is deleted.**

This reverses ADR-0012 on both of its claims.

## What ADR-0012 said, and why it is being undone

It said the visitor switches Faces with a control on the Unit — quoting Fernando at the time,
*"it can be a switch on the cdj and the user can change the design"* — and that Instrument
*"exists and is kept."*

The case for automatic switching is that it gives the Vigil a second job. The Vigil was already the
only state no single Part owns; now it decides not just how much light there is but what the Screen
*is*. Turning the Moon until the room goes dark and finding that the Screen has become a different
object is a stronger moment than clicking a switch labelled "design".

It also removes a control that was competing with the Pads. ADR-0009 killed browsing so that the Pads
would be the only navigation; a Face switch is not navigation, but it is another thing on the Plate
asking to be pressed, and the Unit has been getting quieter on purpose.

## What is lost, and it is not nothing

ADR-0012's argument was that a visitor who changes the entire visual language and finds all six
Modules still working has been *shown* that content and presentation are separable — which is exactly
what ADR-0002 claims and cannot otherwise demonstrate. An automatic switch does not demonstrate that,
because the visitor did not do it. They see two Faces; they do not learn that they are interchangeable.

The reply is that the demonstration survives in weaker form — the same six Modules do still render in
both Faces, and a visitor who runs the Vigil up and down sees it happen — but it is no longer a claim
the object makes on purpose. This is a real cost and it was accepted knowingly.

## Consequences

- **The threshold is 0.94, and it is derived, not chosen.** That is where `RAMPS[2] = [.56, .94]` in
  `scene.js` takes the third candle's ramp to zero. `LAST_CANDLE_OUT` in `screen.js` exists to be the
  one place it is written down. If the ramp moves, the Face moves with it.
- **Cracktro occupies the top 6% of the Vigil.** "The last candle dies" is genuinely near the end of
  the rite, so the night face is rare by construction. If it turns out to be too rare to be worth
  drawing, the fix is to move the ramp in `scene.js` — not to pick a prettier number here and let the
  two drift apart.
- **The Direction control is gone from the workbench**, replaced by a read-only indicator of the Face
  the Vigil has chosen. There is no manual override; the Vigil slider reaches both.
- **Instrument's ~69 lines are deleted**, including its VFD palette. It is recoverable from git if the
  decision reverses again. Its tab strip and spectrum analyser were the only place the Screen had
  chrome that was not content, and nothing else depended on them.
- ADR-0012 is not deleted. It stands as the record of why the switch existed, which is what makes this
  reversal legible rather than looking like the feature was never wanted.
