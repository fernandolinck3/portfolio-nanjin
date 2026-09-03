# Texturas e mapas de ambiente de terceiros

Este diretório guarda binários que **não** foram gerados por este projeto. Tudo aqui é
**CC0** — domínio público, redistribuição livre, atribuição não exigida.

A atribuição é registrada de todo jeito. Este repositório é público e linkado do perfil do
Fernando no GitHub; um repositório público que não sabe de onde vêm seus binários é um
problema para quem for auditá-lo, com ou sem exigência de licença.

**Regra: o arquivo e a linha nesta tabela entram no mesmo commit.**

| arquivo | o que é | fonte | autor | licença |
|---|---|---|---|---|
| `teatro-1k.hdr` | mapa de ambiente equirretangular, 1k (1,57 MB) | [Poly Haven — Music Hall 01](https://polyhaven.com/a/music_hall_01) | Andreas Mischok | CC0 |

## Por que este e não outro

Sete candidatos foram comparados olhando as prévias antes de baixar.

O primeiro escolhido foi uma **capela sepulcral**, pelo argumento de que seus nichos quentes
contra um teto frio são a mesma divisão que o `GradeShader` aplica. O argumento estava certo
sobre a divisão e errado sobre o objeto: **o registro é casarão barroco, não sala sacral
fria**, e metade do que tornava aquele HDRI interessante era justamente a metade que tinha
que sair. Ficou registrado porque a lição vale mais que o arquivo — *a referência não decide
o registro; o registro decide a referência.*

Também foram descartados: `graaff_reinet_groote_kerk` (igreja clara e vermelha — janelas
brilhantes em todo o dourado), `castle_zavelstein_cellar` (adega de tijolo, uma janela única
e forte, e o marrom suja o ouro) e `combination_room` (salão vitoriano — bom, mas doméstico
demais; perde o ornamento).

**Este ganhou** porque é teatro barroco: dourado, ornamento e veludo vermelho, que é a mesma
paleta das bandeirolas que já existem no quarto. Ver
`docs/research/quarto-modelos-e-texturas.md`.

## Fontes aceitáveis para este repositório

CC0 apenas: [Poly Haven](https://polyhaven.com), [ambientCG](https://ambientcg.com),
[Kenney](https://kenney.nl). **Não** usar `textures.com` (a licença restringe
redistribuição), Poliigon ou Quixel (vínculo de conta), nem nada "free for personal use" —
um portfólio profissional não é uso pessoal.
