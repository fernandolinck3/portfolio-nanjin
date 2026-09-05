# O quarto navegável

**2026-09-05 · o cenário deixa de ser fundo e passa a ser a navegação**

Colapso de um mapa de decisões numa spec construível. Os tickets `T-32` a `T-35` saem daqui e
cada um se sustenta sozinho; isto é a razão de eles existirem e a ordem em que se encaixam.

## O problema medido

A régua da sala é a **porta**: 6,6 unidades para os 2,05 m de uma porta de verdade, ou seja
**3,2 unidades por metro**. Com ela o quarto tem 7,25 × 6,56 × 2,31 m. O tampo do Altar tem
**4,81 × 2,88 m** — 66% da largura do quarto e 44% da profundidade, contra os ~21% × 11% que uma
bancada real ocuparia. É um erro de razão de aproximadamente **2×**.

Ele aparece como três queixas separadas — a Unidade parece grande, a mesa parece grande, a mobília
parece jogada — e é uma só. **A mobília não está jogada, está exilada:** o tampo cobre
`x −7,6..+7,6` e `z −4,5..+4,5` como um telhado, e a regra que sobra (`|x| > 8,2 ou |z| > 5,2`)
deixa livre apenas uma faixa rente às paredes e uma tira na frente. Não existe meio de quarto onde
agrupar nada.

A razão entre a Unidade e o tampo, essa, está boa: 39%, contra 60–75% de um controlador sobre uma
mesa. **O par é coerente entre si; o erro é do par contra o quarto.** Por isso os dois descem
juntos, com um fator só.

## Decisão 1 — encolher o instrumento, não crescer o quarto

Crescer o quarto é caro e mexe justamente no que vem a seguir: em `room-baroque.js` só 12 de 34
posições são paramétricas; `WIN`, `SHAFT_LEN = 17.5`, `skyLight.position` e
`setPool({ near: 5, far: 26 })` quebram sem aviso; e a área de parede quadruplicaria para as
mesmas doze luzes.

Encolher é barato: `unit` e `altar` são filhos diretos da cena, na origem, escala 1.

**`k = 0,46`.** Realismo estrito seria `k ≈ 0,33` e transformaria o Altar numa mesinha. Em 0,46 o
tampo fica 2,21 × 1,33 m — grande para uma mesa, correto para um altar — e a Unidade fica
0,86 × 0,47 m, a medida de um all-in-one de verdade. **A altura do tampo volta para 0,92 m depois
da escala**; as pernas torneadas já derivam a altura do topo, então isso é um número e não um
redesenho.

O que se ganha não é fidelidade, é **chão**: a pegada proibida cai para `|x| < 3,6 · |z| < 2,2`.

## Decisão 2 — a Unidade é o controlador, o quarto é o palco

Quem manda na dinâmica. Os pads comandam sempre, esteja a câmera onde estiver, e o quarto é onde o
comando acontece. Não se sai do controlador — muda-se o que ele está tocando.

Por baixo a máquina é uma só, e já está escrita duas vezes neste projeto: ADR-0002 (*o DOM é a
verdade e a Tela renderiza*) e a lição que `screenHit` deixou no `CLAUDE.md` — **duas listas
divergem, uma não pode**. Há **uma variável**, a estação corrente, com três escritores (os pads, o
objeto no quarto, o espelho/URL) e três leitores (a câmera, a Tela, a peça que acende). A tese
acima não contradiz isso: diz qual das três mãos é a principal.

**O pad leva.** Aperta-se o pad, a câmera corre o trilho até a estação, a Tela troca. Um gesto.
Não há um segundo modo de "folhear": viajar é folhear, e quem precisa de texto corrido tem o
espelho no DOM.

Consequência que carrega peso: **perto, lê-se no objeto; longe, lê-se na Plate plana.** A Tela de
590 px não se lê a doze unidades de distância. O T-05 já construiu essa Tela em CSS — o que era
plano B passa a ser o caminho principal.

## Decisão 3 — sete estações, seis delas um anel

Os seis Módulos de `src/content/modules.ts` ganham endereço físico, feito de móveis que já existem.
O Altar no centro não é módulo: é de onde se comanda.

