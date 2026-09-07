# O basement por dentro, e de onde vêm os assets — 2026-09-07

Pesquisa. Nada foi construído; nenhum arquivo de código foi tocado.

Duas perguntas, e elas se encontram no fim: **como o basement resolve peso e luz de uma
cena 3D na web**, e **de onde tirar mobília, superfície e ambiente para um quarto barroco
sem violar licença nem orçamento**. A resposta da primeira decide o que fazer com o que a
segunda entrega.

`basement-laboratory.md` deixou um fio solto explícito — o repositório `website-2k25`, "a
referência mais próxima do que queremos", não lido. Ele foi lido agora, **inteiro e no
código**, e é a fonte de toda a Parte 1.

**Notação, a mesma de `referencias-basement-leonardo.md`:**

- **[M]** — medido no código-fonte, na API ou no arquivo em disco. Reprodutível.
- **[I]** — inferido. Plausível, não verificado.

Onde não houver marca, é [M].

---

# Parte 1 — basement.studio, lido no código-fonte

Fonte: **`github.com/basementstudio/website-2k25`**, clone raso em 2026-09-07, último
commit `fd47f4a` de 2026-09-04. O repositório é público e é o site de agência que está no
ar. Todos os números abaixo saíram de `package.json`, dos scripts de build, dos `.glb` em
disco e do `src/`.

## 1.1 A stack, exata

| | versão fixada em `package.json` |
|---|---|
| `three` | `^0.180.0` |
| `@react-three/fiber` | `9.0.0-rc.6` |
| `@react-three/drei` | `^10.0.0-rc.1` |
| `@react-three/offscreen` | `1.0.0-rc.1` |
| `@react-three/rapier` (física) | `^1.5.0` |
| `@react-three/uikit` | `1.0.60` |
| `three-stdlib` | `^2.36.0` |
| `leva` (dials de debug) | `^0.9.35` |
| `r3f-perf` (medição) | `^7.2.3` |
| `maath` (easing) | `^0.10.8` |
| `next` / `react` | `16.3.0` / `19.2.7` |
| CMS · erros · analytics | Sanity 5 · Sentry 10 · Vercel Analytics + Speed Insights |

Não é three puro: é **React Three Fiber com drei**, mais um segundo canvas em worker
(`@react-three/offscreen`) e física real (`rapier`). O `AGENTS.md` deles registra que o
build roda em **Turbopack** e que os shaders entram por `raw-loader`, com uma restrição
que custou tempo a eles: *"shaders must be plain GLSL with no glslify `#pragma`"* — os
`require` do glslify foram achatados dentro dos `.glsl` para o `raw-loader` bastar.

## 1.2 O pipeline de asset é **cinco scripts de linha de comando**, e nenhum deles é runtime

Isto é o achado central da Parte 1, e é o que transfere para cá com menos atrito. O
`package.json` deles expõe:

```
"assets:hash":            "tsx scripts/3d-assets/hash.ts"
"assets:verify":          "tsx scripts/3d-assets/verify.ts"
"assets:exr-to-ktx2":     "tsx scripts/3d-assets/exr-to-ktx2.ts"
"basis:sync":             "tsx scripts/3d-assets/sync-basis-transcoder.ts"
"assets:glb-recode-webp": "tsx scripts/3d-assets/glb-recode-webp.ts"
"build":                  "pnpm assets:verify && pnpm basis:sync && next build"
```

O `build` **falha** se qualquer um dos dois primeiros reclamar. As regras que eles
escolheram fazer o build impor:

**Todo binário em `public/3d/` carrega um hash de conteúdo no nome.** `hash.ts` renomeia
`office.glb` → `office-077b4007.glb` (sha256, oito hex) e imprime a URL. O `verify.ts`
falha em qualquer arquivo sem o sufixo, e o comentário dele diz por quê: é *"the contract
that makes the year-long immutable `Cache-Control` header at `/3d/:path*` safe"*. O
`next.config.ts` serve `/3d/*` com `public, max-age=31536000, immutable`. O `README` do
`src/lib/3d-config/` fecha o raciocínio: *"A file at a stable URL with new content will be
served stale for up to a year."*

**O manifesto é fonte única e o build confere os dois lados.** `verify.ts` caminha o
`asset-manifest.ts`, checa que toda URL `/3d/...` existe em disco, **e** faz o caminho
inverso — todo arquivo em disco tem que estar referenciado, senão é órfão e é reportado.

**O transcodificador servido é sincronizado com o `three` instalado, no `postinstall`.** O
comentário do `sync-basis-transcoder.ts` é o tipo de nota que só existe depois de perder um
dia: o `KTX2Loader` busca o transcodificador por URL, então nada liga a cópia servida ao
`node_modules`; um upgrade de `three` deixa a cópia velha, e **GPU da Apple suporta o
perfil ASTC HDR e decodifica direto, sem passar pelo transcodificador** — o bug fica
invisível no Mac e aparece só no Windows como `THREE.KTX2Loader: .transcodeImage failed.`

Vale reter isso mesmo que nada de KTX2 entre aqui: **um caminho que a máquina de
desenvolvimento pula é um caminho que ninguém testa.**

## 1.3 Formatos e compressão, medidos arquivo por arquivo

`public/3d/` inteiro tem **20 MB**, assim distribuídos:

| | arquivos | soma |
|---|---|---|
| `.glb` (modelos) | 13 | **7,53 MB** |
| `.ktx2` (lightmaps) | 19 | **2,83 MB** |
| `.mp3` (áudio) | 45 | 7,14 MB |
| `.jpg` (mapas de AO, telas) | 15 | 1,10 MB |
| `.webp` (matcaps, personagem) | 20 | 0,35 MB |
| `.mp4` · `.png` | 7 · 8 | 0,95 · 0,19 MB |

Os 13 `.glb` mais os 19 `.ktx2` somam **10,36 MB** — que é, dentro do arredondamento, os
**10,35 MB** que `referencias-basement-leonardo.md` mediu sobre HTTP em 2026-09-02 sem ter
o repositório. As duas medições independentes batem, o que valida as duas.

Abrindo o `extensionsUsed` de cada `.glb`:

| arquivo | tamanho | extensões | imagens |
|---|---|---|---|
| `officeItems` | 2,54 MB | Draco · Basisu · webp · emissive_strength | 22 × `image/ktx2` |
| `office` | 2,29 MB | Draco · Basisu · texture_transform · transmission · ior · specular | 30 × ktx2/jpeg/png |
| `character-model` | 0,97 MB | **Draco só** | nenhuma (textura externa) |
| `outdoor` | 0,55 MB | Draco · Basisu · webp | 6 × ktx2 |
| `contactPhone` | 0,47 MB | Draco · Basisu | 2 × ktx2 |
| `christmas-tree` | 0,21 MB | Draco · webp · emissive_strength | 1 × `image/webp` |
| `outdoorCars` | 0,17 MB | Draco · Basisu · specular | 10 × ktx2 |
| `pet-model` · `officeWireframe` · `routingElements` | 0,14 · 0,06 · 0,02 MB | Draco só | nenhuma |
| `basketball` · `basketballNet` · `godrays` | 0,07 · 0,02 · 0,01 MB | **nenhuma** | 1 jpeg/png cada |

