# O quarto: o que ele contém, e como ele é renderizado — 2026-09-04

Pesquisa e leitura de referência. Nada foi construído nesta passagem.

Duas fontes, e a descoberta é que elas respondem **perguntas diferentes**, o que é o
motivo de as duas parecerem contraditórias enquanto se tenta obedecer às duas ao mesmo
tempo:

> **As fotografias de interior dizem *o que tem no quarto*.
> O basement diz *como o quarto é renderizado*.**

Perseguir as duas como se fossem a mesma instrução é o que produz o vale onde a cena
está hoje: suave demais para ser PS1, chapada demais para ser fotorreal. Não é nem uma
coisa nem outra, e é isso que se lê como "meio low" — não falta de textura.

## Parte 1 — as três referências de interior

Três fotografias de salão do século XIX, escuras, com piano, biblioteca e escritório.
Lidas por área na imagem, que é o que decide o que a cena tem de copiar.

### 1. O valor é a decisão principal, e é a que a cena atual erra

**Entre 60% e 70% de cada uma das três imagens é preto ou quase preto.** Não existe uma
única parede clara nas três. A madeira é quase preta, o teto é escuro ou pintado, e o que
ilumina são poucos pontos quentes: uma janela, uma lareira, um lustre, um abajur.

A cena atual tem parede em `#C8C6C2` — luminância 0,57 — e um piso de parquê claro que
domina o quadro. É o contrário da referência, e nenhuma textura conserta isso: **é tinta,
não material.** É também a mudança mais barata que existe.

### 2. A riqueza vem de quantidade, não de acabamento

As três têm estante do chão ao teto com centenas de livros, quadros encostados uns nos
outros, molduras sobrepostas, objetos sobre objetos. Nenhum objeto isolado é
espetacular; o conjunto é.

A ADR-0019 já mediu que geometria é a metade grátis. Então o caminho para "cheio" é
**mais peças simples**, não peças melhores. A pilha de sete livros que existe hoje é,
por essa medida, uma amostra e não uma estante.

### 3. Uma cor saturada só

Bordô — veludo, tapete persa desbotado, o teto vermelho de uma delas. Todo o resto é
preto, madeira escura, dourado e o verde de uma planta. A cena já acerta isso no tapete
e nas cortinas; falta nos estofados.

### 4. O dourado só existe em borda

Moldura, cornija, cristal, ferragem. Em nenhuma das três há uma superfície dourada de
área. Isto confirma o que o quarto já faz e é um limite a respeitar quando entrarem
peças novas.

### 5. Duas das três têm planta grande e viva

É o único verde e o único elemento orgânico da imagem. O quarto não tem nenhuma, e
`quarto-modelos-e-texturas.md` já tinha isolado a planta como o caso claro de modelo
externo.

### 6. O lustre é de cristal, não de braço dourado nu

Pingentes que pegam luz. O lustre atual é de braço e vela; a referência é de cristal.

## Parte 2 — o tratamento do basement

**Correção registrada:** numa primeira leitura, em aba automatizada, a home do
basement foi lida como wireframe branco sobre preto com blocos pixelados. **Isso é o
estado de carregamento**, não o resultado. A cena carregada mostra **modelos low-poly,
de aparência PlayStation**. A aba automatizada nunca terminou de carregar os `.glb` em
três esperas de dez segundos, e a leitura errada saiu daí.

O vocabulário dessa estética, e o que cada item significa aqui:

| | o que é | no código |
|---|---|---|
| Baixa contagem de polígono | facetas visíveis; a silhueta faz o trabalho | baixar os segmentos de `lathe` e `TubeGeometry` |
| Textura pequena, filtro nearest | pixel grande e assumido, 128–256px | `magFilter = NearestFilter`, e reduzir o que já existe |
| Warp afim | textura escorrega na perspectiva, como no hardware de 1994 | patch de shader por `onBeforeCompile` |
| Snap de vértice | posição quantizada em espaço de tela | o mesmo patch |
| Luz assada | sem sombra dinâmica; o valor mora no material | já é a direção da ADR-0019 |
| Névoa | corta a distância e dá profundidade sem luz | o Pool já é exatamente isso |
| Dither | grão que substitui gradiente | canvas ou shader, custo zero |

O eixo "snap de vértice, warp afim" **já estava escrito** em
`basement-laboratory.md`, e `61.image-pixelation` continua na lista de técnicas não
colhidas. Esta direção não é nova no projeto; é a que estava esperando decisão.

## A consequência, e ela reverte o plano anterior

O plano que estava se formando — atacar objeto por objeto comprando um conjunto PBR
para cada superfície — **está errado sob este tratamento.** Um material PS1 quer o
oposto: mapa pequeno, sem filtragem, paleta apertada.

Concretamente, isso significa:

- **O teto de 3 MB deixa de ser a restrição.** As texturas encolhem em vez de crescer;
  as que já estão no repositório podem cair para 256 e melhorar, não piorar.
- **Não há download a autorizar** para a maior parte do trabalho. A exceção continua
  sendo a planta, que é forma orgânica.
- **O trabalho é de geometria e de valor**, que são as duas coisas que este projeto já
  mediu como baratas.

## A ordem que isto sugere

1. **O valor.** Escurecer parede, piso e gesso até a razão das referências. Zero bytes.
2. **A densidade.** Estante cheia, mais quadros, mais objetos — geometria simples,
   repetida, com variação de cor.
3. **O tratamento.** `NearestFilter` e redução dos mapas existentes; depois, se
   justificar, o patch de snap e warp.
4. **A planta.** Único modelo externo, e só depois que os três acima estiverem de pé.

Medir a cada passo com `__unit.stats()`, e olhar antes de comprar.