| № | Estação | Módulo | Onde | Feita de |
|---|---|---|---|---|
| — | O Altar | — | `0, 0` | Unidade, Tela, castiçais, props |
| 1 | O retrato | QUEM | `−5,4 · −10,4` | Lyra emoldurada, o busto, a luz de quadro |
| 2 | O acervo | PROJETOS | `−9,6 · −4,4` | A baia de 40 discos, o plinto ao lado |
| 3 | A porta | CONTATO | `−10,2 · +4,9` | A porta almofadada, o armário gótico |
| 4 | A leitura | TRAJETO | `+9,6 · +3,6` | A estante com livros, a poltrona |
| 5 | A lareira | CRITÉRIOS | `+9,2 · −1,0` | Lareira, poltrona e sofá virados para ela |
| 6 | A oficina | HABILIDADES | `+9,4 · −5,6` | Baia de pedais, cabos, os dois monitores |

O trilho é um anel fechado passando por 1→6, e **sai de um JSON de pontos de controle** — não
codificado à mão. É o que o basement faz com o próprio `blender-bezier-exporter`, e faz de uma
estação a mais uma linha de dados.

## Decisão 4 — os controles mudam

| Controle | Hoje | Fica |
|---|---|---|
| Seis pads | trocam o módulo | trocam **e levam** |
| Roda da lua | seleção da lista; fotos de uma Work em foco | inalterada |
| **Roda do sol** | rola o corpo do texto | **vira o trilho** |
| Rolagem do corpo | na roda do sol | vai para a Plate plana |
| Crossfader | a Vigília | intocado — ADR-0006 |

Um jog é um controle de *scrub*; arrastar a câmera por uma Bézier é o mesmo gesto, e dá movimento
contínuo entre estações em vez de só saltos.

**Isto tem uma conta e é o T-30.** O ticket diz que o objeto perde onze dos quinze pontos da
crítica por ter nove controles e nenhuma legenda, e que a correção **não pode** ser painel de
ajuda, tooltip ou onboarding — os três matam o enigma. O que ele pede é o que um instrumento faz:
gravar o nome ao lado do controle. **A roda do sol só vira trilho no mesmo commit em que a Plate
ganha essa gravação.**

## Decisão 5 — som, e o que ele fecha

Seis vozes sintetizadas em Web Audio: um bumbo, um estalo, dois tons, dois ruídos filtrados.
Osciladores e envelopes, **zero bytes de asset**. O contexto nasce no primeiro toque num pad — o
que a política de *autoplay* exige de qualquer jeito. *Mute* gravado na Plate e lembrado entre
visitas. Oito passos, seis pistas; segura-se um pad e ele grava.

O quarto responde no tempo — chamas pulsam, anéis dos decks giram, o lustre balança — e tudo isso é
**emissivo e geometria**, nenhuma luz nova, ADR-0019 intacto.

**E aqui fecha:** com a roda do sol como trilho e um andamento definido, a viagem entre estações é
**quantizada** — a câmera larga na hora e chega no tempo. Trocar de módulo deixa de ser um corte e
vira uma virada. É o que junta a navegação com a brincadeira.

**Regra dura: nada de placar.** Sem pontuação, tempo, ranking ou tela de resultado. O momento em
que isto vira jogo com objetivo é o momento em que passa a competir com o portfólio em vez de
segurar alguém nele.

## O que a ECLIPSE já resolve de graça

`markSeen` já acende um LED por módulo visto, escreve `SINAL 03/06` no visor e aos seis solta
`SEIS SINAIS ALINHADOS`. Hoje a condição é apertar seis pads, o que não é explorar. **Mover a
condição para as estações** — o LED acende ao *chegar* — transforma um easter egg num jogo de
exploração com placar já construído, no próprio objeto, sem uma linha de conteúdo novo.

## Ordem

`T-32` escala → `T-33` reagrupamento → `T-34` estações, trilho e controles → `T-35` som.

A paleta das peças (mapa próprio no lugar do tint sobre mapa de catálogo) fica **depois da etapa de
luz**, e não tem ticket ainda: cor sem luz definida é chute.