Ou seja, o padrão da casa é **`KHR_draco_mesh_compression` para geometria e
`KHR_texture_basisu` (KTX2) para textura**, com `EXT_texture_webp` declarado em alguns.
`EXT_meshopt_compression` **não aparece em nenhum arquivo** — eles escolheram Draco, não
meshopt. Os três arquivos minúsculos saem sem extensão nenhuma, o que confirma o óbvio e
vale dizer: **abaixo de ~80 KB não compensa pagar decodificador.**

O `exr-to-ktx2.ts` documenta a variante exata de KTX2 dos lightmaps — **UASTC HDR 4×4**,
com supercompressão zstd nível 19:

```bash
basisu -hdr_4x4 -ktx2_zstandard_level 19 -file plano.exr -output_file saida.ktx2
```

Exige `basisu` v1.60+ no PATH (`brew install basis-universal`). O cabeçalho do script
carrega um aviso ganho no sangue: *"Do not change the row reversal or add `-y_flip`; either
one alone flips the lightmaps in-scene."* — as linhas do `EXRLoader` vêm de baixo para
cima e o script reescreve o EXR invertido antes de chamar o `basisu`.

O `glb-recode-webp.ts` é a metade estranha e explica um limite real: ele **desfaz** WebP,
recodificando `image/webp` para PNG dentro do `.glb`. Ele reconstrói o chunk BIN à mão
porque *"replaced images change every later byteOffset"*, alinhando tudo em 4 bytes. [I] É
um passo intermediário para alimentar uma ferramenta que não lê WebP — provavelmente o
próprio `basisu`.

## 1.4 A cena: **zero luzes de verdade em todo o site**

`basement-laboratory.md` mediu duas ou três luzes nos experimentos e chamou isso de
conclusão que muda o orçamento. O site de produção vai além:

Quatro buscas sobre todo o `src/`, e as quatro voltam vazias:

```bash
grep -rniE "<(ambient|directional|point|spot|hemisphere|rectArea)Light"  src/   # JSX do R3F
grep -rnE  "new (THREE\.)?(Ambient|Directional|Point|Spot|Hemisphere|RectArea)?Light\b" src/
grep -rnE  "^\s*(Ambient|Directional|Point|Spot|Hemisphere|RectArea)Light,?$"  src/   # import { … } from "three"
grep -rn   "Environment|Lightformer|useEnvironment"  src/                       # drei
```

A terceira importa porque **este código importa símbolo a símbolo do `three`** —
`bakes.tsx` puxa nove nomes assim — então `new PointLight(` sem prefixo seria a grafia
esperada, e ela também não existe. As únicas linhas com "light" no nome são uniformes de
shader (`vPointLightColor` em `material-characters/fragment.glsl`) — uma luz falsa por
instância, sem `THREE.Light` nenhuma por trás.

E as luzes também não chegam pelos modelos: **`KHR_lights_punctual` não aparece no
`extensionsUsed` de nenhum dos 13 `.glb`.** Não há luz no código nem no asset.

A contagem de materiais no `src/`: **80 `ShaderMaterial`, 25 `MeshBasicMaterial`, 15
`MeshStandardMaterial`**. O trabalho todo mora num material próprio,
`createGlobalShaderMaterial`, que recebe o `MeshStandardMaterial` vindo do GLB, copia
`map`, `metalness`, `roughness`, `emissive`, `alphaMap` dele, e devolve um `ShaderMaterial`
com uniformes explícitos:

```js
lightMap, lightMapIntensity, aoMap, aoMapIntensity,
matcap, glassMatcap, glassReflex,
fogColor, fogDensity, fogDepth,
emissive, emissiveIntensity, emissiveMap,
inspectingEnabled, inspectingFactor, fadeFactor,
lampLightmap, lightLampEnabled
```

mais um conjunto de `defines` que liga caminhos: `GLASS`, `GODRAY`, `LIGHT`, `BASKETBALL`,
`FOG`, `VIDEO`, `MATCAP`, `CLOUDS`, `DAYLIGHT`.

**A iluminação inteira é textura.** `bakes.tsx` amarra três mapas por malha, por nome:

- **lightmap** — o `.ktx2` UASTC HDR, `generateMipmaps = false`, `LinearFilter` nos dois
  filtros, `NoColorSpace`. O comentário deles explica a escolha: *"linear so baked lighting
  reads as smooth gradients instead of texel stair-steps"*.
- **oclusão de ambiente** — `.jpg` comum, carregado por `TextureLoader`.
- **matcap** — `.webp`, um por material metálico ou de vidro, com um booleano `glassMatcap`
  separando os dois comportamentos. São **17 matcaps** em disco, somando 0,35 MB.

A névoa é exponencial ao quadrado, escrita à mão no fragmento e portanto isenta do laço de
luz por definição:

```glsl
float fogDepthValue   = min(vMvPosition.z + fogDepth, 0.0);
float fogFactor       = 1.0 - exp(-(fogDensity*fogDensity) * (fogDepthValue*fogDepthValue));
gl_FragColor.rgb      = gl_FragColor.rgb * (1.0 - fogFactor) + fogColor * fogFactor;
```

A leitura direta para este projeto: **o basement não tem um "orçamento de luzes" porque
não tem luzes.** A ADR-0019 mediu quinze luzes em 87% do quadro e doze ainda custam 58%
aqui; o caminho que eles tomaram não é reduzir a conta, é trocar o modelo — assar a luz no
Blender, servir como textura, e deixar o material ler o valor em vez de calculá-lo.

**O que isso custaria aqui, e por que não é adoção direta.** A ADR-0029 já rejeitou assar a
mobília, e a razão continua válida: `applyVigil` caminha as Velas, a luz do quadro e o
`environmentIntensity` conforme o fader, e um móvel assado ficaria aceso exatamente como
foi assado enquanto o quarto apaga em volta. O basement pode assar porque a luz da cena
deles não anda. **A Vigília é o que torna o bake caro aqui, não o Blender.** [I] O meio
termo que sobreviveria seria assar só o que não responde à Vigília — arquitetura, teto,
cantos — e manter em tempo real o que ela toca.

## 1.5 Câmera e navegação: estações, não órbita

`camera-controller.tsx` tem 23 linhas e decide uma coisa só: `flyMode` do painel de debug
manda em `WasdControls`, e todo o resto vai para `CustomCamera`. **A navegação de produção
não tem órbita, não tem trackball e não tem roda de zoom.**

`CustomCamera` lê `currentScene.cameraConfig` do store de navegação — `position`, `target`,
`fov`, servidos pelo **Sanity**, editáveis por quem escreve conteúdo e não por quem escreve
código. `camera-hooks.tsx` faz o movimento com `easing` do `maath` e uma constante
`ANIMATION_DURATION = 1` (mais `ANIMATION_DURATION_FROM_404 = 4`, a transição longa de
volta do 404).

O parallax lateral não é órbita: são **duas malhas invisíveis** (`planeRef`,
`planeBoundaryRef`) posicionadas por `calculatePlanePosition`, escaladas contra as
dimensões de vista calculadas na distância da câmera —

```js
boundary.scale.set(width * 0.6, height, 1)
plane.scale.set(width * 0.4, height, 1)
```

