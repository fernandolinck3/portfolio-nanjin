# O quarto, construído de madrugada — 2026-09-03

Registro de uma sessão longa, autorizada a rodar sem aprovação a cada passo. **Dez commits
locais, nenhum push**, nenhum deploy. `npm run check` limpo e 140 testes verdes em cada
um deles.

Se você está lendo isto de manhã: **os endereços estão no fim.**

## O que mudou, em ordem

### 1. A mesa deixou de ser tábua

`slab()` faz um retângulo de cantos arredondados — certo para o Chassis, errado para o
Altar. Agora existe `shapedTop()`: lados abaulados, cantos generosos, pontas trabalhadas.
Mais um **bordo de bronze** que abraça a espessura e uma **saia** sob o tampo.

Duas correções pelo caminho, as duas por olhar e não por deduzir:

- O bordo saiu primeiro largo em planta e baixo, e de cima lia como **moldura de quadro
  deitada no chão**. Bordo de móvel é o contrário: quase nada de avanço, alto o bastante
  para cobrir a espessura. Visto de cima vira um fio dourado, e é para virar.
- A madeira saiu primeiro como **folheado** de nogueira — reto, uniforme, fatiado a
  máquina. Uniformidade é o que um folheado *é* por fabricação, e é o oposto do que uma
  mesa antiga tem. Trocada por madeira figurada.

A outra metade da referência — o embutido dourado — foi construída depois, na seção 6.

### 2. A luz: o quarto estava iluminado duas vezes

`environmentIntensity` em 1.85 foi ajustado contra uma cena **sem quarto** — sem paredes
para pegar luz e devolver, o mapa de ambiente fazia o papel do rebote. Com o quarto aceso,
os dois estão presentes e o objeto é iluminado duas vezes. Era essa a leitura pálida de
casa de bonecas.

Agora o ambiente **recua conforme o quarto chega**, e o `environmentIntensity` passou a ter
um dono só: a curva da Vigília e a do quarto se multiplicam em `applyVigil`, em vez de duas
funções escreverem a mesma propriedade — a Vigília desfazia a correção do quarto na volta
seguinte do crossfader, e o bug pareceria o quarto clareando sozinho.

### 3. A janela ganhou feixe

O `skyLight` já carregava sol e lua, e o `skyTexture` já desenhava disco, halo e estrelas —
isso não foi refeito. O que faltava era o feixe ser **visível**: uma direcional ilumina
superfícies e não preenche o ar entre elas.

O feixe é **geometria, não luz**: a própria abertura da janela extrudada na direção da
luz, aditiva, fora do laço de iluminação. Toma a cor do `skyLight` e morre na mesma curva,
porque um raio de lua é um feixe — só mais frio e mais quieto.

### 4. As peças barrocas

Cornija, roseta de teto, lustre de dezesseis velas, castiçais de parede, espelho com
crista, cortinas, quadros, relógio parado, busto de bronze, livros, **lareira** e **porta**.

**Trinta e duas chamas novas e nenhuma luz nova.** Tudo que brilha é emissivo — a regra que
o `realism-budget.md` escreve e a mesma resposta a que a cena do bunker do basement chega
sozinha. Geometria se paga uma vez; luz se paga por pixel iluminado, todo frame, para
sempre.

O vocabulário é o de um cômodo do século XIX: **torneado, dourado, moldura e cortina**.
Cada um é uma forma que um torno ou uma extrusão descreve — que é por que nada disso
precisou de Blender, como você pediu.

**A lareira merece nota**: é o objeto em torno do qual um cômodo daquele século se organiza,
põe uma fonte quente **baixa e de lado** (a única direção de onde esta cena nunca foi
iluminada), e dá à Vigília algo além de subtrair — fogo não apaga como vela, ele baixa a
brasa. É a última cor antes da lua.

### 5. Três layouts, que são três respostas

| | o que tem |
|---|---|
| `cheio` | cômodo vivido: busto, relógio, livros, quatro quadros, três castiçais por lado, lareira, porta |
| `sobrio` | a arquitetura e um quadro; sem busto, sem relógio, sem livros |
| `vazio` | a casca — cornija, roseta e lustre. Para julgar a Unit contra nada |

### 6. O embutido dourado — a metade da referência que não é madeira

A mesa da referência é aquela mesa por causa do **ornamento cortado na madeira**. Então o
tampo ganhou uma camada gráfica por cima: banda seguindo a borda abaulada, cartela oval no
centro com volutas saindo dela, e ramos espelhados nos quatro cantos. Latão sobre
transparência, quatro milésimos acima da madeira.

**Desenhado e não baixado**, e o motivo não é preciosismo: toda foto de marchetaria é a
foto da mesa *de outra pessoa*, com as proporções dela e o copyright dela. Este tampo tem
14,6 por 8,6 com lados abaulados, e ornamento que não segue o contorno lê como decalque.

O vocabulário são **quatro marcas** — voluta, folha, campânula e banda — e o espelhamento
é a gramática: um painel de marchetaria é cortado em pilha e aberto, então os cantos são
exatamente o reverso um do outro.

O centro fica liso porque a Unit fica ali. Mesa de verdade é lisa no meio pelo mesmo
motivo: gente põe coisa em cima.

### 7. Lareira e porta

A lareira se paga três vezes: é o objeto em torno do qual um cômodo daquele século se
organiza; põe uma fonte quente **baixa e de lado**, a única direção de onde esta cena nunca
foi iluminada; e dá à Vigília algo além de subtrair, porque fogo não apaga como vela, ele
baixa a brasa. É a última cor antes da lua.

