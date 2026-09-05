# T-34 — O quarto vira a navegação: estações, trilho e a troca de controles

**Track B · blocked by: T-32, T-30 · o maior da track · spec: `docs/specs/quarto-navegavel.md`**

Status: blocked

## Goal

Os seis Módulos ganham endereço físico no quarto. Apertar um pad leva a câmera até a estação por um
trilho; a roda do sol percorre esse trilho de forma contínua; a leitura passa da Tela para a Plate
plana quando a câmera sai do Altar.

## Why

**Hoje o quarto não faz nada.** Toda interação do projeto está na Unidade: as linhas da Tela, o
*claim*, o voltar, a marca do eclipse, os pads, o *fader*, os cubos das rodas e o plinto. O quarto é
um fundo bonito atrás de um objeto clicável, e mobiliá-lo melhor não muda isso.

A tese que decide o desenho: **a Unidade é o controlador, o quarto é o palco.** Os pads comandam
sempre, esteja a câmera onde estiver. Por baixo há **uma variável** — a estação corrente — com três
escritores e três leitores, que é a mesma disciplina do ADR-0002 e a lição que `screenHit` deixou:
duas listas divergem, uma não pode.

## Build

**1 — o estado.** Uma variável `estacao` (0 = o Altar, 1–6 = os módulos). Escritores: os pads, o
*raycast* na peça da estação, o espelho/URL. Leitores: a câmera, a Tela, o emissivo da peça.
Escrever isso como **um** caminho; qualquer controle novo entra por ele ou por nenhum.

**2 — o trilho.** Uma Bézier fechada pelas seis estações, **carregada de um JSON de pontos de
controle**, mais a função que acha o ponto mais próximo da curva em relação a um alvo. É o que o
basement faz em `50.camera-rail.js` com o próprio `blender-bezier-exporter`, e é a saída para a
regra do `CONTEXT.md` que proíbe órbita: um trilho não é órbita, é o mesmo movimento
parametrizado. Estações e coordenadas estão na tabela da spec.

**3 — o pad leva.** `pressPad(i)` passa a escrever `estacao` e a câmera corre o trilho. **0,6 a
0,9 s, com aceleração e freio** — apertar 4 e depois 5 tem que ler como varredura, não como dois
arremessos.

**4 — a superfície de leitura troca.** Saindo do Altar, o texto passa para a **Plate plana**
(`flat.js`, construída pelo T-05). O *canvas* guarda o estado: ao voltar, está onde ficou.

**5 — os controles.** A roda do sol deixa de rolar o corpo e vira o trilho; a rolagem do corpo vai
para a Plate. A roda da lua e o *crossfader* não se tocam.

**6 — a ECLIPSE muda de gatilho.** `markSeen(i)` passa a ser chamado ao **chegar** na estação, e não
ao apertar o pad. Os LEDs, o `SINAL 03/06` e o `SEIS SINAIS ALINHADOS` já existem — é trocar a
condição, e é a linha mais barata deste ticket.

## Traps

- **O T-30 é pré-requisito, não referência.** Ele já contabiliza *onze dos quinze pontos* perdidos
  na crítica por nove controles sem legenda, e proíbe explicitamente painel de ajuda, tooltip e
  onboarding — os três matam o enigma que é metade do valor do objeto. Dar um décimo significado à
  roda do sol **sem** a gravação na Plate, no mesmo commit, é acrescentar exatamente o problema que
  o T-30 abriu.
- **A Tela de 590 px não se lê de longe.** Este ticket promove a Plate plana de plano B a caminho
  principal, então ela precisa ficar boa e não tolerável.
- **O `?sala` diz, em comentário, que a câmera do visitante precisa de um controle na Plate e não
  de uma query string.** Este ticket é a resposta a isso; `?sala` continua sendo bancada.
- **Emissivo, não holofote.** O realce de *hover* de uma estação é borda emissiva. ADR-0019 já
  pagou a conta de luzes que iluminam o que a câmera não vê, e o basement chega na mesma regra em
  `32.bunker-scene.js`.
- **Nenhum móvel de `room-mobilia.js` é alvo de *raycast* antes de T-33** — as peças ainda estão
  onde couberam, não onde a estação as quer.

## Done when

- Os seis pads levam, e a mesma estação pode ser alcançada clicando na peça.
- A roda do sol percorre o trilho; o corpo do texto rola na Plate.
- A Plate carrega a gravação dos controles (T-30 fechado ou fechado nesta parte).
- A ECLIPSE destrava por exploração, não por seis toques em pads.
- Os quatro comandos de verificação passam.