— e o cursor é projetado nelas para gerar um deslocamento com limite rígido. O divisor é
responsivo por largura de tela (`0.32` até 1100 px, `0.8` acima de 1600).

Isto é, ponto por ponto, o modelo de seis estações do Tenebrae: pose fixa por estação,
transição amortecida entre elas, e um pequeno grau de liberdade preso a um retângulo. A
diferença é que aqui as poses moram no `trilho.json` e lá moram no CMS.

## 1.6 Três truques de performance com número

**A câmera secundária desenha um quadro em cada dezesseis.** `postprocessing/renderer.tsx`:

```js
export const cctvConfig = {
  renderTarget: doubleFbo(1024, 1024, { type: HalfFloatType, minFilter: NearestFilter, … }),
  frameCounter: 0,
  framesPerUpdate: 16,
  camera: new PerspectiveCamera(30, 1, 0.1, 1000),
  shouldBakeCCTV: false
}
```

Um alvo duplo de 1024², meio-float, e um contador que só re-renderiza a cada 16 quadros.
Uma tela dentro da cena mostrando outro ponto de vista custa **1/16 de uma segunda
renderização**, não uma.

**O bloom roda em metade da resolução** — `bloomSize` devolve `ceil(w/2) × ceil(h/2)`.

**O `Cache-Control` de um ano** já descrito em 1.2, que só é seguro porque o nome carrega o
hash.

## 1.7 O que transfere, e o que a ADR-0004 barra

| técnica deles | entra aqui? |
|---|---|
| Draco / KTX2 / meshopt no `.glb` | **sim, como etapa de build** — ver Parte 2 (d). Nenhuma delas é pacote novo |
| Hash de conteúdo no nome + `immutable` | **sim, e é barato.** Um script de dez linhas |
| Verificação de manifesto no build | **sim** — o `verify:site` já é o lugar |
| Lightmap KTX2 UASTC HDR | **não agora.** Exige `basisu` local, `KTX2Loader`, e 585 KB de transcodificador em `public/`; e a Vigília briga com o bake (1.4) |
| Matcap para metal e vidro | **candidato forte.** É um `.webp` de poucos KB, lido por `MeshMatcapMaterial` do próprio `three`, e resolve latão e vidro sem uma luz |
| Névoa exponencial no fragmento | já resolvido — o Pool faz isso desde `29.circular-fog` |
| React Three Fiber, drei, rapier, leva, uikit | **não.** ADR-0004 |

`three/examples/jsm` já conta como dentro de `three` pela ADR-0004 — o `post.js` importa
`EffectComposer`, `RenderPass`, `OutputPass`, `ShaderPass` e `Pass` de lá, e o
`portrait.js` importa o `GLTFLoader`. `MeshMatcapMaterial` é do núcleo, nem isso precisa.

---

# Parte 2 — de onde vêm os assets

## 2.0 Os quatro filtros, aplicados fonte a fonte

O repositório é público. **Colocar um arquivo aqui é redistribuí-lo.** Daí quatro
perguntas, e uma fonte precisa passar nas quatro:

1. **Redistribuição permitida?** Sem isso, nada mais importa.
2. **Sem cláusula NãoComercial?** Um portfólio profissional não é uso pessoal.
3. **O download entrega os termos junto com o arquivo?** Licença presa a conta não viaja.
4. **A atribuição, se exigida, cabe num `CREDITS.md`?** Atribuição em tela não cabe na cena.

