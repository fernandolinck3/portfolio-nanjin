# The Unit is generated in code, not modelled in Blender

The chassis, plate, engraving, jog pattern and controls are built procedurally in three.js.
Fernando already has a Blender and Draco pipeline on disk (`~/Documents/folio-2019-master`), so the
modelled route was available and was rejected.

Procedural geometry keeps the whole object editable by parameter, lets the ornament be generated
rather than drawn, ships no binary assets, and means the source of the object is the source of the
repo — which is itself the craft proof the portfolio needs.

**Consequences**: the object is tuned part by part against references rather than sculpted. Detail
that would be trivial to model by hand is expensive, which is one reason the composition stays
top-down (ADR-0007).