A porta fica fechada de propósito — porta aberta precisa levar a algum lugar.

### 8. O quarto foi medido

`__unit.stats()` é novo e existe porque o `perf()` precisa de quadros, e quadro precisa de
janela visível. Isto é a metade que sobrevive: contagens do quadro que acabou de ser
desenhado.

| | draw calls | triângulos |
|---|---|---|
| com o quarto | **603** | 173.917 |
| sem o quarto | 218 | 127.640 |

Todo o cômodo — paredes, mobília antiga e as peças barrocas novas — custa **+385 draw calls
e +46 mil triângulos, e zero luzes**. Pela ADR-0019, que mediu geometria como a metade
grátis, isso é próximo de nada. Mas 603 é quatro vezes o que ela mediu, e num aparelho
fraco draw call começa a pesar — o número está aqui para ser conferido, não para ser
confiado.

### 9. O fio solto era o mesmo bug, pela terceira vez — e fechou

Com o quarto em zero, o `lightsOn` caía de 12 para 11: só a luz do retrato saía. O
`wallWash` e os dois globos ficavam acesos com intensidade cheia, iluminando móveis que a
câmera não vê — o desperdício exato que a ADR-0019 existe para matar.

A causa não estava no `dim()` nem no `roomOnlyLights`, que estavam certos. Estava em **quem
escreve depois**: o `applyVigil` tem curva própria para o `wallWash` (linha 3317) e chama o
`decor.update(vigil)`, que reescreve os globos a partir da Vigília sozinha. O
`setRoomAmount` apagava as quatro e então chamava o `applyVigil` para atualizar o ambiente
— e o quarto acendia de volta dentro da mesma chamada. O único sintoma visível era uma
contagem de luzes que não descia.

Terceira instância do mesmo bug em uma sessão: o ambiente, a luz do retrato e estas. Três
vezes é a forma do arquivo, não um acidente — **uma propriedade, um dono.**

Agora o `setRoomAmount` **não toca em nenhuma luz**. As quatro já têm curvas no
`applyVigil`, porque respondem à Vigília além do quarto; cada uma multiplica a própria
curva por `ROOM_K`, onde a curva já estava escrita, e nada é escrito duas vezes.

Medido depois: **12 luzes com o quarto, 8 sem, 12 ao religar** — sem deriva. Quatro luzes
saem do shader de verdade, que é um terço do orçamento que a ADR-0019 mediu em 87% do frame.

## O que foi decidido por ausência

Três coisas foram construídas e **removidas**, e a remoção é a decisão:

- **A sanefa da janela.** Feita duas vezes, falhou igual: pano franzido contra a coisa mais
  clara do quarto vira toldo listrado. A janela é a peça principal — o que compete com ela
  perde de propósito.
- **O mármore preto do Altar.** O `CONTEXT.md` descrevia laje de mármore com veios; o
  código dizia nogueira escura há muito tempo. Você decidiu nogueira, o glossário foi
  corrigido, e o onyx que eu já tinha baixado foi apagado no mesmo dia.
- **Reflexo real no espelho.** Precisa de um segundo render da cena inteira. É a única
  despesa que este quarto não pode pagar. Vidro escuro com pouca rugosidade pega o mapa de
  ambiente, que é o que um espelho mostra num cômodo penumbroso.

## Peso e licença

**1,9 MB de binários novos, todos CC0**, com procedência em `public/hdri/CREDITS.md` e
`public/textures/CREDITS.md`:

| | |
|---|---|
| ambiente (teatro barroco) | 1,6 MB · Poly Haven |
| piso de parquê | 126 KB · Poly Haven |
| madeira do tampo | 169 KB · ambientCG |
| trama da cortina | 65 KB · ambientCG |

Regra seguida em todos: 512px (256 na cortina), reduzidos com `sips` antes de entrar, e a
linha da tabela de créditos entra no mesmo commit que o arquivo.

E uma regra que apareceu trabalhando e vale guardar: **a fotografia é ótima em *como um
material se comporta* e não tem opinião que valha sobre *que cor este objeto tem nesta
sala*.** A cortina usa relevo e rugosidade da foto, e o vermelho continua autoral.

## Onde olhar

O servidor precisa estar de pé (`npm run prototype`). Pelo celular, o IP da rede.

```
/?sala                    o quarto, sem precisar de ?debug
/?sala&layout=sobrio      menos mobília
/?sala&layout=vazio       só a casca
/?sala&vigil=100          a noite: as chamas mortas, a brasa e a lua
/?debug&sala              o mesmo com os dials (ROOM, POOL, WARM)
/?sala&tex=0              com as superfícies desenhadas, para comparar
/?sala&hdri=0             com o ambiente procedural de antes
```

## O que eu faria a seguir, em ordem

1. **A câmera.** O quarto inteiro é invisível para o visitante: `CAM_LIMITS` prende a vista
   no objeto, e só o FREECAM da bancada chega lá. Sem resolver isso, tudo acima é enfeite de
   bancada. O `50.camera-rail` do laboratório do basement é a forma sem virar órbita livre.
2. **Medir o frame.** O `MEDIR` da bancada tem duas linhas com o quarto aceso e ninguém rodou ainda.
   Trinta e duas chamas emissivas custam pouco, mas *pouco* é uma palavra, não um número.
