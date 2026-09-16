# T-36 — Contact reliability

Status: ready-for-agent
Resolution: done — TASK-004 integrated locally after independent PASS and mocked browser verification; not published.
Blocked by: none
Execution: [TASK-004](../../TASKS.md)
Plan: [Contact reliability](../planning/contact-reliability.md)

The local built-site review confirmed that Tab leaves the Contact modal and Back/Escape cannot dismiss it during a pending request. `contact.js` has no deadline for fetch/body consumption. This compromises the existing visitor flow before room exploration expands.

Preserve the current design and external endpoint. Implement focus containment/restoration, cancellable pending requests, a bounded deadline, truthful uncertainty messages, draft preservation and protection from stale responses/timers. Test with mocks only. The work must operate identically in both locales and through the shared 3D/flat integrations.

The acceptance contract and exclusive file ownership live in TASK-004 and its plan. This issue does not authorize mobile reframing, room changes, a new form framework, real submissions or deployment.
