# O laboratório do basement, lido inteiro

Pesquisa. Nada foi construído; nenhum arquivo de código foi tocado.

Fonte: **`github.com/basementstudio/basement-laboratory`**, `src/experiments/` —
**77 experimentos**, não os 17 que o `lab.md` deles destaca. O site publica um link `SOURCE`
por linha e o repositório é aberto. Lidos em 2026-09-03.

> Também é aberto o **site inteiro**: `github.com/basementstudio/website-2k25`. Não foi lido
> nesta rodada. É a referência mais próxima do que queremos e fica como próxima leitura.

## A conclusão, e ela muda o orçamento do quarto

**Os quartos deles rodam com duas ou três luzes.** Não é exagero de leitura, é o que está no
código:

| cena | luzes de verdade | o que faz o resto |
|---|---|---|
| `13.sculpture-gallery` — galeria inteira | **2** (uma hemisférica, uma direcional, `castShadow = false`) | `THREE.Fog` |
| `32.bunker-scene` — bunker subterrâneo | **0 pontuais** | malhas com material chamado `LIGHT` (emissivo) + `GodRays` + `Noise` |
| `40.carpenter` — ambiente urbano | 1 `SpotLight` | GLTF único com material por prédio, névoa, bloom |

O `docs/realism-budget.md` mediu aqui que **quinze luzes são 87% do frame** e que geometria é
~grátis. A conclusão que estava faltando é a outra metade disso: **o quarto não é caro — o
modelo de iluminação é.** Doze luzes acesas com o quarto desligado é o pior dos dois mundos.

Nenhuma das técnicas abaixo acrescenta uma luz.

## As oito coisas que transferem

### 1. Poça de luz sem luz — `29.circular-fog.js`

Névoa **radial centrada num ponto do mundo**, não na câmera. Injetada por `onBeforeCompile`:

```glsl
vec2 centerPos = vec2(uFogCenterX, uFogCenterZ);
float vFogDepth = distance(toCenter, vPosition.xz);
float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(uFogNearColor, fogColor, fogFactor), fogFactor);
```

Escuridão que cresce conforme se afasta do Altar, com cor perto e cor longe separadas. É
exatamente o **Pool** do `CONTEXT.md`, e **não é luz** — não entra nos 87%. É a técnica mais
valiosa da leitura para este projeto.

Cuidado do `32.bunker-scene`: `materials.Mat_in.fog = false` — dá para **isentar** um material
da névoa. É como a Screen não recebe a escuridão do quarto.

### 2. Feixe de luz como malha — `62.sun-ray-cone.js`

Raios volumétricos são um **cone** com textura de ruído fbm rolando, alfa de base e alfa de
brilho separados, e um fade no topo. Uma malha, zero luzes. As Velas ganham feixe visível e a
janela ganha luar por um cone cada.

### 3. Janela com mundo atrás — `45.fake-window.js`

**Parallax interior mapping**: um plano chapado que parece ter um quarto atrás, com cubemap e
deslocamento em espaço tangente. Você pediu "um quarto fechado com uma janela" — esta é a
janela que custa **uma geometria e nenhuma luz**, e o lado de fora pode ser qualquer coisa.

### 4. Duas cenas, um composer — `65.multi-scene-composer-pipeline.tsx`

**É a resposta para a Screen legível sobre cena em baixa resolução**, que ficou aberta ontem:

```js
const composer = new EffectComposer(gl, rt1)
composer.addPass(new RenderPass(firstScene, camera))   // o objeto e o quarto
const fx = new ShaderPass(Shader)
fx.clear = false
fx.fsQuad.material.depthWrite = false                  // ver abaixo
fx.fsQuad.material.depthTest = false
composer.addPass(fx)
const second = new RenderPass(secondScene, camera)     // a Screen, nítida
second.clear = false                                   // não limpa o buffer de leitura
composer.addPass(second)
```

O comentário deles é o aviso que eu teria levado uma sessão para descobrir: *"Prevent the fsQuad
from modifying the depthBuffer"*. Um passe de tela cheia escreve profundidade, e a `RenderPass`
seguinte não desenha certo em cima disso.

