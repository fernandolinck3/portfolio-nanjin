# Texturas de terceiros

Tudo aqui é **CC0** — domínio público, redistribuição livre. A atribuição não é exigida e
é registrada de todo jeito: este repositório é público, e um repositório público que não
sabe de onde vêm seus binários é um problema para quem for auditá-lo.

**Regra: o arquivo e a linha da tabela entram no mesmo commit.**
As fontes aceitáveis e as proibidas estão em `public/hdri/CREDITS.md`.

---

## Texturas em `public/textures/`

| arquivo | o que é | fonte | licença |
|---|---|---|---|
| `parquet-cor.jpg` · `parquet-arm.jpg` · `parquet-nor.jpg` | piso do quarto — cor, rugosidade e relevo. 512px, 126 KB somados | [Poly Haven — Herringbone Parquet](https://polyhaven.com/a/herringbone_parquet) | CC0 |

Os três vêm em 1k (1,3 MB somados) e foram reduzidos para 512 com o `sips` do macOS
antes de entrar. O piso é visto em ângulo raso, quase sempre na penumbra, e metade dele
fica debaixo do tapete — nenhum daqueles detalhes sobrevive ao ângulo.

**Parquê e não tábua corrida:** tábua lê oficina, parquê lê casa. É o registro de casarão
barroco decidido em 2026-09-03, e é o mesmo piso do teatro que está no mapa de ambiente.

| `nogueira-cor.jpg` · `nogueira-arm.jpg` · `nogueira-nor.jpg` | tampo do Altar — cor, rugosidade e relevo. 512px, 169 KB somados | [Poly Haven — Black Walnut Veneer 01](https://polyhaven.com/a/black_walnut_veneer_01) | CC0 |

**Folheado e não tábua:** a mensa é uma laje só, e emendas de tábua atravessando ela leem
como um piso onde alguém apoiou uma mesa. O tom escuro `0x554438` do material **continua
por cima da foto** — ele não é gosto, foi ajustado porque na exposição 1.75 essa superfície
estourava para o branco e arrastava a imagem inteira.

Um onyx preto (`Onyx013`, ambientCG) chegou a ser baixado antes desta decisão, porque o
`CONTEXT.md` descrevia o Altar como mármore preto com veios. O código já dizia nogueira
escura desde muito antes; o glossário estava velho e foi corrigido. O arquivo foi apagado
no mesmo dia.
