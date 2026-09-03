# O quarto: o que gerar, o que texturizar, o que importar

Pesquisa e inventário. Nada foi construído nesta passagem.

Levantado em 2026-09-03, lendo `scene.js`, `room-decor.js`, `altar-props.js`,
`portrait.js` e `public/`.

## O ponto de partida, medido

**O quarto é inteiramente procedural.** Quinze geradores desenham em `<canvas>` e viram
textura:

| arquivo | gera |
|---|---|
| `scene.js` | `woodTexture` · `clothTexture` · `panelTexture` · `stoneTexture` · `rugTexture` · `skyTexture` · `leadTexture` · `velvetTexture` · `wearMap` · `envTexture` |
| `room-decor.js` | `panelFace` (o tecido dos painéis acústicos e os motivos) |
| `altar-props.js` | `cardTexture` · `coverTexture` · `edgeTexture` |
| `portrait.js` | `paintTexture` (a pintura da Lyra) · `plaqueTexture` |

Arquivos de imagem no projeto, **todos**: `ornament/plate.*`, `decks/moon.png`,
`decks/sun.png`, as capturas em `works/`, os favicons e o `preview.jpg`. `public/` tem
**9,6 MB**, e quase tudo isso são as capturas dos Works.

Ou seja: não existe hoje uma única textura ou modelo de terceiro no objeto. Isso é um
ativo — e é também o motivo pelo qual o quarto lê um pouco chapado. Ruído desenhado à mão
não tem sujeira, variação de escala nem microdetalhe, e são essas três coisas que o olho
usa para decidir se uma superfície é real.

## A regra que decide cada caso

**Geometria: gerar.** Tudo no quarto é caixa, cilindro e arco extrudado, e a geometria é
~grátis (ADR-0019). Modelo externo só onde a forma é orgânica e irregular o bastante para
que código honesto fique pior que ruim — na prática, **planta e figura humana**.

**Superfície: fotografia CC0, onde a área na tela justifica.** O `realism-budget.md` já
autorizou: *mapas de rugosidade, normal e bump são por pixel e baratos, e fazem a maior
parte do trabalho de "material" que as pessoas creditam à iluminação.* Trocar o ruído
desenhado por medida real é a melhoria de maior retorno por esforço no quarto inteiro.

## O mapa, por elemento

Ordenado por **área na tela**, que é o que decide o retorno — não por vontade.

| elemento | hoje | proposta | prioridade |
|---|---|---|---|
| **Piso de madeira** | `woodTexture` | **textura CC0** (albedo + rugosidade + normal). Está em quadro sempre e é a maior superfície contínua | **1** |
| **Tampo do Altar (mármore)** | `stoneTexture` | **textura CC0.** É a superfície herói, embaixo da Unit, no centro de toda foto | **2** |
| **Ambiente / reflexo** | `envTexture` procedural | **HDRI CC0 em 1K.** Melhora *toda* superfície metálica e o clearcoat da Plate de uma vez — mais que qualquer albedo isolado | **3** |
| **Tapete** | `rugTexture` | **fotografia CC0** de kilim ou tapete persa. Padrão real de tapete é impossível de desenhar convincentemente e o nosso ocupa meio piso | **4** |
| **Paredes / painéis acústicos** | `panelTexture` + `panelFace` | **manter procedural.** O tecido lê bem e os motivos são autorais — trocar por foto perderia o desenho | manter |
| **Pano de linho do Altar** | `clothTexture` | textura CC0 de linho, se a dobra continuar chapada depois do HDRI | 5 |
| **Vidro e chumbo da janela** | `leadTexture` + `skyTexture` | **manter.** Já funciona e o céu tem que combinar com a Vigília, o que uma foto não faz | manter |
| **Discos, pedais, cabos, credenza** | geometria + procedural | **manter.** São caixas e cilindros; é onde código ganha | manter |
| **Candelabros** | geometria dourada | **manter geometria**, ganha com o HDRI (item 3) | manter |
| **Retrato da Lyra** | `paintTexture` procedural | **decisão dele, não técnica.** É o único elemento com conteúdo autoral; uma foto não serve e uma pintura gerada é o que existe | dele |
| **Planta** | geometria simplificada | **único caso claro de modelo externo.** Folha é orgânica e irregular; código honesto aqui fica pior que ruim | 6 |
| **Figura humana** | não existe | Se um dia entrar — foi o que ele notou no basement — é modelo externo, e é o item mais caro da lista | depois |

## De onde tirar, e sob que licença

O repositório é **público e linkado do perfil dele no GitHub**. Isso elimina metade das
fontes: qualquer coisa que exija conta, atribuição em tela ou que proíba redistribuição
não pode entrar, porque entrar aqui *é* redistribuir.

**Usar (CC0 — domínio público, redistribuição livre, atribuição não exigida):**

- **Poly Haven** — `polyhaven.com`. Texturas PBR, **HDRIs** e modelos, tudo CC0. É a fonte
  única mais completa e resolve os itens 1, 2 e 3 do mapa.
- **ambientCG** — `ambientcg.com` (ex-CC0Textures). Biblioteca PBR grande, CC0. Madeira,
  mármore, tecido, piso.
- **Kenney** — `kenney.nl`. CC0. Modelos simples, se a planta vier de fora.

**Não usar:** `textures.com` (licença restringe redistribuição), Poliigon e Quixel (conta
ou pagamento, e vínculo de conta não é redistribuível), qualquer coisa "free for personal
use" — este site é portfólio profissional, o que já não é uso pessoal.

**Registrar mesmo sendo CC0.** CC0 não exige atribuição, mas um repositório público que
não sabe de onde vêm seus binários é um problema para quem for auditar. Um
`public/textures/CREDITS.md` com fonte, URL e licença por arquivo, escrito no mesmo commit
que traz o arquivo.

## O orçamento de peso, que é a restrição de verdade

O site hoje pesa **43 KB de HTML + 9 KB de JS de entrada**, com a cena em **915 KB**
carregada depois. Isso é duas ordens de grandeza abaixo do basement (10,35 MB só de 3D), e
é uma vantagem real — não vale perdê-la por textura.

Um conjunto PBR em 2K são 4 a 8 MB. **Doze deles seriam 60 MB e matariam o projeto.**
Então, regras:

- **1K no máximo**, 512 onde a superfície é distante ou desfocada;
- **albedo + rugosidade** primeiro; normal só quando a diferença aparecer numa foto lado a lado;
- **WebP ou JPEG de qualidade 80**, nunca PNG para superfície;
- **HDRI em 1K**, e um só, para todo o ambiente;
- **teto duro: 3 MB somados**, para o quarto inteiro. Se um item não cabe, ele volta a ser
  procedural.

`three/examples/jsm` já é considerado dentro do `three` pela ADR-0004 (o `post.js` diz isso
em tantas palavras), então o `RGBELoader` para o HDRI **não é dependência nova**.

## O que fazer antes de baixar qualquer arquivo

Uma coisa só, e ela é de graça: **o HDRI (item 3) antes das texturas.** Ele muda todo metal
e todo verniz da cena de uma vez, e é um arquivo. Se depois dele o piso e o mármore ainda
parecerem desenhados, aí os itens 1 e 2 se justificam com uma foto lado a lado — e não por
antecipação.

Isso também respeita a ordem que já custou caro aqui: **medir e olhar antes de otimizar ou
de comprar.**