Aplicado aqui: o registro low-fi pega a primeira cena; a Screen vive na segunda e é desenhada
depois, em resolução cheia. Aí o eixo A deixa de custar legibilidade — que é a restrição que
você fixou.

### 5. Trilho de câmera em vez de órbita — `50.camera-rail.js`

Uma curva de Bézier importada de JSON (eles mantêm `blender-bezier-exporter` como repo próprio),
mais uma função que acha **o ponto mais próximo da curva** em relação a um alvo, e a câmera
desliza pelo trilho olhando para onde interessa. O `CONTEXT.md` proíbe órbita; um trilho não é
órbita — é o mesmo movimento dos nove pontos de vista deles, parametrizado.

### 6. Luz que é geometria — `32.bunker-scene.js`

Seis malhas com o material `LIGHT` e `GodRays` no pós. Nenhuma luz pontual no bunker. É
literalmente a regra que o `realism-budget.md` já escreveu — *se algo precisa brilhar, faça
emissivo e deixe o bloom carregar* — confirmada por um estúdio que vive disso, num ambiente
inteiro.

### 7. Remendar o material de três, em vez de escrever um — `30.wireframe-reveal.js`

`onBeforeCompile` com substituição de string nos chunks do three:

```js
shader.fragmentShader = shader.fragmentShader.replace(
  '#include <dithering_fragment>', '#include <dithering_fragment>\n /* … */'
)
```

Mantém sombra, PBR e tudo mais, e acrescenta o efeito. É como o eixo C (snap de vértice, warp
afim) entraria, se entrar — e como a névoa do item 1 entra.

### 8. Pixelar em canvas 2D, sem shader — `61.image-pixelation.tsx`

`imageSmoothingEnabled = false`, desenha reduzido, redesenha ampliado a partir do próprio canvas.
Dois `drawImage`. Não serve para a Screen (mataria a legibilidade), mas serve para **qualquer
imagem que a gente queira em registro** — um Work na parede, um retrato, uma etiqueta.

## O que não transfere

- **Os ambientes deles são trabalho de Blender, não de código.** O `40.carpenter` é um GLTF
  único com material por prédio; o código só posiciona luz e pós. "Geometria simplificada" é
  decisão de arte. O custo do nosso quarto é modelagem, e a parte de código é a barata.
- **Eles usam `@react-three/drei` e `@react-three/postprocessing`.** A ADR-0004 proíbe pacote
  novo aqui, então tudo acima tem que ser reimplementado em three puro. Nenhuma dessas técnicas
  é grande — a mais longa é o parallax da janela.
- `22.linear-lantern.js` tem 37 KB e é quase todo dados de curva; a técnica é o trilho do item 5.
- Metade dos 77 é exercício de scroll, SVG, GSAP e slider — não toca neste projeto.

## O quarto simples, na ordem em que eu construiria

Você pediu: quarto fechado, uma janela, a mesa no meio. Com o que está acima:

1. **A caixa.** Quatro paredes, piso, teto. Geometria é grátis; sem luz nova.
2. **A névoa radial centrada no Altar** (item 1), com a Screen e a Plate isentas (`fog = false`).
   É o que faz a caixa ler como quarto escuro em vez de cubo cinza, e é onde a estética se decide.
3. **A janela** (item 3), com luar do lado de fora. Uma malha.
4. **Um cone de luar** entrando por ela (item 2). Uma malha.
5. **Medir.** Só aqui, e comparado com a linha de base do `perf()`. Se passar do orçamento, o
   problema está nas doze luzes que já existem, não nos quatro passos acima.
6. **Só então** decorar — prateleira, objetos com ficha, o Lab na parede.

O trilho de câmera (item 5) e as duas cenas (item 4) são trabalho de outra natureza e entram
depois de existir quarto para olhar.

## Leitura seguinte

`github.com/basementstudio/website-2k25` — o site que a gente analisou, com fonte. As nove cenas,
as `tabs` como malhas nomeadas, os inspecionáveis com ficha, o rádio do contato e o motor de
áudio com `createPlaylist`/crossfade estão todos lá dentro, e não em experimento isolado.
