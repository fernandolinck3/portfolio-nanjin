# Modelos — procedência e licença

A maior parte dos arquivos desta pasta vem da **Poly Haven** (`polyhaven.com/models`) e
está sob **CC0 1.0 Universal** — domínio público. As exceções têm fonte e licença
declaradas nas seções próprias. O crédito existe porque um repositório que não sabe de
onde vêm seus binários é um problema para quem for auditar.

Baixados em 2026-09-04, na variante **glTF 1k**. De cada peça ficou a malha e o mapa de
cor (`_diff_1k.jpg`, 1024 px). O resto do PBR original — normal, roughness, AO,
displacement, que somam dezenas de MB por modelo — ficou no servidor de propósito: a
sala é iluminada por doze luzes contadas (ADR-0019) e um PBR completo de biblioteca por
cima disso faz o móvel parecer render de catálogo, não peça de um quarto.

**`fancy_picture_frame_01` é a exceção, e a exceção tem regra.** A malha dela tem 629
vértices — um perfil extrudado, liso — e todo o entalhe mora no mapa de normais. Sem
ele o modelo não é melhor que as quatro caixas que veio substituir, e foi assim que a
primeira montagem apareceu na tela. A regra que a distingue: **quando a geometria
carrega a peça, o mapa de normais é enfeite; quando o relevo *é* a peça, ele é a
geometria.** O mesmo raciocínio já estava escrito em `VELVET`, em `room-baroque.js`,
que empresta normal e roughness de uma foto e mantém a cor autorada.

`prototype/room-mobilia.js` monta as peças. A decisão de modelar em vez de escrever a
mobília está em `docs/adr/0029-the-unit-is-written-the-scenery-is-modelled.md`.

| arquivo | página | onde fica na sala |
|---|---|---|
| `Sofa_01/` | polyhaven.com/a/Sofa_01 | a sala de estar, de frente para o Altar |
| `sofa_03/` | polyhaven.com/a/sofa_03 | a sala de estar, à direita, em ângulo |
| `ArmChair_01/` | polyhaven.com/a/ArmChair_01 | virada para a lareira |
| `GreenChair_01/` | polyhaven.com/a/GreenChair_01 | à esquerda da sala de estar |
| `WoodenChair_01/` | polyhaven.com/a/WoodenChair_01 | a cadeira do Altar |
| `ClassicConsole_01/` | polyhaven.com/a/ClassicConsole_01 | parede esquerda, entre a baia e a porta |
| `Shelf_01/` | polyhaven.com/a/Shelf_01 | parede direita — os livros são escritos, ver `encher()` |
| `GothicCabinet_01/` | polyhaven.com/a/GothicCabinet_01 | canto do fundo à esquerda |
| `marble_bust_01/` | polyhaven.com/a/marble_bust_01 | sobre o pedestal da oficina, parede direita — ver `y` em `room-mobilia.js` |
| `fancy_picture_frame_01/` | polyhaven.com/a/fancy_picture_frame_01 | a moldura da Lyra — montada em `portrait.js`, não na tabela da mobília |

## Acervo — vitrola

