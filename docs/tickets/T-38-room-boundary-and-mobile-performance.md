# T-38 — Default-room boundary and reported mobile lag

Status: in-progress
Blocked by: physical-device performance reproduction (TASK-007 only)
Execution: [TASK-006 and TASK-007](../../TASKS.md)

The user reported mobile lag and unexpected extended-room behavior during local preview. Provenance inspection found unfinished room work was already present before Contact/mobile fixes. Default room meshes/lights are disabled, but the normal Work opener unconditionally resolved a hidden wall sleeve. The secondary visor also intentionally remains globally eligible by projected Screen width; its desired default-mobile role is not settled by this report.

A deterministic browser check drove the actual project-open control. Before the fix, the instrument target was `[0,1.98,-0.5]` while the visitor path targeted `[-9.61,0.37,-2.66]` (delta9.98). Gate sleeve targeting on existing `ROOM_K > 0`; preserve room implementation and camera target when enabled. Do not roll back scene.js wholesale: HEAD already contains room experiments and would restore unrelated removed behavior.

Phone lag remains unconfirmed locally. Host Chrome uses the Mac M1 Pro GPU even with mobile emulation; measured median16.7ms/p95 16.8ms cannot establish phone performance. No imported furniture assets were requested on the default-route probe. Need affected device/browser, route and measured behavior before optimizing. The temporary ignored `dist-site/mobile-check.html` compares the existing current/quality0 settings only within its iframe and restores by reload. Keep the phone page foreground during measurement; no real form submissions or remote logging.

Local evidence is preserved under `.impeccable/runtime-diagnosis/`. The temporary phone page is not source or a public/deployed feature and is removed by the next production build.

## TASK-006 handoff

TASK: TASK-006; minimal scene.js change against the reviewed TASK-005 working tree. Previous source retained in ignored `runtime-diagnosis/scene-before.js`; no commit/deployment.

STATUS: DONE locally. Independent `runtime_boundary_review`: PASS.

FILES CHANGED: Product: `prototype/scene.js` (room target guard only). Root task/architecture/ticket records updated. Temporary diagnostic exists only in ignored build output and evidence.

WHAT CHANGED: Normal project-open control clears hidden wall target; active room mode retains wall target.

WHY: Preserved unfinished room work crossed the default/experimental boundary.

VERIFICATION PERFORMED: Original browser reproduction failed with delta9.98; corrected default path passed with delta0, reader open. EN `?trilho` retained wall pose `[-9.61,0.37,-2.66]`, reader opened and Back clicked. All five commands passed (170 tests across9 files). Browser diagnostic current/light/reload behavior checked, zero runtime errors. Other TASK-005 product files match their reviewed hashes.

KNOWN RISKS: Reported phone lag remains unresolved; root cause not identified on affected hardware. The existing visor policy has not changed.

MANUAL VERIFICATION NEEDED: Refresh on phone; identify any remaining unexpected room elements; run temporary phone measurement and report device/browser/results while page remains visible.

FOLLOW-UP WORK: TASK-007 remains IN PROGRESS awaiting reproduction; do not claim phone lag fixed or apply speculative quality defaults.
