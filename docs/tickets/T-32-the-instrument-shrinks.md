# T-32 — O instrumento encolhe para a escala do quarto

**Track B · depends on nothing · `prototype/scene.js` · spec: `docs/specs/quarto-navegavel.md`**

Status: ready

## Goal

`unit` e `altar` passam a viver dentro de um grupo `instrumento` com `scale = 0.46`, e o tampo
volta a ficar a **2,95 unidades do chão** (0,92 m). Tudo que é medido contra eles — distâncias de
câmera, luzes das Velas, o foco do *spot*, o plinto, o tapete — desce junto.

Nada muda de aparência ao olhar de perto. O que muda é a razão contra o quarto.

## Why

A régua da sala é a porta — 6,6 unidades para 2,05 m, logo **3,2 unidades por metro**. Por ela o
quarto tem 7,25 × 6,56 m e o tampo do Altar tem **4,81 × 2,88 m**, ou 66% da largura do quarto
contra os ~21% de uma bancada real. Erro de razão de ~2×.

Ele aparece como três queixas que são uma só, e a terceira é a que trava tudo: **a mobília não está
jogada, está exilada.** O tampo cobre `x −7,6..+7,6` e `z −4,5..+4,5` a 2,95 do chão, como um
telhado — uma poltrona posta ali some por baixo dele, o que já aconteceu na montagem de
`room-mobilia.js`. A regra que sobra, `|x| > 8,2 ou |z| > 5,2`, deixa livre só uma faixa colada nas
paredes. **Sem este ticket, T-33 não tem para onde ir.**

A razão entre a Unidade e o tampo já é boa (39%, contra 60–75% de um controlador sobre uma mesa):
o par é coerente entre si. Por isso desce em bloco, com um fator.

`k = 0,46` e não menos: realismo estrito seria 0,33 e viraria uma mesinha. Em 0,46 o tampo fica
2,21 × 1,33 m e a Unidade 0,86 × 0,47 m — a medida de um all-in-one de verdade.

## Build

1. **Um grupo.** `unit` e `altar` são hoje filhos diretos de `scene`, ambos na origem, escala 1
   (`__unit.roots()` confirma). Criar `instrumento`, mover os dois para dentro, `setScalar(0.46)`.
2. **Devolver a altura.** Depois da escala o tampo estaria a 1,36 do chão. Translar o grupo para
   que a face de cima volte a `y = 0` — as pernas torneadas em `scene.js` já derivam a própria
   altura de `(-.62 - FLOOR_Y)`, então elas se acertam sozinhas.
3. **Câmera.** `REST` em `intro.js` (`dist: 4.6`), as distâncias de `focus.js`, e o `dist` do
   `?sala` — este último enquadra o **quarto** e não o instrumento, então não desce.
4. **Luzes.** As posições das três Velas, o `key` e o seu alvo, e a `pictureLight` não: ela é da
   parede.
5. **Vizinhos.** O plinto (`PED = { x: 5.6, z: -4.2 }` em `summon.js`) e o tapete
   (`PlaneGeometry(19, 13)`) são medidos contra o Altar e descem com ele.

## Traps

- **`castOnly(unit, altar, summoning.group)`** recebe os objetos, não a cena. Se `unit` e `altar`
  passarem a ser filhos de `instrumento`, a chamada continua válida — mas conferir, porque
  `groundShadows(scene)` roda antes e a ordem importa.
- **O *raycast* é em espaço de mundo** e não sente a escala: `screenPoint`, `pick` e `faderValueAt`
  continuam funcionando. O que muda é o alvo ficar menor na tela — verificar que os pads ainda são
  clicáveis no tamanho de toque.
- **A Tela não muda de resolução.** `SCREEN_W`/`SCREEN_H` são o buffer; encolher o objeto encolhe a
  superfície onde ele é mostrado, e o T-22 já gastou uma sessão para levar a Tela de 401 a 494 px.
  **Medir a Tela em pixels de tela depois da mudança** — se ela cair abaixo do que o T-22 conquistou,
  isso é achado deste ticket, não descoberta de outra sessão.
- **`?sala` continua sendo o endereço para julgar.** A câmera dele é de bancada e não propõe nada
  para o visitante.

## Done when

- `?sala` mostra a mesa ocupando cerca de 30% da largura do quarto, com o tampo a 0,92 m.
- A abertura, em `/`, chega ao repouso com o objeto no mesmo tamanho aparente de antes.
- `npm run check`, `build:site`, `verify:site` e `npx vitest run` passam.
- A Tela medida em pixels de tela está registrada no commit, comparada com os 494 px do T-22.
