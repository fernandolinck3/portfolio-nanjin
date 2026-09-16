# ADR-0029 — A Unidade é escrita, o cenário é modelado

ADR-0004 decidiu que **a Unidade** é gerada em código — chassi, plate, gravação, jog, controles — e
a razão continua de pé: o objeto é a prova de ofício do portfólio, e a fonte do objeto ser a fonte do
repositório é metade do que ele prova. Nada aqui reverte isso.

O que este ADR resolve é uma pergunta que ADR-0004 não faz: **quem constrói o resto da sala.** Por
omissão, a resposta vinha sendo "o mesmo processo", e `room-decor.js` e `room-baroque.js` são o
resultado — cornija, roseta, lustre, arandelas, espelho, cortina, lareira, porta, baias, painéis,
monitores, tudo em torno, extrusão e caixa deformada. Para arquitetura e para peça fixa isso funciona
e continua: uma cornija **é** um perfil corrido, e escrevê-la é mais barato do que modelá-la.

Para **móvel**, não funciona. Um Chesterfield é uma superfície contínua com capitonê; caixas
deformadas empilhadas chegam a uma distância dele e param. O custo foi medido em sessão: um sofá
sozinho consumiu mais tempo do que a sala inteira tinha, e parou num resultado que lia como móvel de
longe e como quatro caixas concordando em ser uma de perto.

## Decisão

**A Unidade e a arquitetura são escritas. A mobília é modelada.**

As oito peças iniciais são CC0 da Poly Haven em `public/mobilia/`, montadas por
`prototype/room-mobilia.js`. A procedência e a licença ficam ao lado dos binários, em
`public/mobilia/CREDITS.md`; exceções posteriores são registradas no mesmo arquivo.

### Emenda de 2026-09-08 — a Porta vista de perto

A fronteira continua sendo **Unidade escrita, cenário modelado**, mas a Porta deixa de
ser uma exceção procedural. A estação `porta` aproxima a câmera o bastante para a folha,
a guarnição e a ferragem virarem o assunto do quadro; nessa distância, caixas extrudadas
não descrevem marcenaria, só a substituem por um símbolo.

Por isso, a Porta passa a usar `door_classic/door_classic.glb`, um modelo residencial de
2,28 m trazido para 2,18 m, com materiais e peças preservados. A posição do alvo, a câmera,
o estado fechado e a navegação não mudam nessa substituição. O código continua responsável
pela arquitetura da sala; a peça que uma câmera próxima precisa reconhecer passa a ser
modelada. A revisão visual posterior recua a pose e desloca o alvo dentro da mesma estação,
como registrado abaixo.

A mesma emenda substitui a arandela procedural que atravessava a Porta por
`industrial_wall_sconce`, da Poly Haven. Ela ocupa o trecho livre da parede e carrega
uma Pool curta, quente e ligada à Vigília.

A revisão visual seguinte mostrou que o contorno dourado ainda atribuído à Porta vinha
de dois quadros gerados por canvas e de um espelho extrudado, todos na mesma parede.
Eles saem do trecho da entrada; a parede esquerda perde também a carta celeste
procedural e conserva apenas o reboco fotografado. A pose da estação recua sem mudar
sua navegação. A regra é a mesma da exceção acima: perto da câmera, arquitetura e
fixture visíveis precisam ser modelo ou material medido, não uma aproximação que cruza
outro objeto.

## O que isso custa, medido

Medido em `?sala` com `__unit.roots().mobilia.visible` desligado e ligado, no mesmo quadro — que é
para isso que `__unit.perf()` ganhou a linha `modelled furniture hidden`:

| | sem a mobília | com a mobília |
|---|---|---|
| draw calls | 603 | 625 |
| triângulos | 173 917 | 237 011 |
| programas de shader | 171 | 171 |
| texturas | 71 | 71 |
| luzes acesas | 12 | 12 |
| `public/` em disco | 11 MB | 13,3 MB |

Essa tabela conserva a medição da mobília inicial. Ela antecede a Pool local da Porta
registrada na emenda acima e não deve ser lida como uma nova contagem dessa luz.

Não existe teto de peso escrito neste projeto, e o orçamento de `docs/realism-budget.md` é contado em
draw calls, luzes e megapixels — os três eixos que ADR-0019 e ADR-0021 estabeleceram. Oito malhas
estáticas com um mapa de cor cada não mexem em nenhum deles. Os 2,3 MB entram **depois do primeiro
quadro**, para não cobrar de novo os 2,42 s de abertura que ADR-0023 pagou.

## Duas consequências que não são óbvias

**A mobília usa `MeshStandardMaterial`, não o bake nos vértices.** Os exercícios que levaram a esta
decisão assam Lambert e falloff na CPU e trocam tudo por `MeshBasicMaterial` — zero luz em tempo
real. Aqui isso quebraria a Vigília: `applyVigil` caminha as Velas, a luz do quadro e o
`environmentIntensity` conforme o fader (ADR-0006, ADR-0018), e um móvel assado ficaria aceso
exatamente como foi assado enquanto o quarto apaga em volta dele. O bake é decisão da etapa de luz,
com a Vigília na mesa, e não efeito colateral de importar um sofá.

**A geometria vem de fora, o conteúdo não.** A estante chega vazia e é enchida por `encher()`, que
mede as prateleiras num histograma dos vértices do próprio modelo e escreve os volumes — altura
desigual, pilhas deitadas, tombados, falhas — numa malha só. É a divisão que este ADR propõe em
miniatura: a caixa é comprada, o que está dentro dela é escrito.

## O que continua aberto

A paleta. Cada peça entra com o mapa de cor da biblioteca e um tint multiplicativo que a puxa para a
sala. Funciona e não é a resposta final: um mapa próprio, pintado para esta paleta, é melhor que um
tint sobre um mapa de catálogo, e é trabalho de textura e não de importação.