| arquivo | autor e fonte | licença | adaptação |
|---|---|---|---|
| `vintage_record_player/` | [JennyB — Vintage record player](https://sketchfab.com/3d-models/vintage-record-player-6f3b6984c2f74d64b08833b5f61c2253) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | GLB separado em glTF; só geometria e albedo; textura reduzida para 1024; fundo branco do recorte do disco removido por alfa; material ajustado em `room-decor.js` |

Baixado em 2026-09-06 e integrado em 2026-09-07. A atribuição é obrigatória. O arquivo
original tinha 13 MB e três mapas PBR; a versão servida tem cerca de 528 KiB. A peça é
uma malha única, inclusive o disco. Não há mais cilindro ou vitrola procedural de fallback;
se o arquivo falhar, a cena registra o erro e não inventa outro objeto.

## Acervo — objetos do tampo

| arquivo | autor e fonte | licença | adaptação |
|---|---|---|---|
| `potted_plant_04/` | [James Ray Cock — Potted Plant 04](https://polyhaven.com/a/potted_plant_04) | CC0 1.0 | glTF 1K completo; escala e giro ajustados ao tampo |
| `industrial_pipe_lamp/` | [Mateusz Sadek — Industrial Pipe Lamp](https://polyhaven.com/a/industrial_pipe_lamp) | CC0 1.0 | glTF 1K completo; escala e giro ajustados; emissão subordinada à Vigília |

Baixados e integrados em 2026-09-07 a partir das três referências do canal `projetos
section`. A suculenta e a luminária substituem, respectivamente, a antiga planta de
primitivas e o globo procedural do Acervo; não há fallback geométrico para nenhuma das duas.
O `PointLight` continua sendo luz da cena, mas agora nasce dentro da cúpula de uma luminária
visível e modelada.

## Acervo — credenza

| arquivo | autor e fonte | licença | adaptação |
|---|---|---|---|
| `modern_wooden_cabinet/` | [Patrik Pangerl — Modern Wooden Cabinet](https://polyhaven.com/a/modern_wooden_cabinet) | CC0 1.0 | glTF 1K completo; escala ajustada nos três eixos à pegada aprovada do Acervo; altura do tampo preservada |

Baixado e integrado em 2026-09-07. O modelo mede 2,4 m na fonte e traz cerca de 25 mil
triângulos, portas curvas ripadas, madeira, ferragens e pés metálicos. Neste caso os mapas
de cor, normal e ARM permanecem: o relevo das ripas e a separação entre madeira e metal são
justamente a qualidade que a credenza procedural não conseguia entregar.

Duas peças foram baixadas e **não** entraram: `Chandelier_02`, porque a sala já tem um
lustre com dezesseis chamas emissivas em `room-baroque.js` e trocá-lo mexe no laço de
luzes que já foi consertado três vezes; e `brass_candleholders`, cujo `.bin` sozinho tem
1,2 MB — mais que o dobro de qualquer outra peça — para um objeto que a cena já resolve
com os castiçais do Altar.

Mais duas, em 2026-09-05:

- **`large_castle_door`**, baixada e descartada por medida. A caixa envolvente dela é
  2,01 × 4,06 m. O quarto tem **2,31 m de pé-direito** e a porta escrita em
  `room-baroque.js` mede 3,4 × 6,6 unidades, ou 2,06 m — e é dela que sai o
  `POR_METRO = 3,2` que escala todas as peças desta pasta. Uma porta de castelo de
  quatro metros não cabe num quarto de dois e trinta, e encolhê-la para caber faria o
  ferro e as tábuas dela virarem miniatura. A peça continua descartada; a Porta foi
  resolvida depois com um modelo residencial de proporção correta, registrado abaixo.
- **`ornate_mirror_01`**, baixada e descartada por composição. Mede 0,486 × 0,744 m
  contra os 2,9 × 5,0 unidades (0,91 × 1,56 m) do espelho escrito em `room-baroque.js`
  — menos da metade da altura. Não é a mesma peça em melhor acabamento, é outra peça, e
  trocá-la deixaria um vão de parede acima da baia de discos. Fica registrada porque
  continua sendo uma opção, se o espelho um dia mudar de tamanho de propósito.

**A Poly Haven não tinha lareira barroca nem porta residencial** no levantamento das
521 peças de 2026-09-05: para lareira só havia `barrel_stove`, `electric_stove` e
`scandinavian_masonry_heater`; para porta, `large_castle_door`, `large_iron_gate` e
persianas industriais. A conclusão continua válida para a lareira. A Porta passou a
usar outra biblioteca depois de uma direção visual aprovada.

## Porta — marcenaria e arandela

| arquivo | autor e fonte | licença | adaptação |
|---|---|---|---|
| `door_classic/` | [Anh Le — Door classic](https://www.blenderkit.com/asset-gallery-detail/fcf40255-7266-4066-8d68-aba251560179/) | [Blendkit Royalty Free](https://www.blendkit.com/docs/licenses/) | GLB gratuito; altura ajustada de 2,28 m para 2,18 m; madeira escurecida e brilho reduzido; folha, guarnição e ferragem preservadas |
| `industrial_wall_sconce/` | [Ulan Cabanilla — Industrial Wall Sconce](https://polyhaven.com/a/industrial_wall_sconce) | CC0 1.0 | glTF 1K completo; escala e posição ajustadas para o trecho livre entre console e Porta |

Baixados e integrados em 2026-09-08. A Porta substitui integralmente a folha, as seis
almofadas, os filetes, a maçaneta e a guarnição procedurais de `room-baroque.js`. A
arandela substitui somente a arandela procedural que cruzava a Porta; a iluminação da
sala ganhou apenas uma Pool curta ligada à própria arandela. Na mesma revisão saíram
da parede da entrada os dois quadros abstratos gerados, o espelho sem reflexão e a
carta celeste procedural; o reboco fotografado já creditado em `textures/CREDITS.md`
permanece.

`draco/` contém os três decodificadores Google Draco distribuídos com a mesma versão
do Three.js já instalada no projeto. Eles são carregados apenas quando o GLB
comprimido da Porta é pedido e permanecem sob a licença Apache 2.0 do Draco; uma
cópia integral está em `draco/LICENSE`.

## Duas peças novas, e o que elas custaram

| arquivo | o que é | fonte | licença |
|---|---|---|---|
| `mantel_clock_01/` | relógio de prateleira, na credenza da estação TRAJETO. 840 KB | [Poly Haven — Mantel Clock 01](https://polyhaven.com/a/mantel_clock_01) | CC0 |
| `antique_ceramic_vase_01/` | vaso de cerâmica, no console da estação PORTA. 356 KB | [Poly Haven — Antique Ceramic Vase 01](https://polyhaven.com/a/antique_ceramic_vase_01) | CC0 |

**As texturas dos dois foram reduzidas para 512 com o `sips`, depois do download.** Os
dois vinham a 2,9 MB somados e ficaram em 1,2 MB. É a mesma redução que
`public/textures/CREDITS.md` registra para o piso, e pela mesma razão: nenhuma das duas
peças ocupa mais que um punhado de pixels no quadro em que aparece.

**O relógio não fica na cornija**, que era o lugar óbvio. Medido: a prateleira da lareira
projeta na borda de cima do quadro na pose daquela estação — o `trilho.json` diz que a
estação mira o centroide do sofá e da poltrona, não a lareira. A cornija está na estação;
não está na foto. O topo da credenza projeta no meio do quadro, e é lá que ele está.

## O que o quarto ainda não tem, e por quê

Conferido nos 521 modelos do Poly Haven, nesta ordem de necessidade:

- **Caixa de som de estúdio** — não existe. O que há de mais próximo é `boombox`,
  `cassette_player` e `vintage_radio_transceiver`, e nenhum é um monitor de campo
  próximo. As duas caixas continuam sendo primitivas, e são a peça à mão mais visível
  que sobrou: uma delas fica ao lado do retrato.
- **Lustre** — existem quatro (`Chandelier_01..03`, `lantern_chandelier_01`) e **a troca
  já foi descartada**: o da sala tem dezesseis chamas emissivas presas no laço de luzes
  da Vigília. Não relitigar sem uma razão nova.
- **Espelho** — `ornate_mirror_01` existe e já foi medido e recusado: 0,486 × 0,744 m
  contra os 2,9 × 5,0 unidades que o espelho escrito ocupa.
- **Cortina, pedestal, tapete** — nenhum modelo CC0 em nenhuma das três buscas.
