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

Duas peças foram baixadas e **não** entraram: `Chandelier_02`, porque a sala já tem um
lustre com dezesseis chamas emissivas em `room-baroque.js` e trocá-lo mexe no laço de
luzes que já foi consertado três vezes; e `brass_candleholders`, cujo `.bin` sozinho tem
1,2 MB — mais que o dobro de qualquer outra peça — para um objeto que a cena já resolve
com os castiçais do Altar.
