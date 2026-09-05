# Occlusion, bloom, grade and grain — and what they did not fix

The scene renders through an `EffectComposer` now: **GTAO** for contact occlusion, **UnrealBloom** for
the practicals, **OutputPass** for tone mapping, and a custom **grade** pass for split-tone, vignette
and film grain. It costs **7.6ms** at a 2041x1156 buffer — about 9.5ms at the buffer Fernando's
browser actually uses, so roughly 105fps.

`three/examples/jsm` ships inside the `three` package, so nothing here is a new dependency under
ADR-0004.

## Why

Fernando: *"the 3d result isnt satisfying yet, why isnt it just like the given image, is it a
limitation in your 3d production skills"*

Partly yes. The answer given, and worth keeping:

- **Genuinely a limitation.** The furniture is `BoxGeometry` with cylinders for legs, not modelled
  cabinets with bevels and drawer reveals. Every material value is a guess. The textures are random
  rectangles rather than weave and grain. And working from one screenshot every few minutes is not
  how anyone art-directs.
- **Genuinely the medium.** The reference is a path-traced still. No bounce light, no area lights, no
  occlusion and no grade exist in a raw rasterised frame, and four of those are most of what the eye
  reads as "real".

Post is the cheap perceptual half of the second list. It was the right thing to try first because it
is a day's work rather than a month's, and because it tells us how far this approach can go.

## What the numbers said

Two measurements changed the design:

**Bloom threshold must be 2.6, not 0.85.** `UnrealBloomPass` works on **linear HDR before tone
mapping**, and this scene runs an exposure well above 1 — so nearly every lit surface already sits
above 1.0, and any threshold under one blooms the whole room. The first build hazed over completely:
fog, not light.

**Bloom was a third of the image.** Switching it off took the frame from mean 74 / p90 172 to mean 53
/ p90 144. It had stopped being an effect and become a light source. Strength is 0.30 now.

Along the way, three things that looked like the cause of a washed-out centre and were not: the
Altar's colour (already `#554438`, and its map averages 37,24,17 — it renders nearly black), the
cloth, and `scene.environmentIntensity` (2.3 down to 0.8 moved p90 by nine). Isolating by toggling
one thing at a time found it in four minutes; guessing had not found it in forty.

## The honest result

It is **more photographic and it is not the reference.** Contact shadows sit objects on the floor,
the flames read as light rather than as bright shapes, and the grain removes the last clean-gradient
tell. The gap that remains is the gap that was named up front: **modelling and global illumination**,
neither of which a post chain provides.

So this ADR is also the evidence for a decision that is still Fernando's:

- **Keep going toward photoreal** — bake lighting into the textures, and author real meshes in
  Blender instead of primitives. That is a different kind of project.
- **Or turn toward the Unit's own language.** The Unit reads well precisely because it is graphic and
  ornamental, which is what procedural canvas work is good at. The room reads worst where it imitates
  a render. A room drawn in the Plate's hand might beat a middling copy of Cycles, and would be his.

## Consequences

- `__unit.setPost({ ... })` tunes every value live; `setQuality(0)` drops the whole chain first,
  because the scene still reads without it and does not read without a frame rate.
- `post.setSize()` must be called on resize — the composer owns render targets that do not learn
  about a resized canvas otherwise.
- **`CONTEXT.md` conflict, unresolved and flagged rather than overridden:** the glossary defines the
  Altar as "a slab of black veined marble, an embroidered linen cloth, and the Candles". The mensa has
  been wood for some time, and the reference room — a studio since the furnishing pass, not a chapel —
  puts the instrument straight onto the timber. The cloth may be a survival of the chapel this room
  stopped being. Darkened for now; removing it is Fernando's call.

## Amendment: occlusion and bloom are out of the chain

Fernando: *"i dont know how, but it should be 60fps"*.

It is, and this is most of what it cost. **GTAO and UnrealBloom were removed from the composer**,
leaving `RenderPass → OutputPass → grade`.

Two findings behind that:

