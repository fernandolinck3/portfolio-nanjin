# Modelos — procedência e licença

Todos os arquivos desta pasta vêm da **Poly Haven** (`polyhaven.com/models`) e estão sob
**CC0 1.0 Universal** — domínio público. Uso comercial livre, redistribuição livre,
atribuição não exigida. O crédito abaixo existe porque um repositório que não sabe de
onde vêm seus binários é um problema para quem for auditar, não porque a licença peça.

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

`prototype/room-mobilia.js` monta as oito peças. A decisão de modelar em vez de escrever
a mobília está em `docs/adr/0029-the-unit-is-written-the-scenery-is-modelled.md`.

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
  ferro e as tábuas dela virarem miniatura. **A porta continua escrita.**
- **`ornate_mirror_01`**, baixada e descartada por composição. Mede 0,486 × 0,744 m
  contra os 2,9 × 5,0 unidades (0,91 × 1,56 m) do espelho escrito em `room-baroque.js`
  — menos da metade da altura. Não é a mesma peça em melhor acabamento, é outra peça, e
  trocá-la deixaria um vão de parede acima da baia de discos. Fica registrada porque
  continua sendo uma opção, se o espelho um dia mudar de tamanho de propósito.

**A Poly Haven não tem lareira barroca nem porta residencial.** Levantadas as 521 peças
do catálogo em 2026-09-05: para lareira só existem `barrel_stove`, `electric_stove` e
`scandinavian_masonry_heater`, todos de outra época e outro objeto; para porta,
`large_castle_door` (acima), `large_iron_gate` e persianas industriais. As estações da
**lareira** e da **porta** não se resolvem baixando modelo.
