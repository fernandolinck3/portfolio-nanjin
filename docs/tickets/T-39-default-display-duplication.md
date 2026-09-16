# T-39 — Duplicate display on the default mobile instrument

Status: in-progress
Blocked by: none
Execution: [TASK-008](../../TASKS.md)

The user reports a duplicate display over the CDJ. A real built-browser check at390×844 reproduced auxiliary visor visibility on `/` and `/en/`. The existing policy depended only on projected Screen width, so it applied outside room mode.

Gate the auxiliary display on existing `ROOM_K > 0`. Preserve all room code and the current visibility exceptions/projection threshold within room mode. Do not redesign the camera, remove the instrument or treat this as proof that phone lag/shader failures are fixed.

Verify default PT/EN hidden, experimental room visible, and ordinary instrument project controls after removing the duplicate. Preserve red/green browser evidence and reviewed diff.