- **A pass costs what it costs whether or not its output is used.** Bloom was left at strength 0 when
  the haze was removed, so every downsample and upsample still ran each frame to produce nothing.
  That was pure waste and nobody would have found it by looking at the screen.
- **`GTAOPass` re-renders the whole scene twice** — once for depth, once for normals — which is why a
  scene of ~150 objects was submitting **321 draw calls**. Removing it took that to **153**.

Together with switching off the four lights that were illuminating an already-hidden room (12 active
→ 8), the frame settled at **90fps / 11.1ms**, measured by the live counter in the render loop.

**A measurement lesson worth more than the fix.** Every synchronous benchmark in this project forced
a GPU sync with a one-pixel `readPixels` so the timing would include GPU work. That stalls the
pipeline, which is not how the app runs — and it is why identical configurations benchmarked between
26ms and 110ms, a four-fold spread, and why an earlier "the room costs only 4%" conclusion was drawn
from draw calls, the one metric large flat surfaces barely touch. The number that turned out to be
true came from a counter averaging the actual `requestAnimationFrame` loop over half-second windows,
displayed in the workbench where Fernando could read it. **Measure the loop that ships, not a loop
built to be measurable.**

What was lost: contact shadows, and the glow on the flames. Both are one line from returning if the
budget ever allows — the tuned parameters are above and in the git history.

## Segunda emenda: o bloom volta como opção, escrito à mão

**O que muda:** existe um `BloomPass` em `post.js`, e um botão BLOOM na bancada que
cicla `off · 0,18 · 0,30 · 0,45`. Ele **começa desligado**, e a decisão de ligá-lo por
padrão não é tomada aqui.

**Por que não é o `UnrealBloomPass` de volta.** Ele faz cinco níveis de *Gauss
separável* — duas passagens por nível, treze amostras cada — mais uma composição com
curva. É o que custava o terço do quadro medido acima. O que entrou é o outro filtro
conhecido pelo mesmo resultado: **dual filtering**, de Marius Bjørge. A cadeia desce
por mips com cinco amostras bilineares por pixel e sobe com oito, e quem faz o borrão
é a interpolação bilinear da GPU, não um kernel. Cada nível tem um quarto da área do
anterior e o primeiro já é a metade da tela.

O que ele acrescenta ao quadro, exatamente: **dez quadriláteros de tela cheia** — cinco
descidas, quatro subidas e uma composição — a 1/4, 1/16, 1/64, 1/256 e 1/1024 da área,
mais a composição em resolução plena. Nenhuma geometria da cena é redesenhada, que é a
diferença dele para o `GTAOPass` e a razão de ele não tocar nas 153 chamadas de desenho.

**Nenhuma dependência nova.** `Pass` e `FullScreenQuad` vêm de `three/examples/jsm`,
que já está dentro do pacote `three` — ADR-0003. Um `mipmapBlur` de biblioteca exigiria
o pacote `postprocessing`, que é dependência de runtime e seria uma decisão à parte.

**Ligar é `insertPass`, desligar é `removePass`.** A primeira lição desta ADR é que um
passe custa o que custa use-se ou não o resultado, e foi deixar o bloom montado com
força 0 que produziu o desperdício que ninguém acharia olhando para a tela. Desligado,
este não existe no laço.

**Por que ele começa desligado, e quem decide.** A outra lição desta ADR é *medir o
laço que roda, e não um laço construído para ser medido*: os benchmarks síncronos
mediram a mesma configuração entre 26 e 110ms, e o número que valeu saiu do contador que
faz a média do `requestAnimationFrame` real. **`rAF` não dispara em aba automatizada** —
está no `CLAUDE.md` como armadilha — então esta é uma medição que um agente não pode
fazer. Ligar por padrão seria decidir por um número que não foi lido. O botão fica ao
lado do contador de FPS pela mesma razão pela qual o contador foi posto na bancada.

O limiar continua 2.6 e não 0.85, com o joelho suave que a primeira montagem não tinha:
sem ele, uma chama cintilando em volta do limiar liga e desliga o halo dela entre
quadros. O alvo continua sendo 90fps / 11,1ms.