**Dois arquivos do repositório escrevem hoje uma regra mais curta que esta**, e os dois
ficam desatualizados por ela — `docs/research/quarto-modelos-e-texturas.md` (*"qualquer
coisa que exija conta, atribuição em tela ou que proíba redistribuição não pode entrar"*) e
`public/hdri/CREDITS.md` (*"CC0 apenas: Poly Haven, ambientCG, Kenney"*). Nenhum dos dois
foi editado nesta passagem; a correção é dita aqui em voz alta para não virar contradição
silenciosa entre arquivos vizinhos:

> **CC-BY passa nos quatro filtros.** Ela exige crédito, mas crédito num arquivo de texto
> ao lado do binário, que é exatamente o que `public/mobilia/CREDITS.md` já faz por hábito
> para material CC0 que nem exigiria. A regra antiga confundiu *atribuição* com *atribuição
> em tela*. O que continua barrado é **NC** (filtro 2), **ND** (proíbe a versão reduzida,
> que é obrigatória aqui) e **conta** (filtro 3).

**Consequência prática, e ela é grande:** abrir CC-BY multiplica o catálogo disponível para
esta estética por uma ordem de grandeza, porque quase tudo que é barroco e feito por artista
— e não escaneado por museu — está em CC-BY.

---

## 2.1 (a) Modelos 3D

### Poly Haven — `polyhaven.com/models`

- **Licença:** CC0 1.0. A página de licença: *"You do not need to give credit or
  attribution when using them (although it is appreciated)."* Uso comercial e
  redistribuição livres.
- **Atribuição:** não exigida. Registrada aqui de todo jeito, pela regra de
  `public/mobilia/CREDITS.md`.
- **Formatos:** `gltf`, `blend`, `fbx`, `usd`. Texturas em `jpg`, `png` e `exr`, em 1k, 2k,
  4k e 8k. Download direto por URL, **sem conta** — `api.polyhaven.com/files/<slug>` devolve
  a árvore inteira com tamanho por arquivo, que é como as tabelas abaixo foram feitas.
- **Tamanho do catálogo, contado em 2026-09-07:** **521 modelos**, 856 texturas, 993 HDRIs.

**O que existe e ainda não foi trazido**, buscado por termo no catálogo completo:

| categoria | peças disponíveis |
|---|---|
| móvel de época ausente do quarto | `GothicCommode_01`, `ClassicNightstand_01`, `Ottoman_01`, `Rockingchair_01`, `chinese_armchair`, `chinese_cabinet`, `chinese_commode`, `chinese_console_table`, `chinese_sofa`, `WoodenTable_01..03` |
| castiçal e luminária | `wooden_candlestick`, `brass_candleholders`, `vintage_oil_lamp`, `Lantern_01`, `wooden_lantern_01`, `industrial_caged_sconce`, `Chandelier_01..03`, `lantern_chandelier_01`, `chinese_chandelier` |
| objeto de superfície | `brass_vase_01..04`, `ceramic_vase_01..04`, `book_encyclopedia_set_01`, `chess_set`, `bronze_*_statue`, `bull_head` |
| relógio | `vintage_grandfather_clock_01`, `wall_clock`, `alarm_clock_01` |

**O que confirmadamente não existe** (buscado em todos os 521): **vitrola, gramofone,
toca-discos**. O mais próximo é `boombox`, `cassette_player`, `vintage_radio_transceiver`.
Isso confirma e estende o levantamento de 2026-09-05 registrado no `CREDITS.md`.

**O peso, medido pela API, e a armadilha dele.** O tamanho não segue o tamanho do objeto —
segue a densidade da malha:

| peça | gltf 1k | gltf 2k | gltf 4k |
|---|---|---|---|
| `GothicCommode_01` | 0,58 MB | 1,59 MB | 5,00 MB |
| `marble_bust_01` | 0,86 MB | 1,93 MB | 5,52 MB |
| `Chandelier_01` | 1,25 MB | 2,04 MB | 4,60 MB |
| **`wooden_candlestick`** | **8,04 MB** | **14,08 MB** | 37,34 MB |
| **`brass_candleholders`** | **9,06 MB** | 30,28 MB | 109,77 MB |

Um castiçal pesa dez vezes uma cômoda gótica, e as duas causas são diferentes. O
`wooden_candlestick` foi aberto e medido (Parte 2 (d)): **213 mil triângulos**, um `.bin`
de 5,89 MB que **não muda com a resolução da textura** — é malha pura. Já o
`brass_candleholders` traz **14 arquivos incluídos** contra 4 de todas as outras peças, ou
seja vários conjuntos de material; [I] o peso dele é de textura, não de malha, e ele não
foi aberto para confirmar. O `CREDITS.md` já o tinha recusado por ter 1,2 MB só de `.bin`.

A lição vale para os dois casos: **baixar em 1k reduz textura e não toca em geometria**, e
é a Parte 2 (d) que resolve a outra metade.

### Sketchfab — `sketchfab.com`

- **Licenças:** oito, e a API as publica com os `slug` e os requisitos textuais em
  `api.sketchfab.com/v3/licenses`. Interessam duas:
  - **`cc0`** — *"Credit is not mandatory. Commercial use is allowed."*
  - **`by`** (CC Attribution 4.0) — *"Author must be credited. Commercial use is allowed."*

  Barradas pelos filtros: `by-sa` (ShareAlike — contaminaria o repositório), `by-nd`,
  `by-nc`, `by-nc-sa`, `by-nc-nd`, e a `Free Standard` proprietária.
- **Como filtrar, exatamente.** Na interface, `Downloadable` + o seletor de licença. O
  parâmetro de URL é `licenses=<uuid>`; os dois que interessam são
  `7c23a1ba438d4306920229c12afcb5f9` (CC0) e `322a749bcfa841b29dff1e8a1bb74b0b` (CC-BY).
  Pela API é mais simples e usa o slug:

  ```
  https://api.sketchfab.com/v3/search?type=models&downloadable=true&license=cc0&q=candelabra
  https://api.sketchfab.com/v3/search?type=models&downloadable=true&license=by&q=gramophone
  ```

  A busca é anônima — as tabelas abaixo saíram da API sem autenticação nenhuma. **[I] O
  download exige conta gratuita**, e os formatos habituais são glTF/GLB, o original do
  autor e USDZ: as duas coisas **não foram verificadas na fonte**, porque o artigo de ajuda
  `help.sketchfab.com/.../Downloading-Models` responde 404 e a página
  `sketchfab.com/features/free-3d-models` não diz nada sobre conta nem sobre formato.
  Confirmar antes de tratar o filtro 3 como resolvido.
- **O achado que decide como usar a fonte.** Rodando as duas buscas lado a lado em
  2026-09-07:

  | busca | CC0 | CC-BY |
  |---|---|---|
  | `gramophone` | 1 resultado, **643 mil faces** | 4 resultados, **8,4 a 39 mil faces** |
  | `chesterfield sofa` | **zero** | 4, de 40 a 280 mil faces |
  | `candelabra` | 2, de museu (74 e 154 mil faces) | 4, de **447** a 14 mil faces |
  | `persian rug` | **zero** | 4, de **24** a 1 milhão de faces |
  | `baroque picture frame` | zero | 2, 574 e 593 mil faces |
  | `gothic` | 4, todos de museu, 60 mil a 507 mil faces | 4, de 51 mil a 1,6 milhão |

  **O CC0 do Sketchfab é quase todo escaneamento de museu**, com contagem de face de
  fotogrametria — bonito, e caro em polígono e em retopologia. **O CC-BY é o material feito
  por artista**, na faixa de polígono que uma cena web usa. Nesta estética, a licença mais
  permissiva entrega a peça menos utilizável. Vale o crédito no `CREDITS.md`.
- **Aviso com prazo.** O post *Fab Publishing Portal Open for Sketchfab Migration*, no blog
  da comunidade deles, anuncia a migração para o **Fab** (Epic) e diz, textualmente:
  *"Models that are currently licensable under CC0, CC BY-ShareAlike, CC BY-NonCommercial,
  or CC BY-NoDerivatives cannot migrate to Fab under those license types, as those licenses
  do not exist on Fab at this time."* E sobre o que acontece com eles: *"As with all other
  free content on Sketchfab, these models will remain available for download until licensing
  becomes completely unavailable on Sketchfab."*

  **Nenhuma data de fim é dada** — o post fala em conteúdo gratuito seguindo disponível
  "into 2025", o que já passou, e **em 2026-09-07 a API de busca e o download continuam de
  pé**. Ou seja: o prazo existe, não foi anunciado, e já passou do horizonte que o próprio
  post citou. **O que for usado daqui deve ser baixado e commitado agora, não linkado para
  depois** — e isso vale em dobro para o CC0, que é a licença que não tem para onde migrar.

### Poly Pizza — `poly.pizza`

- **Licenças:** mistura de **CC0** e **CC-BY**, por modelo — nunca por site. Hospeda o
  arquivo do Google Poly (2.294 modelos, CC-BY 3.0) além de coleções próprias.
- **Atribuição:** exigida nos CC-BY; o site gera a linha de crédito pronta.
- **Formatos:** GLTF/GLB, OBJ e FBX. **Sem login.** Há API pública (`poly.pizza/docs/api/v1.1`),
  que exige chave.
- **Serve a este quarto?** [I] Marginalmente. O acervo é low-poly estilizado — é a estética
  do `61.image-pixelation`, não a do casarão barroco. Vale se o eixo PS1 de
  `refs-quarto-e-tratamento-2026-09-04.md` for retomado; não vale para mobília de época.

### Quaternius — `quaternius.com`

- **Licença:** **CC0**, verificado na FAQ deles: *"these assets can be used for free without
  the need for attribution in commercial, educational, and personal projects. All models are
  under the CC0 License."* E: *"attribution is not necessary. However, credit is always
  appreciated."*
- **Formatos:** pacotes para Blender, com GLB entre as saídas.
- **Serve?** Tem `Ultimate House Interior Pack`, `Ultimate Furniture Pack`, `Medieval
  Village MegaKit`, `Modular Dungeons Pack`. [I] É tudo estilizado e de baixa contagem, pela
  mesma razão do Poly Pizza — bom para volume, não para a peça herói.

### Kenney — `kenney.nl`

- **Licença:** **CC0**, impressa em cada página de asset. A `Furniture Kit` diz literalmente
  `License: Creative Commons CC0`, 140 arquivos, lançada em 2018.
- **Serve?** Não para este quarto. É kit de jogo, cores chapadas, sem PBR. Fica na lista
  porque `quarto-modelos-e-texturas.md` já a autoriza e alguém pode se enganar.

### Smithsonian Open Access 3D — `3d.si.edu`

- **Licença:** **CC0** para os itens **designados Open Access**, e só para eles — o resto do
  acervo carrega condições próprias. A ressalva que importa: *"CC0 only applies to copyright
  so you may still need someone else's permission to use a CC0-designated digital asset."*
- **Atribuição:** não exigida nos itens CC0.
- **Formatos:** **glTF, GLB e OBJ**, em resolução reduzida (150k) e cheia.
- **[I] Toda esta ficha é de segunda mão.** `3d.si.edu`, `si.edu/openaccess/terms` e
  `si.edu/openaccess/faq` responderam **403** às três tentativas, então a citação acima e a
  lista de formatos vêm de cobertura secundária (Creative Commons, CG Channel), não da
  página do Smithsonian. Verificar de outra rede antes de baixar.
- **Serve?** [I] Para busto, relevo e objeto de acervo. A malha vem de escaneamento e chega
  em centenas de milhares de triângulos — o `marble_bust_01` do Poly Haven é a mesma coisa
  já preparada. **Vale se o quarto precisar de uma peça específica, não como fornecedor.**

### Scan the World / MyMiniFactory — `myminifactory.com/scantheworld`

- **Licença:** **por objeto, e mista.** Muitos itens são CC0, outros carregam **NC** ou
  **SA**. Não existe licença única de coleção; a página de cada objeto manda.
- **Formatos:** predominantemente **STL**, porque o projeto é de impressão 3D.
- **Serve?** **Fracamente, e é o item mais perigoso da lista.** Três problemas somados:
  (1) o filtro 2 reprova todo item NC e o filtro 4 exige checar item a item; (2) STL não
  carrega UV nem material — a peça chega sem coordenada de textura e precisa de
  desdobramento; (3) a densidade é de impressão, não de tempo real. **Recomendação: não
  usar**, a menos que uma peça exata e insubstituível apareça e o item seja verificado CC0.

### Three D Scans — `threedscans.com`

Escaneamentos de escultura clássica de Louvre, Kunsthistorisches, Museo Archeologico di
Firenze e outros, projeto de Oliver Laric iniciado em 2012. É a fonte mais on-tema que
existe para busto e relevo.

**E a página `/info` deles, lida integralmente em 2026-09-07, não declara licença
nenhuma.** Lista instituições, financiadores e um e-mail de contato. O `<title>` do site diz
"Free 3D scan archive"; isso é uma descrição, não um termo. **Sem texto de licença, o filtro
1 não pode ser dado como aprovado.** Fica registrada como fonte a esclarecer por e-mail
antes de qualquer download — não como fonte disponível.

### Museus que publicam 3D aberto — o padrão

Onde há programa de acesso aberto, o padrão é **CC0 para o item designado, com a ressalva de
que CC0 cobre direito autoral e não cobre direitos de terceiros**. O Smithsonian é o exemplo
bem documentado acima. [I] Vale tratar qualquer outro museu do mesmo jeito: a designação é
por item, nunca por instituição, e a página do item é a única fonte.

---

## 2.2 (b) Texturas e mapas PBR

### ambientCG — `ambientcg.com`

- **Licença:** **CC0 1.0**. A documentação (`docs.ambientcg.com/license/`): *"You can copy,
  modify, distribute and perform the assets, even for commercial purposes, all without asking
  permission"* e *"You can include the raw files in your project, for example a video game."*
  Atribuição não exigida; eles sugerem a linha `"Created using <asset> from ambientCG.com,
  licensed under the Creative Commons CC0 1.0 Universal License."`
- **Formatos:** ZIP por resolução, `JPG` ou `PNG`, em 1K/2K/4K/8K. **Download direto, sem
  conta**, por URL previsível:

  ```
  https://ambientcg.com/get?file=Marble001_1K-JPG.zip
  ```

  A API (`ambientcg.com/api/v2/full_json`) devolve todos os links com tamanho.
- **Catálogo, contado em 2026-09-07.** A API declara **2.009 materiais**; foram varridas
  **2.000 fichas por etiqueta**, então as contagens abaixo cobrem 99,6% do acervo e as
  ausências valem com essa margem.

| o que o quarto precisa | o que existe | exemplo concreto |
|---|---|---|
| **mármore** | `Marble001`–`Marble026` e `Onyx001`–`Onyx014` — **40 conjuntos** | `Marble001_1K-JPG.zip` = **5,86 MB** (4K: 69,4 MB; 8K: 213 MB) |
| **latão / dourado** | 28 conjuntos metálicos; por etiqueta: `Metal034` (`gold, smooth`), `Metal042A` (`gold, clean, shiny`), `Metal035` (`copper`), `Metal017` (`bronze, dark, scratched, old`) | `Metal017` para o latão dos castiçais — a etiqueta *scratched, old* é a metade que o dourado limpo não dá |
| **nogueira** | 192 conjuntos de madeira (`Wood001`–…, `PaintedWood*`) | o quarto já usa `black_walnut_veneer_01` do Poly Haven, e a decisão está registrada |
| **tapete** | `Carpet001`–`Carpet016` | nenhum é persa; são carpetes modernos |
| **papel e papelão** | `Paper001`–`Paper006`, `Cardboard001`–`Cardboard004`, `Wallpaper001A/B/C`, `Wallpaper002A/B/C` | `Cardboard003` para capa de disco gasta; `Paper00x` para etiqueta e ficha |
| **veludo** | **zero.** Nenhuma das 2.000 fichas traz `velvet`, `corduroy` ou `upholster` em etiqueta, e `?q=velvet` também devolve 0 | ver abaixo |

Uma nota sobre o método, porque muda como ler a tabela: **o parâmetro `q` da API casa
nome, não etiqueta.** `?q=brass` devolve zero embora `Metal034` esteja etiquetado `gold` —
os materiais têm nome de série (`Metal 034`), não nome descritivo. Toda busca por assunto
tem que ser feita sobre `tags`, que é como as linhas acima foram levantadas.

### Poly Haven textures — `polyhaven.com/textures`

Mesma licença CC0, mesmo download sem conta. **856 texturas.** Cada uma vem com `Diffuse`,
`Rough`, `AO`, `Displacement`, `nor_gl`, `nor_dx` e o combinado `arm`, em `jpg`, `png` e
`exr`, de 1k a 8k, mais `blend` e `mtlx`.

Buscando o que este quarto pede:

- **madeira:** 130 resultados. `black_walnut_veneer_01..03`, `american_walnut_veneer`,
  `european_walnut_veneer_04/05`, `dark_wood`, `dark_planks`, `lacquered_cherry_wood`,
  `flamed_black_veneer`, `diagonal_parquet`.
- **mármore:** 30 resultados, mas quase todos são *rocha* — `marble_cliff_01..06`,
  `marble_rock_01..03`. Superfície polida de interior é só `marble_01`, `marble_tiles`,
  `marble_mosaic_tiles`, `grey_cartago_01/03`, `granite_tile_01..04`. **Para mármore
  interior, o ambientCG tem 40 e o Poly Haven tem meia dúzia.**
- **latão/dourado:** **quatro resultados, e nenhum é latão** — `metal_plate`,
  `metal_plate_02`, `blue_metal_plate`, e um falso positivo (`crepe_satin`). **Esta é uma
  lacuna real do Poly Haven** e é exatamente a superfície que o quarto mais usa em borda.
- **veludo:** também **zero por nome**. O mais próximo, e é próximo de verdade:
  `floral_jacquard`, `quatrefoil_jacquard_fabric`, `crepe_satin`, `ribbed_corduroy`,
  `poly_wool_herringbone`, `faux_fur_geometric`.
- **papel/papelão:** três resultados — `book_pattern`, `decrepit_wallpaper`,
  `linoleum_brown`. **O ambientCG é a fonte melhor aqui.**

**A conclusão sobre veludo, que é o buraco das duas fontes:** nem Poly Haven nem ambientCG
têm veludo. E o `room-baroque.js` já resolveu isso do jeito certo — o material `VELVET`
empresta **normal e roughness** de uma foto e mantém a cor autorada. Veludo é anisotropia e
gradiente de Fresnel, não padrão de superfície; `ribbed_corduroy` ou um jacquard resolve o
relevo, e o resto é material. **A busca por "uma textura de veludo" não tem resposta e não
precisa ter.**

### Texture Ninja — `texture.ninja`

- **Licença:** **CC0**, mais de 5000 imagens, projeto de Joost Vanhoutte. [I] A licença está
  documentada em coberturas de imprensa (80.lv, CGPress) mas **o site é uma aplicação
  JavaScript e não serve o texto da licença em HTML**, então esta linha é a única da seção
  cuja licença não foi lida na fonte primária. **Confirmar na página antes de usar.**
- **O que é, e por que importa aqui:** são **fotografias de referência**, não conjuntos PBR.
  Não vêm normal nem roughness. É exatamente o material certo para **papel, papelão
  impresso, etiqueta, cartaz, capa gasta** — as superfícies onde o conteúdo *é* a imagem e
  não há relevo a medir. Onde o Poly Haven tem três resultados, esta fonte tem categorias
  inteiras.

### "cc0-textures"

`cc0textures.com` **é o nome antigo do ambientCG** — mesmo acervo, mesma licença, redireciona.
Não é uma fonte a mais.

### As proibidas, sem mudança

`textures.com` (a licença restringe redistribuição), Poliigon e Quixel (vínculo de conta,
filtro 3), e qualquer "free for personal use". Registrado em `public/hdri/CREDITS.md` e
mantido.

---

## 2.3 (c) HDRIs de interior escuro e luz de vela

Poly Haven, CC0, sem conta, `hdr` e `exr` em 1k a 16k. **993 HDRIs**, dos quais **361**
batem em interior/noturno/escuro. Os candidatos para este quarto, com as categorias e
etiquetas do catálogo:

| slug | categorias | etiquetas | por que serve |
|---|---|---|---|
| **`fireplace`** | `indoor` `urban` `night` `high contrast` `artificial light` | `fire couch room lounge` | **é literalmente um interior à luz de lareira, à noite.** O caso mais próximo de "luz de vela" que o acervo tem |
| `warm_bar` | `indoor` `night` `artificial light` | `pub stool bench rafters cozy wood` | quente, baixo, madeira |
| `warm_restaurant_night` | `indoor` `night` `artificial light` | `rafters cozy fireplace tiles wood` | idem, com mais alcance |
| `historic_cloister_passage` | `indoor` `natural light` `medium contrast` | **`gothic medieval monastery castle arch sandstone`** | a etiqueta gótica exata do CONTEXT; luz de dia, porém |
| `sepulchral_chapel_basement` | `indoor` `medium contrast` | `tiles architecture dome circular` | a capela lateral. **Já foi avaliada e recusada em 2026-09-03** — ver abaixo |
| `small_cathedral` | `indoor` `low contrast` `natural light` | `church chapel carpet painting religion` | sacral, claro demais |
| `creepy_bathroom` | `indoor` `night` `artificial light` `low contrast` | `dark spooky abandoned grunge` | escuro de verdade; registro errado |
| `castle_zavelstein_cellar` | `indoor` `high contrast` `natural light` | `cellar basement arch brick castle` | **também já recusado** — "o marrom suja o ouro" |

**Peso, medido** (`fireplace`, e a escala vale para todos): 1k = **1,46 MB** `hdr` ou 1,41 MB
`exr`; 2k = 5,73 MB; 4k = 22,6 MB; 8k = 88,1 MB; 16k = 336 MB. O `teatro-1k.hdr` que está no
projeto tem 1,57 MB, então **1k é a linha certa e um `fireplace` custaria o mesmo que o que
já está lá.**

**A decisão que já existe, e por que esta lista não a reabre.** `public/hdri/CREDITS.md`
registra que sete candidatos foram comparados, que a capela sepulcral foi escolhida primeiro
e depois trocada, e a razão: *o registro é casarão barroco, não sala sacral fria*. O
`music_hall_01` ganhou por ser teatro barroco — dourado, ornamento e veludo vermelho.
**Nenhum HDRI da tabela acima desbanca isso como ambiente principal.**

O uso que sobra é outro e é real: **um segundo HDRI, quente e baixo, para a estação da
lareira.** `fireplace` é o único do acervo cuja distribuição de energia é fogo de lado e
baixo. [I] Trocar o `environment` por estação é barato — é uma textura — e ninguém mediu
ainda se a troca lê como mudança de sala ou como mudança de hora.

---

## 2.4 (d) Ferramentas de linha de comando para reduzir GLB

### Primeiro, a pergunta que a ADR-0004 levanta, respondida

**Uma ferramenta de linha de comando que roda na máquina e escreve um arquivo não é
dependência de runtime.** A ADR-0004 é a que proíbe pacote novo no navegador — é ela que
`basement-laboratory.md` cita para barrar `drei`, e ela que `quarto-modelos-e-texturas.md`
cita ao registrar que `three/examples/jsm` conta como dentro do `three`. A ADR-0029 decide
outra coisa: a Unidade é escrita, o cenário é modelado. **Nenhuma das duas fala de
`npm i -g` numa máquina de desenvolvimento.** O
`gltf-transform`, o `gltfpack` e o Blender headless não aparecem no `package.json` do
projeto, não entram no bundle, e o que chega ao navegador é um `.glb` — o mesmo formato que
`room-mobilia.js` já carrega hoje pelo `GLTFLoader`.

**O que precisa de cuidado é a saída, não a ferramenta.** Cada formato de compressão implica
ou não um decodificador no navegador, e é aí que a ADR-0004 tem opinião. Três níveis:

| nível | o que a ferramenta produz | o que o navegador precisa | pesa quanto |
|---|---|---|---|
| **1 — grátis** | `prune`, `dedup`, `join`, `weld`, `simplify`, `resize`, quantização | **nada.** `.glb` comum | 0 |
| **2 — quase grátis** | `EXT_texture_webp` | **nada.** O `GLTFLoader` do `three` 0.185.1 instalado aqui já traz `EXT_texture_webp` embutido, verificado no arquivo | 0 |
| **2b — 29 KB** | `EXT_meshopt_compression` | `meshopt_decoder.module.js`, **29 KB**, de `three/examples/jsm/libs/` — módulo ESM com o WASM embutido, importado e empacotado pelo Vite. **Nada em `public/`** | 29 KB no bundle |
| **3 — arquivo em `public/`** | `KHR_draco_mesh_compression` | `DRACOLoader` + `setDecoderPath()`. Os arquivos ficam em `three/examples/jsm/libs/draco/gltf/`: `draco_decoder.wasm` 192 KB + `draco_wasm_wrapper.js` 58 KB = **250 KB** buscados em runtime (ou `draco_decoder.js`, 512 KB, no caminho sem WASM) | 250 KB, fora do bundle |
| **3 — arquivo em `public/`** | `KHR_texture_basisu` (KTX2) | `KTX2Loader` + `setTranscoderPath()`. `basis_transcoder.wasm` 527 KB + `.js` 58 KB = **585 KB** copiados para `public/` | 585 KB |

Os níveis 1 e 2 são estritamente dentro do que a ADR-0004 já permite. **O nível 2b é o
primeiro caso interessante**: `three/examples/jsm` já conta como dentro de `three` (o
`post.js` importa cinco módulos de lá), e o decodificador de meshopt é uma importação de
29 KB sem arquivo servido. **O nível 3 é diferente em espécie** — dois binários no `public/`
que a página busca em runtime, com o problema de sincronização que o basement documentou em
1.2. Não é proibido; é uma decisão a tomar com o número na mão, e o número está abaixo.

### O experimento, com a peça certa

Não faz sentido medir num GLB genérico quando a fonte real está a uma URL de distância. Foi
baixado o **`wooden_candlestick` do Poly Haven em glTF 2k** — um castiçal, on-tema, e o
arquivo mais pesado por unidade de objeto de todo o catálogo:

```
wooden_candlestick.bin                 5,89 MB
wooden_candlestick_diff_2k.jpg         2,82 MB
wooden_candlestick_arm_2k.jpg          3,48 MB
wooden_candlestick_nor_gl_2k.jpg       1,88 MB
                                      ───────
empacotado em .glb                    14,08 MB   ← 213 mil triângulos, 113 mil vértices
```

`gltf-transform` **4.5.0**, instalado com `npm install @gltf-transform/cli` num diretório
fora do repositório. Todos os números abaixo são de execuções reais nessa máquina.

| | comando | GLB | textura | triângulos | extensões na saída | decodificador |
|---|---|---|---|---|---|---|
| **base** | — | **14,08 MB** | 8,18 MB | 212.992 | — | — |
| **F** | `resize --width 512 --height 512` + `webp` | 5,99 MB | 0,10 MB | 212.992 | webp | **nenhum** |
| **B** | `optimize --compress false --texture-compress webp --texture-size 512 --simplify-ratio 0.5` | 2,50 MB | 0,11 MB | 106.495 | webp | **nenhum** |
| **A** | `optimize` (só padrões) | 2,61 MB | 2,30 MB | 56.848 | meshopt + quantization | 29 KB |
| **E** | `optimize --compress meshopt --texture-compress webp --texture-size 512` | **0,42 MB** | 0,11 MB | 56.848 | meshopt + webp + quantization | **29 KB** |
| **C** | `optimize --compress draco --texture-compress webp --texture-size 512` | **0,29 MB** | 0,11 MB | 56.848 | draco + webp | 250 KB |

Gzip do que a rede entrega: **E = 0,34 MB, C = 0,28 MB.** A vantagem bruta do Draco sobre o
meshopt (130 KB) quase some depois do gzip (60 KB).

**Leitura, item por item:**

- **A textura é metade do arquivo e some por 512 e WebP.** 8,18 MB → 0,10 MB, **98% a
  menos**, sem tocar em geometria e sem decodificador. Linha F. É a mesma redução que o
  projeto já faz com `sips` depois do download — a diferença é que aqui ela acontece
  *dentro* do `.glb`, em WebP, e num comando só.
- **A geometria é a outra metade e não some sem compressão.** A linha F ainda tem 5,89 MB
  de `float32`. Só quantização + meshopt (ou Draco) a derrubam.
- **`optimize` sozinho engana.** A linha A parece boa (2,61 MB) mas deixou **2,30 MB de
  textura**, porque `--texture-compress` tem padrão `"auto"` — recomprime no formato
  original — e `--texture-size` tem padrão **2048**. Rodar `optimize` sem argumento não
  reduz textura de forma útil.
- **`--simplify` está ligado por padrão e é destrutivo.** Com `--simplify-error 0.0001` e
  `--simplify-ratio 0` ele cortou **73% dos triângulos** (212.992 → 56.848). Para um castiçal
  visto pequeno, tudo bem. **Para a `fancy_picture_frame_01`, não** — o `CREDITS.md` já
  escreve a regra: *quando o relevo é a peça, ele é a geometria*. Naquela peça o relevo mora
  no mapa de normais e a malha tem 629 vértices, então simplificar não tem o que cortar;
  numa peça entalhada de verdade, corta o entalhe. **`--simplify false` em qualquer peça cuja
  silhueta carrega o objeto**, e olhar o resultado antes de aceitar.
- **O ganho do Draco sobre o meshopt não paga o decodificador aqui.** 130 KB por peça contra
  250 KB de decodificador buscado uma vez. [I] O ponto de virada é por volta de **duas
  peças**; com as doze de `public/mobilia/` o Draco ganharia por larga margem — mas ganharia
  1,5 MB num diretório que hoje inteiro tem 4,5 MB, e ao custo de dois arquivos em `public/`
  que precisam ser re-sincronizados a cada upgrade de `three`. **O meshopt entrega 33× de
  redução por 29 KB e nenhum arquivo servido**, e é onde a relação custo/benefício está.

**Os flags, e o que cada um faz** (de `gltf-transform optimize --help`, 4.5.0):

| flag | padrão | o que faz | o que se perde |
|---|---|---|---|
| `--compress` | `meshopt` | `draco` · `meshopt` · `quantize` · `false` | ver tabela de decodificadores |
| `--texture-compress` | `auto` | `ktx2` · `webp` · `avif` · `auto` · `false` | WebP é com perda; `auto` mantém o formato |
| `--texture-size` | **2048** | dimensão máxima em pixels | detalhe de superfície. **512 é a linha deste projeto** |
| `--simplify` / `--simplify-error` / `--simplify-ratio` | `true` / `0.0001` / `0` | decimação por meshoptimizer | **entalhe, silhueta, borda.** Ver acima |
| `--weld` | `true` | funde vértices equivalentes; **obrigatório para simplificar** | costuras de UV, se mal configurado |
| `--join` / `--flatten` | `true` | funde malhas e achata o grafo, reduzindo draw calls | **os nomes dos nós.** Quebra qualquer código que ache malha por nome |
| `--palette` | `true` | funde materiais numa textura-paleta | materiais distintos deixam de ser distintos |
| `--prune` / `--prune-solid-textures` | `true` | remove o não referenciado; troca textura de cor única por fator | nada, se a cena estiver correta |
| `--instance` | `true` (mín. 5) | `EXT_mesh_gpu_instancing` para malhas repetidas | exige suporte à extensão |

**A armadilha de `--join`/`--flatten` merece destaque neste repositório.** `room-mobilia.js`
monta as peças por nome e a `encher()` da estante *"mede as prateleiras num histograma dos
vértices do próprio modelo"*. Achatar o grafo e fundir malhas apaga a estrutura de que esse
código depende. **`--join false --flatten false` em qualquer peça que o código inspecione.**

### O comando, pronto para copiar

```bash
# instalação, uma vez, fora do repositório
npm install --global @gltf-transform/cli    # 4.5.0 na medição acima

# 1. empacotar o glTF do Poly Haven (.gltf + .bin + texturas) num .glb único
gltf-transform copy peca_2k.gltf peca.glb

# 2. a receita recomendada: 33× menor, 29 KB de decodificador, nada em public/
gltf-transform optimize peca.glb peca.min.glb \
  --compress meshopt \
  --texture-compress webp \
  --texture-size 512 \
  --join false --flatten false      # se o código procura malha por nome
  # --simplify false                # se o relevo da malha É a peça

# 3. conferir o que saiu, antes de acreditar
gltf-transform inspect peca.min.glb
```

E no `three`, o único acréscimo — sem pacote novo, sem arquivo em `public/`:

```js
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
loader.setMeshoptDecoder(MeshoptDecoder)
```

### gltfpack / meshoptimizer

`gltfpack` é o utilitário de referência do `meshoptimizer`, do mesmo autor do codec.
Instalado e medido aqui: **`gltfpack 1.2`**, via `npm install gltfpack`.

Flags principais: `-c` (meshopt), `-cc` (compressão extra, pensada para render junto com
gzip), `-si R` (simplificar para a fração R de triângulos), `-tc` (KTX2/Basis), `-tw`
(WebP), `-mi` (instanciamento), `-kn` (preserva nós nomeados), `-km` (preserva materiais
nomeados e desliga fusão), `-ke` (preserva `extras`), `-noq` (desliga quantização).

**E o achado que o README não avisa:** a build do npm não faz textura.

```
$ gltfpack -i base.glb -o G.glb -c -si 0.5 -tw
Error: gltfpack was built without WebP support, texture compression is not available
Note: node.js builds do not support WebP due to lack of platform features;
      download a native build from https://github.com/zeux/meshoptimizer/releases
```

Sem `-tw`, ele processa só geometria e o resultado carrega as texturas originais intactas:
**8,72 MB** com `-c -si 0.5`, e 8,66 MB com `-cc` — porque os 8,18 MB de JPEG continuam
lá. Rodando em cima do `F.glb` (que já tinha WebP 512), `gltfpack -c -si 0.5` deu **0,63
MB**, contra **0,42 MB** do `gltf-transform` com o mesmo codec.

**Conclusão:** `gltfpack` é excelente e é o codec de referência, mas exigiria **binário
nativo baixado das releases** para cobrir textura, e mesmo assim ficou atrás no único teste
feito. **Para este projeto, `gltf-transform` faz tudo num comando e não precisa de binário
fora do npm.** Fica registrado como alternativa, não como caminho.

### Blender headless

```bash
blender -b entrada.blend --python script.py -- saida.glb
```

`-b` roda sem interface. Dentro do script, `bpy.ops.export_scene.gltf(filepath=..., export_format='GLB',
export_draco_mesh_compression_enable=True)` e o modificador `DECIMATE` para reduzir malha.

**Não vale a pena aqui, e a razão é específica.** Blender resolve o que as duas anteriores
não resolvem: **assar luz em lightmap**, desdobrar UV e reparar malha de escaneamento. Nada
disso está na mesa — 1.4 mostra que o bake briga com a Vigília, e as fontes recomendadas na
Parte 2 entregam glTF com UV pronto. Para *só encolher um `.glb`*, o Blender é uma
instalação de centenas de MB fazendo pior o que um comando de npm faz melhor. **Fica
registrado como a ferramenta certa para o dia em que o bake for decidido**, e não antes.

---

# Recomendação — o que fazer primeiro, e por quê

**Uma coisa antes de tudo, e ela não custa download nenhum: rodar a receita de (d) sobre
`public/mobilia/`.** É a única linha desta pesquisa que **melhora o que já existe** em vez
de acrescentar coisa nova.

Mas o ganho tem que ser dito no tamanho certo, e não é o 33× da tabela. Aqueles 33× são em
maioria textura, e **a textura de `public/mobilia/` já foi resolvida** — o `CREDITS.md`
registra que de cada peça ficou só o `_diff_1k.jpg`, reduzido para 512. A conta real dos
4,4 MB do diretório:

| | |
|---|---|
| `.bin` — geometria `float32`, **sem compressão nenhuma** | **3,03 MB** |
| imagens (`_diff` já em 512) | 1,36 MB |

Ou seja, **o alvo é os 3,03 MB de geometria**, e é sobre eles que quantização + meshopt
agem. As peças mais pesadas são `mantel_clock_01` (627 KB), `WoodenChair_01` (534 KB),
`GothicCabinet_01` (475 KB) e `marble_bust_01` (407 KB).

Três ressalvas que fazem parte do passo, não são notas de rodapé:

- **`--join false --flatten false` sempre**, por causa da `encher()`, que mede as
  prateleiras num histograma dos vértices do próprio modelo.
- **`--simplify false` em `marble_bust_01` e `GothicCabinet_01`.** O busto é escaneamento e
  o gabinete é entalhe; nos dois a malha *é* a peça, e o padrão `--simplify-error 0.0001`
  cortou 73% dos triângulos do castiçal sem perguntar.
- **`.gltf` → `.glb` muda o caminho.** `room-mobilia.js` monta a URL em
  `ASSET(item.arq)` com `arq: 'Sofa_01/Sofa_01_1k.gltf'` para as doze peças. O passo não é
  só de build: a tabela de peças muda no mesmo commit.

Depois disso, em ordem:

1. **Um segundo HDRI para a estação da lareira** — `polyhaven.com/a/fireplace`, 1,46 MB em
   1k, CC0. É o único ambiente do acervo cuja energia é fogo baixo e de lado, que é a
   direção de onde a cena nunca foi iluminada. Uma textura, zero luzes, e o
   `applyVigil` já sabe caminhar `environmentIntensity`.
2. **Matcap para latão e vidro** (1.7). Poly Haven e ambientCG **não têm veludo nem latão** —
   é a lacuna medida em 2.2 — e o matcap é a resposta que o basement dá para exatamente essa
   superfície, por poucos KB de `.webp` e com `MeshMatcapMaterial` que já é do núcleo do
   `three`. Resolve a borda dourada sem uma luz nova.
3. **Hash de conteúdo no nome dos binários + `Cache-Control: immutable`** (1.2). Vale por si
   e vale mais depois do passo 0, quando os arquivos de `public/mobilia/` mudarem de conteúdo
   mantendo o nome — que é precisamente o caso em que um cache velho morde.
4. **Sketchfab com filtro `license=by`, e só então.** É onde estão vitrola, Chesterfield,
   tapete persa e moldura barroca, todos ausentes do Poly Haven e todos na faixa de polígono
   certa (2.1). Custa uma conta gratuita para baixar, uma linha no `CREDITS.md` por peça, e
   a revisão da regra de 2.0. **E tem prazo**: os downloads do Sketchfab estão anunciados
   para acabar na migração ao Fab.

**O que não fazer:** Scan the World (licença por objeto, STL sem UV, densidade de
impressão), Three D Scans (sem licença publicada), KTX2 e lightmap assado (585 KB em
`public/` e briga com a Vigília), e Blender só para encolher arquivo.

E a regra que atravessa tudo, porque já custou caro aqui e o experimento em (d) a confirma:
**medir antes de aceitar.** `optimize` com padrões parece ótimo e deixa 2,3 MB de textura
para trás; `--simplify` corta 73% dos triângulos sem perguntar. `gltf-transform inspect`
depois de cada rodada, e olhar a peça na cena antes de commitar o binário.
