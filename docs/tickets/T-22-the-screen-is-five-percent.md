# T-22 — The content region is five percent of the screen

**Track B · `prototype/scene.js` (the resting framing) · no dependency**

## Goal

The Screen reads at roughly twice its buffer scale at rest, so the only informative surface on the
Unit is also a legible one.

## The measurement

At the resting framing (dist 6.04, tilt 12.6) in a 1680×952 window, the Screen opening draws
**~405 CSS px wide**. The buffer is 320×180 (`prototype/screen/render.js:6`), so content renders at
**1.27×**, non-integer, angled and colour-graded. The 8px Silkscreen labels land at about 10 CSS px.

Meanwhile the two Decks are ~300px each and carry **no information at all**.

Measured alternative: **tilt ~4 / dist ~4.6 gives a 676px Screen** — a little over 2× buffer scale,
where the phosphor grid lands on whole pixels.

The narrow layout already solves this and is more legible than the desktop one. This ticket brings
the desktop composition toward what the phone composition already proves.

## Build

Move the `REST` framing in and **let the Decks crop**. The Unit does not need to be whole in frame to
be believed — the reference photographs that started this project are all crops.

## Done when

- The Screen measures ≥ 640px wide at rest at 1680×952.
- The Silkscreen labels land on whole pixels.
- The Decks may leave the frame; the Plate's engraved edge must still read somewhere.

## Traps

- **`REST` is shared with the opening.** `intro.js` lands on it. Changing it changes where the
  opening ends — check both, and check T-21 has not moved the same numbers.
- **Arithmetic is verification.** The opening tilt was originally found by projecting the
  candlestick's top into NDC, not by looking at it. Do the same here rather than eyeballing.
- **The clipped back candlestick** (Open item 14) gets worse at a tighter framing. Three options were
  offered and none chosen — this ticket will force that decision. Surface it, do not silently pick.
- Do not scale the Screen texture up to compensate. The buffer is 320×180 on purpose (ADR-0022).

---

## Fechado em 2026-09-02, e não pelo número que este ticket pediu

`REST` foi de `dist 5.6` para `4.6`. A Screen sai de **401px para 494px**, de 1.25x do buffer para
1.54x, medido a 1280x800 — o viewport em que a crítica mediu os ~405px que abriram este ticket.

**A receita deste ticket estava errada.** Ele prescreve `tilt 4 / dist 4.6` afirmando que isso mede
676px. Refazendo a projeção com a geometria real — `PerspectiveCamera(38)`, a abertura de
1.84 × 1.035 em (0, .272, -.50) — e calibrando contra a única medição que existia, `dist 4.6` dá
494px no mesmo viewport. Chegar a 676 custa `dist 3.4`.

**E o `tilt` quase não entra na conta.** A Screen é um plano deitado e o tilt gira a câmera na
vertical: ele muda a altura projetada, não a largura. Quem manda é a distância.

Três coisas ficaram sabidas e não resolvidas, e valem um ticket novo se alguém quiser os 2.11x:

- **O que corta primeiro é o crossfader, não a roda.** Ele está em z 1.16 e o cap tem .26 de
  profundidade, então a borda do objeto está em z 1.29 — a peça mais à frente da Plate inteira. A
  `dist 4.2` sobram 2px entre o cap e a borda de baixo do quadro. Foi tentado e ele viu na tela.
- **Sobra uma faixa vazia embaixo da Screen** conforme a câmera chega, porque o `lookAt` é
  (0, .35, 0) e a Screen está no fundo da Plate. Isso pede um `pan.y`.
- **O número certo depende da altura da janela, não da largura**, porque o FOV do three.js é
  vertical. `4.6` dá 1.54x numa janela de 800px de altura e 2.03x numa de 1050. Uma distância fixa
  não acerta as duas; a resposta honesta é `dist` em função da altura do viewport.
